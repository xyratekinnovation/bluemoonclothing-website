import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.db.session import engine

settings = get_settings()
app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

logger = logging.getLogger("uvicorn.error")


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    # Log the full traceback to Render logs, but keep response generic.
    logger.exception("Unhandled exception", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/db-health")
async def db_health() -> dict[str, str]:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
        return {"db": "ok"}
    except Exception as exc:
        logger.exception("DB health check failed", exc_info=exc)
        return {"db": "error"}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
