import logging
from typing import Any

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import ssl as pyssl

from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.bootstrap import ensure_default_admin
from app.db.session import engine

settings = get_settings()
app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
_cors_regex = (settings.CORS_ORIGIN_REGEX or "").strip() or None
if _cors_origins or _cors_regex:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_origin_regex=_cors_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

logger = logging.getLogger("uvicorn.error")


@app.on_event("startup")
async def startup() -> None:
    if settings.AUTO_CREATE_TABLES:
        import app.models  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    try:
        await ensure_default_admin()
    except Exception:
        logger.exception("ensure_default_admin failed")


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    # Log the full traceback to Render logs, but keep response generic.
    logger.exception("Unhandled exception", exc_info=exc)
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal Server Error",
                "error_type": type(exc).__name__,
                "message": str(exc),
            },
        )
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/db-health", response_model=None)
async def db_health():
    # Try multiple SSL settings for Supabase compatibility.
    # This helps distinguish "schema mismatch" vs "DB SSL/connection" problems.
    db_url = settings.DATABASE_URL
    tried: list[str] = []
    errors: list[str] = []
    host: str | None = None
    port: int | None = None
    database: str | None = None

    def normalize_url(url: str) -> str:
        if url.startswith("postgres://"):
            return "postgresql://" + url[len("postgres://") :]
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    async def try_select(select_engine_url: str, connect_args: dict) -> None:
        tmp_engine = create_async_engine(
            select_engine_url,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            connect_args=connect_args,
        )
        try:
            async with tmp_engine.connect() as conn:
                await conn.execute(text("select 1"))
        finally:
            maybe_awaitable = tmp_engine.dispose()
            if hasattr(maybe_awaitable, "__await__"):
                await maybe_awaitable

    # 1) Use the configured engine first (what the app uses normally)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
        return {"db": "ok"}
    except Exception as exc:
        tried.append("configured_engine")
        errors.append(str(exc))

    # 2) If Supabase hostname, try common SSL variants
    if "supabase.co" in db_url:
        db_url_norm = normalize_url(db_url)
        parsed = urlparse(db_url_norm)
        host = parsed.hostname
        port = parsed.port
        database = parsed.path.lstrip("/")
        ssl_candidates: list[tuple[str, dict]] = [
            ("ssl_context", {"ssl": pyssl.create_default_context()}),
            ("ssl_true", {"ssl": True}),
            ("ssl_none", {}),
        ]
        for label, connect_args in ssl_candidates:
            try:
                await try_select(db_url_norm, connect_args)
                return {"db": "ok", "ssl": label}
            except Exception as exc:
                tried.append(label)
                errors.append(str(exc))

    logger.exception("DB health check failed", extra={"tried": tried})
    if settings.DEBUG:
        return {
            "db": "error",
            "tried": tried,
            "errors": errors,
            "db_host": host if "supabase.co" in db_url else None,
            "db_port": port if "supabase.co" in db_url else None,
            "db_name": database if "supabase.co" in db_url else None,
        }
    return {"db": "error"}


UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
