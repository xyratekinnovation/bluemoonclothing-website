from datetime import datetime, timezone
from decimal import Decimal
from random import randint

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut, PaymentWebhook

router = APIRouter(prefix="/payments", tags=["Payments"])


def _txn_id() -> str:
    return f"TXN-{randint(100000, 999999)}"


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Payment:
    order_result = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payment = Payment(
        order_id=order.id,
        transaction_id=_txn_id(),
        provider=payload.provider,
        provider_ref=payload.provider_ref,
        amount=Decimal(order.grand_total),
        status="pending",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/webhook", response_model=PaymentOut)
async def payment_webhook(payload: PaymentWebhook, db: AsyncSession = Depends(get_db)) -> Payment:
    result = await db.execute(select(Payment).where(Payment.transaction_id == payload.transaction_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Transaction not found")

    payment.status = payload.status.lower()
    payment.provider_ref = payload.provider_ref
    payment.raw_payload_json = payload.payload
    if payment.status == "success":
        payment.paid_at = datetime.now(tz=timezone.utc)

    order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
    order = order_result.scalar_one()
    if payment.status == "success":
        order.payment_status = "success"
        if order.status == "pending":
            order.status = "paid"
    elif payment.status == "failed":
        order.payment_status = "failed"
    elif payment.status == "refunded":
        order.payment_status = "refunded"

    await db.commit()
    await db.refresh(payment)
    return payment


@router.get("", response_model=list[PaymentOut])
async def list_payments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Payment]:
    result = await db.execute(select(Payment).order_by(Payment.created_at.desc()))
    return list(result.scalars().all())
