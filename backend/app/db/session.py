import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = "postgresql://" + db_url[len("postgres://") :]
if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)


def supabase_unverified_ssl_context() -> ssl.SSLContext:
    """
    Supabase SSL in some container environments can fail verification
    due to missing trust chain. This keeps DB-backed endpoints working.
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    # Supabase SSL: some Render/container environments may fail certificate
    # verification due to missing trust chain. For now we disable verification
    # to keep the app working and avoid 500s on DB-backed endpoints.
    connect_args={"ssl": supabase_unverified_ssl_context()} if "supabase.co" in db_url else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
