from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment / .env.

    Everything has a safe default so the API runs locally with zero setup:
    SQLite database, a dev JWT secret, and stubbed external providers. Override
    in production via real environment variables.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Core
    app_name: str = "AplicoCV API"
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./aplicocv.db"

    # Auth
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30

    # Credential encryption (Fernet). Auto-generated for dev if unset.
    fernet_key: str = ""

    # LLM provider — "stub" (default, no keys), "openai", or "anthropic".
    llm_provider: str = "stub"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # External services (stubbed by default)
    stripe_secret_key: str = ""
    stripe_price_id: str = ""

    # CORS — the Vite dev server and any deployed frontend origin.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Uploads
    upload_dir: str = "./uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
