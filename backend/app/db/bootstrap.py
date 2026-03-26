import logging

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

logger = logging.getLogger("uvicorn.error")


async def ensure_default_admin() -> None:
    settings = get_settings()
    if not settings.SEED_DEFAULT_ADMIN:
        return
    email = settings.DEFAULT_ADMIN_EMAIL.strip()
    password = settings.DEFAULT_ADMIN_PASSWORD
    if not email or not password:
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing is not None:
            if not existing.is_admin:
                existing.is_admin = True
                await session.commit()
                logger.info("Promoted existing user to admin: %s", email)
            return

        user = User(
            name="Admin",
            email=email,
            password_hash=get_password_hash(password),
            is_active=True,
            is_admin=True,
        )
        session.add(user)
        await session.commit()
        logger.info("Created default admin user for %s", email)
