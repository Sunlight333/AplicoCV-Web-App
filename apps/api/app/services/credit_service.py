"""Credit economy + gamification: balance, ledger, daily check-in streak, and
one-time profile-completion grants. Mirrors the competitor's engagement loop."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CreditAccount, CreditTransaction

WELCOME_BONUS = 100
CHECKIN_BASE = 10
DOUBLE_DAYS = {7, 14, 21, 30}
CYCLE_DAYS = 30

# Credit cost per AI action (tuned for our economy; the competitor charges more).
AI_COSTS = {
    "super_cv": 50,
    "cover_letter": 20,
    "personal_analysis": 10,
    "skill_suggestions": 10,
}

# One-time credits for completing each profile section (the competitor's model).
EARN_RULES: list[dict[str, Any]] = [
    {"key": "cv", "label": "Add your CV", "amount": 50},
    {"key": "preferences", "label": "Set your job preferences", "amount": 25},
    {"key": "experience", "label": "Add work experience", "amount": 25},
    {"key": "skills", "label": "Add your skills", "amount": 25},
    {"key": "faq", "label": "Answer 3 common questions", "amount": 25},
    {"key": "extension", "label": "Install the browser extension", "amount": 100},
]


def _today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


async def get_account(db: AsyncSession, user_id: str) -> CreditAccount:
    acc = await db.get(CreditAccount, user_id)
    if acc is None:
        acc = CreditAccount(user_id=user_id, balance=WELCOME_BONUS, streak=0, grants={})
        db.add(acc)
        db.add(CreditTransaction(user_id=user_id, amount=WELCOME_BONUS, reason="welcome_bonus"))
        await db.commit()
        await db.refresh(acc)
    return acc


async def grant(db: AsyncSession, acc: CreditAccount, amount: int, reason: str) -> CreditAccount:
    acc.balance += amount
    db.add(CreditTransaction(user_id=acc.user_id, amount=amount, reason=reason))
    await db.commit()
    await db.refresh(acc)
    return acc


async def spend(db: AsyncSession, acc: CreditAccount, amount: int, reason: str) -> bool:
    """Deduct credits; returns False (no change) if the balance is insufficient."""
    if acc.balance < amount:
        return False
    acc.balance -= amount
    db.add(CreditTransaction(user_id=acc.user_id, amount=-amount, reason=reason))
    await db.commit()
    await db.refresh(acc)
    return True


def day_in_cycle(streak: int) -> int:
    return ((max(streak, 1) - 1) % CYCLE_DAYS) + 1


async def checkin(db: AsyncSession, acc: CreditAccount) -> dict[str, Any]:
    today = _today_iso()
    if acc.last_checkin == today:
        return {"claimed": False, "reason": "already_claimed", "balance": acc.balance, "streak": acc.streak}
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    acc.streak = acc.streak + 1 if acc.last_checkin == yesterday else 1
    d = day_in_cycle(acc.streak)
    amount = CHECKIN_BASE * (2 if d in DOUBLE_DAYS else 1)
    acc.last_checkin = today
    acc.balance += amount
    db.add(CreditTransaction(user_id=acc.user_id, amount=amount, reason=f"checkin_day_{d}"))
    await db.commit()
    await db.refresh(acc)
    return {"claimed": True, "amount": amount, "balance": acc.balance, "streak": acc.streak, "dayInCycle": d}


def completion(profile_data: dict | None, prefs: dict | None, faq_count: int) -> dict[str, Any]:
    p = profile_data or {}
    personal = p.get("personal") or {}
    prefs = prefs or {}
    sections = {
        "cv": bool(personal.get("fullName")),
        "preferences": bool(prefs.get("targetRoles") or prefs.get("locations")),
        "experience": len(p.get("experience") or []) > 0,
        "skills": len(p.get("skills") or []) > 0,
        "education": len(p.get("education") or []) > 0,
        "faq": faq_count >= 3,
    }
    done = sum(1 for v in sections.values() if v)
    return {"sections": sections, "percent": round(done / len(sections) * 100)}


def earn_status(acc: CreditAccount, comp: dict) -> list[dict[str, Any]]:
    out = []
    for rule in EARN_RULES:
        key = rule["key"]
        ready = True if key == "extension" else bool(comp["sections"].get(key))
        out.append({**rule, "claimed": bool((acc.grants or {}).get(key)), "ready": ready})
    return out


async def claim_earn(db: AsyncSession, acc: CreditAccount, key: str, comp: dict) -> dict[str, Any]:
    rule = next((r for r in EARN_RULES if r["key"] == key), None)
    if rule is None:
        return {"ok": False, "reason": "unknown"}
    if (acc.grants or {}).get(key):
        return {"ok": False, "reason": "already_claimed"}
    ready = True if key == "extension" else bool(comp["sections"].get(key))
    if not ready:
        return {"ok": False, "reason": "not_ready"}
    grants = dict(acc.grants or {})
    grants[key] = True
    acc.grants = grants  # reassign so SQLAlchemy detects the JSON change
    acc.balance += rule["amount"]
    db.add(CreditTransaction(user_id=acc.user_id, amount=rule["amount"], reason=f"earn_{key}"))
    await db.commit()
    await db.refresh(acc)
    return {"ok": True, "amount": rule["amount"], "balance": acc.balance}
