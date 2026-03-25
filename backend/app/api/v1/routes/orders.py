import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.cart import Cart
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])


def _make_order_number() -> str:
    return f"BM-{int(datetime.now(tz=timezone.utc).timestamp())}"


@router.post("/checkout", response_model=OrderOut)
async def checkout(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    cart_result = await db.execute(select(Cart).where(Cart.user_id == current_user.id).options(selectinload(Cart.items)))
    cart = cart_result.scalar_one_or_none()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = Decimal("0")
    order = Order(
        order_number=_make_order_number(),
        user_id=current_user.id,
        status="pending",
        payment_status="pending",
        shipping_total=payload.shipping_total,
        tax_total=payload.tax_total,
        discount_total=payload.discount_total,
        notes=payload.notes,
    )
    db.add(order)
    await db.flush()

    for cart_item in cart.items:
        variant_result = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.id == cart_item.product_variant_id)
            .options(selectinload(ProductVariant.product))
        )
        variant = variant_result.scalar_one_or_none()
        if not variant or not variant.is_active:
            raise HTTPException(status_code=400, detail="One or more cart items are invalid")
        if variant.stock_qty < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for SKU: {variant.sku}")

        variant.stock_qty -= cart_item.quantity
        line_total = Decimal(variant.price) * cart_item.quantity
        subtotal += line_total

        name_snapshot = variant.product.name if variant.product else "Product"
        db.add(
            OrderItem(
                order_id=order.id,
                product_variant_id=variant.id,
                product_name_snapshot=name_snapshot,
                sku_snapshot=variant.sku,
                size_snapshot=variant.size,
                color_snapshot=variant.color,
                unit_price=Decimal(variant.price),
                quantity=cart_item.quantity,
                line_total=line_total,
            )
        )

    order.subtotal = subtotal
    order.grand_total = subtotal + order.shipping_total + order.tax_total - order.discount_total

    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status=order.status,
            comment="Order placed",
            changed_by_user_id=current_user.id,
        )
    )

    await db.delete(cart)
    await db.commit()

    order_result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    return order_result.scalar_one()


@router.get("", response_model=list[OrderOut])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/admin", response_model=list[OrderOut])
async def list_all_orders(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status.lower()
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status=order.status,
            comment=payload.comment,
            changed_by_user_id=admin.id,
        )
    )
    await db.commit()
    await db.refresh(order)
    return order
