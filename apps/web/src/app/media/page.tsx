"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  Download,
  ShieldCheck,
  Eye,
  X,
  Database,
  Compass,
  FileText,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi, API_BASE_URL } from "@/lib/api";

export default function MediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [pressKitStation, setPressKitStation] = useState<string>("bharati");
  const [stationAssetFilter, setStationAssetFilter] = useState<string>("");
  const [expeditionFilter, setExpeditionFilter] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [pressKit, setPressKit] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMedia() {
      setLoading(true);
      try {
        const assetParams = new URLSearchParams();
        if (stationAssetFilter) assetParams.set("station_id", stationAssetFilter);
        if (expeditionFilter) assetParams.set("expedition_id", expeditionFilter);
        if (topicFilter) assetParams.set("topic", topicFilter);
        if (mediaTypeFilter) assetParams.set("media_type", mediaTypeFilter);
        if (dateFilter) assetParams.set("date", dateFilter);
        if (sourceFilter) assetParams.set("source", sourceFilter);

        const [assetRes, kitRes] = await Promise.all([
          fetchApi(`/media/assets?${assetParams.toString()}`),
          fetchApi(`/media/press-kit?station_id=${pressKitStation}`),
        ]);
        const list = Array.isArray(assetRes) ? assetRes : [];
        setAssets(list);
        setPressKit(kitRes);
        if (list.length > 0 && !selectedAsset) {
          setSelectedAsset(list[0]);
        }
      } catch (e) {
        console.error("Failed to load media assets", e);
      } finally {
        setLoading(false);
      }
    }
    loadMedia();
  }, [
    pressKitStation,
    stationAssetFilter,
    expeditionFilter,
    topicFilter,
    mediaTypeFilter,
    dateFilter,
    sourceFilter,
  ]);

  function resolveAssetUrl(url: string) {
    if (!url) return "";
    return url.startsWith("/api/v1") ? `${API_BASE_URL}${url.replace("/api/v1", "")}` : url;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#FAF7F0] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-vistaar-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
            <Newspaper className="w-4 h-4" />
            <span>Official Media &amp; Accredited Press Dissemination Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            VISTAAR Media Library &amp; Journalist Press Kits
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Accredited polar photography, field videos, scientific figures, infographics, archival documents, and verified social assets with GODL rights metadata and NPDC provenance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Restricted Assets Protected</span>
        </div>
      </div>

      {/* Public Media Library Grid, 6 Filters & Preview Inspector (Prompt 20) */}
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-vistaar-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-vistaar-text">
                Official Polar Media, Figures, Videos &amp; Social Assets ({assets.length})
              </h2>
              <p className="text-xs text-vistaar-muted">
                Filter by station, expedition, scientific topic, media type, date, or provider source. Click any asset to inspect full rights metadata and related research.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setStationAssetFilter("");
                setExpeditionFilter("");
                setTopicFilter("");
                setMediaTypeFilter("");
                setDateFilter("");
                setSourceFilter("");
              }}
            >
              Reset Filters
            </Button>
          </div>

          {/* All 6 Required Filters (Prompt 20: station, expedition, topic, media type, date, source) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <select
              value={stationAssetFilter}
              onChange={(e) => setStationAssetFilter(e.target.value)}
              className="px-2.5 py-2 rounded border border-vistaar-border bg-[#FAF7F0] text-vistaar-text font-medium"
            >
              <option value="">All Stations</option>
              <option value="maitri">Maitri (Antarctica)</option>
              <option value="bharati">Bharati (Antarctica)</option>
              <option value="himadri">Himadri (Arctic)</option>
              <option value="himansh">Himansh (Himalayas)</option>
            </select>

            <select
              value={expeditionFilter}
              onChange={(e) => setExpeditionFilter(e.target.value)}
              className="px-2.5 py-2 rounded border border-vistaar-border bg-[#FAF7F0] text-vistaar-text font-medium"
            >
              <option value="">All Expeditions</option>
              <option value="isea-43">43-ISEA (Antarctica)</option>
              <option value="arctic-winter-1">1st Winter Arctic</option>
              <option value="himansh-himalaya-8">8th Himalaya Campaign</option>
            </select>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-2.5 py-2 rounded border border-vistaar-border bg-[#FAF7F0] text-vistaar-text font-medium"
            >
              <option value="">All Topics</option>
              <option value="Meteorology">Meteorology &amp; Wind</option>
              <option value="Glaciology">Glaciology &amp; Mass Balance</option>
              <option value="Arctic Amplification">Arctic Amplification</option>
              <option value="Station Infrastructure">Station Infrastructure</option>
            </select>

            <select
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded border border-vistaar-border bg-[#FAF7F0] text-vistaar-text font-medium"
            >
              <option value="">All Media Types</option>
              <option value="IMAGE">Photos (IMAGE)</option>
              <option value="VIDEO">Videos (VIDEO)</option>
              <option value="FIGURE">Figures (FIGURE)</option>
              <option value="INFOGRAPHIC">Infographics (INFOGRAPHIC)</option>
              <option value="DOCUMENT">Documents (DOCUMENT)</option>
              <option value="SOCIAL_ASSET">Social Assets (SOCIAL_ASSET)</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-2 rounded border border-vistaar-border bg-[#FAF7F0] text-vistaar-text font-medium"
            >
              <option value="">All Dates</option>
              <option value="2024">2024 Releases</option>
              <option value="2023">2023 Releases</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-2 rounded border border-vistaar-border bg-[#FAF7F0] text-vistaar-text font-medium"
            >
              <option value="">All Sources / Providers</option>
              <option value="NCPOR">NCPOR / MoES</option>
              <option value="IMD">IMD Meteorology</option>
              <option value="VISTAAR">VISTAAR Outreach Studio</option>
            </select>
          </div>
        </div>

        {/* Selected Asset Preview, Rights Metadata & Related Research/Dataset/Expedition Inspector */}
        {selectedAsset && (
          <Card className="bg-white border-2 border-vistaar-primary shadow-md overflow-hidden">
            <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/70 flex flex-row items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="scientific">
                  <Eye className="w-3 h-3 mr-1 inline" /> Asset Preview &amp; Metadata Inspector
                </Badge>
                <Badge variant="outline">{selectedAsset.media_type}</Badge>
                <span className="text-xs font-mono text-vistaar-muted">
                  ID: <strong>{selectedAsset.asset_id}</strong> • Date: {selectedAsset.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded hover:bg-vistaar-border/50 text-vistaar-muted"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
              <div className="lg:col-span-5 rounded-lg overflow-hidden border border-vistaar-border bg-[#FAF7F0] flex flex-col justify-between">
                <img
                  src={resolveAssetUrl(selectedAsset.url)}
                  alt={selectedAsset.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-3 bg-white border-t border-vistaar-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                    {selectedAsset.license}
                  </span>
                  <a
                    href={`${API_BASE_URL}/media/assets/${selectedAsset.asset_id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      <span>Permitted Download</span>
                    </Button>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-vistaar-text">{selectedAsset.title}</h3>
                  <p className="text-xs text-vistaar-text font-medium mt-1">
                    <strong>Verified Scientific Caption:</strong> {selectedAsset.caption}
                  </p>
                  <p className="text-xs text-vistaar-muted mt-1 leading-relaxed">
                    {selectedAsset.description}
                  </p>
                </div>

                {/* Full Metadata Grid (Prompt 20) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-lg bg-[#FAF7F0] border border-vistaar-border font-mono text-[11px]">
                  <div>
                    <span className="text-vistaar-muted">Asset ID:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.asset_id}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Date:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.date}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Station:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.station || selectedAsset.station_id}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Expedition:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.expedition || selectedAsset.expedition_id}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Source:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.source}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Provider:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.provider}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Creator:</span>{" "}
                    <strong className="text-vistaar-text">{selectedAsset.creator || "NCPOR"}</strong>
                  </div>
                  <div>
                    <span className="text-vistaar-muted">Source Ref:</span>{" "}
                    <strong className="text-vistaar-primary">{selectedAsset.source_reference}</strong>
                  </div>
                  <div className="sm:col-span-2 pt-1 border-t border-vistaar-border/60">
                    <span className="text-vistaar-muted">Rights / License:</span>{" "}
                    <strong className="text-emerald-700">{selectedAsset.license}</strong>
                  </div>
                </div>

                {/* Related Research, Dataset & Expedition Links (Prompt 20) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-vistaar-muted block">
                    Connected Research, Dataset &amp; Expedition Provenance
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/datasets?station=${selectedAsset.station_id}`}>
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-vistaar-scientific" />
                        <span>
                          Dataset: {selectedAsset.related_links?.dataset_id || selectedAsset.station_id}
                        </span>
                      </Button>
                    </Link>
                    <Link href={`/expeditions?id=${selectedAsset.expedition_id}`}>
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-vistaar-primary" />
                        <span>Expedition: {selectedAsset.expedition_id}</span>
                      </Button>
                    </Link>
                    <Link href="/documents">
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-vistaar-text" />
                        <span>
                          Document: {selectedAsset.related_links?.document_id || selectedAsset.source_reference}
                        </span>
                      </Button>
                    </Link>
                    <Link href="/research">
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Related Research</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-sm text-vistaar-muted bg-white rounded-xl border border-vistaar-border">
              Loading verified media assets...
            </div>
          ) : (
            assets.map((ast) => {
              const imgUrl = resolveAssetUrl(ast.url);
              const isSelected = selectedAsset?.asset_id === ast.asset_id;
              return (
                <Card
                  key={ast.asset_id}
                  onClick={() => setSelectedAsset(ast)}
                  className={`overflow-hidden bg-white transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-vistaar-primary shadow-md"
                      : "border-vistaar-border hover:shadow-md"
                  }`}
                >
                  <div className="h-44 bg-[#FAF7F0] relative overflow-hidden border-b border-vistaar-border">
                    <img
                      src={imgUrl}
                      alt={ast.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="scientific">{ast.media_type}</Badge>
                      <Badge variant="outline" className="bg-white/90">
                        {ast.region}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-vistaar-text line-clamp-1">{ast.title}</h4>
                    <p className="text-[11px] text-vistaar-muted line-clamp-2 leading-relaxed">
                      {ast.caption}
                    </p>
                    <div className="pt-2 border-t border-vistaar-border/60 text-[10px] font-mono text-vistaar-muted space-y-0.5">
                      <div className="flex justify-between">
                        <span>Provider: {ast.provider}</span>
                        <span className="text-emerald-700 font-semibold">GODL</span>
                      </div>
                      <div>
                        Expedition: {ast.expedition_id} • Date: {ast.date}
                      </div>
                      <div className="truncate">Ref: {ast.source_reference}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Journalist Press Kit Workflow (Prompt 21) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-vistaar-text">
              Accredited Journalist Press Kit Generator
            </h2>
            <p className="text-xs text-vistaar-muted">
              Compiles strictly verified statistics with NPDC provenance and approved PIB releases. Never exposes internal drafts as official.
            </p>
          </div>

          <select
            value={pressKitStation}
            onChange={(e) => setPressKitStation(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-md border border-vistaar-border bg-white text-vistaar-text shadow-xs"
          >
            <option value="bharati">Bharati Station (Antarctica)</option>
            <option value="maitri">Maitri Station (Antarctica)</option>
            <option value="himadri">Himadri Base (Arctic)</option>
            <option value="himansh">Himansh Station (Himalayas)</option>
          </select>
        </div>

        {pressKit && (
          <Card className="border-vistaar-border bg-white shadow-xs">
            <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="success">Status: {pressKit.release_status}</Badge>
                  <Badge variant="scientific">{pressKit.region}</Badge>
                  <span className="text-xs font-mono text-vistaar-muted">
                    Expedition: {pressKit.expedition_id}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-vistaar-scientific">
                  Provider: {pressKit.provider}
                </span>
              </div>
              <CardTitle className="text-xl font-bold mt-2">
                Press Briefing: {pressKit.station_name}
              </CardTitle>
              <CardDescription className="text-xs text-vistaar-muted font-mono">
                Primary Instrument: <strong>{pressKit.key_instrument}</strong> • Dataset:{" "}
                <strong>{pressKit.dataset_id}</strong> (SHA-256: {pressKit.sha256_checksum?.slice(0, 14)}...)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Official PIB Release Body */}
              <div className="p-4 bg-[#FAF7F0] rounded-lg border border-vistaar-border text-xs leading-relaxed whitespace-pre-line font-sans text-vistaar-text">
                <strong className="block text-sm mb-2 text-vistaar-text">
                  {pressKit.official_press_release?.title}
                </strong>
                {pressKit.official_press_release?.body}
              </div>

              {/* Verified Statistics Table with Provenance */}
              {pressKit.verified_statistics?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-vistaar-text">
                    Verified Dataset Statistics &amp; Provenance
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border border-vistaar-border">
                      <thead className="bg-[#FAF7F0] border-b border-vistaar-border text-[10px] uppercase text-vistaar-muted">
                        <tr>
                          <th className="p-2">Parameter</th>
                          <th className="p-2">Min</th>
                          <th className="p-2">Mean</th>
                          <th className="p-2">Max</th>
                          <th className="p-2">Valid Records</th>
                          <th className="p-2">Provenance Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vistaar-border/60">
                        {pressKit.verified_statistics.map((st: any) => (
                          <tr key={st.parameter}>
                            <td className="p-2 font-bold text-vistaar-primary">{st.parameter}</td>
                            <td className="p-2">
                              {st.min} {st.unit}
                            </td>
                            <td className="p-2">
                              {st.mean} {st.unit}
                            </td>
                            <td className="p-2">
                              {st.max} {st.unit}
                            </td>
                            <td className="p-2">{st.valid_count}</td>
                            <td className="p-2 text-[10px] text-vistaar-muted">
                              {st.provenance?.dataset_id} ({st.provenance?.source_file})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-vistaar-muted">
                <span className="italic">{pressKit.license_guidance}</span>
                <a
                  href={`${API_BASE_URL}/media/press-kit/download?station_id=${pressKitStation}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="primary" className="flex items-center space-x-1.5">
                    <Download className="w-4 h-4" />
                    <span>Download Verified Press Kit (HTML / PDF)</span>
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
