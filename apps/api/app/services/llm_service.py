"""
Centralized LLM orchestration.

The provider is chosen by settings.llm_provider:
- "stub"      -> deterministic, offline responses (default; no API keys needed)
- "openai"    -> OpenAI Chat Completions (json_object mode)
- "anthropic" -> Anthropic Messages API

Only the stub is fully implemented here; the real providers share the same
function signatures so switching is an env-var change. Each task returns plain
Python dicts/strings validated by the routers against Pydantic schemas.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any

from app.config import settings

# A small keyword pool used by the stub's ATS scoring heuristic.
_SKILL_POOL = [
    "react", "typescript", "javascript", "python", "node", "graphql", "rest",
    "aws", "docker", "kubernetes", "sql", "postgres", "redis", "ci/cd",
    "testing", "tailwind", "design systems", "agile", "leadership",
]


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9/+#.]+", text.lower()))


# --- Public task functions ----------------------------------------------------


async def extract_profile(text: str) -> dict[str, Any]:
    """Extract a structured profile from raw CV text."""
    if settings.llm_provider == "stub":
        return _stub_extract_profile(text)
    return await _real_extract_profile(text)


async def score_ats_match(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    if settings.llm_provider == "stub":
        return _stub_ats(job_description, profile)
    return await _real_ats(job_description, profile)


async def generate_cover_letter(
    job_description: str, profile: dict[str, Any], tone: str
) -> str:
    if settings.llm_provider == "stub":
        return _stub_cover_letter(job_description, profile, tone)
    return await _real_cover_letter(job_description, profile, tone)


async def tailor_profile(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    if settings.llm_provider == "stub":
        return _stub_tailor(job_description, profile)
    return await _real_tailor(job_description, profile)


# --- Stub implementations -----------------------------------------------------


def _stub_extract_profile(text: str) -> dict[str, Any]:
    """Best-effort parse of demo CV text; falls back to a sample profile."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    name = lines[0] if lines else "New User"
    email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    found_skills = [s for s in _SKILL_POOL if s in text.lower()]
    return {
        "personal": {
            "fullName": name,
            "headline": lines[1] if len(lines) > 1 else "Professional",
            "email": email_match.group(0) if email_match else "",
            "phone": None,
            "location": None,
            "summary": " ".join(lines[2:5]) if len(lines) > 2 else "",
        },
        "experience": [
            {
                "id": "exp_1",
                "employer": "Most Recent Employer",
                "title": lines[1] if len(lines) > 1 else "Professional",
                "startDate": "2022-01",
                "endDate": None,
                "location": None,
                "bullets": [
                    "Delivered measurable impact across key initiatives.",
                    "Collaborated cross-functionally to ship features.",
                ],
            }
        ],
        "education": [],
        "skills": found_skills or ["Communication", "Teamwork"],
        "languages": [{"id": "lang_1", "language": "English", "level": "professional"}],
        "links": [],
        "complementary": {},
        "version": 1,
    }


def _stub_ats(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    jd = _tokens(job_description)
    skills = {s.lower() for s in profile.get("skills", [])}
    pool_in_jd = [s for s in _SKILL_POOL if s in jd]
    matched = [s for s in pool_in_jd if s in skills]
    missing = [s for s in pool_in_jd if s not in skills][:5]
    base = 50 + len(matched) * 8 - len(missing) * 3
    score = max(5, min(98, base))
    qualification = (
        "strong match" if score >= 70 else "underqualified" if score < 50 else "strong match"
    )
    return {
        "matchScore": score,
        "matchedKeywords": matched or (pool_in_jd[:2] if pool_in_jd else ["communication"]),
        "missingKeywords": missing,
        "qualification": qualification,
        "recommendations": [
            "Add the missing keywords to your summary where they truthfully apply.",
            "Quantify two more achievements in your most recent role.",
            "Mirror the job title's language in your headline.",
        ],
    }


def _stub_cover_letter(job_description: str, profile: dict[str, Any], tone: str) -> str:
    name = profile.get("personal", {}).get("fullName", "the candidate")
    role = "the role"
    m = re.search(r"(engineer|designer|manager|analyst|developer|lead)", job_description.lower())
    if m:
        role = m.group(0)
    opener = {
        "professional": "I am writing to express my strong interest in",
        "warm": "I was genuinely excited to come across your opening for",
        "direct": "I'm applying for",
    }.get(tone, "I am writing to express my strong interest in")
    return (
        f"{opener} {role}. With a track record of delivering measurable results, "
        f"I bring directly relevant experience to your team.\n\n"
        f"In my recent work I led initiatives that improved outcomes and collaborated "
        f"across functions to ship high-quality products. The responsibilities in this "
        f"role align closely with my strengths in execution and ownership.\n\n"
        f"I would welcome the chance to discuss how I can contribute. Thank you for your "
        f"consideration.\n\nSincerely,\n{name}"
    )


def _stub_tailor(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    """Reorder skills to surface JD-relevant ones first; bump version."""
    jd = _tokens(job_description)
    skills = list(profile.get("skills", []))
    skills.sort(key=lambda s: (s.lower() not in jd, s.lower()))
    tailored = {**profile, "skills": skills, "version": profile.get("version", 1) + 1}
    return tailored


# --- Real provider stubs ------------------------------------------------------
# These share signatures with the stubs. Implement when keys are configured.


async def _real_extract_profile(text: str) -> dict[str, Any]:  # pragma: no cover
    raise NotImplementedError("Configure llm_provider + API key to enable real extraction")


async def _real_ats(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:  # pragma: no cover
    raise NotImplementedError


async def _real_cover_letter(jd: str, profile: dict[str, Any], tone: str) -> str:  # pragma: no cover
    raise NotImplementedError


async def _real_tailor(jd: str, profile: dict[str, Any]) -> dict[str, Any]:  # pragma: no cover
    raise NotImplementedError


def _cache_key(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode()).hexdigest()
