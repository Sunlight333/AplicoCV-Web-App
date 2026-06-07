"""
Data-driven job-search insights (no LLM required):

- Phase 3.2  scam / junk-posting detection (rule-based signals)
- Phase 3.4  burnout detection (from the user's own application activity)
- Phase 4.1  job-market heatmap (aggregate across the platform)
- Phase 4.2  anonymous collective intelligence (folded into the heatmap aggregate)

These compute from real stored data, so they work the same with or without an AI key.
"""

from __future__ import annotations

import re
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, Profile, User

# --- 3.2  Scam / junk-posting detection ---------------------------------------

_SCAM_PATTERNS: list[tuple[re.Pattern[str], str, int]] = [
    (re.compile(r"\b(whatsapp|telegram|signal)\b", re.I),
     "Asks to move to WhatsApp/Telegram — legitimate recruiters use company channels.", 30),
    (re.compile(r"\b(no experience|no skills?)\b.*\b(necessary|required|needed)\b", re.I),
     "‘No experience necessary’ for a high reward is a classic lure.", 20),
    (re.compile(r"\$?\d{3,4}\s*(/|per)\s*day", re.I),
     "Unusually high daily pay advertised up front.", 25),
    (re.compile(r"\b(registration|processing|training)\s+fee\b", re.I),
     "Asks for a fee — never pay to apply or be hired.", 40),
    (re.compile(r"\b(gift\s*cards?|bitcoin|crypto|wire transfer)\b", re.I),
     "Mentions gift cards / crypto / wire transfer — strong scam indicator.", 40),
    (re.compile(r"\bwork from home\b.*\b(easy|quick)\s+(money|cash)\b", re.I),
     "‘Easy money from home’ phrasing.", 20),
    (re.compile(r"\b(urgent|immediate)\s+(start|hire|hiring)\b", re.I),
     "Artificial urgency to rush you past red flags.", 10),
    (re.compile(r"@(gmail|yahoo|hotmail|outlook)\.com", re.I),
     "Contact uses a personal email domain rather than a company domain.", 25),
]


def detect_scam(
    *, title: str | None, company: str | None, description: str | None
) -> dict:
    blob = " ".join(x for x in (title, company, description) if x)
    score = 0
    signals: list[str] = []
    for pattern, message, weight in _SCAM_PATTERNS:
        if pattern.search(blob):
            score += weight
            signals.append(message)
    # Very short postings are low-signal but mildly suspicious for senior pay claims.
    if description and len(description) < 200:
        score += 8
        signals.append("Very thin job description — little detail about the actual role.")
    if not company:
        score += 8
        signals.append("No company name provided.")

    score = min(100, score)
    level = "high" if score >= 50 else "medium" if score >= 20 else "low"
    advice = {
        "high": "Treat this as likely fraudulent. Do not share documents, pay any fee, or move off-platform.",
        "medium": "Some red flags — verify the company independently before applying.",
        "low": "No strong scam signals detected, but always verify the employer.",
    }[level]
    return {"riskLevel": level, "riskScore": score, "signals": signals or ["No scam signals matched."], "advice": advice}


# --- 3.4  Burnout detection ---------------------------------------------------


async def burnout_status(db: AsyncSession, user_id: str) -> dict:
    rows = (
        await db.execute(select(Application).where(Application.user_id == user_id))
    ).scalars().all()
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    def _aware(dt: datetime) -> datetime:
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    last7 = [r for r in rows if _aware(r.applied_at) >= week_ago]
    total = len(rows)
    responded = sum(1 for r in rows if r.status in ("viewed", "interview", "offer"))
    response_rate = (responded / total) if total else 0.0

    score = 0
    signals: list[str] = []
    if len(last7) >= 25:
        score += 45
        signals.append(f"{len(last7)} applications in the last 7 days — a very high volume.")
    elif len(last7) >= 12:
        score += 25
        signals.append(f"{len(last7)} applications this week — pace is climbing.")
    if total >= 20 and response_rate < 0.1:
        score += 35
        signals.append(f"Low response rate ({round(response_rate * 100)}%) across {total} applications.")
    elif total >= 10 and response_rate < 0.2:
        score += 20
        signals.append("Response rate is below average — quality may beat quantity here.")
    if total >= 40:
        score += 10
        signals.append("A large cumulative application count can wear you down.")

    score = min(100, score)
    level = "high" if score >= 55 else "elevated" if score >= 25 else "healthy"
    suggestions = {
        "high": [
            "Pause mass-applying for 48 hours and reset.",
            "Pick 5 high-fit roles and tailor deeply instead of applying broadly.",
            "Add networking outreach — referrals convert far better than cold applies.",
        ],
        "elevated": [
            "Cap applications at ~5/day and tailor each one.",
            "Review which roles actually fit before applying.",
        ],
        "healthy": ["Your pace looks sustainable — keep tailoring each application."],
    }[level]
    return {
        "level": level,
        "score": score,
        "applicationsLast7Days": len(last7),
        "responseRate": round(response_rate, 3),
        "signals": signals or ["Activity looks balanced."],
        "suggestions": suggestions,
    }


# --- 4.1 + 4.2  Market heatmap / collective intelligence ----------------------

_MIN_SAMPLE = 1  # in production raise this so small samples stay anonymous


async def market_heatmap(db: AsyncSession) -> dict:
    """Aggregate anonymous signal across all users: in-demand skills, active
    companies/portals, and remote share. No per-user data is exposed."""
    profiles = (await db.execute(select(Profile))).scalars().all()
    apps = (await db.execute(select(Application))).scalars().all()
    users = (await db.execute(select(User))).scalars().all()

    skill_counter: Counter[str] = Counter()
    for p in profiles:
        for s in (p.data or {}).get("skills", []) or []:
            if isinstance(s, str) and s.strip():
                skill_counter[s.strip().title()] += 1

    company_counter = Counter(a.company for a in apps if a.company)
    portal_counter = Counter(a.portal for a in apps if a.portal)

    remote_pref = sum(
        1 for u in users if (u.preferences or {}).get("remote") in ("remote", "hybrid")
    )
    remote_share = round((remote_pref / len(users)) * 100) if users else 0

    def _top(counter: Counter[str], n: int = 8) -> list[dict]:
        return [{"label": k, "value": v} for k, v in counter.most_common(n)]

    sample = len(apps)
    insight = (
        f"Across {len(users)} members, the most in-demand skills cluster around "
        f"{', '.join(k for k, _ in skill_counter.most_common(3)) or 'core fundamentals'}. "
        f"{remote_share}% prefer remote or hybrid roles."
    )
    return {
        "topSkills": _top(skill_counter),
        "topCompanies": _top(company_counter),
        "topPortals": _top(portal_counter),
        "remoteShare": remote_share,
        "sampleSize": sample,
        "insight": insight,
    }
