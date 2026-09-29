from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user_optional, require_roles
from apps.api.domains.rag.models import RAGQueryRequest, RAGResponse
from apps.api.domains.rag.service import execute_rag_pipeline

router = APIRouter(prefix="/rag", tags=["Scientific Knowledge & RAG Engine"])

@router.post("/query", response_model=RAGResponse)
async def query_knowledge_engine(
    req: RAGQueryRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Production scientific RAG knowledge engine query (Prompt 10).
    Pipeline: question -> normalization -> metadata filters -> keyword retrieval -> semantic retrieval -> hybrid ranking -> evidence selection -> structured answer -> citations.
    """
    user_email = current_user.get("email") if current_user else None
    return await execute_rag_pipeline(req, current_user_email=user_email)

@router.get("/traces")
async def list_retrieval_traces(
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[str] = Query(None, alias="status")
):
    """
    Retrieve historical scientific RAG retrieval traces for provenance and audit inspection (Prompt 10).
    """
    db = get_database()
    query = {}
    if status_filter:
        query["status"] = status_filter.upper()

    cursor = db.rag_traces.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.rag_traces.count_documents(query)
    return {"total": total, "items": items}

@router.get("/traces/{query_id}")
async def get_retrieval_trace(query_id: str):
    """
    Get full deterministic retrieval trace with evidence citations for a specific RAG query.
    """
    db = get_database()
    trace = await db.rag_traces.find_one({"query_id": query_id}, {"_id": 0})
    if not trace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RAG query trace not found")
    return trace
