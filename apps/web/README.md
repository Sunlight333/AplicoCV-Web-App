# AplicoCV — Web App (Phase 2)

React + Vite + TypeScript SPA. Profile creation, CV upload, dashboard, tracking, and settings.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

The app ships in **mock mode** (`VITE_USE_MOCKS=true` in `.env`) so the entire UI
is clickable without the Phase 3 backend. Sign in with any email/password.

To point at a real FastAPI backend, set in `.env`:

```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=/api          # proxied to localhost:8000 in dev (see vite.config.ts)
```

## Scripts

| Command            | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Vite dev server with HMR                 |
| `npm run build`    | Type-check (`tsc -b`) + production build |
| `npm run preview`  | Serve the production build locally       |
| `npm run typecheck`| Type-check only                          |

## Architecture

- **`src/lib/apiClient.ts`** — Fetch wrapper: attaches the bearer token, and on a
  `401` performs a single-flight `/auth/refresh` then retries the original request.
  The access token lives only in memory (`tokenStore`); the refresh token is an
  HttpOnly cookie. On app mount `AuthProvider` does a silent refresh to restore
  the session (see `ProtectedRoute`, which shows a loader during bootstrap so the
  login page never flashes).
- **`src/services/*`** — One module per domain. Each branches on `env.useMocks`:
  real `api.*` calls vs. the in-memory mock store (`src/services/mock`). Swapping
  to the backend means flipping one env var — no component changes.
- **`src/types`** — Domain models. In the full monorepo these move to
  `packages/types` and are shared with the Chrome extension.
- **CV parse progress** uses `fetch` streaming (not `EventSource`) so the access
  token can be sent via the `Authorization` header — see `services/documents.ts`.

## Pages

Landing · Login/Register · Onboarding (preferences → upload → review) ·
Dashboard · Profile · Applications (Kanban) · Credentials · Billing · Extension.
