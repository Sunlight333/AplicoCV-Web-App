from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import FaqAnswer, User

router = APIRouter(prefix="/faq", tags=["faq"])

# Common application questions users get asked repeatedly; the extension uses the
# saved answers to autofill open-text fields.
SUGGESTED = [
    "Why do you want to work here?",
    "What are your salary expectations?",
    "What is your notice period / availability to start?",
    "Why are you leaving your current job?",
    "Are you willing to relocate?",
    "Describe your greatest professional achievement.",
    "What are your strengths and weaknesses?",
    "Are you legally authorized to work in this country?",
]


class FaqIn(BaseModel):
    question: str
    answer: str


class FaqOut(BaseModel):
    id: str
    question: str
    answer: str


def _out(f: FaqAnswer) -> FaqOut:
    return FaqOut(id=f.id, question=f.question, answer=f.answer)


@router.get("", response_model=list[FaqOut])
async def list_faq(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[FaqOut]:
    rows = (
        await db.execute(select(FaqAnswer).where(FaqAnswer.user_id == user.id))
    ).scalars().all()
    return [_out(f) for f in rows]


@router.get("/suggested", response_model=list[str])
async def suggested() -> list[str]:
    return SUGGESTED


@router.post("", response_model=FaqOut)
async def create_faq(
    body: FaqIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> FaqOut:
    f = FaqAnswer(user_id=user.id, question=body.question.strip(), answer=body.answer.strip())
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return _out(f)


@router.put("/{faq_id}", response_model=FaqOut)
async def update_faq(
    faq_id: str,
    body: FaqIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FaqOut:
    f = await db.get(FaqAnswer, faq_id)
    if not f or f.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not found")
    f.question = body.question.strip()
    f.answer = body.answer.strip()
    await db.commit()
    await db.refresh(f)
    return _out(f)


@router.delete("/{faq_id}")
async def delete_faq(
    faq_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict[str, bool]:
    f = await db.get(FaqAnswer, faq_id)
    if not f or f.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not found")
    await db.delete(f)
    await db.commit()
    return {"ok": True}
