import logging
import mimetypes
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import require_admin
from app.models.user import User
from app.schemas.storefront import UploadImageOut
from app.services.supabase_storage import supabase_upload_configured, upload_bytes_to_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_BYTES = 20 * 1024 * 1024  # large hero assets (minimize recompression before upload)


def _upload_root() -> Path:
    # backend/app/api/v1/routes/uploads.py -> parents[4] == backend/
    return Path(__file__).resolve().parents[4] / "uploads"


@router.post("/image", response_model=UploadImageOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
) -> UploadImageOut:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    content_type = file.content_type
    if not content_type or content_type == "application/octet-stream":
        content_type = mimetypes.guess_type(f"file{suffix}")[0] or "application/octet-stream"

    if supabase_upload_configured():
        try:
            public_url = await upload_bytes_to_supabase(data=data, suffix=suffix, content_type=content_type)
            return UploadImageOut(url=public_url)
        except Exception as exc:
            logger.exception("Supabase storage upload failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Storage upload failed: {exc}"[:300],
            ) from exc

    root = _upload_root()
    root.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = root / name
    dest.write_bytes(data)
    return UploadImageOut(url=f"/uploads/{name}")
