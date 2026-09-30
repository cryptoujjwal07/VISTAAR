"use client";

import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Upload,
  Layers,
  Table as TableIcon,
  Search,
  Sparkles,
  ExternalLink,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Hash,
  Eye,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  ShieldAlert,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function DocumentIntelligencePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [documentDetail, setDocumentDetail] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [chunks, setChunks] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chunks" | "tables" | "metadata">("chunks");
  const [chunkFilter, setChunkFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadStation, setUploadStation] = useState("himansh");
  const [uploadExpedition, setUploadExpedition] = useState("");
  const [uploadSync, setUploadSync] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Scientist Media Workspace State (Sections 20 & 21)
  const [mediaPanelOpen, setMediaPanelOpen] = useState(false);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaStation, setMediaStation] = useState("maitri");
  const [mediaExpedition, setMediaExpedition] = useState("isea-43");
  const [mediaType, setMediaType] = useState("IMAGE");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaTags, setMediaTags] = useState("glaciology, telemetry, aws");
  const [mediaClassification, setMediaClassification] = useState("OBSERVATIONAL_EVIDENCE");
  const [mediaSubmitting, setMediaSubmitting] = useState(false);

  async function handleScientistMediaUpload(e: React.FormEvent) {
    e.preventDefault();
    setMediaSubmitting(true);
    try {
      const res = await fetchApi("/media/upload", {
        method: "POST",
        body: JSON.stringify({
          title: mediaTitle,
          filename: `${mediaStation}_observation.jpg`,
          station_id: mediaStation,
          expedition_id: mediaExpedition,
          media_type: mediaType,
          caption: mediaCaption,
          tags: mediaTags.split(",").map((t) => t.trim()).filter(Boolean),
          scientific_classification: mediaClassification,
        }),
      });
      setActionMessage(
        `Scientific media '${res.title}' (${res.asset_id}) submitted with status ${res.moderation_state} via ${res.storage_provider} provider (SHA-256: ${res.sha256?.slice(0, 12)}...).`
      );
      setMediaTitle("");
      setMediaCaption("");
      setMediaPanelOpen(false);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to submit scientific media.");
    } finally {
      setMediaSubmitting(false);
    }
  }

  // Prompt 10 RAG Knowledge Engine State
  const [ragQuestion, setRagQuestion] = useState("What was the minimum temperature and atmospheric pressure recorded at Maitri Station in July?");
  const [ragContentType, setRagContentType] = useState("ALL");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);
  const [showRagTrace, setShowRagTrace] = useState(false);

  // Fetch document list
  async function loadDocuments() {
    try {
      setLoading(true);
      let query = "/documents?limit=50";
      if (stationFilter) query += `&station_id=${stationFilter}`;
      if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetchApi(query);
      const docs = res.items || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].document_id);
      }
    } catch (e: any) {
      console.error("Failed to load documents", e);
    } finally {
      setLoading(false);
    }
  }

  // Fetch single document details, chunks, and tables
  async function loadDocumentDetails(docId: string) {
    try {
      const [detailRes, chunksRes, tablesRes] = await Promise.all([
        fetchApi(`/documents/${docId}`),
        fetchApi(`/documents/${docId}/chunks?page_number=${selectedPage}&include_embeddings=false&limit=100`),
        fetchApi(`/documents/${docId}/tables`)
      ]);
      setDocumentDetail(detailRes);
      setChunks(chunksRes.chunks || []);
      setTables(tablesRes.tables || []);
      if (chunksRes.chunks && chunksRes.chunks.length > 0) {
        setSelectedChunkId(chunksRes.chunks[0].chunk_id);
      }
    } catch (e: any) {
      console.error("Failed to load document details", e);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [stationFilter]);

  useEffect(() => {
    if (selectedDocId) {
      loadDocumentDetails(selectedDocId);
    }
  }, [selectedDocId, selectedPage]);

  // Handle PDF upload
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setActionMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadTitle) formData.append("title", uploadTitle);
      if (uploadStation) formData.append("station_id", uploadStation);
      if (uploadExpedition) formData.append("expedition", uploadExpedition);
      formData.append("run_synchronously", String(uploadSync));

      const res = await fetchApi("/documents/upload", {
        method: "POST",
        body: formData
      });

      setActionMessage(`Document "${res.title}" successfully ingested into PyMuPDF intelligence pipeline.`);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      await loadDocuments();
      setSelectedDocId(res.document_id);
      setSelectedPage(1);
    } catch (err: any) {
      setActionMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle reprocess
  async function handleReprocess() {
    if (!selectedDocId) return;
    try {
      await fetchApi(`/documents/${selectedDocId}/reprocess`, { method: "POST" });
      setActionMessage("Reprocessing pipeline triggered in background.");
      setTimeout(() => loadDocumentDetails(selectedDocId), 1500);
    } catch (e: any) {
      setActionMessage(`Reprocess error: ${e.message}`);
    }
  }

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  }

  async function handleExecuteRag(customQuestion?: string) {
    const q = customQuestion || ragQuestion;
    if (!q.trim()) return;
    if (customQuestion) setRagQuestion(customQuestion);
    setRagLoading(true);
    try {
      const res = await fetchApi("/rag/query", {
        method: "POST",
        body: JSON.stringify({
          question: q,
          station_id: stationFilter || undefined,
          content_type: ragContentType,
          top_k: 4
        })
      });
      setRagResult(res);
      if (res.evidence && res.evidence.length > 0) {
        const firstEv = res.evidence[0];
        if (firstEv.document_id && firstEv.page_number) {
          setSelectedDocId(firstEv.document_id);
          setSelectedPage(firstEv.page_number);
          if (firstEv.chunk_id) {
            setSelectedChunkId(firstEv.chunk_id);
          }
        }
      }
    } catch (e: any) {
      setActionMessage(`RAG Query Error: ${e.message}`);
    } finally {
      setRagLoading(false);
    }
  }

  function jumpToEvidenceChunk(ev: any) {
    if (ev.document_id) {
      setSelectedDocId(ev.document_id);
      if (ev.page_number) setSelectedPage(ev.page_number);
      if (ev.chunk_id) setSelectedChunkId(ev.chunk_id);
      setActiveTab("chunks");
    }
  }

  // Active page metadata
  const currentPageInfo = documentDetail?.pages?.find((p: any) => p.page_number === selectedPage) || {
    width: 595,
    height: 842,
    char_count: 0,
    word_count: 0
  };

  const filteredChunks = chunks.filter((c: any) => {
    if (chunkFilter === "ALL") return true;
    if (chunkFilter === "PARAGRAPH") return c.layout_type === "paragraph";
    if (chunkFilter === "HEADING") return c.layout_type === "heading";
    if (chunkFilter === "TABLE") return c.is_table;
    if (chunkFilter === "HEADER_FOOTER") return c.layout_type === "header" || c.layout_type === "footer";
    return true;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Studio Header */}
      <div className="border-b border-vistaar-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-vistaar-scientific font-bold">
              PyMuPDF Document Intelligence & RAG Studio
            </span>
            <span className="text-vistaar-border">•</span>
            <Badge variant="scientific">Prompt 09 & 10 Engine</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              768-dim Embeddings + Hybrid BM25
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-vistaar-text mt-1">
            Scientific PDF Layout, Table & RAG Knowledge Engine
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMediaPanelOpen(!mediaPanelOpen)}
            className="flex items-center space-x-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{mediaPanelOpen ? "Close Media Form" : "Upload Field Media Evidence"}</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Scientific PDF</span>
          </Button>
        </div>
      </div>

      {/* Scientist Media Workspace Form Panel (Sections 20 & 21) */}
      {mediaPanelOpen && (
        <Card className="border-emerald-300 shadow-sm bg-emerald-50/40">
          <CardHeader className="p-4 pb-2 border-b border-emerald-200">
            <CardTitle className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Scientist Field Media Workspace (Section 21: Submit for Review)</span>
            </CardTitle>
            <CardDescription className="text-xs text-emerald-800">
              Upload expedition photographs, videos, or observational evidence. Ingests via Cloudinary / Local Object Storage with SHA-256 fingerprinting. Submitted as <code>SUBMITTED_FOR_REVIEW</code> for Outreach Editor moderation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleScientistMediaUpload} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-vistaar-text block mb-1">Observation Title</label>
                <input
                  type="text"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="AWS Ultrasonic Anemometer Rime Ice Inspection"
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-vistaar-text block mb-1">Polar Station</label>
                <select
                  value={mediaStation}
                  onChange={(e) => setMediaStation(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-white text-xs font-semibold"
                >
                  <option value="maitri">Maitri (Schirmacher Oasis)</option>
                  <option value="bharati">Bharati (Larsemann Hills)</option>
                  <option value="himadri">Himadri (Ny-Ålesund, Arctic)</option>
                  <option value="himansh">Himansh (Chandra Basin, Himalayas)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-vistaar-text block mb-1">Media Type</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-white text-xs"
                >
                  <option value="IMAGE">Photograph / Satellite Image</option>
                  <option value="VIDEO">Field Log Video</option>
                  <option value="FIGURE">Scientific Instrument Figure</option>
                  <option value="DOCUMENT">Field Observation Log</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-vistaar-text block mb-1">Verified Scientific Caption</label>
                <input
                  type="text"
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="Documenting super-cooled fog and rime accretion on the 10m Campbell AWS tower."
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-white text-xs"
                  required
                  minLength={5}
                />
              </div>

              <div>
                <label className="font-bold text-vistaar-text block mb-1">Expedition Reference</label>
                <input
                  type="text"
                  value={mediaExpedition}
                  onChange={(e) => setMediaExpedition(e.target.value)}
                  placeholder="isea-43"
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-white text-xs font-mono"
                />
              </div>

              <div className="md:col-span-3 flex justify-end space-x-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMediaPanelOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={mediaSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {mediaSubmitting ? "Uploading & Fingerprinting..." : "Submit to Outreach Review"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-vistaar-primary flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Prompt 10: Hybrid RAG Scientific Knowledge Engine */}
      <Card className="border-vistaar-primary/30 shadow-sm bg-white">
        <CardHeader className="p-4 pb-3 border-b border-vistaar-border bg-vistaar-bg/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-vistaar-primary" />
            <CardTitle className="text-sm font-bold">
              Hybrid Scientific Knowledge & RAG Engine (Prompt 10)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              Zero-Hallucination Guardrail Active
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-vistaar-muted font-semibold uppercase mr-1">Quick Queries:</span>
            <button
              onClick={() => handleExecuteRag("What was the minimum temperature and atmospheric pressure recorded at Maitri Station in July?")}
              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-vistaar-primary border border-blue-200 font-medium transition"
            >
              Maitri July Temp & Pressure
            </button>
            <button
              onClick={() => handleExecuteRag("What are the benchmark glacier mass balances and SWE measured in Chandra Basin at Himansh?")}
              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-vistaar-primary border border-blue-200 font-medium transition"
            >
              Himansh Glacier Mass Balance
            </button>
            <button
              onClick={() => handleExecuteRag("What is the winter ice thickness and dissolved oxygen in Lake Priyadarshini?")}
              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-vistaar-primary border border-blue-200 font-medium transition"
            >
              Lake Priyadarshini Limnology
            </button>
            <button
              onClick={() => handleExecuteRag("What is the population of cybernetic radioactive dolphins on the moons of Jupiter?")}
              className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition"
            >
              Test Insufficient Evidence Guardrail
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-vistaar-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={ragQuestion}
                onChange={(e) => setRagQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteRag()}
                placeholder="Ask a scientific question across NPDC telemetry and ingested polar PDFs..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-vistaar-border rounded-md bg-white text-vistaar-text focus:outline-none focus:ring-1 focus:ring-vistaar-primary"
              />
            </div>
            <select
              value={ragContentType}
              onChange={(e) => setRagContentType(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-vistaar-border rounded-md bg-white text-vistaar-text"
            >
              <option value="ALL">All Sources (PDF + NPDC)</option>
              <option value="PDF_CHUNK">PDF Chunks Only</option>
              <option value="TABLE">Extracted Tables Only</option>
              <option value="DATASET_RECORD">NPDC Telemetry Only</option>
            </select>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleExecuteRag()}
              disabled={ragLoading}
              className="flex items-center space-x-1.5 px-4"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{ragLoading ? "Retrieving Evidence..." : "Execute Hybrid RAG"}</span>
            </Button>
          </div>

          {/* RAG Answer & Citations Panel */}
          {ragResult && (
            <div className="p-4 rounded-lg border border-vistaar-border bg-vistaar-bg/30 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vistaar-border pb-2.5">
                <div className="flex items-center space-x-2">
                  <Badge variant={ragResult.status === "ANSWERED" ? "success" : "warning"}>
                    {ragResult.status}
                  </Badge>
                  <span className="font-mono text-[11px] text-vistaar-muted">
                    Confidence: <strong className="text-vistaar-text">{(ragResult.confidence_score * 100).toFixed(1)}%</strong>
                  </span>
                  <span className="text-vistaar-border">•</span>
                  <span className="font-mono text-[11px] text-vistaar-muted">
                    Latency: <strong className="text-vistaar-text">{ragResult.retrieval_trace?.execution_time_ms} ms</strong>
                  </span>
                  <span className="text-vistaar-border">•</span>
                  <span className="font-mono text-[11px] text-vistaar-muted">
                    Evaluated: <strong className="text-vistaar-text">{ragResult.retrieval_trace?.candidates_evaluated} candidates</strong>
                  </span>
                </div>
                <button
                  onClick={() => setShowRagTrace(!showRagTrace)}
                  className="text-[11px] font-mono text-vistaar-primary hover:underline"
                >
                  {showRagTrace ? "Hide Retrieval Trace" : "Inspect Retrieval Trace"}
                </button>
              </div>

              <div className="p-3.5 bg-white rounded border border-vistaar-border text-vistaar-text leading-relaxed whitespace-pre-line font-sans">
                {ragResult.answer}
              </div>

              {/* Citations & Evidence Cards */}
              {ragResult.evidence && ragResult.evidence.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-vistaar-muted block">
                    Primary Evidence Citations (Click any PDF citation to highlight its bounding box on the canvas below):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {ragResult.evidence.map((ev: any, idx: number) => (
                      <div
                        key={ev.evidence_id}
                        onClick={() => jumpToEvidenceChunk(ev)}
                        className="p-2.5 rounded border border-vistaar-border bg-white hover:border-vistaar-primary cursor-pointer transition flex flex-col justify-between space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 bg-vistaar-primary text-white font-mono font-bold text-[10px] rounded">
                              [{idx + 1}]
                            </span>
                            <Badge variant="scientific" className="text-[9px]">
                              {ev.source_type}
                            </Badge>
                            <span className="font-mono font-bold text-vistaar-primary text-[11px]">
                              {ev.chunk_id || ev.record_id}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                            Score: {(ev.relevance_score * 100).toFixed(1)}% (Lex: {ev.lexical_score}, Sem: {ev.semantic_score})
                          </span>
                        </div>

                        <p className="text-[11px] text-vistaar-text line-clamp-2 font-sans">
                          {ev.text_snippet}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-vistaar-muted font-mono pt-1 border-t border-vistaar-border/50">
                          <span>
                            {ev.document_title
                              ? `${ev.document_title} (Page ${ev.page_number})`
                              : `Dataset: ${ev.dataset_id} (${ev.station_id?.toUpperCase()})`}
                          </span>
                          {ev.bounding_box && (
                            <span className="text-vistaar-primary font-sans font-semibold">
                              Jump to BBox →
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showRagTrace && (
                <div className="p-3 bg-[#FAF7F0] text-[#17202A] border border-[#E7E0D5] rounded font-mono text-[10px] overflow-x-auto">
                  <div className="text-[#15803D] font-bold mb-1">
                    // Deterministic Retrieval Trace & Prompt Injection XML Data Encapsulation Proof
                  </div>
                  <pre>{JSON.stringify(ragResult.retrieval_trace, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter and Document Selection Bar */}
      <div className="p-3 bg-white border border-vistaar-border rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-vistaar-muted uppercase text-[11px]">Station:</span>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-vistaar-border rounded-md text-xs font-semibold text-vistaar-text"
          >
            <option value="">All Stations (Global)</option>
            <option value="himansh">Himansh (Western Himalayas)</option>
            <option value="bharati">Bharati (Larsemann Hills)</option>
            <option value="maitri">Maitri (Schirmacher Oasis)</option>
            <option value="himadri">Himadri (Svalbard, Arctic)</option>
          </select>

          <span className="font-semibold text-vistaar-muted uppercase text-[11px] ml-2">Select Document:</span>
          <select
            value={selectedDocId || ""}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setSelectedPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-vistaar-border rounded-md text-xs font-bold text-vistaar-primary max-w-md truncate"
          >
            {documents.map((d: any) => (
              <option key={d.document_id} value={d.document_id}>
                {d.title} ({d.page_count} pages • {d.station_id?.toUpperCase() || "POLAR"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {documentDetail && (
            <>
              <Badge variant="scientific" className="text-[10px] font-mono">
                {documentDetail.page_count} Pages
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {documentDetail.chunk_count || chunks.length} Chunks
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {tables.length} Tables Detected
              </Badge>
              <a
                href={`http://localhost:8000/api/v1/documents/${documentDetail.document_id}/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-vistaar-border bg-vistaar-bg/50 hover:bg-vistaar-bg text-vistaar-text text-[11px] font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-vistaar-primary" />
                <span>Original PDF</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Main Split Intelligence Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[750px]">
        {/* LEFT COLUMN: Live Page Canvas with Bounding Box Overlays (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="h-full flex flex-col overflow-hidden">
            {/* Page View Toolbar */}
            <CardHeader className="p-3 border-b border-vistaar-border bg-vistaar-bg/50 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selectedPage <= 1}
                  onClick={() => setSelectedPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono font-bold text-vistaar-text">
                  Page {selectedPage} of {documentDetail?.page_count || 1}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selectedPage >= (documentDetail?.page_count || 1)}
                  onClick={() => setSelectedPage((p) => Math.min(documentDetail?.page_count || 1, p + 1))}
                  className="h-7 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-vistaar-muted font-mono">
                  Dimensions: {currentPageInfo.width} × {currentPageInfo.height} pt
                </span>
                <div className="flex items-center space-x-1 border-l border-vistaar-border pl-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                    className="h-7 w-7 p-0"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[11px] font-mono font-semibold">{zoomLevel}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoomLevel((z) => Math.min(175, z + 15))}
                    className="h-7 w-7 p-0"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Interactive PDF Rendering Canvas with Bounding Boxes */}
            <CardContent className="p-4 flex-1 flex items-center justify-center bg-slate-100 overflow-auto">
              {documentDetail ? (
                <div
                  className="relative shadow-lg border border-slate-300 bg-white transition-all select-none"
                  style={{
                    width: `${(currentPageInfo.width * (zoomLevel / 100)).toFixed(0)}px`,
                    height: `${(currentPageInfo.height * (zoomLevel / 100)).toFixed(0)}px`,
                  }}
                >
                  {/* Rendered Page Image Stream */}
                  <img
                    src={`http://localhost:8000/api/v1/documents/${documentDetail.document_id}/pages/${selectedPage}/render?dpi=150`}
                    alt={`Page ${selectedPage} render`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Bounding Box Highlights Overlay */}
                  {chunks.map((chunk: any) => {
                    const isSelected = selectedChunkId === chunk.chunk_id;
                    const bbox = chunk.bounding_box;
                    if (!bbox || bbox.length !== 4) return null;

                    // Source coordinate mapping
                    const leftPct = (bbox[0] / currentPageInfo.width) * 100;
                    const topPct = (bbox[1] / currentPageInfo.height) * 100;
                    const widthPct = ((bbox[2] - bbox[0]) / currentPageInfo.width) * 100;
                    const heightPct = ((bbox[3] - bbox[1]) / currentPageInfo.height) * 100;

                    let borderColor = "border-blue-400/70 hover:border-blue-600 bg-blue-500/10";
                    if (chunk.is_table) {
                      borderColor = "border-emerald-500/80 hover:border-emerald-700 bg-emerald-500/15";
                    } else if (chunk.layout_type === "heading") {
                      borderColor = "border-indigo-500/80 hover:border-indigo-700 bg-indigo-500/15";
                    } else if (chunk.layout_type === "header" || chunk.layout_type === "footer") {
                      borderColor = "border-amber-400/60 hover:border-amber-600 bg-amber-500/10";
                    }

                    if (isSelected) {
                      borderColor = "border-2 border-red-600 bg-red-500/20 z-30 shadow-md";
                    }

                    return (
                      <div
                        key={chunk.chunk_id}
                        onClick={() => setSelectedChunkId(chunk.chunk_id)}
                        title={`${chunk.chunk_id} • ${chunk.heading_context || "Body"} • [${bbox.join(", ")}]`}
                        className={`absolute border rounded-sm cursor-pointer transition-all duration-150 ${borderColor}`}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                        }}
                      >
                        {isSelected && (
                          <span className="absolute -top-4 left-0 bg-red-600 text-white font-mono text-[9px] px-1 rounded shadow-sm">
                            {chunk.chunk_id}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-24 text-center text-xs text-vistaar-muted">
                  Select a scientific PDF document to inspect its layout coordinates.
                </div>
              )}
            </CardContent>

            {/* Canvas Legend */}
            <div className="p-2.5 bg-vistaar-bg/40 border-t border-vistaar-border flex flex-wrap items-center justify-between text-[11px] text-vistaar-muted px-4 font-mono">
              <div className="flex items-center space-x-3">
                <span className="font-sans font-bold">Bounding Box Provenance:</span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 bg-indigo-500/40 border border-indigo-600 rounded-sm"></span>
                  <span>Headings</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 bg-blue-500/30 border border-blue-500 rounded-sm"></span>
                  <span>Paragraphs</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500/40 border border-emerald-600 rounded-sm"></span>
                  <span>Tables</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 bg-red-500/40 border border-red-600 rounded-sm"></span>
                  <span>Active Chunk</span>
                </span>
              </div>
              <div>Source coordinates [x0, y0, x1, y1] preserved 100%.</div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Intelligence Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="h-full flex flex-col">
            {/* Tabs Selector */}
            <div className="border-b border-vistaar-border bg-vistaar-bg/50 px-3 pt-2.5 flex items-center justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab("chunks")}
                  className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1 ${
                    activeTab === "chunks"
                      ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                      : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Chunks ({filteredChunks.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("tables")}
                  className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1 ${
                    activeTab === "tables"
                      ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                      : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tables ({tables.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("metadata")}
                  className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1 ${
                    activeTab === "metadata"
                      ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                      : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Metadata & SHA256</span>
                </button>
              </div>

              {activeTab === "chunks" && (
                <select
                  value={chunkFilter}
                  onChange={(e) => setChunkFilter(e.target.value)}
                  className="text-[10px] font-semibold px-2 py-1 rounded border border-vistaar-border bg-white"
                >
                  <option value="ALL">All Types</option>
                  <option value="HEADING">Headings Only</option>
                  <option value="PARAGRAPH">Paragraphs Only</option>
                  <option value="TABLE">Tables Only</option>
                  <option value="HEADER_FOOTER">Header/Footer</option>
                </select>
              )}
            </div>

            <CardContent className="p-4 flex-1 overflow-y-auto max-h-[670px] space-y-3">
              {/* TAB 1: DETERMINISTIC CHUNKS */}
              {activeTab === "chunks" && (
                <div className="space-y-3">
                  {filteredChunks.length === 0 ? (
                    <div className="text-center py-16 text-xs text-vistaar-muted">
                      No chunks found on Page {selectedPage} matching filter.
                    </div>
                  ) : (
                    filteredChunks.map((c: any) => {
                      const isSelected = selectedChunkId === c.chunk_id;
                      return (
                        <div
                          key={c.chunk_id}
                          onClick={() => setSelectedChunkId(c.chunk_id)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "border-vistaar-primary bg-blue-50/60 shadow-sm ring-1 ring-vistaar-primary"
                              : "border-vistaar-border bg-white hover:bg-vistaar-bg/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-vistaar-primary text-xs">
                                {c.chunk_id}
                              </span>
                              <Badge
                                variant={
                                  c.is_table
                                    ? "scientific"
                                    : c.layout_type === "heading"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-[9px] uppercase"
                              >
                                {c.layout_type}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-vistaar-muted font-mono">
                              ~{c.token_estimate} tokens
                            </span>
                          </div>

                          <div className="text-[10px] text-vistaar-muted mb-2 font-mono flex flex-wrap gap-2">
                            <span>BBox: [{c.bounding_box?.join(", ")}]</span>
                            <span>Offsets: {c.character_offsets?.start}–{c.character_offsets?.end}</span>
                          </div>

                          {c.heading_context && (
                            <div className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mb-2 truncate">
                              Section: {c.heading_context}
                            </div>
                          )}

                          <div className="font-sans text-xs text-vistaar-text leading-relaxed whitespace-pre-wrap bg-white/80 p-2 rounded border border-vistaar-border/60">
                            {c.text}
                          </div>

                          <div className="mt-2 pt-2 border-t border-vistaar-border/60 flex items-center justify-between text-[10px] text-vistaar-muted font-mono">
                            <span className="text-emerald-700 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>768-dim Embedding Vector</span>
                            </span>
                            <span className="text-vistaar-primary font-semibold">
                              Click to highlight on page
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: EXTRACTED STRUCTURED TABLES */}
              {activeTab === "tables" && (
                <div className="space-y-4">
                  {tables.length === 0 ? (
                    <div className="text-center py-16 text-xs text-vistaar-muted">
                      No tabular structures detected in this scientific document.
                    </div>
                  ) : (
                    tables.map((t: any) => (
                      <div key={t.table_id} className="p-3 bg-white border border-vistaar-border rounded-lg shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TableIcon className="w-4 h-4 text-emerald-700" />
                            <span className="font-bold text-xs text-vistaar-text font-mono">
                              {t.table_id} (Page {t.page_number})
                            </span>
                            <Badge variant="scientific" className="text-[9px]">
                              {t.row_count} rows × {t.col_count} cols
                            </Badge>
                          </div>
                          <span className="text-[10px] text-vistaar-muted font-mono">
                            BBox: [{t.bounding_box?.join(", ")}]
                          </span>
                        </div>

                        <div className="bg-[#FAF7F0] text-[#17202A] border border-[#E7E0D5] p-3 rounded font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed">
                          {t.markdown}
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(t.markdown, t.table_id)}
                            className="h-6 text-[10px] flex items-center space-x-1"
                          >
                            {copiedHash === t.table_id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedHash === t.table_id ? "Copied" : "Copy Markdown"}</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: METADATA & CRYPTOGRAPHIC PROVENANCE */}
              {activeTab === "metadata" && documentDetail && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-white border border-vistaar-border rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-vistaar-muted uppercase tracking-wider block font-sans">
                      Cryptographic Document Integrity
                    </span>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">SHA-256 Checksum:</span>
                        <div className="flex items-center justify-between bg-vistaar-bg p-1.5 rounded text-[11px] text-vistaar-primary break-all">
                          <span>{documentDetail.sha256}</span>
                          <button
                            onClick={() => copyToClipboard(documentDetail.sha256, "sha256")}
                            className="ml-2 p-1 hover:bg-white rounded"
                          >
                            {copiedHash === "sha256" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {documentDetail.md5 && (
                        <div>
                          <span className="text-vistaar-muted text-[10px] block">MD5 Hash:</span>
                          <span className="text-vistaar-text text-[11px]">{documentDetail.md5}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-vistaar-border rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-vistaar-muted uppercase tracking-wider block font-sans">
                      PyMuPDF Document Metadata
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">Title:</span>
                        <span className="font-semibold text-vistaar-text truncate block">{documentDetail.title}</span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">Station ID:</span>
                        <span className="font-bold text-vistaar-primary uppercase">{documentDetail.station_id || "POLAR"}</span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">Author:</span>
                        <span>{documentDetail.metadata?.author || "NCPOR Scientific Team"}</span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">Creator / Engine:</span>
                        <span>{documentDetail.metadata?.creator || "PyMuPDF 1.28 Engine"}</span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">Ingestion Status:</span>
                        <Badge variant="success">{documentDetail.status}</Badge>
                      </div>
                      <div>
                        <span className="text-vistaar-muted text-[10px] block">Page Count:</span>
                        <span className="font-bold">{documentDetail.page_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center font-sans">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReprocess}
                      className="flex items-center space-x-1.5 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reprocess Pipeline</span>
                    </Button>
                    <span className="text-[10px] text-vistaar-muted">
                      Uploaded by {documentDetail.uploaded_by || "authenticated officer"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Scientific PDF Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17202A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-vistaar-border w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-vistaar-border bg-vistaar-bg/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-vistaar-primary" />
                <h3 className="font-bold text-base text-vistaar-text">Upload Scientific PDF Document</h3>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="text-vistaar-muted hover:text-vistaar-text font-bold">✕</button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-vistaar-text mb-1">Select PDF File (.pdf, max 50MB):</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs p-2 border border-vistaar-border rounded bg-vistaar-bg/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-vistaar-text mb-1">Document Title (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Maitri Automated Weather Station Report 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-vistaar-border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-vistaar-text mb-1">Associated Station:</label>
                  <select
                    value={uploadStation}
                    onChange={(e) => setUploadStation(e.target.value)}
                    className="w-full text-xs p-2 border border-vistaar-border rounded bg-white"
                  >
                    <option value="himansh">Himansh (Himalayas)</option>
                    <option value="bharati">Bharati (Antarctica)</option>
                    <option value="maitri">Maitri (Antarctica)</option>
                    <option value="himadri">Himadri (Arctic)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-vistaar-text mb-1">Expedition (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. 41-ISEA"
                    value={uploadExpedition}
                    onChange={(e) => setUploadExpedition(e.target.value)}
                    className="w-full text-xs p-2 border border-vistaar-border rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-vistaar-bg/50 border border-vistaar-border rounded text-[11px] space-y-1">
                <span className="font-bold text-vistaar-primary block">Automatic PyMuPDF Intelligence Pipeline:</span>
                <p className="text-vistaar-muted">
                  SHA-256 Checksum • Page Dimensions • Text & Font Layout • Table Detection & Markdown Extraction • Deterministic Chunking (p{'{'}page{'}'}_c{'{'}id{'}'}) • 768-dim Embeddings.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-vistaar-border">
                <Button type="button" variant="ghost" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isUploading}>
                  {isUploading ? "Ingesting..." : "Ingest Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
