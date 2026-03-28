import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import require_admin
from app.models.user import User
from app.schemas.storefront import UploadImageOut

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
    root = _upload_root()
    root.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = root / name
    dest.write_bytes(data)
    return UploadImageOut(url=f"/uploads/{name}")
