import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CouponBase(BaseModel):
    code: str
    discount_type: str
    value: Decimal = Field(ge=0)
    min_order_amount: Decimal = Field(default=0, ge=0)
    usage_limit: int | None = Field(default=None, ge=0)
    expires_at: datetime | None = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: str | None = None
    discount_type: str | None = None
    value: Decimal | None = Field(default=None, ge=0)
    min_order_amount: Decimal | None = Field(default=None, ge=0)
    usage_limit: int | None = Field(default=None, ge=0)
    expires_at: datetime | None = None
    is_active: bool | None = None


class CouponOut(ORMBase):
    id: uuid.UUID
    code: str
    discount_type: str
    value: Decimal
    min_order_amount: Decimal
    usage_limit: int | None
    used_count: int
    expires_at: datetime | None
    is_active: bool


class ShippingZoneCreate(BaseModel):
    name: str
    charge: Decimal = Field(default=0, ge=0)
    eta_text: str
    is_active: bool = True


class ShippingZoneUpdate(BaseModel):
    name: str | None = None
    charge: Decimal | None = Field(default=None, ge=0)
    eta_text: str | None = None
    is_active: bool | None = None


class ShippingZoneOut(ORMBase):
    id: uuid.UUID
    name: str
    charge: Decimal
    eta_text: str
    is_active: bool


class BannerCreate(BaseModel):
    title: str
    subtitle: str | None = None
    section: str
    image_url: str | None = None
    target_url: str | None = None
    is_active: bool = True
    sort_order: int = 0


class BannerUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    section: str | None = None
    image_url: str | None = None
    target_url: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class BannerOut(ORMBase):
    id: uuid.UUID
    title: str
    subtitle: str | None
    section: str
    image_url: str | None
    target_url: str | None
    is_active: bool
    sort_order: int


class NotificationOut(ORMBase):
    id: uuid.UUID
    type: str
    title: str
    message: str
    entity_type: str | None
    entity_id: str | None
    is_read: bool
    user_id: uuid.UUID | None
    created_at: datetime


class StoreSettingsPatch(BaseModel):
    value: dict


class StoreSettingsOut(ORMBase):
    key: str
    value: dict
