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
  Lock,
  History,
  RotateCcw,
  Edit3,
  Save,
  X
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

  // Prompt 08 Revision & Rollback State
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisionsList, setRevisionsList] = useState<any[]>([]);
  const [isSavingRevision, setIsSavingRevision] = useState(false);

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
    const confirmed = window.confirm(`Confirm rollback to version v${targetVersion}?`);
    if (!confirmed) return;

    try {
      const res = await fetchApi(`/publications/${publication.id}/rollback`, {
        method: "POST",
        body: JSON.stringify({
          target_version: targetVersion,
          reason: `Outreach reviewer triggered rollback to historical revision v${targetVersion}`
        })
      });
      const updatedPub = await fetchApi(`/publications/${publication.id}`);
      setPublication(updatedPub);
      setShowRevisionsModal(false);
      setActionMessage(`Successfully rollbacked to v${targetVersion}. Active version is now v${res.current_version}.`);
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
          track: activeTrack,
          title: editedTitle,
          summary: currentTrackData?.summary || "",
          body: editedBody
        })
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
            {publication && (
              <Badge variant="scientific" className="font-mono text-xs">
                v{publication.version || 1}
              </Badge>
            )}
            {publication?.approved_version && (
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 border-emerald-300">
                Approved: v{publication.approved_version}
              </Badge>
            )}
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

          {/* Revisions & Rollback Trigger */}
          {publication && (
            <Button
              size="sm"
              variant="outline"
              onClick={openRevisionsModal}
              className="flex items-center space-x-1.5"
            >
              <History className="w-4 h-4 text-vistaar-primary" />
              <span>Revisions</span>
            </Button>
          )}

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
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <span className="text-[10px] uppercase font-bold text-vistaar-muted tracking-wider block mb-1">
                        {currentTrackData.track} Content Title
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full text-lg font-bold text-vistaar-text px-2 py-1 border border-vistaar-border rounded bg-white shadow-sm"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-vistaar-text">
                          {currentTrackData.title}
                        </h3>
                      )}
                      <p className="text-xs text-vistaar-muted mt-1 italic">
                        Target Audience: {currentTrackData.target_audience}
                      </p>
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

                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-vistaar-muted uppercase">
                        Track Content Body (Edits automatically bump revision version)
                      </label>
                      <textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        rows={12}
                        className="w-full bg-white p-4 rounded-lg border border-vistaar-border text-xs leading-relaxed font-sans text-vistaar-text focus:outline-none focus:ring-1 focus:ring-vistaar-primary shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="bg-vistaar-bg/60 p-4 rounded-lg border border-vistaar-border text-xs leading-relaxed font-sans whitespace-pre-line text-vistaar-text max-h-72 overflow-y-auto">
                      {currentTrackData.body}
                    </div>
                  )}

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

      {/* Revision History & Rollback Modal */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-vistaar-border w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-vistaar-border flex items-center justify-between bg-vistaar-bg/40">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-vistaar-primary" />
                <h2 className="text-base font-bold text-vistaar-text">
                  Immutable Revision History & Rollback
                </h2>
                <Badge variant="scientific">Current: v{publication?.version || 1}</Badge>
                {publication?.approved_version && (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    Approved: v{publication.approved_version}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setShowRevisionsModal(false)}
                className="p-1 rounded-md text-vistaar-muted hover:text-vistaar-text hover:bg-vistaar-bg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {revisionsList.length === 0 ? (
                <div className="text-center py-12 text-vistaar-muted text-xs">
                  No revisions recorded yet. Initial version (v1) is active. Edits made to any track will record historical snapshots here.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-vistaar-bg/80 border-b border-vistaar-border text-vistaar-muted uppercase text-[10px]">
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
                        <tr key={rev.revision_id || rev.version} className={isCurrent ? "bg-blue-50/40" : "hover:bg-vistaar-bg/40"}>
                          <td className="p-2.5 font-bold text-vistaar-primary">
                            v{rev.version} {isCurrent && <span className="text-[10px] text-emerald-700 font-sans font-normal">(Active)</span>}
                          </td>
                          <td className="p-2.5 uppercase font-semibold">{rev.track || "ALL"}</td>
                          <td className="p-2.5 text-vistaar-muted truncate max-w-[120px]">{rev.author_email || "system"}</td>
                          <td className="p-2.5 text-vistaar-muted">{rev.timestamp?.replace("T", " ").slice(0, 19)}</td>
                          <td className="p-2.5 font-sans text-vistaar-text truncate max-w-xs">{rev.title || rev.summary || "Revision snapshot"}</td>
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

            <div className="p-3 border-t border-vistaar-border bg-vistaar-bg/30 flex justify-between items-center text-xs text-vistaar-muted">
              <span>All rollbacks create an audited new version without destroying historical snapshots.</span>
              <Button size="sm" variant="ghost" onClick={() => setShowRevisionsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
