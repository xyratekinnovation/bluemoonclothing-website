from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("")
async def list_customers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    query = (
        select(
            User.id,
            User.name,
            User.email,
            User.phone,
            User.created_at,
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.grand_total), 0).label("total_spend"),
        )
        .outerjoin(Order, Order.user_id == User.id)
        .where(User.is_admin.is_(False))
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": str(row.id),
            "name": row.name,
            "email": row.email,
            "phone": row.phone,
            "orders": int(row.orders or 0),
            "total_spend": float(row.total_spend or 0),
            "joined": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]
