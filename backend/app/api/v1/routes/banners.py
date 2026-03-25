import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.supporting import Banner
from app.models.user import User
from app.schemas.admin_ops import BannerCreate, BannerOut, BannerUpdate

router = APIRouter(prefix="/banners", tags=["Banners"])


@router.get("", response_model=list[BannerOut])
async def list_banners(db: AsyncSession = Depends(get_db)) -> list[Banner]:
    result = await db.execute(select(Banner).order_by(Banner.sort_order.asc(), Banner.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=BannerOut, status_code=status.HTTP_201_CREATED)
async def create_banner(
    payload: BannerCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Banner:
    banner = Banner(**payload.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.patch("/{banner_id}", response_model=BannerOut)
async def update_banner(
    banner_id: uuid.UUID,
    payload: BannerUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Banner:
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(banner, key, value)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(
    banner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    await db.delete(banner)
    await db.commit()
