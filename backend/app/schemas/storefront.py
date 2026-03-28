from pydantic import BaseModel, Field


class HeroBannerOut(BaseModel):
    desktop_url: str | None = None
    mobile_url: str | None = None


class UploadImageOut(BaseModel):
    url: str = Field(description="Path relative to API origin, e.g. /uploads/file.jpg")
