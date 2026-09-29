import time
from fastapi import APIRouter, HTTPException, status
from apps.api.core.database import get_database, db_manager
from apps.api.core.config import settings
from apps.api.core.storage import storage_service

router = APIRouter(tags=["Health & Observability"])

@router.get("/health")
async def liveness_check():
    """Liveness probe indicating API service is running"""
    return {
        "status": "healthy",
        "service": "vistaar-api",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }

@router.get("/health/ready")
async def readiness_check():
    """Readiness probe checking database connectivity, latency, and subsystem health"""
    start_time = time.time()
    db_status = "unhealthy"
    db_latency_ms = None
    
    try:
        db = get_database()
        if db_manager.client:
            # Issue a quick ping command to MongoDB Atlas
            await db_manager.client.admin.command('ping')
            db_latency_ms = round((time.time() - start_time) * 1000, 2)
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    storage_ok = storage_service.base_dir.exists()
    
    is_ready = (db_status == "connected") and storage_ok
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    response_payload = {
        "status": "ready" if is_ready else "not_ready",
        "checks": {
            "database": {
                "status": db_status,
                "latency_ms": db_latency_ms,
                "database_name": settings.MONGODB_DB_NAME
            },
            "storage": {
                "status": "available" if storage_ok else "unavailable",
                "path": str(storage_service.base_dir)
            },
            "queue": {
                "mode": "in_memory" if settings.USE_IN_MEMORY_QUEUE else "redis",
                "status": "active"
            }
        },
        "timestamp": time.time()
    }

    if not is_ready:
        raise HTTPException(status_code=status_code, detail=response_payload)
        
    return response_payload
