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
import time
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
    """Extract a structured profile from raw CV text.

    The result is normalized to the Profile schema so it persists/reads cleanly
    regardless of how loosely the LLM (or stub) shaped its JSON.
    """
    if settings.resolved_llm_provider == "stub":
        raw = _stub_extract_profile(text)
    else:
        raw = await _real_extract_profile(text)
    return normalize_profile(raw)


def _s(v: Any, default: str = "") -> str:
    """Coerce any value to a non-null string."""
    if v is None:
        return default
    return v if isinstance(v, str) else str(v)


def _opt_s(v: Any) -> str | None:
    return None if v is None else (v if isinstance(v, str) else str(v))


def normalize_profile(raw: dict[str, Any] | None) -> dict[str, Any]:  # noqa: F811 (public)
    """Coerce arbitrary LLM/stub output into a strictly Profile-schema-valid dict
    (required strings never null, ids stringified, language levels constrained)."""
    raw = raw or {}
    p = raw.get("personal") or {}
    _LEVELS = {"basic", "conversational", "professional", "native"}

    experience = []
    for i, e in enumerate(raw.get("experience") or []):
        e = e or {}
        experience.append({
            "id": _s(e.get("id"), f"exp_{i + 1}"),
            "employer": _s(e.get("employer")),
            "title": _s(e.get("title")),
            "startDate": _s(e.get("startDate")),
            "endDate": _opt_s(e.get("endDate")),
            "location": _opt_s(e.get("location")),
            "bullets": [_s(b) for b in (e.get("bullets") or []) if b is not None],
        })

    education = []
    for i, ed in enumerate(raw.get("education") or []):
        ed = ed or {}
        education.append({
            "id": _s(ed.get("id"), f"edu_{i + 1}"),
            "institution": _s(ed.get("institution")),
            "degree": _s(ed.get("degree")),
            "field": _opt_s(ed.get("field")),
            "startDate": _s(ed.get("startDate")),
            "endDate": _opt_s(ed.get("endDate")),
        })

    languages = []
    for i, lang in enumerate(raw.get("languages") or []):
        lang = lang or {}
        level = lang.get("level")
        languages.append({
            "id": _s(lang.get("id"), f"lang_{i + 1}"),
            "language": _s(lang.get("language")),
            "level": level if level in _LEVELS else "professional",
        })

    links = []
    for i, ln in enumerate(raw.get("links") or []):
        ln = ln or {}
        links.append({
            "id": _s(ln.get("id"), f"link_{i + 1}"),
            "label": _s(ln.get("label")),
            "url": _s(ln.get("url")),
        })

    return {
        "personal": {
            "fullName": _s(p.get("fullName")),
            "headline": _s(p.get("headline")),
            "email": _s(p.get("email")),
            "phone": _opt_s(p.get("phone")),
            "location": _opt_s(p.get("location")),
            "summary": _s(p.get("summary")),
        },
        "experience": experience,
        "education": education,
        "skills": [_s(s) for s in (raw.get("skills") or []) if s],
        "skillsToAvoid": [_s(s) for s in (raw.get("skillsToAvoid") or []) if s],
        "languages": languages,
        "links": links,
        # Pass richer sections through untouched (added via the profile editor, not
        # CV extraction) so the tolerant reload path never drops them.
        "certifications": raw.get("certifications") or [],
        "projects": raw.get("projects") or [],
        "baseCoverLetter": _s(raw.get("baseCoverLetter")),
        "complementary": raw.get("complementary") or {},
        "analysis": raw.get("analysis"),
        "version": int(raw.get("version") or 1),
    }


async def score_ats_match(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    if settings.resolved_llm_provider == "stub":
        return _stub_ats(job_description, profile)
    return await _real_ats(job_description, profile)


async def generate_cover_letter(
    job_description: str, profile: dict[str, Any], tone: str
) -> str:
    if settings.resolved_llm_provider == "stub":
        return _stub_cover_letter(job_description, profile, tone)
    return await _real_cover_letter(job_description, profile, tone)


async def tailor_profile(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    if settings.resolved_llm_provider == "stub":
        return _stub_tailor(job_description, profile)
    return await _real_tailor(job_description, profile)


async def localize_profile(
    profile: dict[str, Any], language: str, region: str | None = None
) -> dict[str, Any]:
    if settings.resolved_llm_provider == "stub":
        return _stub_localize(profile, language, region)
    return await _real_localize(profile, language, region)


async def super_cv(
    profile: dict[str, Any], target_role: str, jd: str | None, cv_text: str | None
) -> dict[str, Any]:
    if settings.resolved_llm_provider == "stub":
        return _stub_super_cv(profile, target_role, jd, cv_text)
    return await _real_super_cv(profile, target_role, jd, cv_text)


async def personal_analysis(profile: dict[str, Any]) -> dict[str, Any]:
    if settings.resolved_llm_provider == "stub":
        return _stub_personal_analysis(profile)
    return await _real_personal_analysis(profile)


async def skill_suggestions(profile: dict[str, Any]) -> list[str]:
    if settings.resolved_llm_provider == "stub":
        return _stub_skill_suggestions(profile)
    return await _real_skill_suggestions(profile)


async def interview_questions(
    profile: dict[str, Any], role: str, jd: str | None, kind: str
) -> list[str]:
    if settings.resolved_llm_provider == "stub":
        return _stub_interview_questions(role, kind)
    return await _real_interview_questions(profile, role, jd, kind)


async def interview_feedback(
    profile: dict[str, Any], role: str, qa: list[tuple[str, str]]
) -> dict[str, Any]:
    if settings.resolved_llm_provider == "stub":
        return _stub_interview_feedback(qa)
    return await _real_interview_feedback(profile, role, qa)


async def personalized_cover_letter(
    profile: dict[str, Any],
    jd: str,
    company: str | None,
    role: str | None,
    highlights: str | None,
    tone: str,
) -> str:
    if settings.resolved_llm_provider == "stub":
        return _stub_personalized_cover_letter(profile, company, role, tone)
    return await _real_personalized_cover_letter(profile, jd, company, role, highlights, tone)


def _cv_to_text(profile: dict[str, Any]) -> str:
    p = profile or {}
    per = p.get("personal") or {}
    lines = [per.get("fullName", ""), per.get("headline", ""), per.get("summary", "")]
    for e in p.get("experience") or []:
        lines.append(
            f"{e.get('title','')} — {e.get('employer','')} ({e.get('startDate','')}–{e.get('endDate') or 'present'})"
        )
        for b in e.get("bullets") or []:
            lines.append(f"  • {b}")
    if p.get("skills"):
        lines.append("Skills: " + ", ".join(p["skills"]))
    return "\n".join(line for line in lines if line)


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


_LANG_LABEL = {"es": "Español", "pt": "Português", "en": "English", "fr": "Français"}


def _stub_localize(profile: dict[str, Any], language: str, region: str | None) -> dict[str, Any]:
    """Tag the headline with the target language and bump version (offline stub)."""
    label = _LANG_LABEL.get(language[:2].lower(), language)
    localized = {**profile}
    personal = {**localized.get("personal", {})}
    if personal.get("headline"):
        personal["headline"] = f"{personal['headline']} ({label})"
    localized["personal"] = personal
    localized["version"] = profile.get("version", 1) + 1
    return localized


# --- Real providers -----------------------------------------------------------
# Activated automatically when OPENAI_API_KEY or ANTHROPIC_API_KEY is set (see
# settings.resolved_llm_provider). They share signatures with the stubs and fall
# back to the stub if a provider call fails, so a bad key never breaks the app.

import json

import httpx


async def _log_usage(provider: str, model: str, task: str, usage: dict, latency_ms: int) -> None:
    """Best-effort token accounting to the llm_usage table (never raises)."""
    try:
        from app.db import SessionLocal
        from app.models import LlmUsage

        async with SessionLocal() as db:
            db.add(
                LlmUsage(
                    provider=provider,
                    model=model,
                    task=task,
                    prompt_tokens=int(usage.get("prompt_tokens") or usage.get("input_tokens") or 0),
                    completion_tokens=int(
                        usage.get("completion_tokens") or usage.get("output_tokens") or 0
                    ),
                    latency_ms=latency_ms,
                )
            )
            await db.commit()
    except Exception:
        pass


async def _chat_json(system: str, user: str, task: str = "chat") -> dict[str, Any]:
    """Call the configured provider and return a parsed JSON object."""
    provider = settings.resolved_llm_provider
    start = time.monotonic()
    if provider == "openai":
        async with httpx.AsyncClient(timeout=45) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "response_format": {"type": "json_object"},
                },
            )
            res.raise_for_status()
            data = res.json()
            await _log_usage(
                "openai", settings.openai_model, task, data.get("usage", {}),
                int((time.monotonic() - start) * 1000),
            )
            return json.loads(data["choices"][0]["message"]["content"])
    # anthropic
    async with httpx.AsyncClient(timeout=45) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 2048,
                "system": system + " Respond with a single valid JSON object only.",
                "messages": [{"role": "user", "content": user}],
            },
        )
        res.raise_for_status()
        data = res.json()
        await _log_usage(
            "anthropic", settings.anthropic_model, task, data.get("usage", {}),
            int((time.monotonic() - start) * 1000),
        )
        text = data["content"][0]["text"]
        start_i, end_i = text.find("{"), text.rfind("}")
        return json.loads(text[start_i : end_i + 1])


async def _chat_text(system: str, user: str, task: str = "chat") -> str:
    provider = settings.resolved_llm_provider
    start = time.monotonic()
    if provider == "openai":
        async with httpx.AsyncClient(timeout=45) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            res.raise_for_status()
            data = res.json()
            await _log_usage(
                "openai", settings.openai_model, task, data.get("usage", {}),
                int((time.monotonic() - start) * 1000),
            )
            return data["choices"][0]["message"]["content"]
    async with httpx.AsyncClient(timeout=45) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 1024,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
        )
        res.raise_for_status()
        data = res.json()
        await _log_usage(
            "anthropic", settings.anthropic_model, task, data.get("usage", {}),
            int((time.monotonic() - start) * 1000),
        )
        return data["content"][0]["text"]


async def _real_extract_profile(text: str) -> dict[str, Any]:
    try:
        return await _chat_json(
            "You extract a structured CV profile. Return JSON matching this shape: "
            '{personal:{fullName,headline,email,phone,location,summary}, experience:'
            "[{id,employer,title,startDate,endDate,location,bullets[]}], education:"
            "[{id,institution,degree,field,startDate,endDate}], skills[], languages:"
            "[{id,language,level}], links:[{id,label,url}], complementary:{}, version:1}.",
            f"CV text:\n{text[:8000]}",
            task="extract_profile",
        )
    except Exception:
        return _stub_extract_profile(text)


async def _real_ats(job_description: str, profile: dict[str, Any]) -> dict[str, Any]:
    try:
        return await _chat_json(
            "You are an ATS scorer. Return JSON: {matchScore:int 0-100, matchedKeywords[],"
            " missingKeywords[], qualification:'underqualified'|'strong match'|'overqualified',"
            " recommendations[3]}.",
            f"Job description:\n{job_description[:4000]}\n\nProfile:\n{json.dumps(profile)[:4000]}",
            task="ats_score",
        )
    except Exception:
        return _stub_ats(job_description, profile)


async def _real_cover_letter(jd: str, profile: dict[str, Any], tone: str) -> str:
    try:
        return await _chat_text(
            f"Write a focused 250-350 word cover letter in a {tone} tone. Avoid generic "
            "openers. Use only facts from the profile.",
            f"Job description:\n{jd[:4000]}\n\nProfile:\n{json.dumps(profile)[:4000]}",
            task="cover_letter",
        )
    except Exception:
        return _stub_cover_letter(jd, profile, tone)


async def _real_tailor(jd: str, profile: dict[str, Any]) -> dict[str, Any]:
    try:
        result = await _chat_json(
            "Tailor this profile to the job: reorder experience bullets to surface the most "
            "relevant first, add truthful ATS keywords, keep the same JSON profile shape, and "
            "increment 'version'. Never invent experience.",
            f"Job description:\n{jd[:4000]}\n\nProfile:\n{json.dumps(profile)[:4000]}",
            task="tailor",
        )
        result.setdefault("version", profile.get("version", 1) + 1)
        return result
    except Exception:
        return _stub_tailor(jd, profile)


async def _real_localize(
    profile: dict[str, Any], language: str, region: str | None
) -> dict[str, Any]:
    target = f"{language}" + (f" ({region})" if region else "")
    try:
        result = await _chat_json(
            f"Localize this CV profile to {target}: translate text, adapt cultural tone and "
            "formality, and align seniority vocabulary to the regional professional standard. "
            "Keep the same JSON profile shape and increment 'version'. Do not invent experience.",
            f"Profile:\n{json.dumps(profile)[:6000]}",
            task="localize",
        )
        result.setdefault("version", profile.get("version", 1) + 1)
        return result
    except Exception:
        return _stub_localize(profile, language, region)


def _stub_super_cv(profile, target_role, jd, cv_text):  # type: ignore[no-untyped-def]
    per = profile.get("personal") or {}
    jd_tokens = _tokens(jd or "")
    skills_txt = " ".join(s.lower() for s in (profile.get("skills") or []))
    matched = [t for t in jd_tokens if t in skills_txt] if jd else []
    ats = min(95, 60 + len(matched) * 4) if jd else 78
    gaps = [t for t in list(jd_tokens) if t not in skills_txt][:5] if jd else []
    out = [f"# {per.get('fullName','Your Name')}", f"**{target_role}**", "", per.get("summary", ""), "", "## Experience"]
    for e in profile.get("experience") or []:
        out.append(f"### {e.get('title','')} · {e.get('employer','')}")
        for b in e.get("bullets") or ["Delivered measurable results on key initiatives."]:
            out.append(f"- Accomplished {str(b).rstrip('.')}, measured by clear impact, by applying {target_role} best practices.")
    if profile.get("skills"):
        out += ["", "## Skills", ", ".join(profile["skills"])]
    return {"cvText": "\n".join(out), "atsScore": ats, "gaps": gaps}


def _stub_personal_analysis(profile):  # type: ignore[no-untyped-def]
    skills = profile.get("skills") or []
    strengths = [f"Strong command of {s}" for s in skills[:3]] or [
        "Reliable and adaptable", "Clear communicator", "Fast learner",
    ]
    return {
        "strengths": strengths,
        "weaknesses": "Occasionally takes on too much at once; actively working on delegation.",
        "motivation": "Looking for a role with greater scope, ownership and impact.",
    }


def _stub_skill_suggestions(profile):  # type: ignore[no-untyped-def]
    have = {s.lower() for s in (profile.get("skills") or [])}
    return [s for s in _SKILL_POOL if s.lower() not in have][:8]


def _stub_interview_questions(role, kind):  # type: ignore[no-untyped-def]
    behavioral = [
        f"Tell me about yourself and why you're a strong fit for the {role} role.",
        "Describe a time you disagreed with a teammate. How did you resolve it?",
        "Tell me about a project you're most proud of and your specific contribution.",
        "Describe a time you failed or missed a deadline. What did you learn?",
    ]
    technical = [
        f"Walk me through how you would approach a typical {role} problem end to end.",
        f"What tools and practices do you rely on most as a {role}, and why?",
        "How do you ensure quality and catch issues before they reach production?",
        "Describe a technically challenging decision you made and the trade-offs.",
    ]
    closing = ["Where do you see yourself in three years, and why this company?"]
    if kind == "behavioral":
        pool = behavioral
    elif kind == "technical":
        pool = technical
    else:
        pool = [behavioral[0], technical[0], behavioral[1], technical[1]]
    return (pool + closing)[:5]


def _stub_interview_feedback(qa):  # type: ignore[no-untyped-def]
    per = []
    for q, a in qa:
        words = len((a or "").split())
        rating = 5 if words > 70 else 4 if words > 35 else 3 if words > 12 else 2 if words else 1
        if rating >= 4:
            fb = "Specific and well-structured — good use of a concrete example with a clear result."
        elif rating >= 3:
            fb = "Solid start. Tighten it with the STAR method and quantify the outcome (a number or %)."
        else:
            fb = "Too brief. Add the situation, the actions you personally took, and a measurable result."
        per.append({"question": q, "answer": a or "", "rating": rating, "feedback": fb})
    overall = round(sum(p["rating"] for p in per) / max(len(per), 1) * 20)
    summary = (
        "Strong overall — your answers are concrete and outcome-focused."
        if overall >= 80
        else "Good foundation. Focus on quantifying results and using the STAR structure consistently."
        if overall >= 55
        else "Keep practicing: lead with a concrete situation and always close with a measurable result."
    )
    return {"overallScore": overall, "summary": summary, "perQuestion": per}


def _stub_personalized_cover_letter(profile, company, role, tone):  # type: ignore[no-untyped-def]
    per = profile.get("personal") or {}
    name = per.get("fullName") or "the candidate"
    where = f" at {company}" if company else ""
    pos = role or per.get("headline") or "this role"
    opener = {
        "professional": f"I am writing to apply for the {pos} position{where}.",
        "warm": f"I was thrilled to discover the {pos} opening{where}.",
        "direct": f"I'm applying for the {pos} role{where}.",
    }.get(tone, f"I am writing to apply for the {pos} position{where}.")
    skills = ", ".join((profile.get("skills") or [])[:4]) or "execution and ownership"
    return (
        f"Dear Hiring Team{(' at ' + company) if company else ''},\n\n"
        f"{opener} My background has equipped me with strengths in {skills}, and I bring a "
        f"track record of delivering measurable results.\n\n"
        f"In my recent experience I led initiatives that improved outcomes and collaborated "
        f"across functions to ship high-quality work. I'm drawn to this opportunity because it "
        f"aligns closely with what I do best and where I want to grow.\n\n"
        f"I would welcome the chance to discuss how I can contribute. Thank you for your "
        f"consideration.\n\nSincerely,\n{name}"
    )


async def _real_super_cv(profile, target_role, jd, cv_text):  # type: ignore[no-untyped-def]
    source = cv_text or _cv_to_text(profile)
    try:
        res = await _chat_json(
            "You are a senior FAANG recruiter. Rewrite the CV for the target role using the X-Y-Z "
            "formula (Accomplished X, measured by Y, by doing Z). NEVER invent employers, titles or "
            "facts not present in the source. Integrate keywords from the job description. Return JSON "
            "{cvText: markdown string, atsScore: integer 0-100, gaps: array of missing-keyword strings}.",
            f"TARGET ROLE: {target_role}\nJOB DESCRIPTION: {jd or '(none provided)'}\n\nCV SOURCE:\n{source[:7000]}",
            task="super_cv",
        )
        return {
            "cvText": _s(res.get("cvText")) or source,
            "atsScore": int(res.get("atsScore") or 78),
            "gaps": [_s(g) for g in (res.get("gaps") or [])][:8],
        }
    except Exception:
        return _stub_super_cv(profile, target_role, jd, cv_text)


async def _real_personal_analysis(profile):  # type: ignore[no-untyped-def]
    try:
        res = await _chat_json(
            "Analyze this candidate constructively. Return JSON {strengths: array of 3-5 short "
            "strings, weaknesses: string, motivation: string}.",
            _cv_to_text(profile)[:5000],
            task="personal_analysis",
        )
        return {
            "strengths": [_s(s) for s in (res.get("strengths") or [])][:5],
            "weaknesses": _s(res.get("weaknesses")),
            "motivation": _s(res.get("motivation")),
        }
    except Exception:
        return _stub_personal_analysis(profile)


async def _real_skill_suggestions(profile):  # type: ignore[no-untyped-def]
    try:
        res = await _chat_json(
            "Suggest up to 8 relevant technical skills/technologies this candidate likely has or "
            "should add, based on their profile. Do not repeat skills they already list. Return JSON "
            "{skills: array of strings}.",
            _cv_to_text(profile)[:5000],
            task="skill_suggestions",
        )
        return [_s(s) for s in (res.get("skills") or [])][:8]
    except Exception:
        return _stub_skill_suggestions(profile)


async def _real_interview_questions(profile, role, jd, kind):  # type: ignore[no-untyped-def]
    try:
        res = await _chat_json(
            f"You are a senior interviewer for a {role} role. Generate exactly 5 {kind} interview "
            "questions tailored to the role and the candidate's background. Return JSON "
            "{questions: array of 5 strings}.",
            f"ROLE: {role}\nJOB DESCRIPTION: {jd or '(none)'}\n\nCANDIDATE:\n{_cv_to_text(profile)[:3000]}",
            task="interview_questions",
        )
        qs = [_s(q) for q in (res.get("questions") or []) if q][:5]
        return qs or _stub_interview_questions(role, kind)
    except Exception:
        return _stub_interview_questions(role, kind)


async def _real_interview_feedback(profile, role, qa):  # type: ignore[no-untyped-def]
    transcript = "\n\n".join(f"Q: {q}\nA: {a or '(no answer)'}" for q, a in qa)
    try:
        res = await _chat_json(
            f"You are a senior interviewer evaluating a candidate for a {role} role. For each "
            "question rate the answer 1-5 and give one specific, actionable line of feedback. Then "
            "give an overall 0-100 score and a 1-2 sentence summary. Return JSON {overallScore:int, "
            "summary:string, perQuestion:[{question, answer, rating:int, feedback}]}.",
            transcript[:7000],
            task="interview_feedback",
        )
        per = []
        for i, item in enumerate(res.get("perQuestion") or []):
            item = item or {}
            q, a = (qa[i] if i < len(qa) else ("", ""))
            per.append({
                "question": _s(item.get("question")) or q,
                "answer": _s(item.get("answer")) or (a or ""),
                "rating": max(1, min(5, int(item.get("rating") or 3))),
                "feedback": _s(item.get("feedback")),
            })
        if not per:
            return _stub_interview_feedback(qa)
        return {
            "overallScore": max(0, min(100, int(res.get("overallScore") or 0))),
            "summary": _s(res.get("summary")),
            "perQuestion": per,
        }
    except Exception:
        return _stub_interview_feedback(qa)


async def _real_personalized_cover_letter(profile, jd, company, role, highlights, tone):  # type: ignore[no-untyped-def]
    try:
        return await _chat_text(
            f"Write a fully personalized 250-380 word cover letter in a {tone} tone, addressed to "
            f"{company or 'the hiring team'} for the {role or 'role'}. Reference concrete, relevant "
            "facts from the candidate profile and weave in the points they want to emphasize. Avoid "
            "generic filler. Never invent experience the profile does not contain.",
            f"JOB DESCRIPTION:\n{jd[:3500]}\n\nEMPHASIZE: {highlights or '(candidate did not specify)'}"
            f"\n\nCANDIDATE PROFILE:\n{json.dumps(profile)[:3500]}",
            task="cover_letter_pro",
        )
    except Exception:
        return _stub_personalized_cover_letter(profile, company, role, tone)


def _cache_key(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode()).hexdigest()
