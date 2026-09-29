"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Sparkles,
  Navigation,
  ShieldCheck,
  Database,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function ExplorePage() {
  // Unified Search & Hybrid Discovery State (Prompt 23)
  const [searchQuery, setSearchQuery] = useState("katabatic wind");
  const [stationFilter, setStationFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [ragResult, setRagResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Expedition Explorer State (Prompt 18)
  const [activeExpedition, setActiveExpedition] = useState("isea43");

  const EXPEDITIONS = [
    {
      id: "isea43",
      title: "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
      leader: "National Centre for Polar and Ocean Research (NCPOR)",
      period: "November 2023 – March 2024",
      sector: "Larsemann Hills & Schirmacher Oasis",
      tempRange: "-4.2°C to -38.6°C",
      distanceCovered: "14,800 Nautical Miles",
      summary:
        "Multidisciplinary voyage investigating Antarctic ice-shelf dynamics, paleoclimate ice-core records, and katabatic wind boundary-layer telemetry at Maitri and Bharati.",
      vessel: "Polar Vessel MV Vasiliy Golovnin",
      keyInstruments: [
        "HATPRO Microwave Radiometer (Bharati)",
        "MRR-2 Micro Rain Radar",
        "Synoptic AWS Anemometers & Barometers (Maitri)",
      ],
      waypoints: [
        { name: "Cape Town Staging Port", lat: "-33.92°", lng: "18.42°", date: "22 Nov 2023" },
        { name: "Southern Ocean Polar Front", lat: "-50.10°", lng: "25.40°", date: "01 Dec 2023" },
        { name: "Maitri Station (Schirmacher Oasis)", lat: "-70.76°", lng: "11.73°", date: "14 Dec 2023" },
        { name: "Bharati Station (Larsemann Hills)", lat: "-69.40°", lng: "76.19°", date: "28 Dec 2023" },
      ],
    },
    {
      id: "arctic2024",
      title: "1st Indian Winter Arctic Expedition — Ny-Ålesund (79°N)",
      leader: "Arctic Sciences Division, NCPOR",
      period: "Year-Round Campaign 2023–2024",
      sector: "Kongsfjorden, Svalbard Archipelago",
      tempRange: "+4.5°C to -28.2°C",
      distanceCovered: "Continuous Fjord & Station Telemetry",
      summary:
        "Year-round observation of Arctic sea-ice retreat, hydrometeor phase transitions via laser disdrometry, and IndARC sub-surface mooring telemetry.",
      vessel: "Svalbard Polar Research Logistics",
      keyInstruments: [
        "OTT-PARSIVEL Optical Disdrometer",
        "Micro Rain Radar (MRR-2)",
        "IndARC Sub-surface Oceanographic Mooring",
      ],
      waypoints: [
        { name: "Longyearbyen Staging Hub", lat: "78.22°", lng: "15.65°", date: "Dec 2023" },
        { name: "Himadri Station (Ny-Ålesund)", lat: "78.92°", lng: "11.92°", date: "Jan 2024" },
        { name: "Kongsfjorden IndARC Mooring Site", lat: "79.02°", lng: "11.60°", date: "Feb 2024" },
      ],
    },
    {
      id: "himalaya2024",
      title: "Chandra Basin Glaciological Monitoring Campaign",
      leader: "Cryosphere & Climate Group, NCPOR",
      period: "Continuous Monitoring (2016 – Present)",
      sector: "Spiti Valley, Himachal Pradesh (4,080 m)",
      tempRange: "+16.8°C to -34.6°C",
      distanceCovered: "5 Benchmark Glacier Basins",
      summary:
        "Third Pole glaciology campaign tracking Sutri Dhaka and Batal glaciers to quantify snow water equivalent (SWE) and seasonal ablation rates.",
      vessel: "High-Altitude Terrestrial Convoy",
      keyInstruments: [
        "Himansh High-Altitude Automatic Weather Station",
        "Upwelling/Downwelling Pyranometers (Albedo)",
        "Glacier Ablation Stakes & DGPS",
      ],
      waypoints: [
        { name: "Manali Logistics Base", lat: "32.24°", lng: "77.18°", date: "Field Staging" },
        { name: "Himansh Station (4,080 m)", lat: "32.40°", lng: "77.61°", date: "Continuous AWS" },
        { name: "Sutri Dhaka Glacier Terminus (4,500 m)", lat: "32.45°", lng: "77.68°", date: "Mass Balance Site" },
      ],
    },
  ];

  async function executeUnifiedSearch(qOverride?: string) {
    const q = (qOverride ?? searchQuery).trim();
    if (!q) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q });
      if (stationFilter) params.set("station_id", stationFilter);
      if (regionFilter) params.set("region", regionFilter);
      if (contentTypeFilter && contentTypeFilter !== "all") params.set("content_type", contentTypeFilter);

      const [res, rag] = await Promise.all([
        fetchApi(`/search?${params.toString()}`),
        fetchApi("/search/rag", {
          method: "POST",
          body: JSON.stringify({
            query: q,
            station_id: stationFilter || null,
            region: regionFilter || null,
            max_evidence_chunks: 4,
          }),
        }),
      ]);
      setSearchResults(res);
      setRagResult(rag);
      setSuggestions([]);
    } catch (e) {
      console.error("Unified search error", e);
    } finally {
      setSearching(false);
    }
  }

  async function handleQueryChange(val: string) {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      try {
        const ac = await fetchApi(`/search/autocomplete?q=${encodeURIComponent(val.trim())}`);
        setSuggestions(ac.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    executeUnifiedSearch("katabatic wind");
  }, [stationFilter, regionFilter, contentTypeFilter]);

  const current = EXPEDITIONS.find((e) => e.id === activeExpedition) || EXPEDITIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 bg-[#FAF7F0] min-h-screen">
      {/* Unified Search & Hybrid Discovery Hub (Prompt 23) */}
      <Card className="bg-white border-vistaar-border shadow-sm">
        <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/60">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
            <Search className="w-4 h-4" />
            <span>Unified Multi-Domain Discovery & Hybrid RAG Search</span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-vistaar-text">
            Explore India&apos;s Polar Knowledge Repository
          </CardTitle>
          <CardDescription className="text-xs text-vistaar-muted">
            Search across NPDC datasets, expedition PDF monographs, stations, published bulletins, classroom modules, and accredited media.
          </CardDescription>

          {/* Search Input & Filters */}
          <div className="pt-4 space-y-3">
            <div className="relative flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-vistaar-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeUnifiedSearch()}
                  placeholder="Search polar datasets, katabatic winds, glacier mass balance, instruments..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-vistaar-border bg-white text-vistaar-text focus:outline-none focus:border-vistaar-primary"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-vistaar-border rounded-md shadow-lg py-1 text-xs">
                    {suggestions.map((sug, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSearchQuery(sug);
                          setSuggestions([]);
                          executeUnifiedSearch(sug);
                        }}
                        className="px-3 py-1.5 hover:bg-[#FAF7F0] cursor-pointer text-vistaar-text"
                      >
                        {sug}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={() => executeUnifiedSearch()} disabled={searching}>
                {searching ? "Searching..." : "Hybrid Search"}
              </Button>
            </div>

            {/* Filter Selectors & Facet Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-vistaar-border bg-white text-xs"
                >
                  <option value="">All Polar Regions</option>
                  <option value="Antarctica">Antarctica</option>
                  <option value="Arctic">Arctic</option>
                  <option value="Himalayas">Himalayas (Third Pole)</option>
                </select>

                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-vistaar-border bg-white text-xs"
                >
                  <option value="">All Stations</option>
                  <option value="maitri">Maitri</option>
                  <option value="bharati">Bharati</option>
                  <option value="himadri">Himadri</option>
                  <option value="himansh">Himansh</option>
                </select>

                <select
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-vistaar-border bg-white text-xs"
                >
                  <option value="all">All Content Types</option>
                  <option value="datasets">NPDC Datasets</option>
                  <option value="documents">PDF Technical Reports</option>
                  <option value="publications">Published Bulletins</option>
                  <option value="education">Classroom Lessons</option>
                  <option value="media">Media Assets</option>
                </select>
              </div>

              {searchResults?.facets && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <Badge variant="scientific">Total Hits: {searchResults.total_count}</Badge>
                  <Badge variant="outline">Datasets: {searchResults.facets.datasets}</Badge>
                  <Badge variant="outline">PDFs: {searchResults.facets.documents}</Badge>
                  <Badge variant="outline">Education: {searchResults.facets.education}</Badge>
                  <Badge variant="outline">Media: {searchResults.facets.media}</Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* AI Evidence Synthesis Banner */}
          {ragResult && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-vistaar-primary flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Hybrid RAG Evidence Synthesis</span>
                </span>
                <Badge variant={ragResult.status === "GROUNDED" ? "success" : "warning"}>
                  {ragResult.status || "GROUNDED"}
                </Badge>
              </div>
              <p className="text-xs text-vistaar-text leading-relaxed whitespace-pre-line">
                {ragResult.answer}
              </p>
            </div>
          )}

          {/* Unified Search Results Grid */}
          {searchResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Datasets Column */}
              <div className="p-4 rounded-lg border border-vistaar-border bg-[#FAF7F0]/50 space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-vistaar-scientific flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>NPDC Datasets ({searchResults.datasets?.length || 0})</span>
                </h4>
                {(searchResults.datasets || []).slice(0, 3).map((ds: any) => (
                  <div key={ds.dataset_id} className="p-2.5 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{ds.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      ID: {ds.dataset_id} • Station: {ds.station_name} • SHA-256: {ds.sha256?.slice(0, 10)}...
                    </div>
                  </div>
                ))}
              </div>

              {/* PDF Documents Column */}
              <div className="p-4 rounded-lg border border-vistaar-border bg-[#FAF7F0]/50 space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-vistaar-primary flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Scientific PDFs ({searchResults.documents?.length || 0})</span>
                </h4>
                {(searchResults.documents || []).slice(0, 3).map((doc: any) => (
                  <div key={doc.document_id} className="p-2.5 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{doc.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      Doc ID: {doc.document_id} • Pages: {doc.page_count} • Chunks: {doc.chunk_count}
                    </div>
                  </div>
                ))}
              </div>

              {/* Education & Media Column */}
              <div className="p-4 rounded-lg border border-vistaar-border bg-[#FAF7F0]/50 space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Classroom & Media ({(searchResults.education?.length || 0) + (searchResults.media?.length || 0)})</span>
                </h4>
                {(searchResults.education || []).slice(0, 2).map((les: any) => (
                  <div key={les.id} className="p-2.5 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{les.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      NCERT Class {les.class_grade} • {les.station}
                    </div>
                  </div>
                ))}
                {(searchResults.media || []).slice(0, 2).map((m: any) => (
                  <div key={m.asset_id} className="p-2.5 bg-white rounded border border-vistaar-border space-y-1">
                    <div className="font-bold text-vistaar-text">{m.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      {m.media_type} • {m.provider} ({m.license})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expedition Traverse Explorer (Prompt 18 & 33 — Warm Beige & White Institutional Identity) */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vistaar-border pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-scientific uppercase tracking-wide mb-1">
              <Compass className="w-4 h-4" />
              <span>National Polar Explorations Archive</span>
            </div>
            <h2 className="text-2xl font-bold text-vistaar-text">
              Indian Scientific Expeditions & Field Traverses
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXPEDITIONS.map((exp) => (
              <button
                key={exp.id}
                onClick={() => setActiveExpedition(exp.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                  activeExpedition === exp.id
                    ? "bg-vistaar-primary text-white border-vistaar-primary shadow-sm"
                    : "bg-white text-vistaar-text border-vistaar-border hover:bg-[#FAF7F0]"
                }`}
              >
                {exp.title.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Card className="bg-white border-vistaar-border shadow-sm">
              <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="scientific">{current.sector}</Badge>
                  <span className="text-xs font-mono text-vistaar-muted">{current.period}</span>
                </div>
                <CardTitle className="text-xl font-bold text-vistaar-text">{current.title}</CardTitle>
                <CardDescription className="text-xs text-vistaar-muted mt-1">
                  Lead Institution: <strong>{current.leader}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-xs">
                <p className="text-vistaar-text leading-relaxed text-sm">{current.summary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF7F0] p-4 rounded-lg border border-vistaar-border font-mono">
                  <div>
                    <span className="text-[10px] text-vistaar-muted uppercase block">Observed Temp Window</span>
                    <span className="font-bold text-vistaar-primary text-xs">{current.tempRange}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-vistaar-muted uppercase block">Logistics / Vessel</span>
                    <span className="font-bold text-vistaar-text text-xs">{current.vessel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-vistaar-muted uppercase block">Coverage</span>
                    <span className="font-bold text-vistaar-scientific text-xs">{current.distanceCovered}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-vistaar-text flex items-center space-x-1.5">
                    <Navigation className="w-4 h-4 text-vistaar-primary" />
                    <span>Sequential Field Waypoints & Coordinates</span>
                  </h4>
                  <div className="space-y-2.5">
                    {current.waypoints.map((wp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF7F0]/60 rounded border border-vistaar-border flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-vistaar-text block">{wp.name}</span>
                          <span className="text-[10px] text-vistaar-muted font-mono">{wp.date}</span>
                        </div>
                        <span className="text-[11px] font-mono text-vistaar-scientific font-semibold">
                          {wp.lat}, {wp.lng}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border-vistaar-border shadow-sm">
              <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-vistaar-text">
                  Calibrated Scientific Instruments Deployed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5 text-xs">
                {current.keyInstruments.map((inst, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#FAF7F0] rounded border border-vistaar-border font-mono text-vistaar-text flex items-center justify-between"
                  >
                    <span>{inst}</span>
                    <Badge variant="success">CALIBRATED</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white border-vistaar-border shadow-sm">
              <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-vistaar-text">
                  Connected Repository Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-2 gap-3 text-xs">
                <Link href="/stations">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Station Explorer
                  </Button>
                </Link>
                <Link href="/datasets">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    NPDC Datasets
                  </Button>
                </Link>
                <Link href="/weather">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Weather Series
                  </Button>
                </Link>
                <Link href="/documents">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    PDF & RAG Studio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
