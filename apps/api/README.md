# AplicoCV — Backend API (Phase 3)

Async **FastAPI** backend with **SQLAlchemy 2 (async) + SQLite**, JWT auth, Fernet
credential encryption, SSE CV-parse streaming, and a swappable LLM layer.

It runs with **zero configuration** — SQLite database, dev JWT secret, and a
**stubbed** LLM provider (no API keys needed). It seeds reference data and a demo
account on first boot.

## Quick start

```bash
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger): http://localhost:8000/docs
- Health: http://localhost:8000/api/health

The Vite dev server proxies `/api` → `localhost:8000`, so the frontend works
against this backend once `VITE_USE_MOCKS=false`.

## Demo account

| email | password |
| --- | --- |
| `demo@aplicocv.com` | `password123` |

Seeded as a **premium** user with a profile, applications, a credential, and a
recommendation.

## Going from stub → real

Everything is wired so enabling real providers is config-only:

| Concern | Stub default | Enable |
| --- | --- | --- |
| LLM | deterministic offline responses | set `LLM_PROVIDER=openai\|anthropic` + key, implement `_real_*` in `services/llm_service.py` |
| Billing | auto-upgrades on checkout | set `STRIPE_SECRET_KEY` |
| CV parsing | reads text; uses `pdfplumber`/`python-docx` if installed | `pip install pdfplumber python-docx` |
| DB | SQLite | set `DATABASE_URL` to Postgres (`postgresql+asyncpg://…`) |

## Endpoints (under `/api`)

auth (register/login/refresh/logout/me) · users · profiles (get/put/patch/skills/tailor/localize) ·
documents (upload + SSE parse) · applications (+stats) · ats/score · cover-letters/generate ·
credentials (+decrypt) · billing (checkout/portal/webhook) · portals/configs ·
recommendations · agent/scan · operations/{id}/result
