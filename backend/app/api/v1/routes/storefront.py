from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import APIRouter, Depends

from app.db.session import get_db
from app.models.supporting import StoreSetting
from app.schemas.storefront import HeroBannerOut

router = APIRouter(prefix="/storefront", tags=["Storefront"])

HERO_BANNER_KEY = "hero_banner"


@router.get("/hero-banner", response_model=HeroBannerOut)
async def get_hero_banner(db: AsyncSession = Depends(get_db)) -> HeroBannerOut:
    result = await db.execute(select(StoreSetting).where(StoreSetting.key == HERO_BANNER_KEY))
    row = result.scalar_one_or_none()
    if not row or not isinstance(row.value, dict):
        return HeroBannerOut()
    v = row.value
    return HeroBannerOut(
        desktop_url=v.get("desktop_url") if isinstance(v.get("desktop_url"), str) else None,
        mobile_url=v.get("mobile_url") if isinstance(v.get("mobile_url"), str) else None,
    )
