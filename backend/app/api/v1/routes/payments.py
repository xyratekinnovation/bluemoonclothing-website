import hashlib
import hmac
import json
from datetime import datetime, timezone
from decimal import Decimal
from random import randint

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.config import get_settings
from app.db.session import get_db
from app.models.order import Order, OrderPaymentStatus, OrderStatus, OrderStatusHistory
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentInitiateOut,
    PaymentInitiateRequest,
    PaymentOut,
    PaymentVerifyRequest,
    PaymentWebhook,
)

router = APIRouter(prefix="/payments", tags=["Payments"])
settings = get_settings()


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


def _verify_checkout_signature(order_id: str, payment_id: str, signature: str) -> bool:
    secret = settings.RAZORPAY_KEY_SECRET
    if not secret:
        return False
    payload = f"{order_id}|{payment_id}".encode()
    generated = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, signature)


@router.post("/initiate", response_model=PaymentInitiateOut, status_code=status.HTTP_201_CREATED)
async def initiate_payment(
    payload: PaymentInitiateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentInitiateOut:
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway is not configured")

    order_result = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    existing_result = await db.execute(
        select(Payment).where(Payment.order_id == order.id, Payment.status == "pending").order_by(Payment.created_at.desc())
    )
    existing_payment = existing_result.scalar_one_or_none()
    if existing_payment:
        return PaymentInitiateOut(
            payment_id=existing_payment.id,
            order_id=order.id,
            transaction_id=existing_payment.transaction_id,
            amount_paise=int(Decimal(existing_payment.amount) * 100),
            key_id=settings.RAZORPAY_KEY_ID,
        )

    amount_paise = int(Decimal(order.grand_total) * 100)
    if amount_paise <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.razorpay.com/v1/orders",
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order.order_number,
                    "notes": {"order_id": str(order.id)},
                },
            )
        response.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Unable to create gateway order") from exc

    gateway_order = response.json()
    transaction_id = gateway_order.get("id")
    if not transaction_id:
        raise HTTPException(status_code=502, detail="Invalid gateway response")

    payment = Payment(
        order_id=order.id,
        transaction_id=transaction_id,
        provider="razorpay",
        provider_ref=None,
        amount=Decimal(order.grand_total),
        status="pending",
        raw_payload_json=gateway_order,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return PaymentInitiateOut(
        payment_id=payment.id,
        order_id=order.id,
        transaction_id=payment.transaction_id,
        amount_paise=amount_paise,
        key_id=settings.RAZORPAY_KEY_ID,
    )


@router.post("/verify", response_model=PaymentOut)
async def verify_payment(
    payload: PaymentVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Payment:
    result = await db.execute(select(Payment).where(Payment.transaction_id == payload.razorpay_order_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    if str(order.id) != str(payload.order_id):
        raise HTTPException(status_code=400, detail="Order mismatch")

    if not _verify_checkout_signature(
        payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    payment.status = "success"
    payment.provider_ref = payload.razorpay_payment_id
    payment.paid_at = datetime.now(tz=timezone.utc)
    payment.raw_payload_json = {
        "razorpay_order_id": payload.razorpay_order_id,
        "razorpay_payment_id": payload.razorpay_payment_id,
    }
    order.payment_status = OrderPaymentStatus.SUCCESS
    if order.status == OrderStatus.PENDING:
        order.status = OrderStatus.PAID
        db.add(
            OrderStatusHistory(
                order_id=order.id,
                status=order.status,
                comment="Payment verified",
                changed_by_user_id=current_user.id,
            )
        )

    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/webhook", response_model=PaymentOut)
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_razorpay_signature: str | None = Header(default=None),
) -> Payment:
    raw_body = await request.body()
    if settings.RAZORPAY_WEBHOOK_SECRET:
        if not x_razorpay_signature:
            raise HTTPException(status_code=400, detail="Missing webhook signature")
        expected = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    event = payload.get("event", "")
    payment_entity = ((payload.get("payload") or {}).get("payment") or {}).get("entity") or {}
    razorpay_order_id = payment_entity.get("order_id")
    razorpay_payment_id = payment_entity.get("id")
    if not razorpay_order_id:
        raise HTTPException(status_code=400, detail="Missing order id")

    result = await db.execute(select(Payment).where(Payment.transaction_id == razorpay_order_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Transaction not found")

    status_map = {
        "payment.captured": "success",
        "payment.authorized": "success",
        "payment.failed": "failed",
        "refund.processed": "refunded",
    }
    mapped_status = status_map.get(event)
    if not mapped_status:
        # Unknown event, keep current status but persist payload for audit.
        payment.raw_payload_json = payload
        await db.commit()
        await db.refresh(payment)
        return payment

    payment.status = mapped_status
    if razorpay_payment_id:
        payment.provider_ref = razorpay_payment_id
    payment.raw_payload_json = payload
    if mapped_status == "success":
        payment.paid_at = datetime.now(tz=timezone.utc)

    order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
    order = order_result.scalar_one()
    if mapped_status == "success":
        order.payment_status = OrderPaymentStatus.SUCCESS
        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.PAID
    elif mapped_status == "failed":
        order.payment_status = OrderPaymentStatus.FAILED
    elif mapped_status == "refunded":
        order.payment_status = OrderPaymentStatus.REFUNDED

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
