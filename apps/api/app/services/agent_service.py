"""
Beta AI Job Agent — recommendation generation.

Pulls REAL live postings from the free Remotive job API, filtered by the user's
target role and scored against their skills. Falls back to role-tailored portal
search links if the API is unavailable, so "Go apply" is always a working link.
"""

from __future__ import annotations

import re
from urllib.parse import quote_plus

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile, Recommendation, User

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"


# LATAM signals in a free-text location / region string (accent-insensitive-ish).
_LATAM_HINTS = (
    "latam", "latin", "south america", "sudamerica", "sudamérica", "chile", "argentina",
    "mexico", "méxico", "colombia", "peru", "perú", "brasil", "brazil", "uruguay",
    "ecuador", "bolivia", "paraguay", "venezuela", "santiago", "buenos aires", "bogota",
    "bogotá", "lima", "cdmx",
)
_USA_HINTS = (
    "usa", "united states", "estados unidos", "north america", "norteamerica",
    "norteamérica", "u.s.", "new york", "san francisco", "texas", "california",
)


def _derive_targeting(prefs: dict) -> tuple[bool, bool, str]:
    """From the user's saved intake, decide (wants_remote, wants_onsite, region_bucket).
    region_bucket ∈ {"latam", "usa", "global"} routes which portals we query — the
    'in which regions + remote vs on-site' question the client asked for."""
    remote = (prefs.get("remote") or "any").lower()
    modalities = [m.lower() for m in (prefs.get("workModalities") or [])]
    scope = prefs.get("remoteScope")
    wants_remote = remote in ("remote", "any") or "remote" in modalities or scope == "full_remote"
    wants_onsite = (
        remote in ("onsite", "hybrid", "any")
        or scope == "onsite_hybrid"
        or bool(prefs.get("onsiteLocations"))
    )
    if not wants_remote and not wants_onsite:
        wants_remote = wants_onsite = True  # unset → search both

    blob = " ".join(
        [*(prefs.get("locations") or []), *(prefs.get("remoteRegions") or [])]
    ).lower()
    regions = [r.lower() for r in (prefs.get("remoteRegions") or [])]
    if any(h in blob for h in _LATAM_HINTS) or "south_america" in regions:
        bucket = "latam"
    elif any(h in blob for h in _USA_HINTS) or "north_america" in regions:
        bucket = "usa"
    else:
        bucket = "global"
    return wants_remote, wants_onsite, bucket


# Vetted portal search links (stable query URLs). Each is tagged with the work modes
# and region buckets it fits; selection below filters by the user's intake.
def _portal_catalog(q: str, loc: str) -> list[dict]:
    locq = f"&location={loc}" if loc else ""
    locq_l = f"&l={loc}" if loc else ""
    return [
        {"portal": "We Work Remotely", "url": f"https://weworkremotely.com/remote-jobs/search?term={q}",
         "modes": {"remote"}, "buckets": {"latam", "usa", "global"}},
        {"portal": "Get on Board", "url": f"https://www.getonbrd.com/jobs?q={q}",
         "modes": {"remote", "onsite"}, "buckets": {"latam", "global"}},
        {"portal": "LinkedIn", "url": f"https://www.linkedin.com/jobs/search/?keywords={q}{locq}",
         "modes": {"remote", "onsite"}, "buckets": {"latam", "usa", "global"}},
        {"portal": "Indeed", "url": f"https://www.indeed.com/jobs?q={q}{locq_l}",
         "modes": {"remote", "onsite"}, "buckets": {"usa", "global"}},
        {"portal": "Glassdoor", "url": f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={q}",
         "modes": {"remote", "onsite"}, "buckets": {"usa", "global"}},
        {"portal": "Computrabajo", "url": f"https://www.computrabajo.com/empleos-de-{q}",
         "modes": {"onsite"}, "buckets": {"latam"}},
        # --- The rest of the portals the client asked us to cover -------------
        # USA / global
        {"portal": "Google Jobs", "url": f"https://www.google.com/search?q={q}+jobs&ibp=htl;jobs",
         "modes": {"remote", "onsite"}, "buckets": {"latam", "usa", "global"}},
        {"portal": "ZipRecruiter", "url": f"https://www.ziprecruiter.com/jobs-search?search={q}{locq_l}",
         "modes": {"remote", "onsite"}, "buckets": {"usa", "global"}},
        {"portal": "USAJobs", "url": f"https://www.usajobs.gov/Search/Results?k={q}",
         "modes": {"onsite"}, "buckets": {"usa"}},
        {"portal": "FlexJobs", "url": f"https://www.flexjobs.com/search?search={q}",
         "modes": {"remote"}, "buckets": {"usa", "global"}},
        {"portal": "Remote.co", "url": f"https://remote.co/remote-jobs/search/?search_keywords={q}",
         "modes": {"remote"}, "buckets": {"usa", "global"}},
        {"portal": "RemoteOK", "url": f"https://remoteok.com/remote-{q}-jobs",
         "modes": {"remote"}, "buckets": {"latam", "usa", "global"}},
        # Freelance marketplaces
        {"portal": "Upwork", "url": f"https://www.upwork.com/nx/search/jobs/?q={q}",
         "modes": {"remote"}, "buckets": {"latam", "usa", "global"}},
        {"portal": "Fiverr", "url": f"https://www.fiverr.com/search/gigs?query={q}",
         "modes": {"remote"}, "buckets": {"latam", "usa", "global"}},
        # LATAM
        {"portal": "WeRemoto", "url": f"https://weremoto.com/trabajos?search={q}",
         "modes": {"remote"}, "buckets": {"latam"}},
        {"portal": "Laborum", "url": f"https://www.laborum.cl/empleos-busqueda-{q}.html",
         "modes": {"remote", "onsite"}, "buckets": {"latam"}},
        {"portal": "ZonaJobs", "url": f"https://www.zonajobs.com.ar/empleos-busqueda-{q}.html",
         "modes": {"remote", "onsite"}, "buckets": {"latam"}},
        {"portal": "Bumeran", "url": f"https://www.bumeran.com.mx/empleos-busqueda-{q}.html",
         "modes": {"remote", "onsite"}, "buckets": {"latam"}},
        {"portal": "Chiletrabajos", "url": f"https://www.chiletrabajos.cl/trabajos?q={q}",
         "modes": {"onsite"}, "buckets": {"latam"}},
        {"portal": "InfoJobs Brasil", "url": f"https://www.infojobs.com.br/empregos.aspx?palabra={q}",
         "modes": {"remote", "onsite"}, "buckets": {"latam"}},
        {"portal": "Konzerta", "url": f"https://www.konzerta.com/empleos-busqueda-{q}.html",
         "modes": {"remote", "onsite"}, "buckets": {"latam"}},
    ]


def _search_links(role: str, location: str, prefs: dict | None = None) -> list[dict]:
    """Region- and mode-aware search links: pick the portals that match the user's
    'which regions + remote/on-site' intake, so recommendations point at the right
    boards instead of a fixed list."""
    q = quote_plus(role)
    loc = quote_plus(location)
    wants_remote, wants_onsite, bucket = _derive_targeting(prefs or {})
    wanted_modes = ({"remote"} if wants_remote else set()) | ({"onsite"} if wants_onsite else set())

    picked = [
        p for p in _portal_catalog(q, loc)
        if (p["modes"] & wanted_modes) and bucket in p["buckets"]
    ]
    if not picked:  # never return nothing — fall back to the broad global set
        picked = [p for p in _portal_catalog(q, loc) if "global" in p["buckets"]]

    # A search link is NOT a job match: it is a query URL on a portal. It therefore
    # carries NO match score (0 = "search link", the sentinel the Copilot UI groups
    # on). Previously these were given an invented score (92, 86, 80…) which put a
    # bare Glassdoor search URL into "ready to apply" wearing a "92% match" badge —
    # and, being above the auto-apply threshold, made it eligible to be queued as a
    # prepared application. Never fabricate a score for something we did not score.
    return [
        {
            "title": f"{role} roles",
            "company": p["portal"],
            "portal": p["portal"],
            "url": p["url"],
            "score": 0,
            "note": f"Open search for your target role and region on {p['portal']}.",
        }
        for p in picked
    ]


def _score(title: str, skills: list[str], description: str = "") -> int:
    """Match % from how many of the user's skills appear in the title + description.
    Description-aware so a genuinely strong fit can realistically reach 85%+ (a
    title-only score rarely could), which is what the high-match digest/queue need."""
    text = f"{title or ''} {description or ''}".lower()
    considered = [s for s in skills if s][:12]
    if not considered:
        return 72
    hits = sum(1 for s in considered if s.lower() in text)
    ratio = hits / len(considered)
    return int(min(97, 60 + ratio * 38))


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
        desc = re.sub(r"<[^>]+>", " ", j.get("description") or "")[:2000]
        out.append({
            "title": title,
            "company": j.get("company_name") or "Company",
            "portal": "Remotive",
            "url": url,
            "score": _score(title, skills, desc),
            "note": None,
        })
    return out


async def autonomous_apply_for_user(db: AsyncSession, user: User) -> int:
    """ALPHA agent (Phase 4.4) — for opted-in premium users, QUEUE high-confidence
    matches as 'prepared' apply tasks for review. It never submits without the user;
    a human confirms each queued task. Returns the number of tasks queued.

    Gated three ways: a global config flag, per-user preferences.autoApply, and a high
    match-score threshold. Disabled by default.
    """
    from app.config import settings
    from app.routers.apply import enqueue_apply  # lazy import avoids a router<->service cycle
    from app.schemas import ApplyRequestInput

    if not settings.alpha_agent_enabled:
        return 0
    if not (user.preferences or {}).get("autoApply"):
        return 0

    recs = (
        await db.execute(
            select(Recommendation)
            .where(
                Recommendation.user_id == user.id,
                Recommendation.match_score >= settings.alpha_apply_threshold,
            )
            .order_by(Recommendation.match_score.desc())
            .limit(5)
        )
    ).scalars().all()

    queued = 0
    for rec in recs:
        await enqueue_apply(
            db,
            user.id,
            ApplyRequestInput(
                recommendationId=rec.id,
                jobUrl=rec.job_url,
                portal=rec.portal,
                jobTitle=rec.job_title,
                company=rec.company,
                autoTailor=True,
            ),
            autonomous=True,
        )
        queued += 1
    return queued


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

    wants_remote, _wants_onsite, _bucket = _derive_targeting(prefs)
    # Remotive lists remote roles, so only pull it for users open to remote.
    jobs: list[dict] = await _live_jobs(role, skills) if wants_remote else []
    jobs += _search_links(role, location, prefs)
    # Dedupe by URL and cap to a daily shortlist (client's "up to ~20" target).
    seen: set[str] = set()
    jobs = [j for j in jobs if j["url"] not in seen and not seen.add(j["url"])][:20]

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
