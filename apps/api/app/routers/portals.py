from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.db import get_db
from app.models import PortalConfig
from app.schemas import PortalConfigOut

router = APIRouter(prefix="/portals", tags=["portals"])


@router.get("/configs", response_model=list[PortalConfigOut])
async def portal_configs(db: AsyncSession = Depends(get_db)) -> list[PortalConfigOut]:
    rows = (await db.execute(select(PortalConfig))).scalars().all()
    return [
        PortalConfigOut(
            name=p.name,
            domainPattern=p.domain_pattern,
            selectors=p.selectors or {},
            quirks=p.quirks,
            logoUrl=p.logo_url,
        )
        for p in rows
    ]
