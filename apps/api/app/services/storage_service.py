"""
Document storage abstraction.

Two backends, selected by settings.storage_enabled (STORAGE_PROVIDER=s3|r2 with
S3_BUCKET set):

- local : files written under settings.upload_dir; the stored reference is the
          absolute filesystem path (the MVP default, zero setup).
- s3/r2 : files uploaded to the bucket via boto3; the stored reference is the
          object key. Cloudflare R2 is just S3 with a custom S3_ENDPOINT_URL.

Only the storage layer changes between backends — callers store the returned
reference on the Document row and later use `local_path()` to get a real file on
disk for parsing/OCR (S3/R2 objects are streamed to a temp file transparently).
"""

from __future__ import annotations

import asyncio
import os
import tempfile
import uuid
from contextlib import asynccontextmanager

from app.config import settings


def _new_key(filename: str) -> str:
    """UUID-prefixed object key / filename that preserves the extension."""
    ext = os.path.splitext(filename or "")[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


def _client():
    """Build a boto3 S3 client (works for AWS S3 and Cloudflare R2)."""
    import boto3  # imported lazily so the dep is only needed when S3/R2 is on

    return boto3.client(
        "s3",
        region_name=settings.s3_region or None,
        endpoint_url=settings.s3_endpoint_url or None,
        aws_access_key_id=settings.s3_access_key_id or None,
        aws_secret_access_key=settings.s3_secret_access_key or None,
    )


async def save(data: bytes, filename: str) -> str:
    """Persist bytes and return the storage reference (object key or local path)."""
    key = _new_key(filename)
    if settings.storage_enabled:
        def _put() -> None:
            _client().put_object(Bucket=settings.s3_bucket, Key=key, Body=data)

        await asyncio.to_thread(_put)
        return key

    os.makedirs(settings.upload_dir, exist_ok=True)
    path = os.path.join(settings.upload_dir, key)
    with open(path, "wb") as out:
        out.write(data)
    return path


@asynccontextmanager
async def local_path(ref: str):
    """
    Yield a real filesystem path for `ref`. Local refs are yielded as-is; S3/R2
    object keys are downloaded to a temp file (and cleaned up afterwards) so the
    pdfplumber / python-docx / OCR code can work on a path. The `os.path.exists`
    check also handles legacy local files when storage was switched on later.
    """
    if settings.storage_enabled and not os.path.exists(ref):
        def _download() -> str:
            fd, tmp = tempfile.mkstemp(suffix=os.path.splitext(ref)[1])
            os.close(fd)
            _client().download_file(settings.s3_bucket, ref, tmp)
            return tmp

        tmp_path = await asyncio.to_thread(_download)
        try:
            yield tmp_path
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    else:
        yield ref
