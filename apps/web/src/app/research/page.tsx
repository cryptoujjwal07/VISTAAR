"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  ShieldCheck,
  Languages,
  Users,
  Download,
  ExternalLink,
  CheckCircle2,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi, API_BASE_URL } from "@/lib/api";

export default function ResearchPage() {
  const [publishedItems, setPublishedItems] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [persona, setPersona] = useState<"scientist" | "journalist" | "teacher" | "student">("scientist");
  const [targetLang, setTargetLang] = useState<string>("en");
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublicResearch() {
      setLoading(true);
      try {
        const [pubs, docs] = await Promise.all([
          fetchApi("/publications/published"),
          fetchApi("/documents"),
        ]);
        setPublishedItems(Array.isArray(pubs) ? pubs : []);
        setDocuments(docs?.items || []);
      } catch (e) {
        console.error("Failed to load research portal data", e);
      } finally {
        setLoading(false);
      }
    }
    loadPublicResearch();
  }, []);

  async function handleTranslate(pubId: string, text: string, lang: string) {
    if (lang === "en") return;
    const key = `${pubId}_${lang}`;
    if (translatedMap[key]) return;
    try {
      const res = await fetchApi("/localization/translate", {
        method: "POST",
        body: JSON.stringify({
          text,
          target_language: lang,
          source_language: "en",
        }),
      });
      setTranslatedMap((prev) => ({ ...prev, [key]: res.translated_text }));
    } catch (e) {
      console.error("Translation error", e);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#FAF7F0] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-vistaar-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-scientific uppercase tracking-wide mb-1">
            <BookOpen className="w-4 h-4" />
            <span>NCPOR / MoES Verified Public Knowledge Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Published Polar Research & Verified Bulletins
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Displays strictly human-approved, published scientific outreach and cryptographically indexed expedition technical reports.
          </p>
        </div>

        {/* Persona & Multilingual Switcher (Prompt 17 & 22) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#FAF7F0] p-1 rounded-md border border-vistaar-border">
            {(["scientist", "journalist", "teacher", "student"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-all ${
                  persona === p
                    ? "bg-vistaar-primary text-white shadow-xs"
                    : "text-vistaar-muted hover:text-vistaar-text"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5">
            <Languages className="w-4 h-4 text-vistaar-scientific" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded border border-vistaar-border bg-white text-vistaar-text"
            >
              <option value="en">English (Original)</option>
              <option value="hi">Hindi (हिन्दी — Bhashini)</option>
              <option value="ta">Tamil (தமிழ் — Bhashini)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 1: Indexed Scientific Technical Reports (PDF Intelligence) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-vistaar-text flex items-center space-x-2">
            <FileText className="w-5 h-5 text-vistaar-primary" />
            <span>Peer-Reviewed & Technical Expedition Monographs ({documents.length})</span>
          </h2>
          <Link href="/documents">
            <Button size="sm" variant="outline" className="text-xs">
              Open Document AI & RAG Studio
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <Card key={doc.document_id} className="bg-white border-vistaar-border shadow-sm">
              <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/50">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="scientific">{doc.region || "Polar"}</Badge>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    SHA-256: {doc.checksum_sha256?.slice(0, 12)}...
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-vistaar-text">{doc.title}</CardTitle>
                <CardDescription className="text-xs font-mono">
                  Document ID: {doc.document_id} • Pages: {doc.page_count} • Station: {doc.station_id?.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex items-center justify-between text-xs">
                <span className="text-vistaar-muted">
                  Extracted Chunks: <strong>{doc.chunk_count}</strong> | Tables: <strong>{doc.table_count || 0}</strong>
                </span>
                <Link href="/documents" className="text-vistaar-primary font-semibold hover:underline flex items-center space-x-1">
                  <span>Inspect Bounding Boxes & Citations</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 2: Approved & Published Multi-Track Bulletins */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-vistaar-text flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>Official Published Outreach Bulletins ({publishedItems.length})</span>
        </h2>

        {loading ? (
          <div className="py-16 text-center text-sm text-vistaar-muted bg-white rounded-lg border border-vistaar-border">
            Loading approved publications from MongoDB Atlas...
          </div>
        ) : publishedItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-vistaar-border space-y-2">
            <p className="text-sm font-semibold text-vistaar-text">
              No unapproved drafts are shown on the public portal.
            </p>
            <p className="text-xs text-vistaar-muted">
              Approve and publish a verified bulletin in the Scientific Review Workspace to display it here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {publishedItems.map((pub) => {
              const activeTrackBlock =
                persona === "student" || persona === "teacher"
                  ? pub.education || pub.pib
                  : targetLang === "hi" && pub.vernacular
                  ? pub.vernacular
                  : pub.pib;
              const bodyText =
                translatedMap[`${pub.id}_${targetLang}`] || activeTrackBlock?.body || "";

              return (
                <Card key={pub.id} className="bg-white border-vistaar-border shadow-sm">
                  <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="success">PUBLISHED (v{pub.version || 1})</Badge>
                        <Badge variant="scientific">{pub.station_id?.toUpperCase()}</Badge>
                        <span className="text-xs font-mono text-vistaar-muted">
                          Dataset: {pub.dataset_id}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold text-vistaar-text">
                        {activeTrackBlock?.title || pub.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {targetLang !== "en" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTranslate(pub.id, activeTrackBlock?.body || "", targetLang)}
                          className="text-xs"
                        >
                          Translate via Bhashini ({targetLang.toUpperCase()})
                        </Button>
                      )}
                      <a
                        href={`${API_BASE_URL}/publications/${pub.id}/export/pib-html`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1">
                          <Download className="w-3.5 h-3.5" />
                          <span>Export PIB Release</span>
                        </Button>
                      </a>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div className="p-4 bg-[#FAF7F0] rounded border border-vistaar-border text-xs leading-relaxed whitespace-pre-line font-sans text-vistaar-text">
                      {bodyText}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-vistaar-muted">
                      <span>Approved By: {pub.approved_by || "NCPOR Editorial Board"}</span>
                      <span>Published At: {pub.published_at?.slice(0, 19).replace("T", " ")} UTC</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
