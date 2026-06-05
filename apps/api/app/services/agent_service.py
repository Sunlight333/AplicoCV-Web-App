"""
Beta AI Job Agent — recommendation generation.

Pulls REAL live postings from the free Remotive job API, filtered by the user's
target role and scored against their skills. Falls back to role-tailored portal
search links if the API is unavailable, so "Go apply" is always a working link.
"""

from __future__ import annotations

from urllib.parse import quote_plus

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile, Recommendation, User

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"


def _search_links(role: str, location: str) -> list[dict]:
    q = quote_plus(role)
    loc = quote_plus(location)
    portals = [
        ("LinkedIn", "LinkedIn Jobs",
         f"https://www.linkedin.com/jobs/search/?keywords={q}" + (f"&location={loc}" if location else "")),
        ("Indeed", "Indeed", f"https://www.indeed.com/jobs?q={q}" + (f"&l={loc}" if location else "")),
        ("Get on Board", "Get on Board", f"https://www.getonbrd.com/jobs?q={q}"),
        ("We Work Remotely", "We Work Remotely", f"https://weworkremotely.com/remote-jobs/search?term={q}"),
    ]
    return [
        {
            "title": f"{role} roles",
            "company": company,
            "portal": portal,
            "url": url,
            "score": max(62, 92 - i * 8),
            "note": f"Live search tailored to your target role on {portal}." if i == 0 else None,
        }
        for i, (portal, company, url) in enumerate(portals)
    ]


def _score(title: str, skills: list[str]) -> int:
    t = (title or "").lower()
    hits = sum(1 for s in skills if s and s.lower() in t)
    return min(96, 68 + hits * 7)


async def _live_jobs(role: str, skills: list[str]) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get(REMOTIVE_URL, params={"search": role, "limit": 8})
            res.raise_for_status()
            jobs = res.json().get("jobs", [])[:5]
    except Exception:
        return []
    out = []
    for j in jobs:
        url = j.get("url")
        title = j.get("title")
        if not url or not title:
            continue
        out.append({
            "title": title,
            "company": j.get("company_name") or "Company",
            "portal": "Remotive",
            "url": url,
            "score": _score(title, skills),
            "note": None,
        })
    return out


async def scan_for_user(db: AsyncSession, user: User) -> list[Recommendation]:
    """Replace this user's recommendations with a fresh, preference-tailored scan."""
    existing = (
        await db.execute(select(Recommendation).where(Recommendation.user_id == user.id))
    ).scalars().all()
    for r in existing:
        await db.delete(r)

    prefs = user.preferences or {}
    prof = (
        await db.execute(select(Profile).where(Profile.user_id == user.id))
    ).scalar_one_or_none()
    pdata = (prof.data if prof else {}) or {}
    roles = prefs.get("targetRoles") or []
    if not roles:
        headline = (pdata.get("personal") or {}).get("headline")
        roles = [headline] if headline else ["Software Engineer"]
    role = roles[0]
    location = (prefs.get("locations") or [""])[0]
    skills = pdata.get("skills") or []

    jobs = await _live_jobs(role, skills)
    if not jobs:
        jobs = _search_links(role, location)

    created: list[Recommendation] = []
    for job in jobs:
        rec = Recommendation(
            user_id=user.id,
            job_title=job["title"][:200],
            company=job["company"][:120],
            portal=job["portal"],
            match_score=job["score"],
            job_url=job["url"],
            strategic_note=job["note"],
        )
        db.add(rec)
        created.append(rec)
    await db.commit()
    for r in created:
        await db.refresh(r)
    return created
