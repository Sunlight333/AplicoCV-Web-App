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


class AppLock(Base):
    """Cross-process lease so a periodic job (the monitoring sweep) runs in only
    one uvicorn worker even when several are started. New table — created on boot
    by create_all, so no migration is required."""

    __tablename__ = "app_locks"

    name: Mapped[str] = mapped_column(String, primary_key=True)
    locked_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


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


class AutofillEvent(Base):
    """Telemetry the extension reports after each autofill (Phase 2.5).

    Lets us derive *measured* time-saved from how many fields were actually filled
    instead of a flat per-application constant. Its own table, so create_all adds it
    cleanly without altering existing tables.
    """

    __tablename__ = "autofill_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    portal: Mapped[str | None] = mapped_column(String, nullable=True)
    job_url: Mapped[str | None] = mapped_column(String, nullable=True)
    fields_filled: Mapped[int] = mapped_column(default=0)
    seconds_per_field: Mapped[int] = mapped_column(default=25)  # avg manual typing time
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


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


class LlmUsage(Base):
    """Per-call LLM token accounting for cost attribution (Phase 3)."""

    __tablename__ = "llm_usage"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    task: Mapped[str | None] = mapped_column(String, nullable=True)
    prompt_tokens: Mapped[int] = mapped_column(default=0)
    completion_tokens: Mapped[int] = mapped_column(default=0)
    latency_ms: Mapped[int] = mapped_column(default=0)
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


class CreditAccount(Base):
    """Per-user credit balance + gamification state (separate table so it is
    created cleanly by create_all without altering the users table)."""

    __tablename__ = "credit_accounts"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    balance: Mapped[int] = mapped_column(default=0)
    streak: Mapped[int] = mapped_column(default=0)
    last_checkin: Mapped[str | None] = mapped_column(String, nullable=True)  # ISO date
    grants: Mapped[dict] = mapped_column(JSON, default=dict)  # one-time earn keys claimed


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column()  # positive = earned, negative = spent
    reason: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class FaqAnswer(Base):
    """Reusable answers to common application questions (feeds extension autofill)."""

    __tablename__ = "faq_answers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class InterviewSession(Base):
    """A mock-interview run: generated questions, the user's answers, and AI feedback."""

    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String, default="mixed")
    questions: Mapped[list] = mapped_column(JSON, default=list)
    answers: Mapped[list | None] = mapped_column(JSON, nullable=True)
    feedback: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    overall_score: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ApplyTask(Base):
    """Assisted-apply queue (Phase 1.3 / Phase 4.4 ALPHA agent).

    A user confirms 'apply' on a recommendation; the backend prepares a tailored CV
    and cover letter and queues the task. The extension picks up 'prepared' tasks,
    autofills the posting, and reports back, flipping status to 'submitted'.
    Statuses: queued | prepared | submitted | dismissed | error.
    """

    __tablename__ = "apply_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    recommendation_id: Mapped[str | None] = mapped_column(String, nullable=True)
    job_url: Mapped[str] = mapped_column(String)
    portal: Mapped[str] = mapped_column(String)
    job_title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="queued")
    cv_version_label: Mapped[str | None] = mapped_column(String, nullable=True)
    tailored_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_score: Mapped[int | None] = mapped_column(nullable=True)
    autonomous: Mapped[bool] = mapped_column(default=False)  # queued by ALPHA agent
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Referral(Base):
    """One row per redeemed referral code — a user can only be referred once."""

    __tablename__ = "referrals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    referrer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    referred_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
