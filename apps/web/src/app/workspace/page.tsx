"use client";

import { useEffect, useState, useRef } from "react";
import {
  ShieldCheck,
  FileText,
  Share2,
  GraduationCap,
  Languages,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Sparkles,
  Send,
  Eye,
  FileCheck2,
  History,
  RotateCcw,
  Edit3,
  Save,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Crosshair,
  Activity,
  Scale,
  Check,
  Ban,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchApi, API_BASE_URL } from "@/lib/api";

export default function ReviewWorkspacePage() {
  const [stationId, setStationId] = useState("maitri");
  const [activeTrack, setActiveTrack] = useState<"pib" | "social" | "education" | "vernacular">("pib");
  const [socialPlatform, setSocialPlatform] = useState<"x" | "linkedin" | "instagram">("x");
  const [publication, setPublication] = useState<any>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Prompt 15: Source PDF Viewer State (LEFT Pane)
  const [docId, setDocId] = useState<string>("doc_test_polar_maitri");
  const [docDetails, setDocDetails] = useState<any>(null);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfSearchQuery, setPdfSearchQuery] = useState<string>("");
  const [activeChunkId, setActiveChunkId] = useState<string | null>("p1_c01");
  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Prompt 08: Revision & Rollback State
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisionsList, setRevisionsList] = useState<any[]>([]);
  const [isSavingRevision, setIsSavingRevision] = useState(false);

  // Prompt 15: Inline Claim Editor & Reviewer Governance State
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editClaimText, setEditClaimText] = useState<string>("");
  const [editClaimValue, setEditClaimValue] = useState<string>("");
  const [editClaimUnit, setEditClaimUnit] = useState<string>("");

  // Prompt 15 Bottom Pane: Real NPDC Telemetry Series & Numerical Normalizer
  const [telemetrySeries, setTelemetrySeries] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [normExprA, setNormExprA] = useState<string>("-38.4°C");
  const [normExprB, setNormExprB] = useState<string>("−38.4 °C");
  const [normResult, setNormResult] = useState<any>(null);

  // Load PDF document details for Left Pane
  async function loadPdfDocument(targetDocId: string) {
    try {
      const res = await fetchApi(`/documents/${targetDocId}`);
      setDocDetails(res);
    } catch {
      // Fallback to listing available documents
      try {
        const list = await fetchApi("/documents");
        if (list?.items?.length > 0) {
          const firstId = list.items[0].document_id;
          setDocId(firstId);
          const d = await fetchApi(`/documents/${firstId}`);
          setDocDetails(d);
        }
      } catch {
        // Ignore if offline
      }
    }
  }

  // Load real NPDC telemetry time series for Bottom Pane
  async function loadStationTelemetry(targetStation: string) {
    try {
      const res = await fetchApi(`/weather/timeseries?station_id=${targetStation}`);
      setTelemetrySeries(res);
    } catch {
      setTelemetrySeries(null);
    }
  }

  // Generate initial four-track outreach draft from real NPDC data
  async function handleGenerate() {
    setIsGenerating(true);
    setActionMessage(null);
    try {
      const res = await fetchApi("/ai/generate-outreach", {
        method: "POST",
        body: JSON.stringify({ station_id: stationId }),
      });
      setPublication(res);
      if (res.document_id) {
        setDocId(res.document_id);
        loadPdfDocument(res.document_id);
      }
      if (res.claims && res.claims.length > 0) {
        handleSelectClaim(res.claims[0]);
      }
      setActionMessage("Generated 4-track outreach package (DRAFT / AI_GENERATED) with deterministic NPDC claim verification.");
    } catch (e: any) {
      setActionMessage(`Error generating content: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Clicking a claim navigates to exact PDF page, scrolls to evidence, and highlights bounding box (Prompt 15)
  function handleSelectClaim(claim: any) {
    setSelectedClaim(claim);
    const ev = claim?.evidence;
    if (ev?.document_id && ev.document_id !== docId) {
      setDocId(ev.document_id);
      loadPdfDocument(ev.document_id);
    }
    const targetPage = ev?.page_number || 1;
    setPdfPage(targetPage);
    const targetChunk = ev?.chunk_id || `p${targetPage}_c01`;
    setActiveChunkId(targetChunk);

    setTimeout(() => {
      const el = chunkRefs.current[targetChunk];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 120);
  }

  // Reviewer Claim Action (Accept, Reject, Request Revision, Resolve Conflict, Edit)
  async function handleClaimReviewAction(
    claimId: string,
    action: "ACCEPT" | "REJECT" | "REQUEST_REVISION" | "RESOLVE_CONFLICT" | "EDIT"
  ) {
    if (!publication) return;
    try {
      const payload: any = {
        action,
        publication_id: publication.id,
        reviewer_notes: `Reviewer action '${action}' executed in Scientific Review Workspace`,
      };
      if (action === "EDIT") {
        payload.updated_claim_text = editClaimText;
        payload.updated_value = parseFloat(editClaimValue);
        payload.updated_unit = editClaimUnit;
      }
      const res = await fetchApi(`/claims/${claimId}/review-action`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Refresh publication state
      const updatedPub = await fetchApi(`/publications/${publication.id}`);
      setPublication(updatedPub);
      const updatedClaim = updatedPub.claims?.find((c: any) => c.claim_id === claimId);
      if (updatedClaim) {
        setSelectedClaim(updatedClaim);
      }
      setEditingClaimId(null);
      setActionMessage(`Claim ${claimId} marked as ${res.new_status} via audited reviewer action (${action}).`);
    } catch (e: any) {
      setActionMessage(`Claim action failed: ${e.message}`);
    }
  }

  // Handle publishing state transition (Prompt 15 & 24)
  async function handleTransition(newStatus: string) {
    if (!publication) return;
    try {
      await fetchApi(`/publications/${publication.id}/transition`, {
        method: "POST",
        body: JSON.stringify({
          new_status: newStatus,
          reason: `Reviewer governance transition to ${newStatus}`,
        }),
      });
      const updatedPub = await fetchApi(`/publications/${publication.id}`);
      setPublication(updatedPub);
      setActionMessage(`Publication lifecycle transitioned to: ${newStatus} (Audit event logged).`);
    } catch (e: any) {
      setActionMessage(`Transition error: ${e.message}`);
    }
  }

  // Test scientific numerical normalization (Prompt 13)
  async function handleRunNormalization(exprA = normExprA, exprB = normExprB) {
    try {
      const res = await fetchApi("/claims/normalize", {
        method: "POST",
        body: JSON.stringify({
          expression_a: exprA,
          expression_b: exprB,
          location: stationId,
        }),
      });
      setNormResult(res.comparison);
    } catch (e: any) {
      setActionMessage(`Normalization error: ${e.message}`);
    }
  }

  // Sync edit buffer whenever active track or publication changes
  useEffect(() => {
    if (publication && publication[activeTrack]) {
      setEditedTitle(publication[activeTrack].title || "");
      setEditedBody(publication[activeTrack].body || "");
      setIsEditing(false);
    }
  }, [activeTrack, publication]);

  async function openRevisionsModal() {
    if (!publication) return;
    try {
      const res = await fetchApi(`/publications/${publication.id}/revisions`);
      setRevisionsList(res.revisions || []);
      setShowRevisionsModal(true);
    } catch (e: any) {
      setActionMessage(`Failed to load revisions: ${e.message}`);
    }
  }

  async function handleRollback(targetVersion: number) {
    if (!publication) return;
    try {
      const res = await fetchApi(`/publications/${publication.id}/rollback`, {
        method: "POST",
        body: JSON.stringify({
          target_version: targetVersion,
          reason: `Outreach reviewer triggered rollback to historical revision v${targetVersion}`,
        }),
      });
      const updatedPub = await fetchApi(`/publications/${publication.id}`);
      setPublication(updatedPub);
      setShowRevisionsModal(false);
      setActionMessage(`Successfully rollbacked to v${targetVersion}. Active version is now v${res.new_version || res.current_version || updatedPub.version}.`);
    } catch (e: any) {
      setActionMessage(`Rollback failed: ${e.message}`);
    }
  }

  async function handleSaveTrackRevision() {
    if (!publication) return;
    setIsSavingRevision(true);
    try {
      const res = await fetchApi(`/publications/${publication.id}/track`, {
        method: "PATCH",
        body: JSON.stringify({
          track: activeTrack.toUpperCase(),
          title: editedTitle,
          summary: currentTrackData?.summary || "",
          body: editedBody,
        }),
      });
      const updatedPub = await fetchApi(`/publications/${publication.id}`);
      setPublication(updatedPub);
      setIsEditing(false);
      setActionMessage(`Saved revision v${res.version} for ${activeTrack.toUpperCase()} track.`);
    } catch (e: any) {
      setActionMessage(`Save revision failed: ${e.message}`);
    } finally {
      setIsSavingRevision(false);
    }
  }

  useEffect(() => {
    const defaultDoc = stationId === "himansh" ? "doc_himansh_glaciology_2023" : "doc_test_polar_maitri";
    setDocId(defaultDoc);
    loadPdfDocument(defaultDoc);
    loadStationTelemetry(stationId);
    handleGenerate();
    handleRunNormalization("-38.4°C", "−38.4 °C");
  }, [stationId]);

  const currentTrackData = publication ? publication[activeTrack] : null;
  const pageCount = docDetails?.page_count || 2;
  const allChunks: any[] = docDetails?.chunks || [];
  const currentPageChunks = allChunks.filter((c) => c.page_number === pdfPage);
  const filteredChunks = pdfSearchQuery.trim()
    ? allChunks.filter((c) => c.text?.toLowerCase().includes(pdfSearchQuery.toLowerCase()))
    : currentPageChunks;

  function getStatusBadgeVariant(st: string): "success" | "warning" | "danger" | "scientific" {
    const s = (st || "").toUpperCase();
    if (s === "VERIFIED" || s === "PUBLISHED" || s === "APPROVED") return "success";
    if (s === "NEEDS_REVIEW" || s === "REVIEWED" || s === "AI_GENERATED" || s === "DRAFT") return "warning";
    if (s === "CONFLICTING" || s === "UNSUPPORTED") return "danger";
    return "scientific";
  }

  // Telemetry chart points calculation
  const seriesPoints: any[] = telemetrySeries?.series || [];
  const validValues = seriesPoints.map((p) => p.value).filter((v) => typeof v === "number");
  const minVal = validValues.length ? Math.min(...validValues) : -20;
  const maxVal = validValues.length ? Math.max(...validValues) : 10;
  const avgVal = validValues.length
    ? (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2)
    : "0.00";
  const valRange = Math.max(1, maxVal - minVal);

  return (
    <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#FAF7F0] min-h-screen">
      {/* Workspace Header & Governance Lifecycle Bar */}
      <div className="bg-white p-4 rounded-lg border border-vistaar-border shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-vistaar-scientific font-bold">
              NCPOR Scientific Review & Verification Workspace
            </span>
            <span className="text-vistaar-border">•</span>
            <Badge variant={getStatusBadgeVariant(publication?.status || "DRAFT")}>
              Lifecycle: {publication?.status || "DRAFT"}
            </Badge>
            {publication && (
              <Badge variant="scientific" className="font-mono text-xs">
                Revision v{publication.version || 1}
              </Badge>
            )}
            {publication?.approved_version && (
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                Approved Snapshot: v{publication.approved_version}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-vistaar-text mt-1">
            Evidence-First Four-Track Outreach & Deterministic Claim Verification
          </h1>
        </div>

        {/* Station Selector, Generate & Step-by-Step Governance Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-md border border-vistaar-border bg-[#FAF7F0] text-vistaar-text shadow-sm"
          >
            <option value="maitri">Maitri Station (East Antarctica)</option>
            <option value="himansh">Himansh Station (Himalayas)</option>
            <option value="bharati">Bharati Base (Larsemann Hills)</option>
            <option value="himadri">Himadri Station (Arctic)</option>
          </select>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Synthesizing..." : "Synthesize 4-Track"}</span>
          </Button>

          {publication && (
            <Button
              size="sm"
              variant="outline"
              onClick={openRevisionsModal}
              className="flex items-center space-x-1"
            >
              <History className="w-3.5 h-3.5 text-vistaar-primary" />
              <span>Revisions (v{publication.version || 1})</span>
            </Button>
          )}

          {/* Enforced Publishing Governance State Machine Buttons */}
          {publication && (
            <div className="flex flex-wrap items-center gap-1.5 pl-2 border-l border-vistaar-border">
              {(publication.status === "DRAFT" || publication.status === "AI_GENERATED") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTransition("NEEDS_REVIEW")}
                  className="text-xs border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100"
                >
                  1. Submit to Review
                </Button>
              )}

              {(publication.status === "AI_GENERATED" || publication.status === "NEEDS_REVIEW") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTransition("REVIEWED")}
                  className="text-xs border-blue-400 text-blue-800 bg-blue-50 hover:bg-blue-100"
                >
                  2. Mark Reviewed
                </Button>
              )}

              {publication.status === "REVIEWED" && (
                <Button
                  size="sm"
                  variant="scientific"
                  onClick={() => handleTransition("APPROVED")}
                  className="flex items-center space-x-1 text-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>3. Approve Snapshot</span>
                </Button>
              )}

              {publication.status === "APPROVED" && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleTransition("PUBLISHED")}
                  className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>4. Publish to Portal</span>
                </Button>
              )}

              {publication.status !== "NEEDS_REVIEW" && publication.status !== "DRAFT" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTransition("NEEDS_REVIEW")}
                  className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  Request Revision
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-vistaar-primary flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-vistaar-primary shrink-0" />
            <span className="font-medium">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2 px-1.5">
            ×
          </button>
        </div>
      )}

      {/* TOP SPLIT WORKSPACE: LEFT = Source PDF & Bounding Boxes (5 cols) | RIGHT = 4-Track Content & Claims (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE: Interactive Source PDF Viewer with Page Nav, Zoom, Search & Bounding-Box Highlight */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <Card className="bg-white border-vistaar-border shadow-sm flex-1 flex flex-col">
            <CardHeader className="p-3.5 border-b border-vistaar-border bg-[#FAF7F0]/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 text-vistaar-text">
                  <Eye className="w-4 h-4 text-vistaar-scientific" />
                  <span>Authoritative Source PDF & Bounding-Box Evidence</span>
                </CardTitle>
                <select
                  value={docId}
                  onChange={(e) => {
                    setDocId(e.target.value);
                    setPdfPage(1);
                    loadPdfDocument(e.target.value);
                  }}
                  className="text-[11px] font-mono px-2 py-1 rounded border border-vistaar-border bg-white"
                >
                  <option value="doc_test_polar_maitri">doc_test_polar_maitri (Maitri AWS PDF)</option>
                  <option value="doc_himansh_glaciology_2023">doc_himansh_glaciology_2023 (Himansh PDF)</option>
                </select>
              </div>

              {/* PDF Controls: Page Navigation, Zoom & In-Document Search */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                    disabled={pdfPage <= 1}
                    className="p-1 rounded border border-vistaar-border bg-white disabled:opacity-40 hover:bg-vistaar-bg"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-semibold px-2">
                    Page {pdfPage} / {pageCount}
                  </span>
                  <button
                    onClick={() => setPdfPage((p) => Math.min(pageCount, p + 1))}
                    disabled={pdfPage >= pageCount}
                    className="p-1 rounded border border-vistaar-border bg-white disabled:opacity-40 hover:bg-vistaar-bg"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPdfZoom((z) => Math.max(75, z - 25))}
                    className="p-1 rounded border border-vistaar-border bg-white hover:bg-vistaar-bg"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5">{pdfZoom}%</span>
                  <button
                    onClick={() => setPdfZoom((z) => Math.min(150, z + 25))}
                    className="p-1 rounded border border-vistaar-border bg-white hover:bg-vistaar-bg"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3 h-3 text-vistaar-muted absolute left-2 top-2" />
                  <input
                    type="text"
                    value={pdfSearchQuery}
                    onChange={(e) => setPdfSearchQuery(e.target.value)}
                    placeholder="Search PDF text/tables..."
                    className="w-full pl-6 pr-2 py-1 text-[11px] rounded border border-vistaar-border bg-white focus:outline-none focus:border-vistaar-primary"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 space-y-3 flex-1 flex flex-col">
              {/* High-DPI Rendered PDF Page with Interactive Bounding-Box Overlay */}
              <div className="relative bg-[#FAF7F0] border border-vistaar-border rounded-md overflow-auto max-h-[420px] flex justify-center p-2">
                <div
                  className="relative shadow-md bg-white border border-stone-300 transition-all"
                  style={{ width: `${(pdfZoom / 100) * 460}px` }}
                >
                  <img
                    src={`${API_BASE_URL}/documents/${docId}/pages/${pdfPage}/render?dpi=150`}
                    alt={`PDF Page ${pdfPage}`}
                    className="w-full h-auto block select-none"
                  />
                  {/* Bounding Box Overlays scaled from standard 612x792 PDF point coordinates */}
                  {currentPageChunks.map((chunk: any) => {
                    const bb = chunk.bounding_box;
                    if (!bb) return null;
                    const isSelected = activeChunkId === chunk.chunk_id;
                    const leftPct = Math.max(0, Math.min(96, (bb.x0 / 612) * 100));
                    const topPct = Math.max(0, Math.min(96, (bb.y0 / 792) * 100));
                    const widthPct = Math.max(5, Math.min(100 - leftPct, ((bb.x1 - bb.x0) / 612) * 100));
                    const heightPct = Math.max(3, Math.min(100 - topPct, ((bb.y1 - bb.y0) / 792) * 100));

                    return (
                      <div
                        key={chunk.chunk_id}
                        onClick={() => setActiveChunkId(chunk.chunk_id)}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                        }}
                        className={`absolute cursor-pointer transition-all rounded-sm ${
                          isSelected
                            ? "border-2 border-[#2563EB] bg-blue-500/20 ring-2 ring-amber-400/80 z-10"
                            : "border border-teal-600/40 bg-teal-500/5 hover:bg-blue-500/15"
                        }`}
                        title={`Chunk ${chunk.chunk_id} (${chunk.chunk_type || "text"})`}
                      >
                        {isSelected && (
                          <span className="absolute -top-4 left-0 bg-[#2563EB] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow">
                            {chunk.chunk_id}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extracted Chunks & Highlighted Source Evidence List */}
              <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-vistaar-muted">
                  <span>Extracted Source Chunks ({filteredChunks.length})</span>
                  <span>Click chunk or claim to sync bounding box</span>
                </div>
                {filteredChunks.map((ch: any) => {
                  const isAct = activeChunkId === ch.chunk_id;
                  return (
                    <div
                      key={ch.chunk_id}
                      ref={(el) => {
                        chunkRefs.current[ch.chunk_id] = el;
                      }}
                      onClick={() => {
                        setPdfPage(ch.page_number);
                        setActiveChunkId(ch.chunk_id);
                      }}
                      className={`p-2 rounded border text-[11px] cursor-pointer transition-all ${
                        isAct
                          ? "border-[#2563EB] bg-blue-50/80 shadow-sm"
                          : "border-vistaar-border bg-[#FAF7F0]/50 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                        <span className="font-bold text-vistaar-primary">
                          [{ch.chunk_id}] Page {ch.page_number} ({ch.chunk_type || "text"})
                        </span>
                        <span className="text-vistaar-muted">
                          BBox: [{Math.round(ch.bounding_box?.x0 || 0)}, {Math.round(ch.bounding_box?.y0 || 0)}]
                        </span>
                      </div>
                      <p className="text-vistaar-text line-clamp-2 font-sans">{ch.text}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANE: Four-Track Outreach Studio & Deterministic Claim Verification Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <Card className="bg-white border-vistaar-border shadow-sm flex-1 flex flex-col">
            {/* 4-Track Tabs */}
            <div className="border-b border-vistaar-border bg-[#FAF7F0]/70 px-4 pt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTrack("pib")}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTrack === "pib"
                    ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                    : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Administrative / PIB</span>
              </button>

              <button
                onClick={() => setActiveTrack("social")}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTrack === "social"
                    ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                    : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>2. Social (X / LinkedIn / IG)</span>
              </button>

              <button
                onClick={() => setActiveTrack("education")}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTrack === "education"
                    ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                    : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>3. Education (Class 8–12)</span>
              </button>

              <button
                onClick={() => setActiveTrack("vernacular")}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTrack === "vernacular"
                    ? "border-vistaar-primary text-vistaar-primary bg-white rounded-t-md"
                    : "border-transparent text-vistaar-muted hover:text-vistaar-text"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>4. Vernacular (Hindi)</span>
              </button>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-5">
              {currentTrackData ? (
                <div className="space-y-4">
                  {/* Track Header & Edit Controls */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-vistaar-scientific tracking-wider">
                          {currentTrackData.track} Track
                        </span>
                        <span className="text-vistaar-border">•</span>
                        <span className="text-[11px] text-vistaar-muted">
                          Audience: {currentTrackData.target_audience}
                        </span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full text-base font-bold text-vistaar-text px-2.5 py-1 border border-vistaar-border rounded bg-white"
                        />
                      ) : (
                        <h3 className="text-base font-bold text-vistaar-text">{currentTrackData.title}</h3>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setEditedTitle(currentTrackData.title || "");
                              setEditedBody(currentTrackData.body || "");
                            }}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={handleSaveTrackRevision}
                            disabled={isSavingRevision}
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingRevision ? "Saving..." : `Save v${(publication?.version || 1) + 1}`}</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-1 text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Track</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Social Media Multi-Platform Switcher (Prompt 12) */}
                  {activeTrack === "social" && currentTrackData.platforms && !isEditing && (
                    <div className="flex items-center space-x-2 pt-1">
                      {(["x", "linkedin", "instagram"] as const).map((plat) => (
                        <button
                          key={plat}
                          onClick={() => setSocialPlatform(plat)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase border transition-all ${
                            socialPlatform === plat
                              ? "bg-[#2563EB] text-white border-[#2563EB]"
                              : "bg-[#FAF7F0] text-vistaar-text border-vistaar-border"
                          }`}
                        >
                          {plat === "x" ? "X (Twitter)" : plat === "linkedin" ? "LinkedIn" : "Instagram"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Track Body */}
                  {isEditing ? (
                    <textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows={8}
                      className="w-full bg-white p-3.5 rounded-lg border border-vistaar-border text-xs leading-relaxed font-sans text-vistaar-text focus:outline-none focus:ring-1 focus:ring-vistaar-primary"
                    />
                  ) : (
                    <div className="bg-[#FAF7F0]/80 p-4 rounded-lg border border-vistaar-border text-xs leading-relaxed font-sans whitespace-pre-line text-vistaar-text max-h-52 overflow-y-auto">
                      {activeTrack === "social" && currentTrackData.platforms
                        ? currentTrackData.platforms[socialPlatform] || currentTrackData.body
                        : currentTrackData.body}
                    </div>
                  )}

                  {/* Scientific Claims & Deterministic Verification Inspector (Prompts 12, 14, 15) */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-vistaar-text flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-vistaar-scientific" />
                        <span>Structured Scientific Claims & Verification Engine ({publication?.claims?.length || 0})</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-muted">
                        Click any claim to jump to source & highlight PDF bounding box
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {(publication?.claims || currentTrackData.claims || []).map((clm: any) => {
                        const isSel = selectedClaim?.claim_id === clm.claim_id;
                        const isEditingThis = editingClaimId === clm.claim_id;
                        return (
                          <div
                            key={clm.claim_id}
                            onClick={() => handleSelectClaim(clm)}
                            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all space-y-2.5 ${
                              isSel
                                ? "border-[#2563EB] bg-blue-50/40 shadow-sm"
                                : "border-vistaar-border bg-white hover:bg-[#FAF7F0]/60"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <Badge variant={getStatusBadgeVariant(clm.verification_status || clm.status)}>
                                  {clm.verification_status || clm.status}
                                </Badge>
                                <Badge variant="scientific" className="font-mono text-[10px]">
                                  {clm.epistemic_type || "OBSERVED"}
                                </Badge>
                                <span className="text-[10px] font-mono text-vistaar-muted">
                                  ID: {clm.claim_id} • Rule: {clm.verification_rule || "RULE_EXACT_MATCH"}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectClaim(clm);
                                }}
                                className="flex items-center space-x-1 text-[10px] font-mono font-semibold text-[#2563EB] hover:underline"
                              >
                                <Crosshair className="w-3 h-3" />
                                <span>
                                  Jump to Page {clm.evidence?.page_number || 1} [{clm.evidence?.chunk_id || "p1_c01"}]
                                </span>
                              </button>
                            </div>

                            {isEditingThis ? (
                              <div
                                className="space-y-2 bg-white p-2.5 rounded border border-vistaar-border"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editClaimText}
                                  onChange={(e) => setEditClaimText(e.target.value)}
                                  className="w-full text-xs px-2 py-1 border border-vistaar-border rounded"
                                />
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editClaimValue}
                                    onChange={(e) => setEditClaimValue(e.target.value)}
                                    className="w-28 text-xs px-2 py-1 border border-vistaar-border rounded font-mono"
                                  />
                                  <input
                                    type="text"
                                    value={editClaimUnit}
                                    onChange={(e) => setEditClaimUnit(e.target.value)}
                                    className="w-24 text-xs px-2 py-1 border border-vistaar-border rounded font-mono"
                                  />
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleClaimReviewAction(clm.claim_id, "EDIT")}
                                    className="text-[11px] h-7"
                                  >
                                    Save Claim Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingClaimId(null)}
                                    className="text-[11px] h-7"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="font-semibold text-vistaar-text leading-relaxed">{clm.claim_text}</p>
                            )}

                            {/* Structured Claim Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#FAF7F0] p-2 rounded border border-vistaar-border/80 font-mono text-[10px]">
                              <div>
                                <span className="text-vistaar-muted block uppercase">Metric</span>
                                <span className="font-bold text-vistaar-text">{clm.metric}</span>
                              </div>
                              <div>
                                <span className="text-vistaar-muted block uppercase">Value & Unit</span>
                                <span className="font-bold text-vistaar-primary">
                                  {clm.value} {clm.unit}
                                </span>
                              </div>
                              <div>
                                <span className="text-vistaar-muted block uppercase">Qualifier</span>
                                <span className="font-bold text-vistaar-text">{clm.qualifier || "observed"}</span>
                              </div>
                              <div>
                                <span className="text-vistaar-muted block uppercase">Location</span>
                                <span className="font-bold text-vistaar-text">{clm.location}</span>
                              </div>
                              <div>
                                <span className="text-vistaar-muted block uppercase">Source Ref</span>
                                <span className="font-bold text-vistaar-scientific truncate block">
                                  {clm.evidence?.dataset_id || clm.evidence?.document_id}
                                </span>
                              </div>
                            </div>

                            {/* Explainable Verification Proof */}
                            <div className="text-[11px] text-vistaar-muted bg-white/90 px-2.5 py-1.5 rounded border border-vistaar-border/60">
                              <strong className="text-vistaar-text">Verification Proof: </strong>
                              {clm.evidence?.explanation}
                            </div>

                            {/* Reviewer Governance Actions on Claim (Prompt 15) */}
                            <div
                              className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-vistaar-border/60"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  onClick={() => handleClaimReviewAction(clm.claim_id, "ACCEPT")}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center space-x-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleClaimReviewAction(clm.claim_id, "REQUEST_REVISION")}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 flex items-center space-x-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Request Revision</span>
                                </button>
                                <button
                                  onClick={() => handleClaimReviewAction(clm.claim_id, "RESOLVE_CONFLICT")}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100"
                                >
                                  Resolve Conflict
                                </button>
                                <button
                                  onClick={() => handleClaimReviewAction(clm.claim_id, "REJECT")}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 flex items-center space-x-1"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingClaimId(clm.claim_id);
                                    setEditClaimText(clm.claim_text);
                                    setEditClaimValue(String(clm.value));
                                    setEditClaimUnit(clm.unit);
                                  }}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-[#FAF7F0] text-vistaar-text border border-vistaar-border hover:bg-stone-200"
                                >
                                  Edit Claim
                                </button>
                              </div>
                              {clm.reviewed_by && (
                                <span className="text-[10px] font-mono text-emerald-700">
                                  Audited by {clm.reviewed_by}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-sm text-vistaar-muted">
                  Click &ldquo;Synthesize 4-Track&rdquo; to generate evidence-grounded outreach drafts.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOTTOM PANE: Scientific Evidence Telemetry Visualization & Numerical Normalizer (Prompt 13, 14, 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bottom Left (7 cols): Real NPDC Station Telemetry Time-Series Visualization */}
        <Card className="lg:col-span-7 bg-white border-vistaar-border shadow-sm">
          <CardHeader className="p-4 border-b border-vistaar-border bg-[#FAF7F0]/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 text-vistaar-text">
                <Activity className="w-4 h-4 text-vistaar-scientific" />
                <span>Bottom Scientific Evidence Panel — Calibrated NPDC Telemetry Series</span>
              </CardTitle>
              <p className="text-[11px] text-vistaar-muted mt-0.5 font-mono">
                Dataset: {telemetrySeries?.dataset_id || publication?.dataset_id || "NPDC Verified"} • Parameter:{" "}
                {telemetrySeries?.parameter || selectedClaim?.metric || "tempr"} ({telemetrySeries?.unit || selectedClaim?.unit || "°C"})
              </p>
            </div>
            <div className="flex items-center space-x-3 font-mono text-xs">
              <span className="px-2 py-1 rounded bg-[#FAF7F0] border border-vistaar-border">
                Min: <strong>{minVal}</strong>
              </span>
              <span className="px-2 py-1 rounded bg-[#FAF7F0] border border-vistaar-border">
                Mean: <strong>{avgVal}</strong>
              </span>
              <span className="px-2 py-1 rounded bg-[#FAF7F0] border border-vistaar-border">
                Max: <strong>{maxVal}</strong>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {seriesPoints.length > 0 ? (
              <div className="space-y-2">
                <svg viewBox="0 0 700 170" className="w-full h-44 bg-[#FAF7F0]/60 rounded border border-vistaar-border p-2">
                  {/* Horizontal Grid Lines */}
                  <line x1="40" y1="20" x2="680" y2="20" stroke="#E7E0D5" strokeDasharray="3,3" />
                  <line x1="40" y1="85" x2="680" y2="85" stroke="#E7E0D5" strokeDasharray="3,3" />
                  <line x1="40" y1="150" x2="680" y2="150" stroke="#E7E0D5" />

                  {/* Polyline for NPDC Telemetry */}
                  <polyline
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.2"
                    points={seriesPoints
                      .slice(0, 60)
                      .map((pt, idx, arr) => {
                        const x = 45 + (idx / Math.max(1, arr.length - 1)) * 625;
                        const y =
                          typeof pt.value === "number"
                            ? 145 - ((pt.value - minVal) / valRange) * 120
                            : 85;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* Interactive Data Points */}
                  {seriesPoints.slice(0, 60).map((pt, idx, arr) => {
                    if (typeof pt.value !== "number") return null;
                    const x = 45 + (idx / Math.max(1, arr.length - 1)) * 625;
                    const y = 145 - ((pt.value - minVal) / valRange) * 120;
                    const isClaimMatch =
                      selectedClaim && Math.abs(Number(pt.value) - Number(selectedClaim.value)) < 0.05;
                    return (
                      <circle
                        key={pt.record_id || idx}
                        cx={x}
                        cy={y}
                        r={isClaimMatch ? 5.5 : 3}
                        fill={isClaimMatch ? "#D97706" : "#0E7490"}
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(pt)}
                      />
                    );
                  })}
                </svg>
                <div className="flex items-center justify-between text-[11px] font-mono text-vistaar-muted">
                  <span>
                    {hoveredPoint
                      ? `Inspected Record: ${hoveredPoint.record_id} | Timestamp: ${hoveredPoint.timestamp} | Value: ${hoveredPoint.value} ${telemetrySeries?.unit || ""} (QC: ${hoveredPoint.quality_flag})`
                      : "Hover any telemetry node to inspect its raw NPDC record_id, timestamp, and quality flag."}
                  </span>
                  <span className="text-amber-700 font-bold">● Amber Node = Selected Claim Evidence</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-vistaar-muted">
                Loading verified station telemetry series...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Right (5 cols): Live Scientific Numerical Normalizer Inspector (Prompt 13) */}
        <Card className="lg:col-span-5 bg-white border-vistaar-border shadow-sm">
          <CardHeader className="p-4 border-b border-vistaar-border bg-[#FAF7F0]/70">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 text-vistaar-text">
              <Scale className="w-4 h-4 text-vistaar-primary" />
              <span>Scientific Numerical & Unit Normalization Engine</span>
            </CardTitle>
            <p className="text-[11px] text-vistaar-muted mt-0.5">
              Verifies equivalent forms (-38.4°C, −38.4 °C, Devanagari -३८.४ °C) & blocks cross-unit mismatches (38.4 knots ≠ 38.4°C).
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-vistaar-muted block mb-1">
                  Claimed Expression A
                </label>
                <input
                  type="text"
                  value={normExprA}
                  onChange={(e) => setNormExprA(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-vistaar-border font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-vistaar-muted block mb-1">
                  Source Reference B
                </label>
                <input
                  type="text"
                  value={normExprB}
                  onChange={(e) => setNormExprB(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-vistaar-border font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="sm" onClick={() => handleRunNormalization()} className="text-[11px] h-7">
                Compare Equivalence
              </Button>
              <button
                onClick={() => {
                  setNormExprA("-38.4°C");
                  setNormExprB("-३८.४ डिग्री सेल्सियस");
                  handleRunNormalization("-38.4°C", "-३८.४ डिग्री सेल्सियस");
                }}
                className="px-2 py-1 rounded border border-vistaar-border bg-[#FAF7F0] text-[10px] font-mono hover:bg-stone-200"
              >
                Preset: Devanagari °C
              </button>
              <button
                onClick={() => {
                  setNormExprA("38.4 knots");
                  setNormExprB("38.4°C");
                  handleRunNormalization("38.4 knots", "38.4°C");
                }}
                className="px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-800 text-[10px] font-mono hover:bg-rose-100"
              >
                Preset: 38.4 knots vs 38.4°C
              </button>
            </div>

            {normResult && (
              <div
                className={`p-3 rounded border font-mono text-[11px] space-y-1 ${
                  normResult.equivalent
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                    : "bg-rose-50/70 border-rose-300 text-rose-950"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>
                    Status: {normResult.equivalent ? "EQUIVALENT (VERIFIED)" : "MISMATCH / CONFLICTING"}
                  </span>
                  <span>Unit Compatible: {String(normResult.unit_compatible)}</span>
                </div>
                <p className="font-sans text-[11px] leading-snug">{normResult.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revision History & Rollback Modal */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-vistaar-border w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-vistaar-border flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-vistaar-primary" />
                <h2 className="text-base font-bold text-vistaar-text">
                  Immutable Revision History & Rollback
                </h2>
                <Badge variant="scientific">Current: v{publication?.version || 1}</Badge>
              </div>
              <button
                onClick={() => setShowRevisionsModal(false)}
                className="p-1 rounded-md text-vistaar-muted hover:text-vistaar-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {revisionsList.length === 0 ? (
                <div className="text-center py-12 text-vistaar-muted text-xs">
                  Initial version (v1) is active. Edits made to any track record historical snapshots here.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF7F0] border-b border-vistaar-border text-vistaar-muted uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Version</th>
                      <th className="p-2.5">Track</th>
                      <th className="p-2.5">Author</th>
                      <th className="p-2.5">Timestamp (UTC)</th>
                      <th className="p-2.5">Summary / Note</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vistaar-border/60">
                    {revisionsList.map((rev: any) => {
                      const isCurrent = rev.version === publication?.version;
                      return (
                        <tr key={rev.revision_id || rev.version} className={isCurrent ? "bg-blue-50/40" : ""}>
                          <td className="p-2.5 font-bold text-vistaar-primary">
                            v{rev.version} {isCurrent && <span className="text-[10px] text-emerald-700">(Active)</span>}
                          </td>
                          <td className="p-2.5 uppercase font-semibold">{rev.track || "ALL"}</td>
                          <td className="p-2.5 text-vistaar-muted">{rev.author_email || "system"}</td>
                          <td className="p-2.5 text-vistaar-muted">{rev.timestamp?.replace("T", " ").slice(0, 19)}</td>
                          <td className="p-2.5 font-sans text-vistaar-text truncate max-w-xs">
                            {rev.title || rev.summary || "Revision snapshot"}
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrent}
                              onClick={() => handleRollback(rev.version)}
                              className="text-xs h-7 flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rollback</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
