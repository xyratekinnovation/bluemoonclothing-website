# Bluemoon Backend

FastAPI backend scaffold for Bluemoon e-commerce platform.

## Setup

1. Copy environment file:
   - `.env.example` -> `.env`
2. Create virtual environment and install deps:
   - `pip install -r requirements.txt`
3. Configure database URLs in `.env` for your Supabase/Postgres.
4. Run API:
   - `uvicorn app.main:app --reload --port 8000`

## API Docs

- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Implemented modules

- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- Categories:
  - `GET /api/v1/categories`
  - `POST /api/v1/categories` (admin)
  - `PATCH /api/v1/categories/{category_id}` (admin)
- Products:
  - `GET /api/v1/products`
  - `GET /api/v1/products/{product_id}`
  - `POST /api/v1/products` (admin)
  - `PATCH /api/v1/products/{product_id}` (admin)
- Cart:
  - `GET /api/v1/cart`
  - `POST /api/v1/cart/items`
- Orders:
  - `POST /api/v1/orders/checkout`
  - `GET /api/v1/orders`
  - `PATCH /api/v1/orders/{order_id}/status` (admin)
- Payments:
  - `POST /api/v1/payments`
  - `POST /api/v1/payments/webhook`
  - `GET /api/v1/payments` (admin)
- Coupons:
  - `GET /api/v1/coupons` (admin)
  - `POST /api/v1/coupons` (admin)
  - `PATCH /api/v1/coupons/{coupon_id}` (admin)
  - `DELETE /api/v1/coupons/{coupon_id}` (admin)
- Shipping:
  - `GET /api/v1/shipping-zones`
  - `POST /api/v1/shipping-zones` (admin)
  - `PATCH /api/v1/shipping-zones/{zone_id}` (admin)
  - `DELETE /api/v1/shipping-zones/{zone_id}` (admin)
- Banners:
  - `GET /api/v1/banners`
  - `POST /api/v1/banners` (admin)
  - `PATCH /api/v1/banners/{banner_id}` (admin)
  - `DELETE /api/v1/banners/{banner_id}` (admin)
- Notifications:
  - `GET /api/v1/notifications` (admin)
  - `PATCH /api/v1/notifications/{notification_id}/read`
  - `PATCH /api/v1/notifications/read-all` (admin)
- Settings:
  - `GET /api/v1/settings` (admin)
  - `PUT /api/v1/settings/{key}` (admin)

## Next build sequence

1. Customer management + admin access control APIs
2. Analytics aggregation endpoints
3. Frontend and admin panel API integration (remove mocks)
