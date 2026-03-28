"""
Default Men / Women / Kids category tree for Bluemoon (idempotent upserts).
Run via `seed_data.py` or: python -m app.db.seed_categories (if __main__ added).
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


async def _upsert_category(
    session: AsyncSession,
    *,
    name: str,
    slug: str,
    sort_order: int,
    parent_id: uuid.UUID | None = None,
) -> Category:
    result = await session.execute(select(Category).where(Category.slug == slug))
    row = result.scalar_one_or_none()
    if row:
        row.name = name
        row.sort_order = sort_order
        row.parent_id = parent_id
        row.is_active = True
        return row
    cat = Category(
        name=name,
        slug=slug,
        sort_order=sort_order,
        parent_id=parent_id,
        is_active=True,
    )
    session.add(cat)
    await session.flush()
    return cat


async def seed_default_categories(session: AsyncSession) -> None:
    """Create roots + full subcategory tree. Safe to run multiple times."""
    men = await _upsert_category(session, name="Men", slug="men", sort_order=1, parent_id=None)
    women = await _upsert_category(session, name="Women", slug="women", sort_order=2, parent_id=None)
    kids = await _upsert_category(session, name="Kids", slug="kids", sort_order=3, parent_id=None)

    men_leaves: list[tuple[str, str, int]] = [
        ("T-Shirt", "men-t-shirt", 10),
        ("Polo T-Shirt", "men-polo-t-shirt", 20),
        ("Shorts", "men-shorts", 30),
        ("Pants", "men-pants", 40),
        ("Co-ord Sets", "men-coord-sets", 50),
        ("Night Suits", "men-night-suits", 60),
        ("Hoodie", "men-hoodie", 70),
        ("Oversized", "men-oversized", 80),
        ("Tracks", "men-tracks", 90),
    ]
    for name, slug, order in men_leaves:
        await _upsert_category(session, name=name, slug=slug, sort_order=order, parent_id=men.id)

    women_groups: list[tuple[str, str, int, list[tuple[str, str, int]]]] = [
        (
            "Tops & Basics",
            "women-tops-basics",
            10,
            [
                ("Crop Top", "women-crop-top", 10),
                ("Tank Top", "women-tank-top", 20),
                ("Slips", "women-slips", 30),
                ("T-Shirts", "women-t-shirts", 40),
            ],
        ),
        (
            "Bottom Wear",
            "women-bottom-wear",
            20,
            [
                ("Shorts", "women-shorts", 10),
                ("Pants", "women-pants", 20),
                ("Straight Pants", "women-straight-pants", 30),
            ],
        ),
        (
            "Shapewear & Leggings",
            "women-shapewear-leggings",
            30,
            [
                ("Shapewear", "women-shapewear", 10),
                ("Leggings - Ankle Length", "women-leggings-ankle-length", 20),
                ("Leggings - Chudidar Length", "women-leggings-chudidar-length", 30),
                ("3/4 Leggings", "women-leggings-three-quarter", 40),
            ],
        ),
        (
            "Night Wear",
            "women-night-wear",
            40,
            [
                ("Peplum Top & Pants Set", "women-peplum-top-pants-set", 10),
                ("T-Shirt & Pant Set", "women-tshirt-pant-set", 20),
                ("Shortie", "women-shortie", 30),
                ("Feeding Shortie", "women-feeding-shortie", 40),
                ("Feeding T-Shirt & Pant Set", "women-feeding-tshirt-pant-set", 50),
            ],
        ),
        (
            "Casual / Outerwear",
            "women-casual-outerwear",
            50,
            [
                ("Oversized T-Shirt", "women-oversized-tshirt", 10),
                ("Hoodie", "women-hoodie", 20),
                ("Co-ord Sets", "women-coord-sets", 30),
            ],
        ),
    ]
    for gname, gslug, gorder, leaves in women_groups:
        group = await _upsert_category(session, name=gname, slug=gslug, sort_order=gorder, parent_id=women.id)
        for lname, lslug, lorder in leaves:
            await _upsert_category(session, name=lname, slug=lslug, sort_order=lorder, parent_id=group.id)

    boys = await _upsert_category(session, name="Boys", slug="kids-boys", sort_order=10, parent_id=kids.id)
    boys_leaves: list[tuple[str, str, int]] = [
        ("T-Shirt", "kids-boys-tshirt", 10),
        ("Pants", "kids-boys-pants", 20),
        ("Shorts", "kids-boys-shorts", 30),
        ("Night Sets", "kids-boys-night-sets", 40),
        ("Summer Suits", "kids-boys-summer-suits", 50),
        ("Winter Suits", "kids-boys-winter-suits", 60),
    ]
    for name, slug, order in boys_leaves:
        await _upsert_category(session, name=name, slug=slug, sort_order=order, parent_id=boys.id)

    girls = await _upsert_category(session, name="Girls", slug="kids-girls", sort_order=20, parent_id=kids.id)
    girls_leaves: list[tuple[str, str, int]] = [
        ("Frock", "kids-girls-frock", 10),
        ("T-Shirt", "kids-girls-tshirt", 20),
        ("Pants", "kids-girls-pants", 30),
        ("Shorts", "kids-girls-shorts", 40),
        ("Night Sets", "kids-girls-night-sets", 50),
        ("Summer Suits", "kids-girls-summer-suits", 60),
        ("Winter Suits", "kids-girls-winter-suits", 70),
    ]
    for name, slug, order in girls_leaves:
        await _upsert_category(session, name=name, slug=slug, sort_order=order, parent_id=girls.id)


async def main() -> None:
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        await seed_default_categories(session)
        await session.commit()
    print("Default categories seeded.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
