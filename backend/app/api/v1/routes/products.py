import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.product import Product, ProductImage, ProductVariant
from app.schemas.catalog import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    category_id: uuid.UUID | None = Query(default=None),
    featured: bool | None = Query(default=None),
    active_only: bool = Query(default=True),
    q: str | None = Query(default=None),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[Product]:
    query: Select[tuple[Product]] = (
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.images))
        .order_by(Product.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if active_only:
        query = query.where(Product.is_active.is_(True))
    if category_id:
        query = query.where(Product.category_id == category_id)
    if featured is not None:
        query = query.where(Product.is_featured.is_(featured))
    if q:
        query = query.where(Product.name.ilike(f"%{q.strip()}%"))

    result = await db.execute(query)
    return list(result.scalars().unique().all())


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Product:
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.variants), selectinload(Product.images))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
) -> Product:
    exists = await db.execute(select(Product).where(Product.slug == payload.slug))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Product slug already exists")

    data = payload.model_dump(exclude={"variants", "images"})
    product = Product(**data)
    db.add(product)
    await db.flush()

    for variant in payload.variants:
        db.add(ProductVariant(product_id=product.id, **variant.model_dump()))
    for image in payload.images:
        db.add(ProductImage(product_id=product.id, **image.model_dump()))

    await db.commit()
    await db.refresh(product)
    return await get_product(product.id, db)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    payload_data = payload.model_dump(exclude_unset=True)
    variants = payload_data.pop("variants", None)
    images = payload_data.pop("images", None)

    for key, value in payload_data.items():
        setattr(product, key, value)

    if variants is not None:
        await db.execute(delete(ProductVariant).where(ProductVariant.product_id == product.id))
        for variant in variants:
            db.add(ProductVariant(product_id=product.id, **variant))

    if images is not None:
        await db.execute(delete(ProductImage).where(ProductImage.product_id == product.id))
        for image in images:
            db.add(ProductImage(product_id=product.id, **image))

    await db.commit()
    return await get_product(product.id, db)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
) -> None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()
