import uuid
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CartItemUpsert(BaseModel):
    product_variant_id: uuid.UUID
    quantity: int = Field(ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class ProductBriefOut(ORMBase):
    id: uuid.UUID
    name: str
    slug: str


class VariantBriefOut(ORMBase):
    id: uuid.UUID
    sku: str
    size: str | None
    color: str | None
    price: Decimal
    compare_at_price: Decimal | None
    stock_qty: int
    is_active: bool
    product: ProductBriefOut


class CartItemOut(ORMBase):
    id: uuid.UUID
    product_variant_id: uuid.UUID
    quantity: int
    unit_price_snapshot: Decimal
    variant: VariantBriefOut


class CartOut(ORMBase):
    id: uuid.UUID
    user_id: uuid.UUID | None
    session_id: str | None
    items: list[CartItemOut] = []
