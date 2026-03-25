from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.supporting import StoreSetting
from app.models.user import User
from app.schemas.admin_ops import StoreSettingsOut, StoreSettingsPatch

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=list[StoreSettingsOut])
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[StoreSetting]:
    result = await db.execute(select(StoreSetting).order_by(StoreSetting.key.asc()))
    return list(result.scalars().all())


@router.put("/{key}", response_model=StoreSettingsOut)
async def upsert_setting(
    key: str,
    payload: StoreSettingsPatch,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> StoreSetting:
    result = await db.execute(select(StoreSetting).where(StoreSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = payload.value
    else:
        setting = StoreSetting(key=key, value=payload.value)
        db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return setting
