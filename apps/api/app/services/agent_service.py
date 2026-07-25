"""
AI Job Agent — recommendation generation.

Pulls REAL live postings from every free (no-key) job API we can read, ranks them
against the user's CV with the LLM (falling back to a keyword heuristic), and adds
role-tailored portal search links so there is always somewhere to go. The search runs
server-side on a schedule, so the shortlist is waiting in the panel without the user
having a session open.
"""

from __future__ import annotations

import asyncio
import re
from urllib.parse import quote_plus

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile, Recommendation, User
from app.services import llm_service

# Free, keyless job feeds. Each is optional: a dead feed is skipped, never fatal.
REMOTIVE_URL = "https://remotive.com/api/remote-jobs"
REMOTEOK_URL = "https://remoteok.com/api"
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"
JOBICY_URL = "https://jobicy.com/api/v2/remote-jobs"

# Keep the board a shortlist: newer batches accumulate, the oldest rows are trimmed.
MAX_BOARD = 40


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
        # Get on Board's own /jobs?q= does NOT filter server-side — it lands on the
        # unfiltered jobs panel (client 24.07: "te lleva al panel principal, no al
        # link del empleo"). Route through a Get-on-Board-scoped search that reliably
        # surfaces matching postings for the role.
        {"portal": "Get on Board", "url": f"https://www.google.com/search?q={q}+site:getonbrd.com",
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


# A remote posting still has a REQUIRED location — "Worldwide", "Europe", "USA Only",
# "Latin America", etc. Only these read as truly "open to anyone, anywhere". Note the
# bare word "remote" is deliberately NOT here: "Remote — Europe" is still Europe-only.
_WORLDWIDE_HINTS = (
    "worldwide", "anywhere", "global", "no restriction", "any location",
    "100% remote", "fully remote", "international",
)


def _region_ok(location: str, bucket: str, prefs: dict) -> bool:
    """True when a remote job's required location actually fits the user's region.

    The client reported getting Europe-only remote jobs while based in LATAM — the CV
    match was great but the geography was wrong. A remote role restricted to a region
    the user isn't in is not a real option, so we drop it. Unknown/worldwide locations
    are kept (they're open to anyone)."""
    l = (location or "").lower().strip()
    if not l:
        return True  # unknown location → don't over-filter
    if any(w in l for w in _WORLDWIDE_HINTS):
        return True
    # The user explicitly said they're open to worldwide remote.
    if "worldwide" in [r.lower() for r in (prefs.get("remoteRegions") or [])]:
        return True
    # Both LATAM and the USA are in the Americas, so an "Americas"-wide remote role fits.
    if bucket == "latam":
        return "americas" in l or any(h in l for h in _LATAM_HINTS)
    if bucket == "usa":
        return "americas" in l or any(h in l for h in _USA_HINTS)
    return True  # global bucket: no strong region pin → keep


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


def _strip_html(s: str, limit: int = 2000) -> str:
    return re.sub(r"<[^>]+>", " ", s or "")[:limit]


def _mini_summary(description: str | None, limit: int = 160) -> str | None:
    """A one-line "what this job is" for the copilot table — the client asked each row
    to carry a mini summary, and previously only the first search link had any note."""
    text = re.sub(r"\s+", " ", _strip_html(description or "", 600)).strip()
    if not text:
        return None
    sentence = re.split(r"(?<=[.!?])\s", text)[0]
    out = sentence if len(sentence) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"
    return out or None


async def _fetch_remotive(client: httpx.AsyncClient, role: str) -> list[dict]:
    res = await client.get(REMOTIVE_URL, params={"search": role, "limit": 20})
    res.raise_for_status()
    return [
        {
            "title": j.get("title"), "company": j.get("company_name") or "Company",
            "portal": "Remotive", "url": j.get("url"),
            "description": _strip_html(j.get("description")),
            "location": j.get("candidate_required_location") or "Worldwide",
        }
        for j in res.json().get("jobs", [])[:12]
    ]


async def _fetch_remoteok(client: httpx.AsyncClient, role: str) -> list[dict]:
    # RemoteOK's feed is unfiltered; the first element is a legal notice, not a job.
    res = await client.get(REMOTEOK_URL, headers={"User-Agent": "AplicoCV/1.0"})
    res.raise_for_status()
    rows = [r for r in res.json() if isinstance(r, dict) and r.get("position")]
    needle = (role or "").lower()
    hits = [r for r in rows if needle in f"{r.get('position','')} {' '.join(r.get('tags') or [])}".lower()]
    return [
        {
            "title": r.get("position"), "company": r.get("company") or "Company",
            "portal": "RemoteOK", "url": r.get("url") or r.get("apply_url"),
            "description": _strip_html(r.get("description")),
            "location": r.get("location") or "Worldwide",
        }
        for r in (hits or rows)[:12]
    ]


async def _fetch_arbeitnow(client: httpx.AsyncClient, role: str) -> list[dict]:
    res = await client.get(ARBEITNOW_URL)
    res.raise_for_status()
    needle = (role or "").lower()
    rows = res.json().get("data", []) or []
    hits = [r for r in rows if needle in f"{r.get('title','')} {' '.join(r.get('tags') or [])}".lower()]
    return [
        {
            "title": r.get("title"), "company": r.get("company_name") or "Company",
            "portal": "Arbeitnow", "url": r.get("url"),
            "description": _strip_html(r.get("description")),
            # Arbeitnow is a Europe-centric board; keep its posted location so the
            # region filter can drop EU-only roles for a LATAM/USA user.
            "location": r.get("location") or "Europe",
        }
        for r in (hits or rows)[:12]
    ]


async def _fetch_jobicy(client: httpx.AsyncClient, role: str) -> list[dict]:
    res = await client.get(JOBICY_URL, params={"count": 20})
    res.raise_for_status()
    needle = (role or "").lower()
    rows = res.json().get("jobs", []) or []
    hits = [r for r in rows if needle in str(r.get("jobTitle", "")).lower()]
    return [
        {
            "title": r.get("jobTitle"), "company": r.get("companyName") or "Company",
            "portal": "Jobicy", "url": r.get("url"),
            "description": _strip_html(r.get("jobDescription")),
            "location": r.get("jobGeo") or "Anywhere",
        }
        for r in (hits or rows)[:12]
    ]


async def _live_jobs(
    role: str, skills: list[str], bucket: str = "global", prefs: dict | None = None
) -> list[dict]:
    """Real postings from every source we can read without a key.

    Previously this was Remotive alone, capped at 5 — so a "daily shortlist of ~20"
    was never more than a handful of real jobs padded with search links. Sources are
    fetched concurrently and each is isolated: one flaky feed must not empty the panel.

    Region-aware: these feeds are worldwide/EU remote boards, so a job whose required
    location doesn't fit the user's region is dropped (client feedback — a LATAM user
    was seeing Europe-only remote roles). Worldwide/unknown locations are kept.
    """
    prefs = prefs or {}
    sources = (_fetch_remotive, _fetch_remoteok, _fetch_arbeitnow, _fetch_jobicy)
    out: list[dict] = []
    async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
        results = await asyncio.gather(
            *(fn(client, role) for fn in sources), return_exceptions=True
        )
    for res in results:
        if isinstance(res, Exception):
            continue  # a dead feed is not a failed scan
        for j in res:
            if not j.get("url") or not j.get("title"):
                continue
            if not _region_ok(j.get("location", ""), bucket, prefs):
                continue  # right role, wrong region — not a real option for this user
            out.append({
                "title": j["title"],
                "company": j["company"],
                "portal": j["portal"],
                "url": j["url"],
                "description": j.get("description") or "",
                "location": j.get("location") or "",
                "score": _score(j["title"], skills, j.get("description") or ""),
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
    """Add a fresh, preference-tailored batch to this user's shortlist.

    The sweep no longer wipes the board: it used to delete every prior recommendation,
    so each run threw away yesterday's shortlist (and anything the user hadn't got to
    yet) instead of accumulating a daily batch. We keep what's there, skip URLs already
    listed, and trim the oldest once the board grows past MAX_BOARD.
    """
    existing = (
        await db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user.id)
            .order_by(Recommendation.created_at.desc())
        )
    ).scalars().all()
    existing_urls = {r.job_url for r in existing}
    # Trim the tail so the board stays a shortlist rather than growing forever.
    for stale in existing[MAX_BOARD:]:
        await db.delete(stale)

    prefs = user.preferences or {}
    prof = (
        await db.execute(select(Profile).where(Profile.user_id == user.id))
    ).scalar_one_or_none()
    pdata = (prof.data if prof else {}) or {}
    # Derive the search role from the user's OWN data — never a hardcoded default.
    # "Software Engineer" as the fallback was surfacing software jobs to non-tech users
    # who never chose that (client 24.07): headline → most-recent job title → the
    # industry/category they picked in the funnel → a neutral term, in that order.
    roles = prefs.get("targetRoles") or []
    if not roles:
        headline = (pdata.get("personal") or {}).get("headline")
        exp = pdata.get("experience") or []
        exp_title = exp[0].get("title") if exp else None
        industries = prefs.get("industries") or []
        industry = industries[0] if industries else None
        roles = [headline or exp_title or industry or "Professional"]
    role = roles[0]
    location = (prefs.get("locations") or [""])[0]
    skills = pdata.get("skills") or []

    wants_remote, _wants_onsite, bucket = _derive_targeting(prefs)

    # If the user is no longer open to remote, purge remote-feed recommendations left
    # on the board from an earlier preference — otherwise on-site seekers keep seeing
    # yesterday's remote roles (client 24.07). These four feeds are remote-only, so
    # dropping them is safe; the board then refills from region/mode-appropriate sources.
    if not wants_remote:
        remote_feeds = {"Remotive", "RemoteOK", "Arbeitnow", "Jobicy"}
        for r in existing:
            if r.portal in remote_feeds:
                await db.delete(r)
                existing_urls.discard(r.job_url)

    # These feeds list remote roles, so only pull them for users open to remote — and
    # then only the ones whose required location fits the user's region (a LATAM user
    # should not get Europe-only remote roles). On-site-only users lean on the
    # region-appropriate portal search links below instead.
    jobs: list[dict] = await _live_jobs(role, skills, bucket, prefs) if wants_remote else []

    # Rank the REAL postings against the CV with the LLM. Search links are excluded:
    # they are queries, not jobs, and carry no score at all.
    ranked = await llm_service.rank_jobs(pdata, jobs)
    for i, j in enumerate(jobs):
        if i in ranked:
            j["score"] = ranked[i]
            j["scoredBy"] = "ai"
    jobs.sort(key=lambda j: j["score"], reverse=True)

    jobs += _search_links(role, location, prefs)
    # Dedupe by URL and cap to a daily shortlist (client's "up to ~20" target).
    seen: set[str] = set()
    jobs = [j for j in jobs if j["url"] not in seen and not seen.add(j["url"])][:20]

    created: list[Recommendation] = []
    for job in jobs:
        if job["url"] in existing_urls:
            continue  # already on the board from an earlier sweep
        rec = Recommendation(
            user_id=user.id,
            job_title=job["title"][:200],
            company=job["company"][:120],
            portal=job["portal"],
            match_score=job["score"],
            job_url=job["url"],
            # A one-line "why this" for the copilot table. Real postings get the first
            # sentence of the posting itself; links keep their own note.
            strategic_note=job.get("note") or _mini_summary(job.get("description")),
        )
        db.add(rec)
        created.append(rec)
    await db.commit()
    for r in created:
        await db.refresh(r)
    return created
