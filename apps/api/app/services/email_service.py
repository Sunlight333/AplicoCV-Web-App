"""
Transactional email.

Activates from config: EMAIL_PROVIDER=resend|sendgrid + the matching key.
With EMAIL_PROVIDER=console (default) it just logs — so the app runs with no key.
send() never raises: a failed email is logged, never breaks the request flow.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger("aplicocv.email")


async def send(to: str, subject: str, html: str) -> bool:
    """Send one email. Returns True if accepted by the provider."""
    provider = settings.email_provider
    try:
        if provider == "resend" and settings.resend_api_key:
            return await _send_resend(to, subject, html)
        if provider == "sendgrid" and settings.sendgrid_api_key:
            return await _send_sendgrid(to, subject, html)
    except Exception as exc:  # never break the caller over an email
        logger.warning("email send failed (%s): %s", provider, exc)
        return False

    # console fallback
    logger.info("[email:console] to=%s subject=%s", to, subject)
    return True


async def _send_resend(to: str, subject: str, html: str) -> bool:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={"from": settings.email_from, "to": [to], "subject": subject, "html": html},
        )
        res.raise_for_status()
        return True


async def _send_sendgrid(to: str, subject: str, html: str) -> bool:
    # EMAIL_FROM may be "Name <email>"; SendGrid wants the bare address.
    from_addr = settings.email_from
    if "<" in from_addr:
        from_addr = from_addr.split("<", 1)[1].rstrip(">").strip()
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {settings.sendgrid_api_key}"},
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {"email": from_addr},
                "subject": subject,
                "content": [{"type": "text/html", "value": html}],
            },
        )
        res.raise_for_status()
        return True


def welcome_email(name: str) -> tuple[str, str]:
    """(subject, html) for the post-registration welcome email."""
    first = (name or "there").split(" ")[0]
    subject = "Welcome to AplicoCV"
    html = (
        f"<div style='font-family:Inter,Arial,sans-serif;color:#0b1426'>"
        f"<h2>Welcome, {first} 👋</h2>"
        f"<p>Your AplicoCV account is ready. Upload your CV once and start "
        f"autofilling job applications across LinkedIn, Workday, Indeed and more.</p>"
        f"<p><a href='https://aplicocv.com/onboarding' "
        f"style='background:#0a74f0;color:#fff;padding:10px 18px;border-radius:8px;"
        f"text-decoration:none'>Set up your profile</a></p>"
        f"<p style='color:#4f6bb7;font-size:13px'>— The AplicoCV team</p></div>"
    )
    return subject, html


def job_digest_email(name: str, jobs: list[dict]) -> tuple[str, str]:
    """(subject, html) for the autonomous assistant's new-matches digest (Phase 8).

    Each job dict: {title, company, portal, score, url}.
    """
    first = (name or "there").split(" ")[0]
    subject = f"{len(jobs)} new job match{'es' if len(jobs) != 1 else ''} for you"
    rows = "".join(
        f"<tr>"
        f"<td style='padding:10px 0;border-bottom:1px solid #eef2fb'>"
        f"<div style='font-weight:600;color:#0b1426'>{j.get('title','')}</div>"
        f"<div style='color:#4f6bb7;font-size:13px'>{j.get('company','')} · {j.get('portal','')}</div>"
        f"</td>"
        f"<td style='padding:10px 0;border-bottom:1px solid #eef2fb;text-align:right'>"
        f"<span style='font-weight:700;color:#16a34a'>{int(j.get('score',0))}%</span><br>"
        f"<a href='{j.get('url','#')}' style='color:#0a74f0;font-size:13px'>Apply →</a>"
        f"</td></tr>"
        for j in jobs
    )
    html = (
        f"<div style='font-family:Inter,Arial,sans-serif;color:#0b1426'>"
        f"<h2>New matches while you were away, {first}</h2>"
        f"<p>Your AplicoCV assistant found these high-match roles based on your preferences.</p>"
        f"<table style='width:100%;border-collapse:collapse'>{rows}</table>"
        f"<p style='margin-top:18px'><a href='https://aplicocv.com/dashboard' "
        f"style='background:#0a74f0;color:#fff;padding:10px 18px;border-radius:8px;"
        f"text-decoration:none'>Open your dashboard</a></p>"
        f"<p style='color:#4f6bb7;font-size:13px'>You can turn this digest off anytime in "
        f"Preferences.</p></div>"
    )
    return subject, html


def reset_password_email(link: str) -> tuple[str, str]:
    """(subject, html) for the forgot-password reset link."""
    subject = "Reset your AplicoCV password"
    html = (
        f"<div style='font-family:Inter,Arial,sans-serif;color:#0b1426'>"
        f"<h2>Reset your password</h2>"
        f"<p>We received a request to reset your AplicoCV password. Click below to "
        f"choose a new one. This link expires in 30 minutes.</p>"
        f"<p><a href='{link}' "
        f"style='background:#0a74f0;color:#fff;padding:10px 18px;border-radius:8px;"
        f"text-decoration:none'>Reset password</a></p>"
        f"<p style='color:#4f6bb7;font-size:13px'>If you didn't request this, you can "
        f"safely ignore this email — your password won't change.</p>"
        f"<p style='color:#4f6bb7;font-size:13px'>— The AplicoCV team</p></div>"
    )
    return subject, html
