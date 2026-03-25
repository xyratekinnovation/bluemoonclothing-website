import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.supporting import Notification
from app.models.user import User
from app.schemas.admin_ops import NotificationOut
from app.schemas.common import APIMessage

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Notification]:
    result = await db.execute(select(Notification).order_by(Notification.created_at.desc()))
    return list(result.scalars().all())


@router.patch("/{notification_id}/read", response_model=APIMessage)
async def mark_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> APIMessage:
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
    return APIMessage(message="Notification marked as read")


@router.patch("/read-all", response_model=APIMessage)
async def mark_all_read(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)) -> APIMessage:
    result = await db.execute(select(Notification).where(Notification.is_read.is_(False)))
    records = result.scalars().all()
    for record in records:
        record.is_read = True
    await db.commit()
    return APIMessage(message="All notifications marked as read")
