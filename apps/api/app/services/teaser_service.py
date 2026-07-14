"""
Public "carrot" teaser for the logged-out intake (Enfoque 2.0).

Anonymous visitors paste a CV / target role on the landing and get an instant,
tempting preview: a quick ATS‑readiness score with a couple of concrete wins, and
a real count of matching roles. Deliberately heuristic + cache‑friendly (no LLM, no
auth) so it's cheap and abuse‑resistant.
"""

from __future__ import annotations

import re
import time

import httpx

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"

_PHONE = re.compile(r"\+?\d[\d\s().-]{7,}\d")
_METRICS = re.compile(r"\d+\s?%|\$\s?\d|\d{3,}")
_SECTIONS = ("experience", "education", "skill", "experiencia", "educaci", "habilidad", "formaç", "habilidad")


def ats_quicklook(cv_text: str) -> tuple[int, list[str]]:
    """A fast, LLM‑free ATS readiness score (0–100) + up to 3 improvement codes the
    frontend localizes. Rewards the signals a recruiter/ATS scans for in seconds."""
    t = cv_text or ""
    tl = t.lower()
    words = len(t.split())
    has_email = "@" in t
    has_phone = bool(_PHONE.search(t))
    has_linkedin = "linkedin" in tl
    has_metrics = bool(_METRICS.search(t))
    sections = sum(1 for k in _SECTIONS if k in tl)

    score = 40
    score += 10 if has_email else 0
    score += 8 if has_phone else 0
    score += 10 if has_linkedin else 0
    score += 12 if has_metrics else 0
    score += min(15, sections * 5)
    score += 5 if words >= 150 else 0
    score = max(20, min(96, score))

    wins: list[str] = []
    if not has_metrics:
        wins.append("quantify")       # add measurable achievements
    if not has_linkedin:
        wins.append("add_linkedin")   # include a LinkedIn URL
    if words < 150:
        wins.append("more_detail")    # flesh out experience
    if not has_phone or not has_email:
        wins.append("add_contact")    # complete contact details
    if not wins:
        wins.append("tailor")         # tailor to each job's keywords
    return score, wins[:3]


# role (lowercased) -> (fetched_at_monotonic, count). Keeps anonymous traffic from
# hammering the external API.
_COUNT_CACHE: dict[str, tuple[float, int]] = {}
_TTL = 60 * 60


async def match_count(role: str) -> int:
    """Real count of currently‑listed remote roles matching the title (via the free
    Remotive API), cached for an hour. Returns 0 if unavailable — the frontend then
    shows a generic message instead of a number."""
    key = (role or "").lower().strip()
    if not key:
        return 0
    now = time.monotonic()
    hit = _COUNT_CACHE.get(key)
    if hit and now - hit[0] < _TTL:
        return hit[1]
    count = 0
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            res = await client.get(REMOTIVE_URL, params={"search": role, "limit": 100})
            res.raise_for_status()
            count = len(res.json().get("jobs", []))
    except Exception:
        count = 0
    _COUNT_CACHE[key] = (now, count)
    return count
