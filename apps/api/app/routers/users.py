from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import (
    Application,
    CoverLetter,
    Credential,
    CreditAccount,
    CreditTransaction,
    Document,
    FaqAnswer,
    LlmUsage,
    Operation,
    Profile,
    Recommendation,
    User,
)
from app.routers.auth import REFRESH_COOKIE, _user_out
from app.schemas import JobPreferences, SetPasswordInput, UserOut
from app.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


class UserPatch(BaseModel):
    onboarded: bool | None = None
    fullName: str | None = None


# Profile sections the tool needs to work correctly. The user cannot finish
# onboarding until each has at least one entry (client requirement).
REQUIRED_SECTIONS = ("experience", "education", "languages")


def _missing_required(profile_data: dict | None) -> list[str]:
    p = profile_data or {}
    return [s for s in REQUIRED_SECTIONS if not (p.get(s) or [])]


@router.patch("/me/preferences", response_model=UserOut)
async def update_preferences(
    prefs: JobPreferences,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user.preferences = prefs.model_dump()
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


# ---- Onboarding funnel → profile adoption ---------------------------------
# The conversational funnel (/comenzar) collects the same information the app's
# preferences hold, but as its own answer ids. This endpoint both SAVES the raw
# answers on the user and APPLIES them by mapping into JobPreferences, so the account
# lands with its profile pre-filled instead of re-asking everything inside the app.

_EMP_STATUS = {
    "unemployed": "unemployed",
    "employed": "employed_seeking",
    "freelance": "employed_open",
    "student": "unemployed_relaxed",
}
_SENIORITY = {
    "entry": "junior", "junior": "junior", "mid": "mid",
    "senior": "senior", "lead": "lead", "exec": "principal",
}
_JOBTYPE_MODALITY = {
    "fulltime": "full_time", "parttime": "part_time",
    "contract": "contract", "internship": "internship",
}
_CATEGORY_INDUSTRY = {
    "sales": "Sales", "marketing": "Marketing", "software": "Software / IT",
    "design": "Design", "ops": "Operations", "data": "Data & Analytics",
    "finance": "Finance", "hr": "HR & Recruiting", "customer": "Customer Support",
}
_COUNTRY_NAMES = {
    "US": "United States", "MX": "México", "AR": "Argentina", "CL": "Chile",
    "CO": "Colombia", "PE": "Perú", "BR": "Brasil", "UY": "Uruguay", "PY": "Paraguay",
    "BO": "Bolivia", "EC": "Ecuador", "VE": "Venezuela", "CR": "Costa Rica",
    "PA": "Panamá", "GT": "Guatemala", "DO": "Rep. Dominicana", "ES": "España",
    "CA": "Canada", "GB": "United Kingdom", "DE": "Germany", "FR": "France",
    "IT": "Italy", "PT": "Portugal", "NL": "Netherlands", "IE": "Ireland",
    "AU": "Australia", "IN": "India", "PH": "Philippines", "ZA": "South Africa",
}
_US_AUTH = {
    "citizen": "US citizen / permanent resident",
    "visa": "Holds a valid US work visa",
    "student": "US student authorization (OPT/CPT)",
    "need_sponsor": "Will need US visa sponsorship",
}


def _as_list(v: object) -> list:
    if isinstance(v, list):
        return v
    return [v] if v else []


def _map_funnel_to_prefs(a: dict) -> dict:
    """Translate funnel answer ids into JobPreferences fields. Only sets fields the
    answers actually cover — untouched fields keep their existing/default value."""
    out: dict = {}

    ws = a.get("workStatus")
    if ws in _EMP_STATUS:
        emp = _EMP_STATUS[ws]
        if ws == "employed" and a.get("searchFocus") == "open":
            emp = "employed_open"
        out["employmentStatus"] = emp

    lvl = a.get("level")
    if lvl in _SENIORITY:
        out["seniority"] = _SENIORITY[lvl]

    modality = _as_list(a.get("modality"))
    if modality:
        s = set(modality)
        if s == {"remote"}:
            out["remote"] = "remote"
        elif s == {"onsite"}:
            out["remote"] = "onsite"
        elif s == {"hybrid"}:
            out["remote"] = "hybrid"
        else:
            out["remote"] = "any"
        out["remoteScope"] = "full_remote" if "remote" in s else "onsite_hybrid"

    mods = [_JOBTYPE_MODALITY[t] for t in _as_list(a.get("jobTypes")) if t in _JOBTYPE_MODALITY]
    if "remote" in modality:
        mods.append("remote")
    if mods:
        out["workModalities"] = sorted(set(mods))

    sal = a.get("minSalary")
    if isinstance(sal, (int, float)) and sal > 0:
        out["salaryMin"] = int(sal)
        out["salaryUsdAmount"] = int(sal)
        out["salaryPeriod"] = "month"
        out["salaryCurrency"] = "USD"

    country = a.get("country")
    if country:
        out["locations"] = [_COUNTRY_NAMES.get(country, str(country))]

    cats = _as_list(a.get("categories"))
    if cats and "any" not in cats:
        inds = [_CATEGORY_INDUSTRY[c] for c in cats if c in _CATEGORY_INDUSTRY]
        if inds:
            out["industries"] = inds

    ua = a.get("usAuth")
    if ua in _US_AUTH:
        out["workAuthorization"] = _US_AUTH[ua]

    return out


class FunnelAdoptInput(BaseModel):
    answers: dict = {}


@router.post("/me/funnel", response_model=UserOut)
async def adopt_funnel(
    body: FunnelAdoptInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Save the funnel's raw answers and apply them to the user's job preferences."""
    answers = body.answers or {}
    # Overlay the mapped fields onto the current preferences (defaults if empty).
    base = JobPreferences(**(user.preferences or {})).model_dump()
    base.update(_map_funnel_to_prefs(answers))
    validated = JobPreferences(**base).model_dump()
    # Keep the raw snapshot too (UserOut ignores this extra key; it lets us re-apply
    # or inspect the original answers later).
    validated["funnel"] = answers
    user.preferences = validated
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    patch: UserPatch,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if patch.onboarded:
        # Block completing onboarding until Experience, Education and Languages
        # each have at least one entry — the tool can't autofill without them.
        prof = (
            await db.execute(select(Profile).where(Profile.user_id == user.id))
        ).scalar_one_or_none()
        missing = _missing_required(prof.data if prof else {})
        if missing:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Add at least one entry to: " + ", ".join(missing),
            )
        user.onboarded = True
    elif patch.onboarded is not None:
        user.onboarded = patch.onboarded
    if patch.fullName is not None:
        user.full_name = patch.fullName
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.post("/me/password", response_model=UserOut)
async def set_password(
    body: SetPasswordInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Set or change the account password.

    Accounts that already have a password must supply the correct current one.
    Passwordless accounts (e.g. created via Google) can set their first password
    without it.
    """
    if user.hashed_password:
        if not body.currentPassword or not verify_password(body.currentPassword, user.hashed_password):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Your current password is incorrect")
    user.hashed_password = hash_password(body.newPassword)
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.delete("/me")
async def delete_account(
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Permanently delete the account and all associated data."""
    for model in (
        Profile, Document, Application, CoverLetter, Credential,
        Recommendation, Operation, CreditAccount, CreditTransaction, FaqAnswer, LlmUsage,
    ):
        await db.execute(sql_delete(model).where(model.user_id == user.id))
    await db.delete(user)
    await db.commit()
    response.delete_cookie(REFRESH_COOKIE, path="/")
    return {"ok": True}
