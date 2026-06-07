"""
Job-posting fetcher (Phase 0.2 — shared enabler).

Several features need the *text* of a posting, not just its URL: real CV tailoring,
ATS scoring, the predictive apply score, ghost-recruiter advice and scam detection.
This service fetches a posting URL, strips it to readable text, and caches the result
in-memory so repeated calls for the same URL are cheap.

It is deliberately dependency-light (httpx + a small HTML-to-text reducer) and always
fails soft: on any network/parse error it returns an empty string so callers can fall
back to user-pasted text instead of erroring.
"""

from __future__ import annotations

import re
import time

import httpx

# url -> (fetched_at_monotonic, text)
_CACHE: dict[str, tuple[float, str]] = {}
_TTL_SECONDS = 60 * 60  # 1 hour; postings rarely change within a session
_MAX_CHARS = 12000

_UA = (
    "Mozilla/5.0 (compatible; AplicoCVBot/1.0; +https://aplicocv.com/bot) "
    "fetching a job posting the user explicitly asked to apply to"
)

# Tags whose contents are never useful posting text.
_STRIP_BLOCKS = re.compile(
    r"<(script|style|nav|footer|header|svg|noscript)[^>]*>.*?</\1>",
    re.IGNORECASE | re.DOTALL,
)
_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"[ \t\f\v]+")
_BLANKS = re.compile(r"\n\s*\n\s*\n+")


def html_to_text(html: str) -> str:
    """Reduce an HTML document to readable plain text (best-effort, no deps)."""
    text = _STRIP_BLOCKS.sub(" ", html)
    # Preserve block breaks so sections don't run together.
    text = re.sub(r"<(br|/p|/div|/li|/h[1-6]|/tr)[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = _TAG.sub(" ", text)
    # Unescape the handful of entities that matter for readability.
    for ent, ch in (("&amp;", "&"), ("&nbsp;", " "), ("&lt;", "<"), ("&gt;", ">"),
                    ("&#39;", "'"), ("&quot;", '"'), ("&mdash;", "—"), ("&ndash;", "–")):
        text = text.replace(ent, ch)
    text = _WS.sub(" ", text)
    text = _BLANKS.sub("\n\n", text)
    return text.strip()[:_MAX_CHARS]


def _is_fetchable(url: str) -> bool:
    return isinstance(url, str) and url.lower().startswith(("http://", "https://"))


async def fetch_job_text(url: str, *, force: bool = False) -> str:
    """Fetch and clean a posting's text. Returns "" on any failure (caller falls back)."""
    if not _is_fetchable(url):
        return ""
    now = time.monotonic()
    if not force:
        hit = _CACHE.get(url)
        if hit and (now - hit[0]) < _TTL_SECONDS:
            return hit[1]
    try:
        async with httpx.AsyncClient(
            timeout=12,
            follow_redirects=True,
            headers={"User-Agent": _UA, "Accept": "text/html,application/xhtml+xml"},
        ) as client:
            res = await client.get(url)
            res.raise_for_status()
            ctype = res.headers.get("content-type", "")
            text = html_to_text(res.text) if "html" in ctype or "<" in res.text[:200] else res.text[:_MAX_CHARS]
    except Exception:
        return ""
    _CACHE[url] = (now, text)
    return text


async def job_text_or_fallback(url: str | None, pasted: str | None) -> str:
    """Prefer pasted text; otherwise fetch the URL. Used by tailoring/scoring callers."""
    if pasted and pasted.strip():
        return pasted.strip()[:_MAX_CHARS]
    if url:
        fetched = await fetch_job_text(url)
        if fetched:
            return fetched
    # Last resort: the URL itself is weak signal, but better than nothing for the stub.
    return (url or "")[:_MAX_CHARS]
