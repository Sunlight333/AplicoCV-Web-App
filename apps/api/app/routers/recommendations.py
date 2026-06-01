from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Recommendation, User
from app.schemas import RecommendationOut

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationOut])
async def list_recommendations(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[RecommendationOut]:
    rows = (
        await db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user.id)
            .order_by(Recommendation.match_score.desc())
        )
    ).scalars().all()
    return [
        RecommendationOut(
            id=r.id,
            jobTitle=r.job_title,
            company=r.company,
            portal=r.portal,
            matchScore=r.match_score,
            jobUrl=r.job_url,
            strategicNote=r.strategic_note,
        )
        for r in rows
    ]
