from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.product import ProductVariant
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    revenue = await db.scalar(select(func.coalesce(func.sum(Order.grand_total), 0)))
    orders = await db.scalar(select(func.count(Order.id)))
    customers = await db.scalar(select(func.count(User.id)).where(User.is_admin.is_(False)))
    avg_order = await db.scalar(select(func.coalesce(func.avg(Order.grand_total), 0)))

    recent_orders_result = await db.execute(
        select(Order.order_number, Order.grand_total, Order.status, Order.created_at)
        .order_by(desc(Order.created_at))
        .limit(5)
    )
    recent_orders = [
        {
            "id": row.order_number,
            "total": float(row.grand_total or 0),
            "status": row.status,
            "date": row.created_at.isoformat() if row.created_at else None,
        }
        for row in recent_orders_result.all()
    ]

    low_stock_result = await db.execute(
        select(ProductVariant.sku, ProductVariant.stock_qty)
        .where(ProductVariant.stock_qty <= ProductVariant.low_stock_threshold)
        .order_by(ProductVariant.stock_qty.asc())
        .limit(5)
    )
    low_stock = [{"sku": row.sku, "stock": row.stock_qty} for row in low_stock_result.all()]

    top_products_result = await db.execute(
        select(
            OrderItem.product_name_snapshot,
            func.sum(OrderItem.quantity).label("sold"),
            func.sum(OrderItem.line_total).label("revenue"),
        )
        .group_by(OrderItem.product_name_snapshot)
        .order_by(desc(func.sum(OrderItem.quantity)))
        .limit(5)
    )
    top_products = [
        {"name": row.product_name_snapshot, "sold": int(row.sold or 0), "revenue": float(row.revenue or 0)}
        for row in top_products_result.all()
    ]

    return {
        "metrics": {
            "total_revenue": float(revenue or 0),
            "total_orders": int(orders or 0),
            "total_customers": int(customers or 0),
            "avg_order_value": float(avg_order or 0),
        },
        "recent_orders": recent_orders,
        "low_stock": low_stock,
        "top_products": top_products,
    }
