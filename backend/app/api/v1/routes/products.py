import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import Select, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product, ProductImage, ProductVariant
from app.schemas.catalog import ProductAdminListOut, ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


async def _collect_descendant_category_ids(db: AsyncSession, root_id: uuid.UUID) -> list[uuid.UUID]:
    """Root id plus every descendant (multi-level), for hub category product lists."""
    collected: list[uuid.UUID] = [root_id]
    frontier: list[uuid.UUID] = [root_id]
    while frontier:
        result = await db.execute(select(Category.id).where(Category.parent_id.in_(frontier)))
        frontier = [row[0] for row in result.all()]
        collected.extend(frontier)
    return collected


@router.get("/admin-list", response_model=list[ProductAdminListOut])
async def admin_list_products(
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
    active_only: bool = Query(default=False),
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    # Lightweight list for admin tables (avoids loading variants/images arrays).
    # Uses correlated subqueries to fetch the "first" variant and primary image.
    base = select(
        Product.id,
        Product.title,
        Product.name,
        Product.slug,
        Product.category_id,
        Product.is_active,
        Product.is_featured,
    ).order_by(Product.created_at.desc()).limit(limit).offset(offset)
    if active_only:
        base = base.where(Product.is_active.is_(True))
    if q:
        term = f"%{q.strip()}%"
        base = base.where(or_(Product.title.ilike(term), Product.name.ilike(term)))

    sub = base.subquery()

    first_variant = (
        select(
            ProductVariant.product_id.label("product_id"),
            ProductVariant.id.label("first_variant_id"),
            ProductVariant.sku.label("sku"),
            ProductVariant.size.label("size"),
            ProductVariant.color.label("color"),
            ProductVariant.price.label("price"),
            ProductVariant.compare_at_price.label("compare_at_price"),
            ProductVariant.stock_qty.label("stock_qty"),
        )
        .where(ProductVariant.product_id == sub.c.id)
        .order_by(ProductVariant.created_at.asc())
        .limit(1)
        .lateral()
    )

    first_image = (
        select(
            ProductImage.product_id.label("product_id"),
            ProductImage.image_url.label("image_url"),
        )
        .where(ProductImage.product_id == sub.c.id)
        .order_by(ProductImage.is_primary.desc(), ProductImage.sort_order.asc(), ProductImage.created_at.asc())
        .limit(1)
        .lateral()
    )

    query = (
        select(
            sub.c.id,
            sub.c.title,
            sub.c.name,
            sub.c.slug,
            sub.c.category_id,
            sub.c.is_active,
            sub.c.is_featured,
            first_variant.c.first_variant_id,
            first_variant.c.sku,
            first_variant.c.size,
            first_variant.c.color,
            first_variant.c.price,
            first_variant.c.compare_at_price,
            first_variant.c.stock_qty,
            first_image.c.image_url,
        )
        .select_from(sub)
        .outerjoin(first_variant, first_variant.c.product_id == sub.c.id)
        .outerjoin(first_image, first_image.c.product_id == sub.c.id)
    )

    result = await db.execute(query)
    return [dict(row._mapping) for row in result.all()]


@router.get("", response_model=list[ProductOut])
async def list_products(
    response: Response,
    db: AsyncSession = Depends(get_db),
    category_id: uuid.UUID | None = Query(default=None),
    expand_parent: bool = Query(
        default=False,
        description="When true with category_id, include products in this category and all nested child categories.",
    ),
    featured: bool | None = Query(default=None),
    active_only: bool = Query(default=True),
    q: str | None = Query(default=None),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[Product]:
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
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
        if expand_parent:
            allowed = await _collect_descendant_category_ids(db, category_id)
            if allowed:
                query = query.where(Product.category_id.in_(allowed))
        else:
            query = query.where(Product.category_id == category_id)
    if featured is not None:
        query = query.where(Product.is_featured.is_(featured))
    if q:
        term = f"%{q.strip()}%"
        query = query.where(or_(Product.title.ilike(term), Product.name.ilike(term)))

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
    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Product title is required")
    data["title"] = title
    data["name"] = (data.get("name") or title).strip()
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

    if "title" in payload_data and payload_data["title"] is not None:
        payload_data["title"] = str(payload_data["title"]).strip()
        if not payload_data["title"]:
            raise HTTPException(status_code=400, detail="Product title is required")
    if "name" in payload_data and payload_data["name"] is not None:
        payload_data["name"] = str(payload_data["name"]).strip()
    if "title" in payload_data and "name" not in payload_data:
        # Keep legacy `name` aligned with UI title unless explicitly overridden.
        payload_data["name"] = payload_data["title"]

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
