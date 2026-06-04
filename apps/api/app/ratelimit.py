"""
Shared rate limiter (Phase 6 — abuse protection via slowapi).

A single Limiter instance keyed by client IP. Routes opt in with the
`@limiter.limit(...)` decorator (the decorated endpoint must take a
`request: Request` parameter). Registered on the app in `main.py`.

slowapi is declared in requirements.txt, but to preserve the project's
zero-setup boot it is imported defensively: if it is not installed the limiter
becomes a no-op (rate limiting inert) instead of crashing the app at import.
Install the full requirements to activate it.
"""

from __future__ import annotations

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
    RATELIMIT_ENABLED = True
except ImportError:  # pragma: no cover - exercised only without slowapi installed

    class _NoopLimiter:
        """Stand-in so `@limiter.limit(...)` decorators are harmless no-ops."""

        def limit(self, *_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

    limiter = _NoopLimiter()
    RATELIMIT_ENABLED = False
