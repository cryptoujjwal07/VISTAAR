import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apps.api.core.config import settings
from apps.api.core.database import connect_to_mongo, close_mongo_connection
from apps.api.core.queue import job_queue
from apps.api.core.logging import (
    clear_log_context,
    get_logger,
    redact_sensitive_text,
    set_log_context,
)

# Import domain routers
from apps.api.domains.health.router import router as health_router
from apps.api.domains.auth.router import router as auth_router
from apps.api.domains.datasets.router import router as datasets_router
from apps.api.domains.weather.router import router as weather_router
from apps.api.domains.documents.router import router as documents_router
from apps.api.domains.claims.router import router as claims_router
from apps.api.domains.ai.router import router as ai_router
from apps.api.domains.publications.router import router as publications_router
from apps.api.domains.classroom.router import router as classroom_router
from apps.api.domains.media.router import router as media_router
from apps.api.domains.search.router import router as search_router
from apps.api.domains.audit.router import router as audit_router
from apps.api.domains.localization.router import router as localization_router
from apps.api.domains.rag.router import router as rag_router

logger = get_logger("vistaar.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing VISTAAR API Backend services...")
    await connect_to_mongo()
    await job_queue.start()
    logger.info("VISTAAR API Backend initialized and ready for production traffic.")
    yield
    # Shutdown sequence
    logger.info("Shutting down VISTAAR API Backend services...")
    await job_queue.stop()
    await close_mongo_connection()
    logger.info("VISTAAR API Backend shutdown complete.")

app = FastAPI(
    title="VISTAAR API — Integrated Polar Science Knowledge Engine",
    description="Official NCPOR / MoES Polar Science Outreach, Knowledge Repository and Media Dissemination API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from apps.api.core.performance import idempotency_store, performance_profiler


def _extract_resource_id_from_path(path: str) -> str | None:
    """Extract resource_id from common REST path patterns for structured log correlation (Prompt 28)."""
    parts = [p for p in path.strip("/").split("/") if p]
    resource_collections = {"datasets", "documents", "publications", "claims", "media", "lessons", "jobs"}
    for idx, seg in enumerate(parts[:-1]):
        if seg in resource_collections:
            candidate = parts[idx + 1]
            if candidate not in {"upload", "search", "verify", "generate", "translate", "stream", "export"}:
                return candidate
    return None


@app.exception_handler(Exception)
async def production_safe_exception_handler(request: Request, exc: Exception):
    """
    Production-safe global exception handler (Prompt 28).
    Never exposes stack traces, internal file paths, or sensitive credentials publicly.
    """
    req_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {redact_sensitive_text(str(exc))}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error occurred.",
            "detail": "An unexpected internal error occurred. Please reference request_id for support.",
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )


# Request ID, Log Context Correlation, Idempotency, Performance Profiling & Security Headers Middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
    idem_key = request.headers.get("Idempotency-Key")
    resource_id = _extract_resource_id_from_path(request.url.path)
    request.state.request_id = req_id
    request.state.idempotency_key = idem_key
    clear_log_context()
    set_log_context(request_id=req_id, resource_id=resource_id)
    start_time = time.perf_counter()

    def _apply_security_headers(resp: Response, duration_ms: float) -> Response:
        resp.headers["X-Request-ID"] = req_id
        resp.headers["X-Response-Time-MS"] = str(duration_ms)
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["X-XSS-Protection"] = "1; mode=block"
        resp.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        resp.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resp.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return resp

    if idem_key and request.method in ("POST", "PATCH", "PUT"):
        scoped_key = f"{request.method}:{request.url.path}:{idem_key}"
        cached_idem = idempotency_store.get(scoped_key)
        if cached_idem is not None:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            performance_profiler.record_route(request.method, request.url.path, cached_idem["status_code"], duration_ms)
            replay_resp = JSONResponse(
                status_code=cached_idem["status_code"],
                content=cached_idem["body"],
                headers={"X-Idempotent-Replay": "true", "X-Cache": "HIT"},
            )
            clear_log_context()
            return _apply_security_headers(replay_resp, duration_ms)

    try:
        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        performance_profiler.record_route(request.method, request.url.path, response.status_code, duration_ms)

        if (
            idem_key
            and request.method in ("POST", "PATCH", "PUT")
            and response.status_code in (200, 201, 202)
            and "application/json" in response.headers.get("content-type", "")
        ):
            import json as _json
            body_chunks = [chunk async for chunk in response.body_iterator]
            raw_bytes = b"".join(body_chunks)
            try:
                parsed_json = _json.loads(raw_bytes.decode("utf-8"))
                scoped_key = f"{request.method}:{request.url.path}:{idem_key}"
                idempotency_store.set(scoped_key, response.status_code, parsed_json)
            except Exception:
                pass
            response = Response(
                content=raw_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
            response.headers["X-Idempotent-Replay"] = "false"

        _apply_security_headers(response, duration_ms)

        # Suppress routine health check log spam
        if request.url.path not in ["/health", "/health/ready"]:
            logger.info(
                f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
                extra={"request_id": req_id, "resource_id": resource_id},
            )
        return response
    except Exception as e:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        performance_profiler.record_route(request.method, request.url.path, 500, duration_ms)
        logger.error(f"Unhandled error on {request.method} {request.url.path}: {redact_sensitive_text(str(e))}")
        err_resp = JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error occurred.",
                "detail": "An unexpected internal error occurred. Please reference request_id for support.",
                "request_id": req_id,
            },
            headers={"X-Request-ID": req_id},
        )
        return _apply_security_headers(err_resp, duration_ms)
    finally:
        clear_log_context()

# Direct root health endpoints (Prompt 01 requirement)
app.include_router(health_router, prefix="")
app.include_router(health_router, prefix="/api/v1")

# Domain routers mounted under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(datasets_router, prefix="/api/v1")
app.include_router(weather_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(claims_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(publications_router, prefix="/api/v1")
app.include_router(classroom_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(localization_router, prefix="/api/v1")
app.include_router(rag_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
