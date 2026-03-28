from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    analytics,
    access_control,
    banners,
    cart,
    categories,
    customers,
    coupons,
    notifications,
    orders,
    payments,
    products,
    settings,
    shipping,
    storefront,
    uploads,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(access_control.router)
api_router.include_router(cart.router)
api_router.include_router(categories.router)
api_router.include_router(coupons.router)
api_router.include_router(shipping.router)
api_router.include_router(banners.router)
api_router.include_router(notifications.router)
api_router.include_router(settings.router)
api_router.include_router(customers.router)
api_router.include_router(analytics.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(products.router)
api_router.include_router(storefront.router)
api_router.include_router(uploads.router)
