"""
Data-driven insight endpoints (no LLM key required):

- POST /insights/scam-check      Phase 3.2  detect junk/ghost/scam postings
- GET  /insights/burnout         Phase 3.4  job-search burnout detector
- GET  /insights/market-heatmap  Phase 4.1  in-demand skills/companies/portals (anon)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import (
    BurnoutOut,
    MarketHeatmapOut,
    ScamCheckInput,
    ScamCheckOut,
)
from app.services import insight_service, job_fetch_service

router = APIRouter(prefix="/insights", tags=["insights"])


@router.post("/scam-check", response_model=ScamCheckOut)
async def scam_check(
    body: ScamCheckInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ScamCheckOut:
    description = body.jobDescription
    if not description and body.jobUrl:
        description = await job_fetch_service.fetch_job_text(body.jobUrl)
    result = insight_service.detect_scam(
        title=body.jobTitle, company=body.company, description=description
    )
    return ScamCheckOut(**result)


@router.get("/burnout", response_model=BurnoutOut)
async def burnout(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> BurnoutOut:
    result = await insight_service.burnout_status(db, user.id)
    return BurnoutOut(**result)


@router.get("/market-heatmap", response_model=MarketHeatmapOut)
async def market_heatmap(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> MarketHeatmapOut:
    result = await insight_service.market_heatmap(db)
    return MarketHeatmapOut(**result)
