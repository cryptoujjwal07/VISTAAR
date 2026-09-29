import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apps.api.core.config import settings
from apps.api.core.database import connect_to_mongo, close_mongo_connection
from apps.api.core.queue import job_queue
from apps.api.core.logging import get_logger

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

# Request ID & Structured Logging Middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
    request.state.request_id = req_id
    start_time = time.time()
    
    try:
        response: Response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-MS"] = str(duration_ms)
        
        # Suppress routine health check log spam
        if request.url.path not in ["/health", "/health/ready"]:
            logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
        return response
    except Exception as e:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error occurred.",
                "request_id": req_id
            },
            headers={"X-Request-ID": req_id}
        )

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
