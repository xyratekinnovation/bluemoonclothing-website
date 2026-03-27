import uuid
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import ORMBase


class PaymentCreate(BaseModel):
    order_id: uuid.UUID
    provider: str
    provider_ref: str | None = None


class PaymentInitiateRequest(BaseModel):
    order_id: uuid.UUID


class PaymentInitiateOut(BaseModel):
    payment_id: uuid.UUID
    order_id: uuid.UUID
    transaction_id: str
    amount_paise: int
    currency: str = "INR"
    key_id: str


class PaymentVerifyRequest(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentWebhook(BaseModel):
    transaction_id: str
    status: str
    provider_ref: str | None = None
    payload: dict | None = None


class PaymentOut(ORMBase):
    id: uuid.UUID
    order_id: uuid.UUID
    transaction_id: str
    provider: str
    amount: Decimal
    status: str
    provider_ref: str | None
