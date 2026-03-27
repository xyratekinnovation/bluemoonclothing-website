from decimal import Decimal

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.cart import CartItemUpdate, CartItemUpsert, CartOut

router = APIRouter(prefix="/cart", tags=["Cart"])


async def _get_or_create_cart(db: AsyncSession, user: User | None, session_id: str | None) -> Cart:
    if user:
        result = await db.execute(select(Cart).where(Cart.user_id == user.id))
    elif session_id:
        result = await db.execute(select(Cart).where(Cart.session_id == session_id))
    else:
        raise HTTPException(status_code=400, detail="Missing user or x-session-id")

    cart = result.scalar_one_or_none()
    if cart:
        return cart

    cart = Cart(user_id=user.id if user else None, session_id=session_id if not user else None)
    db.add(cart)
    await db.flush()
    return cart


@router.get("", response_model=CartOut)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Cart:
    cart = await _get_or_create_cart(db, current_user, None)
    await db.commit()
    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.variant)
            .selectinload(ProductVariant.product)
            .selectinload(Product.images)
        )
    )
    return result.scalar_one()


@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
async def add_or_update_item(
    payload: CartItemUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_session_id: str | None = Header(default=None),
) -> Cart:
    cart = await _get_or_create_cart(db, current_user, x_session_id)

    variant_result = await db.execute(select(ProductVariant).where(ProductVariant.id == payload.product_variant_id))
    variant = variant_result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Product variant not found")

    item_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_variant_id == payload.product_variant_id,
        )
    )
    item = item_result.scalar_one_or_none()
    if item:
        item.quantity = payload.quantity
    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_variant_id=payload.product_variant_id,
                quantity=payload.quantity,
                unit_price_snapshot=Decimal(variant.price),
            )
        )

    await db.commit()
    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.variant)
            .selectinload(ProductVariant.product)
            .selectinload(Product.images)
        )
    )
    return result.scalar_one()


@router.patch("/items/{item_id}", response_model=CartOut)
async def update_item_quantity(
    item_id: uuid.UUID,
    payload: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Cart:
    cart_result = await db.execute(select(Cart).where(Cart.user_id == current_user.id))
    cart = cart_result.scalar_one_or_none()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item_result = await db.execute(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = payload.quantity
    await db.commit()

    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.variant)
            .selectinload(ProductVariant.product)
            .selectinload(Product.images)
        )
    )
    return result.scalar_one()


@router.delete("/items/{item_id}", response_model=CartOut)
async def remove_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Cart:
    cart_result = await db.execute(select(Cart).where(Cart.user_id == current_user.id))
    cart = cart_result.scalar_one_or_none()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item_result = await db.execute(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    await db.delete(item)
    await db.commit()

    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.variant)
            .selectinload(ProductVariant.product)
            .selectinload(Product.images)
        )
    )
    return result.scalar_one()


@router.delete("", response_model=CartOut)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Cart:
    cart_result = await db.execute(select(Cart).where(Cart.user_id == current_user.id))
    cart = cart_result.scalar_one_or_none()
    if not cart:
        cart = await _get_or_create_cart(db, current_user, None)

    items_result = await db.execute(select(CartItem).where(CartItem.cart_id == cart.id))
    for item in items_result.scalars().all():
        await db.delete(item)
    await db.commit()

    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.variant)
            .selectinload(ProductVariant.product)
            .selectinload(Product.images)
        )
    )
    return result.scalar_one()
