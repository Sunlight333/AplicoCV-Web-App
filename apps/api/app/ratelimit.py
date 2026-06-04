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

import inspect

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    class _SignaturePreservingLimiter(Limiter):
        """Limiter whose ``@limit`` decorator preserves the endpoint signature.

        slowapi's wrapper rebuilds the call signature without the original
        type annotations, so FastAPI no longer recognises a ``body`` Pydantic
        param (or special params like ``BackgroundTasks``) and mis-binds them
        as query params — a 422 on every rate-limited body endpoint
        (register/login/refresh). Re-stamping ``__signature__`` from the
        original function forces FastAPI to introspect the real parameters,
        while slowapi still receives ``request`` at call time.

        This only matters when slowapi is installed (production). Without it,
        the no-op limiter below leaves the function untouched.
        """

        def limit(self, *args, **kwargs):
            inner = super().limit(*args, **kwargs)

            def decorator(func):
                wrapped = inner(func)
                # Resolve annotations against the ORIGINAL function's globals
                # (``eval_str=True``). slowapi's wrapper carries slowapi's own
                # __globals__, so without this FastAPI evaluates the stringized
                # ``body: RegisterInput`` annotation in the wrong namespace,
                # fails to find it, and mis-binds the body as a query param.
                try:
                    wrapped.__signature__ = inspect.signature(func, eval_str=True)
                except (TypeError, ValueError, NameError):  # pragma: no cover
                    try:
                        wrapped.__signature__ = inspect.signature(func)
                    except (TypeError, ValueError):
                        pass
                return wrapped

            return decorator

    limiter = _SignaturePreservingLimiter(key_func=get_remote_address)
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
