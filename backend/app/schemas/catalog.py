import uuid
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CategoryCreate(BaseModel):
    name: str
    slug: str
    parent_id: uuid.UUID | None = None
    image_url: str | None = None
    is_active: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    parent_id: uuid.UUID | None = None
    image_url: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class CategoryOut(ORMBase):
    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None
    image_url: str | None
    is_active: bool
    sort_order: int


class ProductVariantIn(BaseModel):
    sku: str
    size: str | None = None
    color: str | None = None
    price: Decimal = Field(ge=0)
    compare_at_price: Decimal | None = Field(default=None, ge=0)
    stock_qty: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    is_active: bool = True


class ProductImageIn(BaseModel):
    image_url: str
    is_primary: bool = False
    sort_order: int = 0


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    badge: str | None = None
    category_id: uuid.UUID | None = None
    is_active: bool = True
    is_featured: bool = False
    variants: list[ProductVariantIn] = []
    images: list[ProductImageIn] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    badge: str | None = None
    category_id: uuid.UUID | None = None
    is_active: bool | None = None
    is_featured: bool | None = None


class ProductVariantOut(ORMBase):
    id: uuid.UUID
    sku: str
    size: str | None
    color: str | None
    price: Decimal
    compare_at_price: Decimal | None
    stock_qty: int
    low_stock_threshold: int
    is_active: bool


class ProductImageOut(ORMBase):
    id: uuid.UUID
    image_url: str
    is_primary: bool
    sort_order: int


class ProductOut(ORMBase):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    badge: str | None
    category_id: uuid.UUID | None
    is_active: bool
    is_featured: bool
    variants: list[ProductVariantOut] = []
    images: list[ProductImageOut] = []
