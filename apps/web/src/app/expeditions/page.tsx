"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import {
  Compass,
  Calendar,
  Anchor,
  MapPin,
  ArrowRight,
  Database,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  BookOpen,
  ShieldCheck,
  Clock,
  Tag,
} from "lucide-react";

export default function ExpeditionsPage() {
  const [expeditions, setExpeditions] = useState<any[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string>("isea-43");
  const [explorerData, setExplorerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get("id");
      if (idParam) {
        setSelectedExpId(idParam.toLowerCase());
      }
    }
    async function loadExpeditions() {
      try {
        const res = await fetchApi("/weather/expeditions");
        if (Array.isArray(res) && res.length > 0) {
          setExpeditions(res);
        }
      } catch (e) {
        console.error("Failed to load expeditions from API", e);
      } finally {
        setLoading(false);
      }
    }
    loadExpeditions();
  }, []);

  useEffect(() => {
    if (!selectedExpId) return;
    async function loadExpeditionGraph() {
      try {
        const res = await fetchApi(`/weather/expeditions/${selectedExpId}/explorer`);
        setExplorerData(res);
      } catch (e) {
        console.error("Failed to load expedition relational graph", e);
      }
    }
    loadExpeditionGraph();
  }, [selectedExpId]);

  const activeExp = explorerData?.expedition;

  return (
    <div className="min-h-screen bg-[#FAF7F0] pb-16">
      <PageHeader
        title="Indian Scientific Expeditions & Relational Explorer"
        subtitle="Database-linked chronicle of India's polar explorations across Antarctica, the Arctic, and the Himalayan Third Pole with full SHA-256 dataset and document provenance."
        badge="NCPOR National Missions"
        breadcrumbs={[{ label: "Expeditions" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Expedition Selector Cards (Database-Backed Counts) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-sm text-vistaar-muted bg-white rounded-xl border border-vistaar-border">
              Loading expeditions and relational database counts...
            </div>
          ) : (
            expeditions.map((exp) => {
              const isSelected = selectedExpId === exp.id;
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id)}
                  className={`cursor-pointer bg-white rounded-xl border p-6 transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-2 border-vistaar-primary shadow-md"
                      : "border-vistaar-border hover:border-vistaar-primary/50 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-semibold text-vistaar-scientific flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        {exp.id.toUpperCase()}
                      </span>
                      <StatusIndicator
                        status={exp.status === "ACTIVE" ? "success" : "neutral"}
                        label={exp.status === "ACTIVE" ? "Operational" : "Archived"}
                        pulse={exp.status === "ACTIVE"}
                      />
                    </div>

                    <h3 className="text-base font-bold text-vistaar-text leading-snug">
                      {exp.name}
                    </h3>
                    <p className="text-xs text-vistaar-muted mt-2 line-clamp-2">
                      {exp.objectives}
                    </p>

                    <div className="mt-4 pt-3 border-t border-vistaar-border/60 space-y-1.5 text-xs text-vistaar-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-vistaar-primary" />
                        <span>{exp.season}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5 text-vistaar-primary" />
                        <span className="truncate">{exp.vessel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-vistaar-primary" />
                        <span className="truncate">{(exp.stations || []).join(" • ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-vistaar-border/60 flex flex-wrap gap-1.5 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-vistaar-border">
                      Datasets: {exp.counts?.datasets ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-vistaar-border">
                      PDFs: {exp.counts?.documents ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-vistaar-border">
                      Stories: {exp.counts?.published_content ?? 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Expedition Relational Graph (Prompt 18) */}
        {explorerData && activeExp && (
          <Card className="bg-white border-vistaar-border shadow-xs">
            {/* Overview Header */}
            <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="scientific">Expedition Knowledge Graph • {activeExp.id.toUpperCase()}</Badge>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {explorerData.provenance?.provider}
                  </span>
                </div>
                <CardTitle className="text-2xl font-extrabold text-vistaar-text pt-1">
                  {activeExp.name}
                </CardTitle>
                <CardDescription className="text-xs text-vistaar-muted max-w-3xl">
                  {activeExp.objectives}
                </CardDescription>
                <div className="text-xs font-mono text-vistaar-scientific pt-1">
                  Lead: {activeExp.leader} • Vessel/Platform: {activeExp.vessel} • Season: {activeExp.season}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(activeExp.station_ids || []).map((sid: string) => (
                  <Link key={sid} href={`/stations?station=${sid}`}>
                    <Button variant="outline" size="sm" className="text-xs font-mono uppercase">
                      Station: {sid} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                ))}
              </div>
            </CardHeader>

            {/* Timeline & Scientific Topics */}
            <div className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/30 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-vistaar-primary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Expedition Chronological Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(explorerData.timeline || []).map((step: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white rounded-lg border border-vistaar-border space-y-1"
                    >
                      <div className="text-[11px] font-mono font-bold text-vistaar-scientific">
                        Phase {idx + 1} • {step.period}
                      </div>
                      <div className="text-xs font-bold text-vistaar-text">{step.phase}</div>
                      <div className="text-[11px] text-vistaar-muted">{step.description}</div>
                      <div className="text-[10px] font-mono text-vistaar-primary pt-1">
                        Location: {step.station}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-vistaar-scientific flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Scientific Topics &amp; Provenance
                </h4>
                <div className="p-4 bg-white rounded-lg border border-vistaar-border space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(explorerData.scientific_topics || []).map((t: string) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-vistaar-border font-medium text-vistaar-text"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-vistaar-border text-[11px] font-mono text-vistaar-muted space-y-1">
                    <div className="font-semibold text-vistaar-text">SHA-256 Provenance Fingerprints:</div>
                    {(explorerData.provenance?.dataset_sha256_fingerprints || []).map((fp: any) => (
                      <div key={fp.dataset_id} className="truncate">
                        • {fp.dataset_id}: {fp.sha256?.slice(0, 16)}...
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Database Entities: Datasets, Documents, Public Content, Education, Media */}
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {/* 1. Connected NPDC Datasets */}
              <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
                <h4 className="font-bold uppercase tracking-wider text-vistaar-scientific flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>NPDC Datasets ({explorerData.datasets?.length || 0})</span>
                  </span>
                  <Link href="/datasets" className="text-[11px] underline">
                    Explore
                  </Link>
                </h4>
                {(explorerData.datasets || []).map((ds: any) => (
                  <div key={ds.dataset_id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{ds.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      ID: {ds.dataset_id} • Station: {ds.station_id?.toUpperCase()}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700">
                      SHA-256: {ds.sha256?.slice(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Connected Scientific Documents */}
              <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
                <h4 className="font-bold uppercase tracking-wider text-vistaar-text flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Scientific Documents ({explorerData.documents?.length || 0})</span>
                  </span>
                  <Link href="/documents" className="text-[11px] underline">
                    PDF Library
                  </Link>
                </h4>
                {(explorerData.documents || []).map((doc: any) => (
                  <div key={doc.document_id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{doc.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      {doc.document_id} • {doc.page_count} pages • {doc.chunk_count} chunks
                    </div>
                    {doc.sha256 && (
                      <div className="text-[10px] font-mono text-emerald-700">
                        SHA-256: {doc.sha256.slice(0, 16)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 3. Related Public Content (Strictly PUBLISHED) */}
              <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
                <h4 className="font-bold uppercase tracking-wider text-vistaar-primary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Related Public Content ({explorerData.related_public_content?.length || 0})</span>
                  </span>
                  <Link href="/research" className="text-[11px] underline">
                    Research Portal
                  </Link>
                </h4>
                {(explorerData.related_public_content || []).map((pub: any) => (
                  <div key={pub.id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{pub.pib?.title || pub.id}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      Status: {pub.status} • Dataset: {pub.dataset_id} • v{pub.version || 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. Related Education Modules */}
              <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border md:col-span-1">
                <h4 className="font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Related Education ({explorerData.related_education?.length || 0})</span>
                  </span>
                  <Link href="/education" className="text-[11px] underline">
                    Classroom
                  </Link>
                </h4>
                {(explorerData.related_education || []).map((les: any) => (
                  <div key={les.id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{les.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      NCERT Class {les.class_grade} • Station: {les.station}
                    </div>
                  </div>
                ))}
              </div>

              {/* 5. Connected Media Assets */}
              <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border md:col-span-2">
                <h4 className="font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Expedition Media &amp; Press Assets ({explorerData.media_assets?.length || 0})</span>
                  </span>
                  <Link href="/media" className="text-[11px] underline">
                    Press Kits
                  </Link>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(explorerData.media_assets || []).map((ast: any) => (
                    <div key={ast.asset_id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                      <div className="font-bold text-vistaar-text">{ast.title}</div>
                      <div className="text-[10px] font-mono text-vistaar-muted">
                        {ast.asset_id} • {ast.media_type} • {ast.license}
                      </div>
                      <div className="text-[10px] text-vistaar-muted truncate">
                        Source: {ast.attribution || "NCPOR / MoES"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
