"""Public, no‑auth endpoints for the logged‑out intake (Enfoque 2.0)."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas import TeaserInput, TeaserOut
from app.services import teaser_service

router = APIRouter(prefix="/public", tags=["public"])


@router.post("/teaser", response_model=TeaserOut)
async def teaser(body: TeaserInput) -> TeaserOut:
    """The landing 'carrot': an instant ATS‑readiness score + concrete wins for a
    pasted CV, and a real count of matching remote roles for the target role.
    Heuristic and cached — no auth, no LLM cost."""
    role = (body.role or "").strip()
    # If no explicit role, fall back to the first line of the CV as the search term.
    if not role and body.cvText:
        role = body.cvText.strip().splitlines()[0][:80]
    score, wins = teaser_service.ats_quicklook(body.cvText)
    count = await teaser_service.match_count(role) if role else 0
    return TeaserOut(atsScore=score, wins=wins, matchCount=count, role=role)
