import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.catalog import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    response: Response,
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(default=True),
) -> list[Category]:
    response.headers["Cache-Control"] = "public, max-age=120, stale-while-revalidate=300"
    query = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
    if active_only:
        query = query.where(Category.is_active.is_(True))
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
) -> Category:
    exists = await db.execute(select(Category).where(Category.slug == payload.slug))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category slug already exists")

    category = Category(**payload.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
) -> Category:
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
) -> None:
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Clear FKs explicitly so delete works even if the DB was created without ON DELETE SET NULL.
    await db.execute(update(Product).where(Product.category_id == category_id).values(category_id=None))
    await db.execute(update(Category).where(Category.parent_id == category_id).values(parent_id=None))

    try:
        await db.delete(category)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this category while other data still references it. Deactivate it instead or remove linked records.",
        )
