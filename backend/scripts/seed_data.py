import asyncio
import os
from decimal import Decimal

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.product import Product, ProductImage, ProductVariant
from app.models.user import User
from app.utils.security import get_password_hash


async def upsert_category(session, name: str, slug: str, sort_order: int) -> Category:
    result = await session.execute(select(Category).where(Category.slug == slug))
    category = result.scalar_one_or_none()
    if category:
        category.name = name
        category.sort_order = sort_order
        category.is_active = True
        return category

    category = Category(name=name, slug=slug, sort_order=sort_order, is_active=True)
    session.add(category)
    await session.flush()
    return category


async def upsert_product(
    session,
    *,
    category_id,
    name: str,
    slug: str,
    description: str,
    badge: str | None,
    sku: str,
    size: str,
    color: str,
    price: Decimal,
    compare_at_price: Decimal | None,
    stock_qty: int,
    image_url: str,
    featured: bool,
) -> Product:
    result = await session.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if not product:
        product = Product(
            name=name,
            slug=slug,
            description=description,
            badge=badge,
            category_id=category_id,
            is_active=True,
            is_featured=featured,
        )
        session.add(product)
        await session.flush()
    else:
        product.name = name
        product.description = description
        product.badge = badge
        product.category_id = category_id
        product.is_active = True
        product.is_featured = featured

    variant_result = await session.execute(select(ProductVariant).where(ProductVariant.sku == sku))
    variant = variant_result.scalar_one_or_none()
    if not variant:
        variant = ProductVariant(
            product_id=product.id,
            sku=sku,
            size=size,
            color=color,
            price=price,
            compare_at_price=compare_at_price,
            stock_qty=stock_qty,
            low_stock_threshold=5,
            is_active=True,
        )
        session.add(variant)
    else:
        variant.product_id = product.id
        variant.size = size
        variant.color = color
        variant.price = price
        variant.compare_at_price = compare_at_price
        variant.stock_qty = stock_qty
        variant.is_active = True

    image_result = await session.execute(
        select(ProductImage).where(ProductImage.product_id == product.id, ProductImage.image_url == image_url)
    )
    image = image_result.scalar_one_or_none()
    if not image:
        session.add(
            ProductImage(
                product_id=product.id,
                image_url=image_url,
                is_primary=True,
                sort_order=0,
            )
        )

    return product


async def upsert_admin_user(session) -> User:
    admin_email = os.getenv("ADMIN_EMAIL", "admin@bluemoon.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123456")
    admin_name = os.getenv("ADMIN_NAME", "Bluemoon Admin")

    result = await session.execute(select(User).where(User.email == admin_email))
    admin = result.scalar_one_or_none()
    if admin:
        admin.name = admin_name
        admin.is_admin = True
        admin.is_active = True
        if not admin.password_hash:
            admin.password_hash = get_password_hash(admin_password)
        return admin

    admin = User(
        name=admin_name,
        email=admin_email,
        phone="9999999999",
        password_hash=get_password_hash(admin_password),
        is_active=True,
        is_admin=True,
    )
    session.add(admin)
    return admin


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        men = await upsert_category(session, "Men", "men", 1)
        women = await upsert_category(session, "Women", "women", 2)
        kids = await upsert_category(session, "Kids", "kids", 3)

        await upsert_product(
            session,
            category_id=men.id,
            name="Royal Blue Polo",
            slug="royal-blue-polo",
            description="Premium polo crafted for all-day comfort.",
            badge="Bestseller",
            sku="BM-PLO-001",
            size="M",
            color="Blue",
            price=Decimal("1499"),
            compare_at_price=Decimal("1799"),
            stock_qty=84,
            image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            featured=True,
        )
        await upsert_product(
            session,
            category_id=women.id,
            name="Floral Maxi Dress",
            slug="floral-maxi-dress",
            description="Elegant maxi dress for modern styling.",
            badge="New",
            sku="BM-DRS-023",
            size="S",
            color="Pink",
            price=Decimal("2499"),
            compare_at_price=Decimal("2999"),
            stock_qty=45,
            image_url="https://images.unsplash.com/photo-1496747611176-843222e1e57c",
            featured=True,
        )
        await upsert_product(
            session,
            category_id=kids.id,
            name="Kids Denim Jacket",
            slug="kids-denim-jacket",
            description="Soft denim jacket for kids.",
            badge=None,
            sku="BM-KDJ-011",
            size="6Y",
            color="Blue",
            price=Decimal("1799"),
            compare_at_price=None,
            stock_qty=28,
            image_url="https://images.unsplash.com/photo-1519238359922-989348752efb",
            featured=False,
        )

        await upsert_admin_user(session)
        await session.commit()

    print("Seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
