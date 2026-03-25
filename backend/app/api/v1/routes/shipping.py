import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.supporting import ShippingZone
from app.models.user import User
from app.schemas.admin_ops import ShippingZoneCreate, ShippingZoneOut, ShippingZoneUpdate

router = APIRouter(prefix="/shipping-zones", tags=["Shipping"])


@router.get("", response_model=list[ShippingZoneOut])
async def list_shipping_zones(db: AsyncSession = Depends(get_db)) -> list[ShippingZone]:
    result = await db.execute(select(ShippingZone).order_by(ShippingZone.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=ShippingZoneOut, status_code=status.HTTP_201_CREATED)
async def create_shipping_zone(
    payload: ShippingZoneCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> ShippingZone:
    zone = ShippingZone(**payload.model_dump())
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone


@router.patch("/{zone_id}", response_model=ShippingZoneOut)
async def update_shipping_zone(
    zone_id: uuid.UUID,
    payload: ShippingZoneUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> ShippingZone:
    result = await db.execute(select(ShippingZone).where(ShippingZone.id == zone_id))
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Shipping zone not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(zone, key, value)
    await db.commit()
    await db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shipping_zone(
    zone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    result = await db.execute(select(ShippingZone).where(ShippingZone.id == zone_id))
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Shipping zone not found")
    await db.delete(zone)
    await db.commit()
