"use client";

import { useEffect, useState } from "react";
import { Newspaper, Download, ShieldCheck, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi, API_BASE_URL } from "@/lib/api";

export default function MediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [pressKitStation, setPressKitStation] = useState<string>("bharati");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("");
  const [stationAssetFilter, setStationAssetFilter] = useState<string>("");
  const [pressKit, setPressKit] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMedia() {
      setLoading(true);
      try {
        const assetParams = new URLSearchParams();
        if (stationAssetFilter) assetParams.set("station_id", stationAssetFilter);
        if (mediaTypeFilter) assetParams.set("media_type", mediaTypeFilter);

        const [assetRes, kitRes] = await Promise.all([
          fetchApi(`/media/assets?${assetParams.toString()}`),
          fetchApi(`/media/press-kit?station_id=${pressKitStation}`),
        ]);
        setAssets(assetRes);
        setPressKit(kitRes);
      } catch (e) {
        console.error("Failed to load media assets", e);
      } finally {
        setLoading(false);
      }
    }
    loadMedia();
  }, [pressKitStation, mediaTypeFilter, stationAssetFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#FAF7F0] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-vistaar-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
            <Newspaper className="w-4 h-4" />
            <span>Official Media & Accredited Press Dissemination Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Media Library & Journalist Press Kits
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Accredited polar photography, scientific figures, infographics, approved PIB releases, and verified statistical briefings.
          </p>
        </div>
      </div>

      {/* Journalist Press Kit Workflow (Prompt 21) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-vistaar-text">Accredited Journalist Press Kit Generator</h2>
            <p className="text-xs text-vistaar-muted">
              Compiles strictly verified statistics with NPDC provenance and approved PIB releases. Never exposes internal drafts as official.
            </p>
          </div>

          <select
            value={pressKitStation}
            onChange={(e) => setPressKitStation(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-md border border-vistaar-border bg-white text-vistaar-text shadow-sm"
          >
            <option value="bharati">Bharati Station (Antarctica)</option>
            <option value="maitri">Maitri Station (Antarctica)</option>
            <option value="himadri">Himadri Base (Arctic)</option>
            <option value="himansh">Himansh Station (Himalayas)</option>
          </select>
        </div>

        {pressKit && (
          <Card className="border-vistaar-border bg-white shadow-sm">
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
                    Verified Dataset Statistics & Provenance
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
                            <td className="p-2">{st.min} {st.unit}</td>
                            <td className="p-2">{st.mean} {st.unit}</td>
                            <td className="p-2">{st.max} {st.unit}</td>
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

      {/* Public Media Library Grid & Filters (Prompt 20) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-vistaar-text">
            Official Polar Media, Figures & Infographics Archive ({assets.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={stationAssetFilter}
              onChange={(e) => setStationAssetFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-vistaar-border bg-white"
            >
              <option value="">All Stations</option>
              <option value="maitri">Maitri</option>
              <option value="bharati">Bharati</option>
              <option value="himadri">Himadri</option>
              <option value="himansh">Himansh</option>
            </select>

            <select
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-vistaar-border bg-white"
            >
              <option value="">All Media Types</option>
              <option value="IMAGE">Photographs (IMAGE)</option>
              <option value="FIGURE">Scientific Figures (FIGURE)</option>
              <option value="INFOGRAPHIC">Infographics (INFOGRAPHIC)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((ast) => {
            const imgUrl = ast.url?.startsWith("/api/v1")
              ? `${API_BASE_URL}${ast.url.replace("/api/v1", "")}`
              : ast.url;
            return (
              <Card
                key={ast.asset_id}
                onClick={() => setSelectedAsset(ast)}
                className="overflow-hidden bg-white border-vistaar-border hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="h-44 bg-[#FAF7F0] relative overflow-hidden border-b border-vistaar-border">
                  <img
                    src={imgUrl}
                    alt={ast.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="scientific">{ast.media_type}</Badge>
                    <Badge variant="outline" className="bg-white/90">{ast.region}</Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-vistaar-text line-clamp-1">{ast.title}</h4>
                  <p className="text-[11px] text-vistaar-muted line-clamp-2 leading-relaxed">{ast.caption}</p>
                  <div className="pt-2 border-t border-vistaar-border/60 text-[10px] font-mono text-vistaar-muted space-y-0.5">
                    <div className="flex justify-between">
                      <span>Source: {ast.provider}</span>
                      <span className="text-emerald-700 font-semibold">{ast.license}</span>
                    </div>
                    <div>Ref: {ast.source_reference} • Date: {ast.date}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
