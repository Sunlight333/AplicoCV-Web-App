from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import CreditAccount, User
from app.services import credit_service, monitoring_service

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/status")
async def monitoring_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Whether smart job monitoring is active for this user, and the pass price."""
    acc = await db.get(CreditAccount, user.id)  # non-creating; status(None) is safe
    return monitoring_service.status(user, acc)


@router.post("/activate")
async def monitoring_activate(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Entitle the user to monitoring. Premium is included; otherwise spend the
    token pass for a 7-day window. Returns the updated status."""
    acc = await credit_service.get_account(db, user.id)
    try:
        return await monitoring_service.activate(db, user, acc)
    except ValueError as exc:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, detail=str(exc))
