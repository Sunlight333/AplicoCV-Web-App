from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str | None] = mapped_column(String, nullable=True)
    plan: Mapped[str] = mapped_column(String, default="free")  # free | premium
    onboarded: Mapped[bool] = mapped_column(default=False)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    profile: Mapped[Profile | None] = relationship(back_populates="user", uselist=False)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)  # full structured profile
    version: Mapped[int] = mapped_column(default=1)

    user: Mapped[User] = relationship(back_populates="profile")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    filename: Mapped[str] = mapped_column(String)
    path: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String, default="cv")  # cv | tailored
    job_url: Mapped[str | None] = mapped_column(String, nullable=True)
    parsed: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    job_url: Mapped[str] = mapped_column(String)
    portal: Mapped[str] = mapped_column(String)
    job_title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="applied")
    cv_version_label: Mapped[str | None] = mapped_column(String, nullable=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    job_url: Mapped[str | None] = mapped_column(String, nullable=True)
    tone: Mapped[str] = mapped_column(String, default="professional")
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    portal: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String)
    encrypted_password: Mapped[str] = mapped_column(String)  # Fernet ciphertext
    sync_status: Mapped[str] = mapped_column(String, default="unverified")


class PortalConfig(Base):
    __tablename__ = "portal_configs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    domain_pattern: Mapped[str] = mapped_column(String)
    selectors: Mapped[dict] = mapped_column(JSON, default=dict)
    quirks: Mapped[str | None] = mapped_column(String, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    job_title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    portal: Mapped[str] = mapped_column(String)
    match_score: Mapped[int] = mapped_column(default=0)
    job_url: Mapped[str] = mapped_column(String)
    strategic_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Operation(Base):
    """Tracks async/long-running jobs the extension polls for (MV3 pattern)."""

    __tablename__ = "operations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending|completed|error
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
