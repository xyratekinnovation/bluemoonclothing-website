import uuid
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CartItemUpsert(BaseModel):
    product_variant_id: uuid.UUID
    quantity: int = Field(ge=1)


class CartItemOut(ORMBase):
    id: uuid.UUID
    product_variant_id: uuid.UUID
    quantity: int
    unit_price_snapshot: Decimal


class CartOut(ORMBase):
    id: uuid.UUID
    user_id: uuid.UUID | None
    session_id: str | None
    items: list[CartItemOut] = []
