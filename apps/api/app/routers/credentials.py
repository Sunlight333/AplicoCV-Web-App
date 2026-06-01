from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Credential, User
from app.schemas import CredentialCreate, CredentialOut, DecryptedCredential
from app.security import decrypt_secret, encrypt_secret

router = APIRouter(prefix="/credentials", tags=["credentials"])


def _out(c: Credential) -> CredentialOut:
    return CredentialOut(
        id=c.id, portal=c.portal, email=c.email, syncStatus=c.sync_status  # type: ignore[arg-type]
    )


@router.get("", response_model=list[CredentialOut])
async def list_credentials(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[CredentialOut]:
    rows = (
        await db.execute(select(Credential).where(Credential.user_id == user.id))
    ).scalars().all()
    return [_out(c) for c in rows]


@router.post("", response_model=CredentialOut)
async def save_credential(
    body: CredentialCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    # Upsert by portal. The raw password is encrypted (Fernet) before storage and
    # never persisted in plaintext nor returned to the client.
    result = await db.execute(
        select(Credential).where(
            Credential.user_id == user.id, Credential.portal == body.portal
        )
    )
    cred = result.scalar_one_or_none()
    if cred:
        cred.email = body.email
        cred.encrypted_password = encrypt_secret(body.password)
        cred.sync_status = "unverified"
    else:
        cred = Credential(
            user_id=user.id,
            portal=body.portal,
            email=body.email,
            encrypted_password=encrypt_secret(body.password),
        )
        db.add(cred)
    await db.commit()
    await db.refresh(cred)
    return _out(cred)


@router.delete("/{cred_id}")
async def delete_credential(
    cred_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    cred = await db.get(Credential, cred_id)
    if not cred or cred.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Credential not found")
    await db.delete(cred)
    await db.commit()
    return {"ok": True}


@router.post("/decrypt", response_model=DecryptedCredential)
async def decrypt_credential(
    portal: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DecryptedCredential:
    """Used by the extension to fill a login form. Decryption happens server-side."""
    result = await db.execute(
        select(Credential).where(Credential.user_id == user.id, Credential.portal == portal)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No credential for portal")
    return DecryptedCredential(
        portal=cred.portal, email=cred.email, password=decrypt_secret(cred.encrypted_password)
    )
