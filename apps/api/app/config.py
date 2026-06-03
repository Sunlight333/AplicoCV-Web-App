from functools import cached_property, lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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
    jwt_secret: str = "dev-secret-change-me-in-production"
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

    # ---- Error monitoring (Sentry) ----------------------------------------
    sentry_dsn: str = ""

    # ---- CORS / uploads ---------------------------------------------------
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
        return self.storage_provider in ("s3", "r2") and bool(self.s3_bucket)

    @property
    def email_enabled(self) -> bool:
        return (self.email_provider == "resend" and bool(self.resend_api_key)) or (
            self.email_provider == "sendgrid" and bool(self.sendgrid_api_key)
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
