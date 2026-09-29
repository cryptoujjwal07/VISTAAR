"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Database,
  CloudSun,
  MapPin,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function StationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("maitri");
  const [explorerData, setExplorerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stParam = params.get("station");
      if (stParam) {
        setSelectedStationId(stParam.toLowerCase());
      }
    }
    async function loadStations() {
      try {
        const res = await fetchApi("/weather/stations");
        setStations(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("Failed to load stations", e);
      } finally {
        setLoading(false);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    if (!selectedStationId) return;
    async function loadRelationalGraph() {
      try {
        const res = await fetchApi(`/weather/stations/${selectedStationId}/explorer`);
        setExplorerData(res);
      } catch (e) {
        console.error("Failed to load station relational explorer", e);
      }
    }
    loadRelationalGraph();
  }, [selectedStationId]);

  const weatherSummary = explorerData?.weather_summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#FAF7F0] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-vistaar-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
            <Compass className="w-4 h-4" />
            <span>India&apos;s Polar &amp; High-Altitude Research Infrastructure</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Permanent Research Observatories &amp; Relational Explorer
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Database-linked exploration of Maitri, Bharati, Himadri, and Himansh connecting station metadata, expeditions, scientific documents, NPDC datasets, weather telemetry, media, education, and research topics.
          </p>
        </div>
        <Link href="/expeditions">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            Open Expedition Explorer <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-4 py-12 text-center text-sm text-vistaar-muted bg-white rounded-xl border border-vistaar-border">
            Loading station profiles from MongoDB Atlas...
          </div>
        ) : (
          stations.map((st) => {
            const isSel = selectedStationId === st.id;
            return (
              <Card
                key={st.id}
                onClick={() => setSelectedStationId(st.id)}
                className={`cursor-pointer transition-all bg-white ${
                  isSel
                    ? "border-2 border-vistaar-primary shadow-md"
                    : "border-vistaar-border hover:border-vistaar-primary/50"
                }`}
              >
                <CardHeader className="p-4 border-b border-vistaar-border bg-[#FAF7F0]/50">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="success">{st.status}</Badge>
                    <span className="text-xs font-mono font-bold text-vistaar-scientific">{st.region}</span>
                  </div>
                  <CardTitle className="text-base font-bold">{st.name}</CardTitle>
                  <CardDescription className="text-xs text-vistaar-muted flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{st.location}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs font-mono">
                  <div className="bg-[#FAF7F0] p-2.5 rounded border border-vistaar-border space-y-1">
                    <div>
                      Coords: <strong>{st.coordinates?.lat}°, {st.coordinates?.lng}°</strong>
                    </div>
                    <div>
                      Elevation: <strong>{st.coordinates?.elevation} m a.s.l.</strong>
                    </div>
                  </div>
                  <div className="flex gap-2 font-sans">
                    <Link href={`/weather?station=${st.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-[11px]">
                        Weather
                      </Button>
                    </Link>
                    <Link href={`/datasets?station=${st.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-[11px]">
                        Datasets
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Database-Linked Relational Station Explorer (Prompt 18) */}
      {explorerData && (
        <Card className="bg-white border-vistaar-border shadow-xs">
          <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="scientific">Relational Database Graph • {explorerData.station?.region}</Badge>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SHA-256 Provenance Preserved
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-vistaar-text mt-1">
                {explorerData.station?.name} — Connected Knowledge Graph
              </CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">
                Provider: {explorerData.station?.provider || "NCPOR / NPDC"} • Location: {explorerData.station?.location} ({explorerData.station?.coordinates?.lat}°, {explorerData.station?.coordinates?.lng}°, {explorerData.station?.coordinates?.elevation}m)
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Expeditions: {explorerData.expeditions?.length || 0}</Badge>
              <Badge variant="outline">Datasets: {explorerData.datasets?.length || 0}</Badge>
              <Badge variant="outline">PDF Reports: {explorerData.documents?.length || 0}</Badge>
              <Badge variant="outline">Research Briefs: {explorerData.published_research?.length || 0}</Badge>
              <Badge variant="outline">Lessons: {explorerData.education_modules?.length || 0}</Badge>
              <Badge variant="outline">Media: {explorerData.media_assets?.length || 0}</Badge>
            </div>
          </CardHeader>

          {/* Research Topics & Weather Intelligence Summary Strip */}
          <div className="px-6 py-4 bg-[#FAF7F0]/40 border-b border-vistaar-border grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-3.5 bg-white rounded-lg border border-vistaar-border">
              <div className="text-[11px] font-bold uppercase tracking-wider text-vistaar-primary flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5" /> Connected Research Topics
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(explorerData.research_topics || []).map((topic: string) => (
                  <span
                    key={topic}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-vistaar-border font-medium text-vistaar-text"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-vistaar-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-vistaar-scientific flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5" /> Connected Weather Telemetry
                </div>
                <div className="text-xs text-vistaar-text font-semibold mt-1">
                  {weatherSummary?.total_records || 0} Ingested NPDC Observations • Params: {(weatherSummary?.parameters || []).join(", ") || "N/A"}
                </div>
                <div className="text-[11px] font-mono text-vistaar-muted mt-0.5">
                  Dataset: {weatherSummary?.primary_dataset_id || "N/A"} • SHA-256: {(weatherSummary?.primary_dataset_sha256 || "").slice(0, 12)}...
                </div>
              </div>
              <Link href={`/weather?station=${selectedStationId}`}>
                <Button variant="primary" size="sm" className="text-xs whitespace-nowrap">
                  Inspect Telemetry <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* 1. Connected Expeditions */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
              <h4 className="font-bold uppercase tracking-wider text-vistaar-primary flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Expeditions ({explorerData.expeditions?.length || 0})</span>
                </span>
                <Link href="/expeditions" className="text-[11px] underline">
                  View All
                </Link>
              </h4>
              {(explorerData.expeditions || []).map((exp: any) => (
                <div key={exp.id} className="p-3 bg-white rounded border border-vistaar-border space-y-1.5">
                  <div className="font-bold text-vistaar-text">{exp.name}</div>
                  <div className="text-[10px] font-mono text-vistaar-muted">
                    ID: {exp.id} • Season: {exp.season} • {exp.vessel}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {exp.topics?.map((t: string) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-vistaar-primary">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <Link
                      href={`/expeditions?id=${exp.id}`}
                      className="inline-flex items-center text-[11px] font-semibold text-vistaar-primary hover:underline"
                    >
                      Explore Expedition Graph <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Connected NPDC Datasets */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
              <h4 className="font-bold uppercase tracking-wider text-vistaar-scientific flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>NPDC Datasets ({explorerData.datasets?.length || 0})</span>
                </span>
                <Link href={`/datasets?station=${selectedStationId}`} className="text-[11px] underline">
                  Catalog
                </Link>
              </h4>
              {(explorerData.datasets || []).map((ds: any) => (
                <div key={ds.dataset_id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                  <div className="font-bold text-vistaar-text">{ds.title}</div>
                  <div className="text-[10px] font-mono text-vistaar-muted">
                    ID: {ds.dataset_id} • File: {ds.original_filename || "NPDC CSV"}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700">
                    SHA-256: {ds.sha256?.slice(0, 16)}...
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Connected PDF Documents */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
              <h4 className="font-bold uppercase tracking-wider text-vistaar-text flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Scientific Documents ({explorerData.documents?.length || 0})</span>
                </span>
                <Link href="/documents" className="text-[11px] underline">
                  PDF Viewer
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

            {/* 4. Connected Published Research Stories */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
              <h4 className="font-bold uppercase tracking-wider text-vistaar-primary flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Published Research ({explorerData.published_research?.length || 0})</span>
                </span>
                <Link href="/research" className="text-[11px] underline">
                  All Stories
                </Link>
              </h4>
              {(explorerData.published_research || []).length === 0 ? (
                <div className="p-3 bg-white rounded border border-vistaar-border text-vistaar-muted">
                  No published public stories yet for this station.
                </div>
              ) : (
                (explorerData.published_research || []).map((pub: any) => (
                  <div key={pub.id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{pub.pib?.title || pub.id}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      ID: {pub.id} • Source Dataset: {pub.dataset_id} • v{pub.version || 1}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 5. Connected Classroom Education Modules */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
              <h4 className="font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Classroom Modules ({explorerData.education_modules?.length || 0})</span>
                </span>
                <Link href="/education" className="text-[11px] underline">
                  Classroom
                </Link>
              </h4>
              {(explorerData.education_modules || []).map((les: any) => (
                <div key={les.id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                  <div className="font-bold text-vistaar-text">{les.title}</div>
                  <div className="text-[10px] font-mono text-vistaar-muted">
                    NCERT Class {les.class_grade} • {les.subject || "Earth & Polar Sciences"}
                  </div>
                </div>
              ))}
            </div>

            {/* 6. Connected Media Assets */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAF7F0] border border-vistaar-border">
              <h4 className="font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media &amp; Press Assets ({explorerData.media_assets?.length || 0})</span>
                </span>
                <Link href="/media" className="text-[11px] underline">
                  Media Vault
                </Link>
              </h4>
              {(explorerData.media_assets || []).map((ast: any) => (
                <div key={ast.asset_id} className="p-3 bg-white rounded border border-vistaar-border space-y-1">
                  <div className="font-bold text-vistaar-text">{ast.title}</div>
                  <div className="text-[10px] font-mono text-vistaar-muted">
                    {ast.asset_id} • {ast.media_type} • {ast.license}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
