from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.utils.security import get_password_hash

router = APIRouter(prefix="/access-control", tags=["Access Control"])

DEFAULT_PERMISSIONS = ["Products", "Orders", "Analytics", "Customers", "Payments", "Settings", "Access Control"]


@router.get("/admins")
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    result = await db.execute(select(User).where(User.is_admin.is_(True)).order_by(User.created_at.desc()))
    admins = result.scalars().all()
    return [
        {
            "id": str(admin.id),
            "name": admin.name,
            "email": admin.email,
            "role": "Super Admin",
            "permissions": DEFAULT_PERMISSIONS,
            "active": admin.is_active,
        }
        for admin in admins
    ]


@router.post("/admins", status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    email = payload.get("email")
    name = payload.get("name")
    if not email or not name:
        raise HTTPException(status_code=400, detail="name and email are required")

    exists = await db.execute(select(User).where(User.email == email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        name=name,
        email=email,
        is_admin=True,
        is_active=True,
        password_hash=get_password_hash("TempAdmin@123"),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": payload.get("role", "Staff"),
        "permissions": payload.get("permissions", DEFAULT_PERMISSIONS),
        "active": user.is_active,
    }


@router.patch("/admins/{admin_id}")
async def update_admin(
    admin_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    result = await db.execute(select(User).where(User.id == admin_id, User.is_admin.is_(True)))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if "name" in payload:
        admin.name = payload["name"]
    if "email" in payload:
        admin.email = payload["email"]
    if "active" in payload:
        admin.is_active = bool(payload["active"])
    await db.commit()
    await db.refresh(admin)
    return {
        "id": str(admin.id),
        "name": admin.name,
        "email": admin.email,
        "role": payload.get("role", "Staff"),
        "permissions": payload.get("permissions", DEFAULT_PERMISSIONS),
        "active": admin.is_active,
    }


@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(
    admin_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    result = await db.execute(select(User).where(User.id == admin_id, User.is_admin.is_(True)))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    await db.delete(admin)
    await db.commit()
