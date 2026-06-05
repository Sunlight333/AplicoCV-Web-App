from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import base64
import hashlib

import bcrypt
from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.config import settings


# Derive a stable Fernet key. In production set FERNET_KEY; for dev we derive a
# deterministic key from the JWT secret so restarts can still decrypt.
def _fernet() -> Fernet:
    if settings.fernet_key:
        return Fernet(settings.fernet_key.encode())
    digest = hashlib.sha256(settings.jwt_secret.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


fernet = _fernet()


def _prep(password: str) -> bytes:
    # bcrypt only considers the first 72 bytes; truncate explicitly to avoid the
    # ValueError raised by newer bcrypt builds on longer inputs.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prep(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prep(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def encrypt_secret(plaintext: str) -> str:
    return fernet.encrypt(plaintext.encode()).decode()


def decrypt_secret(ciphertext: str) -> str:
    return fernet.decrypt(ciphertext.encode()).decode()


def _create_token(subject: str, token_type: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(user_id, "access", timedelta(minutes=settings.access_token_minutes))


def create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, "refresh", timedelta(days=settings.refresh_token_days))


def create_reset_token(user_id: str) -> str:
    """Short-lived token emailed for the forgot-password flow."""
    return _create_token(user_id, "reset", timedelta(minutes=30))


def decode_token(token: str, expected_type: str) -> str | None:
    """Return the subject (user id) if valid and of the expected type, else None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload.get("sub")
