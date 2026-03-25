from fastapi import FastAPI

from app.api.v1.api import api_router
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
