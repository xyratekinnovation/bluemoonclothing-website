import uuid
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CheckoutRequest(BaseModel):
    shipping_total: Decimal = Field(default=0, ge=0)
    tax_total: Decimal = Field(default=0, ge=0)
    discount_total: Decimal = Field(default=0, ge=0)
    notes: str | None = None


class OrderItemOut(ORMBase):
    id: uuid.UUID
    product_variant_id: uuid.UUID | None
    product_name_snapshot: str
    sku_snapshot: str | None
    size_snapshot: str | None
    color_snapshot: str | None
    unit_price: Decimal
    quantity: int
    line_total: Decimal


class OrderOut(ORMBase):
    id: uuid.UUID
    order_number: str
    user_id: uuid.UUID | None
    status: str
    payment_status: str
    subtotal: Decimal
    discount_total: Decimal
    shipping_total: Decimal
    tax_total: Decimal
    grand_total: Decimal
    notes: str | None
    items: list[OrderItemOut] = []


class OrderStatusUpdate(BaseModel):
    status: str
    comment: str | None = None
