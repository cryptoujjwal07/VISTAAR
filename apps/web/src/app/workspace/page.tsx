"use client";

import { useEffect, useState } from "react";
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
  Upload, 
  Send,
  Eye,
  FileCheck2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function ReviewWorkspacePage() {
  const [stationId, setStationId] = useState("himansh");
  const [activeTrack, setActiveTrack] = useState<"pib" | "social" | "education" | "vernacular">("pib");
  const [publication, setPublication] = useState<any>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
      if (res.claims && res.claims.length > 0) {
        setSelectedClaim(res.claims[0]);
      }
      setActionMessage("Generated outreach draft with 100% real NPDC observation provenance.");
    } catch (e: any) {
      setActionMessage(`Error generating content: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle publishing state transition
  async function handleTransition(newStatus: string) {
    if (!publication) return;
    try {
      const res = await fetchApi(`/publications/${publication.id}/transition`, {
        method: "POST",
        body: JSON.stringify({
          new_status: newStatus,
          reason: `Reviewer action: transitioned to ${newStatus}`,
        }),
      });
      setPublication((prev: any) => ({ ...prev, status: newStatus }));
      setActionMessage(`Publication status successfully updated to: ${newStatus}`);
    } catch (e: any) {
      setActionMessage(`Transition error: ${e.message}`);
    }
  }

  useEffect(() => {
    handleGenerate();
  }, [stationId]);

  const currentTrackData = publication ? publication[activeTrack] : null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Workspace Header */}
      <div className="border-b border-vistaar-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-vistaar-scientific font-bold">
              Institutional Review Studio
            </span>
            <span className="text-vistaar-border">•</span>
            <Badge variant={publication?.status === "PUBLISHED" ? "success" : "warning"}>
              {publication?.status || "DRAFT"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-vistaar-text mt-1">
            Scientific Review & Claim Verification Workspace
          </h1>
        </div>

        {/* Station Selector & Generate Button */}
        <div className="flex items-center space-x-3">
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-md border border-vistaar-border bg-white text-vistaar-text shadow-sm"
          >
            <option value="himansh">Himansh Station (Himalayas)</option>
            <option value="bharati">Bharati Base (Larsemann Hills)</option>
            <option value="maitri">Maitri Base (Schirmacher Oasis)</option>
            <option value="himadri">Himadri Station (Arctic)</option>
          </select>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Synthesizing..." : "Generate Four-Track"}</span>
          </Button>

          {/* Publishing Governance Actions */}
          {publication && (
            <div className="flex items-center space-x-2 pl-2 border-l border-vistaar-border">
              {publication.status !== "APPROVED" && publication.status !== "PUBLISHED" && (
                <Button
                  size="sm"
                  variant="scientific"
                  onClick={() => handleTransition("APPROVED")}
                  className="flex items-center space-x-1"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Approve Content</span>
                </Button>
              )}

              {publication.status === "APPROVED" && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleTransition("PUBLISHED")}
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Portal</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-vistaar-primary flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Split Review Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* LEFT COLUMN: Source Evidence & Dataset Record (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-4 pb-3 border-b border-vistaar-border bg-vistaar-bg/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-vistaar-scientific" />
                  <span>Authoritative Source Evidence</span>
                </CardTitle>
                <Badge variant="scientific">NPDC Observation</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex-1 space-y-4 text-xs">
              {selectedClaim ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md">
                    <span className="block text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                      Target Scientific Claim
                    </span>
                    <p className="mt-1 font-medium text-vistaar-text leading-relaxed">
                      "{selectedClaim.claim_text}"
                    </p>
                  </div>

                  <div className="space-y-3 font-mono">
                    <div className="grid grid-cols-2 gap-2 bg-vistaar-bg p-3 rounded border border-vistaar-border">
                      <div>
                        <span className="text-vistaar-muted block text-[10px] uppercase">Parameter</span>
                        <span className="font-bold text-vistaar-text">{selectedClaim.metric}</span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted block text-[10px] uppercase">Claimed Value</span>
                        <span className="font-bold text-vistaar-primary">
                          {selectedClaim.value} {selectedClaim.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted block text-[10px] uppercase">Station Location</span>
                        <span className="font-bold text-vistaar-text">{selectedClaim.location}</span>
                      </div>
                      <div>
                        <span className="text-vistaar-muted block text-[10px] uppercase">Verification Status</span>
                        <Badge variant="success">{selectedClaim.status}</Badge>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded border border-vistaar-border space-y-2">
                      <span className="text-vistaar-muted block text-[10px] uppercase">Deterministic Evidence Proof</span>
                      <p className="text-[11px] text-vistaar-text leading-relaxed font-sans">
                        {selectedClaim.evidence?.explanation}
                      </p>
                      <div className="pt-2 border-t border-vistaar-border/60 text-[10px] space-y-1 text-vistaar-muted">
                        <div>Dataset: <span className="text-vistaar-text font-mono">{selectedClaim.evidence?.dataset_id}</span></div>
                        <div>Record ID: <span className="text-vistaar-text font-mono">{selectedClaim.evidence?.record_id}</span></div>
                        <div>Timestamp: <span className="text-vistaar-text font-mono">{selectedClaim.evidence?.timestamp}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-vistaar-muted">
                  Select a scientific claim from the right panel to trace its source evidence.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Four-Track Content Editor & Claims Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="h-full flex flex-col">
            {/* Track Switcher Tabs */}
            <div className="border-b border-vistaar-border bg-vistaar-bg/50 px-4 pt-3 flex flex-wrap gap-2">
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
                <span>2. Social Media</span>
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
                <span>3. Classroom (8–12)</span>
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

            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
              {currentTrackData ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-vistaar-muted tracking-wider block mb-1">
                      {currentTrackData.track} Content Title
                    </span>
                    <h3 className="text-lg font-bold text-vistaar-text">
                      {currentTrackData.title}
                    </h3>
                    <p className="text-xs text-vistaar-muted mt-1 italic">
                      Target Audience: {currentTrackData.target_audience}
                    </p>
                  </div>

                  <div className="bg-vistaar-bg/60 p-4 rounded-lg border border-vistaar-border text-xs leading-relaxed font-sans whitespace-pre-line text-vistaar-text max-h-72 overflow-y-auto">
                    {currentTrackData.body}
                  </div>

                  {/* Claims List for this track */}
                  <div className="pt-2">
                    <span className="text-[11px] uppercase font-bold text-vistaar-text block mb-2">
                      Factual Scientific Claims ({currentTrackData.claims?.length || 0})
                    </span>
                    <div className="space-y-2">
                      {currentTrackData.claims?.map((clm: any) => (
                        <div
                          key={clm.claim_id}
                          onClick={() => setSelectedClaim(clm)}
                          className={`p-3 rounded border text-xs cursor-pointer transition-all flex items-start justify-between ${
                            selectedClaim?.claim_id === clm.claim_id
                              ? "border-vistaar-primary bg-blue-50/50 shadow-sm"
                              : "border-vistaar-border bg-white hover:bg-vistaar-bg"
                          }`}
                        >
                          <div className="space-y-1 pr-2">
                            <span className="font-semibold text-vistaar-text block">
                              {clm.claim_text}
                            </span>
                            <span className="text-[10px] text-vistaar-muted font-mono block">
                              Metric: {clm.metric} = {clm.value} {clm.unit}
                            </span>
                          </div>
                          <Badge variant="success">{clm.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-sm text-vistaar-muted">
                  Click "Generate Four-Track" to synthesize outreach drafts from real observations.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
