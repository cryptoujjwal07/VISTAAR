from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, description="Scientific question to answer from NPDC and polar archives")
    station_id: Optional[str] = Field(None, description="Filter by polar research base (maitri, bharati, himadri, himansh)")
    region: Optional[str] = Field(None, description="Filter by polar region (antarctica, arctic, himalayas, southern_ocean)")
    dataset_id: Optional[str] = Field(None, description="Filter by specific calibrated NPDC dataset ID")
    provider: Optional[str] = Field(None, description="Filter by telemetry provider (ncpor, imd, etc.)")
    start_date: Optional[str] = Field(None, description="Observation start date (ISO formatted)")
    end_date: Optional[str] = Field(None, description="Observation end date (ISO formatted)")
    document_id: Optional[str] = Field(None, description="Filter by specific ingested scientific PDF document")
    topic: Optional[str] = Field(None, description="Topic filter (meteorology, glaciology, oceanography, radiation)")
    content_type: Optional[str] = Field("ALL", description="Content filter (ALL, PDF_CHUNK, DATASET_RECORD, TABLE)")
    top_k: int = Field(5, ge=1, le=20, description="Maximum number of evidence citations to select")

class EvidenceItem(BaseModel):
    evidence_id: str
    source_type: str  # 'DOCUMENT_CHUNK', 'DOCUMENT_TABLE', 'DATASET_RECORD'
    relevance_score: float
    lexical_score: float
    semantic_score: float
    document_id: Optional[str] = None
    document_title: Optional[str] = None
    page_number: Optional[int] = None
    chunk_id: Optional[str] = None
    bounding_box: Optional[List[float]] = None
    dataset_id: Optional[str] = None
    station_id: Optional[str] = None
    timestamp: Optional[str] = None
    record_id: Optional[str] = None
    field: Optional[str] = None
    value: Optional[Any] = None
    unit: Optional[str] = None
    text_snippet: str
    heading_context: Optional[str] = None

class Citation(BaseModel):
    citation_index: int
    source_type: str
    label: str
    identifier: str
    location: str
    quote_or_value: str

class RAGResponse(BaseModel):
    query_id: str
    question: str
    status: str  # 'ANSWERED' | 'INSUFFICIENT_EVIDENCE'
    answer: str
    confidence_score: float
    evidence: List[EvidenceItem]
    citations: List[Citation]
    retrieval_trace: Dict[str, Any]
