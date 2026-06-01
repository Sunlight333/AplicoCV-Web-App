import os
import sys

import pytest
import pytest_asyncio

# Ensure the app package and bundled libs are importable.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, ".libs"))

# Use an isolated on-disk test DB (shared across the app's async sessions) and
# stub LLM so tests are deterministic and offline. Set before importing app.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_aplicocv.db"
os.environ["LLM_PROVIDER"] = "stub"

from asgi_lifespan import LifespanManager  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest_asyncio.fixture
async def client():
    # Start a fresh DB for the test session.
    if os.path.exists("test_aplicocv.db"):
        os.remove("test_aplicocv.db")
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c
    if os.path.exists("test_aplicocv.db"):
        os.remove("test_aplicocv.db")


@pytest_asyncio.fixture
async def auth_client(client):
    """A client pre-authenticated as a freshly registered user."""
    res = await client.post(
        "/api/auth/register",
        json={"fullName": "Test User", "email": "test@example.com", "password": "password123"},
    )
    assert res.status_code == 200, res.text
    token = res.json()["accessToken"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
