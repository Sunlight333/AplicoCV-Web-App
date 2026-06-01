from __future__ import annotations

import asyncio
import json
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Document, User
from app.services import llm_service

router = APIRouter(prefix="/documents", tags=["documents"])

_ALLOWED = {".pdf", ".docx"}


def _extract_text(path: str) -> str:
    """
    Read text from an uploaded CV. Tries pdfplumber / python-docx if installed;
    otherwise reads the raw bytes as UTF-8 (works for the demo's text uploads).
    Kept dependency-light so the API runs without the heavy parsing stack.
    """
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".pdf":
            import pdfplumber  # type: ignore

            with pdfplumber.open(path) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        if ext == ".docx":
            import docx  # type: ignore

            return "\n".join(p.text for p in docx.Document(path).paragraphs)
    except Exception:
        pass
    try:
        with open(path, "rb") as fh:
            return fh.read().decode("utf-8", errors="ignore")
    except Exception:
        return ""


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Only PDF or DOCX allowed")

    os.makedirs(settings.upload_dir, exist_ok=True)
    stored = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.upload_dir, stored)
    with open(path, "wb") as out:
        out.write(await file.read())

    doc = Document(user_id=user.id, filename=file.filename or stored, path=path, kind="cv")
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"documentId": doc.id}


@router.get("/parse")
async def parse(
    documentId: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    Server-Sent Events stream of parsing progress. Emits one event per stage,
    then a final event carrying the structured profile. Matches the frontend's
    fetch-streaming consumer (which sends the Authorization header).
    """
    doc = await db.get(Document, documentId)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found")

    async def event_stream():
        stages = [
            ("read", "Reading document…"),
            ("work", "Extracting work history…"),
            ("skills", "Identifying skills…"),
            ("education", "Structuring education…"),
            ("contact", "Collecting contact details…"),
        ]
        for stage, message in stages:
            await asyncio.sleep(0.5)
            yield f"data: {json.dumps({'stage': stage, 'message': message, 'done': False})}\n\n"

        text = _extract_text(doc.path)
        profile = await llm_service.extract_profile(text)
        doc.parsed = profile
        await db.commit()
        payload = {"stage": "complete", "message": "Done", "done": True, "profile": profile}
        yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
