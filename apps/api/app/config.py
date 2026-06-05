from functools import cached_property, lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# The dev fallback JWT secret. Used as the default so the app boots zero-config in
# development, but explicitly rejected when environment == "production" (see the
# model validator below) so a real deployment can never ship with it.
DEV_JWT_SECRET = "dev-secret-change-me-in-production"


class Settings(BaseSettings):
    """
    Application configuration loaded from environment / .env.

    Design goal: **every integration is "key-ready".** Each external service has
    a config slot here and a matching commented line in `.env.example`. Drop in
    the key and the feature activates automatically — no code change. With no
    keys set, the API runs fully on safe defaults (SQLite, stub LLM, auto Fernet
    key, billing auto-upgrade), so it boots with zero setup.

    See `.env.example` for the documented, copy-paste key registry.
    """

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    # ---- Core -------------------------------------------------------------
    app_name: str = "AplicoCV API"
    environment: str = "development"  # development | staging | production
    # SQLite by default; set to postgresql+asyncpg://… to use Postgres.
    database_url: str = "sqlite+aiosqlite:///./aplicocv.db"

    # ---- Auth (JWT) -------------------------------------------------------
    jwt_secret: str = DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30

    # ---- Credential encryption (Fernet) ----------------------------------
    # Leave empty in dev (a key is derived from jwt_secret). Set a real Fernet
    # key in production. Generate: python -c "from cryptography.fernet import
    # Fernet; print(Fernet.generate_key().decode())"
    fernet_key: str = ""

    # ---- LLM provider -----------------------------------------------------
    # "auto" (default) resolves to openai/anthropic if the matching key is set,
    # else "stub". Force a provider by setting it explicitly.
    llm_provider: str = "auto"  # auto | stub | openai | anthropic
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # ---- Billing (Stripe) -------------------------------------------------
    # Without a secret key, checkout auto-upgrades (stub) so the flow is testable.
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_price_id: str = ""
    stripe_webhook_secret: str = ""

    # ---- Google OAuth -----------------------------------------------------
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    # ---- Document storage (S3 / Cloudflare R2) ----------------------------
    # If unset, uploads go to the local filesystem (upload_dir). Set these to
    # offload to S3/R2 — endpoint_url lets the same fields target R2.
    storage_provider: str = "local"  # local | s3 | r2
    s3_bucket: str = ""
    s3_region: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_endpoint_url: str = ""  # set for Cloudflare R2

    # ---- Transactional email (Resend / SendGrid) --------------------------
    email_provider: str = "console"  # console | resend | sendgrid
    resend_api_key: str = ""
    sendgrid_api_key: str = ""
    email_from: str = "AplicoCV <no-reply@aplicocv.com>"

    # ---- Background tasks (Celery / Redis) --------------------------------
    # If REDIS_URL is set, the Beta AI Job Agent can run as a Celery Beat task;
    # otherwise scans run synchronously on demand via POST /agent/scan.
    redis_url: str = ""
    agent_scan_interval_hours: int = 6
    agent_match_threshold: int = 65

    # ---- Free trial -------------------------------------------------------
    # Every new account gets full Premium access for this many days from signup.
    trial_days: int = 7

    # ---- Error monitoring (Sentry) ----------------------------------------
    sentry_dsn: str = ""

    @property
    def celery_enabled(self) -> bool:
        return bool(self.redis_url)

    # ---- Frontend / CORS / uploads ----------------------------------------
    # Where the web app is served. Used for OAuth and billing redirects back to
    # the SPA. In production set FRONTEND_URL=https://aplicocv.com.
    frontend_url: str = "http://localhost:5173"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aplicocv.com",
        "https://www.aplicocv.com",
    ]
    upload_dir: str = "./uploads"

    # ---- Derived helpers --------------------------------------------------
    @cached_property
    def resolved_llm_provider(self) -> str:
        """The effective LLM provider after auto-resolution from available keys."""
        if self.llm_provider != "auto":
            return self.llm_provider
        if self.openai_api_key:
            return "openai"
        if self.anthropic_api_key:
            return "anthropic"
        return "stub"

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def storage_enabled(self) -> bool:
        # Require the bucket AND credentials so a half-configured S3/R2 block
        # (provider+bucket set, keys still blank) safely falls back to local
        # storage instead of failing every upload.
        return (
            self.storage_provider in ("s3", "r2")
            and bool(self.s3_bucket)
            and bool(self.s3_access_key_id)
            and bool(self.s3_secret_access_key)
        )

    @property
    def email_enabled(self) -> bool:
        return (self.email_provider == "resend" and bool(self.resend_api_key)) or (
            self.email_provider == "sendgrid" and bool(self.sendgrid_api_key)
        )

    # ---- Startup validation ----------------------------------------------
    @model_validator(mode="after")
    def _validate_production(self) -> "Settings":
        """
        Fail fast on insecure production configuration. In development everything
        defaults to safe stubs and the app boots with zero setup; in production
        the server refuses to start if security-critical secrets are missing or
        left at their dev defaults (Phase 1 requirement).
        """
        if self.environment != "production":
            return self

        problems: list[str] = []
        if not self.jwt_secret or self.jwt_secret == DEV_JWT_SECRET:
            problems.append(
                "JWT_SECRET must be set to a strong unique value (the dev default "
                "is not allowed in production)."
            )
        if not self.fernet_key:
            # Without an explicit Fernet key, the credential-encryption key is
            # derived from JWT_SECRET — so a default/shared secret would make all
            # stored credentials decryptable. Require an explicit key in prod.
            problems.append(
                "FERNET_KEY must be set in production (generate with "
                "`python -c \"from cryptography.fernet import Fernet; "
                "print(Fernet.generate_key().decode())\"`)."
            )
        if problems:
            raise ValueError(
                "Invalid production configuration:\n  - " + "\n  - ".join(problems)
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
