"""Optional Supabase Storage uploads (survives ephemeral server filesystem)."""

from __future__ import annotations

import uuid

import httpx

from app.core.config import get_settings


def _supabase_base_url() -> str | None:
    s = get_settings()
    if not s.SUPABASE_URL or not str(s.SUPABASE_URL).strip():
        return None
    return str(s.SUPABASE_URL).rstrip("/")


def supabase_upload_configured() -> bool:
    s = get_settings()
    return bool(
        _supabase_base_url()
        and (s.SUPABASE_SERVICE_ROLE_KEY or "").strip()
        and (s.SUPABASE_STORAGE_BUCKET or "").strip(),
    )


async def upload_bytes_to_supabase(
    *,
    data: bytes,
    suffix: str,
    content_type: str,
) -> str:
    """
    Upload to Supabase Storage and return a public object URL.
    Bucket must allow public read (Dashboard → Storage → bucket → Public).
    """
    s = get_settings()
    base = _supabase_base_url()
    key = (s.SUPABASE_SERVICE_ROLE_KEY or "").strip()
    bucket = (s.SUPABASE_STORAGE_BUCKET or "").strip()
    if not base or not key or not bucket:
        raise RuntimeError("Supabase storage is not configured")

    object_name = f"{uuid.uuid4().hex}{suffix}"
    upload_url = f"{base}/storage/v1/object/{bucket}/{object_name}"

    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": content_type,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(upload_url, headers=headers, content=data)

    if resp.status_code not in (200, 201):
        detail = resp.text[:500] if resp.text else resp.reason_phrase
        raise RuntimeError(f"Supabase upload failed ({resp.status_code}): {detail}")

    return f"{base}/storage/v1/object/public/{bucket}/{object_name}"
