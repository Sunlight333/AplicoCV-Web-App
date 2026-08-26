"""Anonymous, no-auth endpoints used before an account exists (landing + funnel)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import FunnelLead
from app.schemas import TeaserInput, TeaserOut
from app.services import agent_service, teaser_service

router = APIRouter(prefix="/public", tags=["public"])


@router.post("/teaser", response_model=TeaserOut)
async def teaser(body: TeaserInput) -> TeaserOut:
    """The landing 'carrot': an instant ATS-readiness score + concrete wins for a
    pasted CV, and a real count of matching remote roles for the target role.
    Heuristic and cached — no auth, no LLM cost."""
    role = (body.role or "").strip()
    # If no explicit role, fall back to the first line of the CV as the search term.
    if not role and body.cvText:
        role = body.cvText.strip().splitlines()[0][:80]
    score, wins = teaser_service.ats_quicklook(body.cvText)
    count = await teaser_service.match_count(role) if role else 0
    return TeaserOut(atsScore=score, wins=wins, matchCount=count, role=role)


# ---- Onboarding funnel ------------------------------------------------------
# The funnel promises "we found N jobs that match your profile — by your skills, not
# keywords", which the client called out as its most powerful line. That number has to
# be REAL: this runs the same live search the Copilot uses, with the answers the visitor
# just gave. When we genuinely cannot search for them (e.g. on-site only, where every
# keyless feed we have is remote), we say so with live=false and the UI softens the
# wording to "around N" instead of inventing precision.

# Funnel category id -> a search term the job feeds understand.
_CATEGORY_TERM = {
    "sales": "sales", "marketing": "marketing", "software": "software engineer",
    "design": "designer", "ops": "operations", "data": "data analyst",
    "finance": "finance", "hr": "recruiter", "customer": "customer support",
    "engineering": "engineer", "health": "healthcare", "education": "teacher",
    "legal": "legal", "logistics": "logistics", "hospitality": "hospitality",
    "construction": "construction", "retail": "retail", "media": "media",
}


class FunnelPreviewInput(BaseModel):
    answers: dict = {}


class FunnelPreviewOut(BaseModel):
    count: int
    live: bool


@router.post("/funnel-preview", response_model=FunnelPreviewOut)
async def funnel_preview(body: FunnelPreviewInput) -> FunnelPreviewOut:
    """How many real, currently-open postings match these funnel answers."""
    # Import here to avoid a router <-> router import cycle at module load.
    from app.routers.users import _map_funnel_to_prefs

    answers = body.answers or {}
    prefs = _map_funnel_to_prefs(answers)

    cats = [c for c in (answers.get("categories") or []) if c != "any"]
    role = _CATEGORY_TERM.get(cats[0], "") if cats else ""

    wants_remote, wants_onsite, bucket = agent_service._derive_targeting(prefs)
    try:
        jobs = await agent_service._live_jobs(
            role, [], bucket, prefs, wants_remote, wants_onsite
        )
    except Exception:
        return FunnelPreviewOut(count=0, live=False)

    if not jobs:
        return FunnelPreviewOut(count=0, live=False)
    return FunnelPreviewOut(count=len(jobs), live=True)


class FunnelLeadInput(BaseModel):
    email: str
    answers: dict = {}


@router.post("/funnel-lead")
async def funnel_lead(
    body: FunnelLeadInput, db: AsyncSession = Depends(get_db)
) -> dict[str, bool]:
    """Store an email captured mid-funnel so a visitor who doesn't subscribe can still
    be followed up with. Best-effort: never blocks the funnel."""
    email = (body.email or "").strip().lower()
    if "@" not in email:
        return {"ok": False}
    db.add(FunnelLead(email=email, answers=body.answers or {}))
    await db.commit()
    return {"ok": True}
