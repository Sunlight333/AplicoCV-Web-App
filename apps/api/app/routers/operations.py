from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Operation, User
from app.schemas import OperationOut

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/{op_id}/result", response_model=OperationOut)
async def get_result(
    op_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OperationOut:
    """
    Polled by the Chrome extension every ~2s. The MV3 service worker can be
    killed mid-operation, so long work is started server-side and its result is
    fetched here instead of via a live message response.
    """
    op = await db.get(Operation, op_id)
    if not op or op.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Operation not found")
    return OperationOut(id=op.id, kind=op.kind, status=op.status, result=op.result)  # type: ignore[arg-type]
