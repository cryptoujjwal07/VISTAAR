"use client";

import { useEffect, useState } from "react";
import {
  CloudSun,
  Filter,
  FileCode2,
  ShieldCheck,
  Calendar,
  Database,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function WeatherPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("himansh");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [rangeMode, setRangeMode] = useState<string>("MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [fullRecord, setFullRecord] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  async function inspectFullRecord(pt: any) {
    setSelectedPoint(pt);
    if (!pt?.record_id) return;
    try {
      const rec = await fetchApi(`/weather/records/${pt.record_id}`);
      setFullRecord(rec);
    } catch {
      setFullRecord(null);
    }
  }

  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetchApi("/weather/stations");
        setStations(res);
      } catch (e) {
        console.error("Failed to load stations", e);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    if (!selectedStation) return;
    async function loadTimeSeries() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          station_id: selectedStation,
          range_mode: rangeMode,
        });
        if (selectedDataset) params.set("dataset_id", selectedDataset);
        if (selectedProvider) params.set("provider", selectedProvider);
        if (selectedParam) params.set("parameter", selectedParam);
        if (rangeMode === "CUSTOM" && startDate) params.set("start_date", startDate);
        if (rangeMode === "CUSTOM" && endDate) params.set("end_date", endDate);

        const res = await fetchApi(`/weather/timeseries?${params.toString()}`, {
          bypassCache: true,
        });
        setData(res);
        if (!selectedParam && res.parameter) {
          setSelectedParam(res.parameter);
        }
        if (res.points?.length > 0) {
          inspectFullRecord(res.points[0]);
        }
      } catch (e) {
        console.error("Failed to load time series", e);
      } finally {
        setLoading(false);
      }
    }
    loadTimeSeries();
  }, [selectedStation, selectedDataset, selectedProvider, selectedParam, rangeMode, startDate, endDate]);

  const points = data?.points || [];
  const stats = data?.statistics;
  const minVal = stats?.min ?? 0;
  const maxVal = stats?.max ?? 100;
  const avgVal = stats?.avg ?? 50;
  const range = maxVal - minVal || 1;

  const svgWidth = 820;
  const svgHeight = 250;
  const padding = 36;

  const polylineCoords = points
    .map((pt: any, idx: number) => {
      const x = padding + (idx / Math.max(points.length - 1, 1)) * (svgWidth - 2 * padding);
      const y = svgHeight - padding - ((pt.value - minVal) / range) * (svgHeight - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  const meanY = svgHeight - padding - ((avgVal - minVal) / range) * (svgHeight - 2 * padding);
  const activeInspect = hoveredPoint || selectedPoint;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#FAF7F0] min-h-screen">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-vistaar-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-scientific uppercase tracking-wide mb-1">
            <CloudSun className="w-4 h-4" />
            <span>National Polar Data Centre (NPDC) • Calibrated Instrument Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-vistaar-text">
            Polar Weather & Environmental Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-vistaar-muted mt-1">
            100% real ingested NPDC telemetry. Missing sensor observations are explicitly flagged and never replaced with zero.
          </p>
        </div>

        {/* Station Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {stations.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedStation(st.id);
                setSelectedDataset("");
                setSelectedParam("");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                selectedStation === st.id
                  ? "bg-vistaar-primary text-white border-vistaar-primary shadow-sm"
                  : "bg-[#FAF7F0] text-vistaar-text border-vistaar-border hover:bg-white"
              }`}
            >
              {st.name.replace(" Station", "").replace(" Research", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Time-Range Resolution Controls (Sections 16 & 54: LIVE / DAY / WEEK / MONTH / YEAR / CUSTOM) */}
      <div className="bg-white p-3.5 rounded-lg border border-vistaar-border shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-vistaar-scientific" />
          <span className="font-bold text-vistaar-text">Time-Range Resolution:</span>
          <span className="font-mono text-[11px] font-bold text-vistaar-primary">
            [{rangeMode}] {data?.resolution || "ADAPTIVE_RESOLUTION"} • {points.length} Plotted Points ({stats?.count ?? 0} Raw Window Obs)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["LIVE", "DAY", "WEEK", "MONTH", "YEAR", "CUSTOM"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setRangeMode(mode);
                if (mode !== "CUSTOM") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className={`px-3 py-1 rounded font-mono text-xs font-bold border transition-all cursor-pointer ${
                rangeMode === mode
                  ? "bg-vistaar-primary text-white border-vistaar-primary shadow-2xs"
                  : "bg-[#FAF7F0] text-vistaar-text border-vistaar-border hover:bg-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Provenance Metadata Bar (Prompt 16 Requirement) */}
      <div className="bg-white p-4 rounded-lg border border-vistaar-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="text-[10px] font-mono uppercase text-vistaar-muted block mb-1">
            Dataset Selector
          </label>
          <select
            value={selectedDataset || data?.dataset_id || ""}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-vistaar-border bg-[#FAF7F0] font-mono text-xs"
          >
            {(data?.available_datasets || []).map((ds: any) => (
              <option key={ds.dataset_id} value={ds.dataset_id}>
                {ds.dataset_id} — {ds.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-vistaar-muted block mb-1">
            Start Date (UTC)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setRangeMode("CUSTOM");
            }}
            className="w-full px-2.5 py-1.5 rounded border border-vistaar-border bg-[#FAF7F0] font-mono text-xs"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-vistaar-muted block mb-1">
            End Date (UTC)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setRangeMode("CUSTOM");
            }}
            className="w-full px-2.5 py-1.5 rounded border border-vistaar-border bg-[#FAF7F0] font-mono text-xs"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-vistaar-muted block mb-1">
            Authoritative Provider Selector
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-vistaar-border bg-[#FAF7F0] font-semibold text-vistaar-scientific text-xs"
          >
            <option value="">All Providers ({data?.provider || "NCPOR / NPDC"})</option>
            {(data?.available_providers || []).map((prov: string) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-white border-vistaar-border shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-vistaar-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F0]/50">
              <div>
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  <span>{data?.station_name || "Station"}</span>
                  <Badge variant="scientific">
                    {data?.parameter} ({data?.unit || "unit"})
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Dataset: {data?.dataset_id}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-1 font-mono">
                  Period: {data?.period?.start?.slice(0, 10) || "N/A"} → {data?.period?.end?.slice(0, 10) || "N/A"} UTC •{" "}
                  Provider: {data?.provider}
                </CardDescription>
              </div>

              {/* Dynamic Parameter Selector Pills */}
              <div className="flex flex-wrap gap-1.5">
                {data?.available_parameters?.map((p: string) => (
                  <button
                    key={p}
                    onClick={() => setSelectedParam(p)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors font-mono ${
                      data.parameter === p
                        ? "bg-vistaar-scientific text-white border-vistaar-scientific font-bold"
                        : "bg-white text-vistaar-text border-vistaar-border hover:bg-[#FAF7F0]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-sm text-vistaar-muted">
                  Loading calibrated NPDC time series from MongoDB Atlas...
                </div>
              ) : points.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-vistaar-muted">
                  No observations recorded for the specified filter window.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Interactive Hover Bar */}
                  <div className="flex flex-wrap items-center justify-between bg-[#FAF7F0] px-3 py-2 rounded border border-vistaar-border text-xs font-mono">
                    <span>
                      Inspected Point:{" "}
                      <strong className="text-vistaar-primary">
                        {activeInspect?.value} {activeInspect?.unit}
                      </strong>{" "}
                      at {activeInspect?.timestamp}
                    </span>
                    <span>
                      Record ID: <strong>{activeInspect?.record_id}</strong> • QC:{" "}
                      <Badge variant={activeInspect?.quality === "VALID" ? "success" : "warning"}>
                        {activeInspect?.quality || "VALID"}
                      </Badge>
                    </span>
                  </div>

                  {/* Interactive SVG Time-Series Chart */}
                  <div className="relative border border-vistaar-border rounded-lg bg-[#FAF7F0]/40 p-2 overflow-x-auto">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 overflow-visible">
                      <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E7E0D5" strokeDasharray="3 3" />
                      <line x1={padding} y1={meanY} x2={svgWidth - padding} y2={meanY} stroke="#0E7490" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#E7E0D5" strokeDasharray="3 3" />

                      <text x={padding - 6} y={padding + 4} textAnchor="end" fontSize="10" fill="#5F6B76">
                        {maxVal}
                      </text>
                      <text x={padding - 6} y={meanY + 3} textAnchor="end" fontSize="10" fill="#0E7490">
                        μ={avgVal}
                      </text>
                      <text x={padding - 6} y={svgHeight - padding + 4} textAnchor="end" fontSize="10" fill="#5F6B76">
                        {minVal}
                      </text>

                      {/* Missing-Data Visual Gap Markers (Never replaced with zero) */}
                      {(data?.missing_points || []).slice(0, 30).map((mp: any, mIdx: number) => {
                        const totalSpan = Math.max(points.length + (data?.missing_points?.length || 0), 2);
                        const mx = padding + ((mp.index || mIdx) / totalSpan) * (svgWidth - 2 * padding);
                        return (
                          <line
                            key={mp.record_id || `miss_${mIdx}`}
                            x1={mx}
                            y1={padding}
                            x2={mx}
                            y2={svgHeight - padding}
                            stroke="#D97706"
                            strokeWidth="1.2"
                            strokeDasharray="2 3"
                            opacity="0.65"
                          />
                        );
                      })}

                      <polyline
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineCoords}
                      />

                      {points.map((pt: any, i: number) => {
                        const cx = padding + (i / Math.max(points.length - 1, 1)) * (svgWidth - 2 * padding);
                        const cy = svgHeight - padding - ((pt.value - minVal) / range) * (svgHeight - 2 * padding);
                        const isSelected = selectedPoint?.record_id === pt.record_id;
                        return (
                          <circle
                            key={pt.record_id}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 6 : 3.2}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? "fill-amber-600 stroke-white stroke-2"
                                : "fill-vistaar-scientific hover:fill-vistaar-primary"
                            }`}
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            onClick={() => inspectFullRecord(pt)}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Authoritative Source Citation Footer (Prompt 16 Requirement) */}
                  <div className="p-3 bg-[#FAF7F0] rounded border border-vistaar-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-vistaar-scientific shrink-0" />
                      <span className="font-mono text-[11px] text-vistaar-text">{data?.source_citation}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                      <Badge variant="success">VALID: {data?.quality_breakdown?.VALID || stats?.count || 0}</Badge>
                      <Badge variant="warning">MISSING: {stats?.missing_count || 0} (Not zero-filled)</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Statistics & Original Record Provenance */}
        <div className="space-y-6">
          <Card className="bg-white border-vistaar-border shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-vistaar-border bg-[#FAF7F0]/60">
              <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                <Filter className="w-4 h-4 text-vistaar-primary" />
                <span>Verified Metric Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-vistaar-border/60">
                <span className="text-vistaar-muted">Valid Points:</span>
                <span className="font-mono font-bold text-vistaar-text">{stats?.count?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-vistaar-border/60">
                <span className="text-vistaar-muted">Missing Gaps (Unfilled):</span>
                <span className="font-mono font-bold text-amber-700">{stats?.missing_count || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-vistaar-border/60">
                <span className="text-vistaar-muted">Minimum Value:</span>
                <span className="font-mono font-bold text-vistaar-scientific">
                  {stats?.min !== undefined ? `${stats.min} ${stats.unit}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-vistaar-border/60">
                <span className="text-vistaar-muted">Maximum Value:</span>
                <span className="font-mono font-bold text-vistaar-danger">
                  {stats?.max !== undefined ? `${stats.max} ${stats.unit}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-vistaar-muted">Calculated Mean (μ):</span>
                <span className="font-mono font-bold text-vistaar-primary">
                  {stats?.avg !== undefined ? `${stats.avg} ${stats.unit}` : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-vistaar-primary/40 bg-white shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-vistaar-border bg-blue-50/50">
              <CardTitle className="text-sm font-bold text-vistaar-primary flex items-center space-x-1.5">
                <FileCode2 className="w-4 h-4" />
                <span>Chart Point → Original Dataset Record</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs font-mono">
              {selectedPoint ? (
                <>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Record ID</span>
                    <span className="font-bold text-vistaar-text">{selectedPoint.record_id}</span>
                  </div>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Observed Value</span>
                    <span className="font-bold text-vistaar-primary text-sm">
                      {selectedPoint.value} {selectedPoint.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Timestamp (UTC)</span>
                    <span className="text-vistaar-text">{selectedPoint.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Quality Flag</span>
                    <Badge variant={selectedPoint.quality === "VALID" ? "success" : "warning"}>
                      {selectedPoint.quality}
                    </Badge>
                  </div>
                  {fullRecord?.metrics && (
                    <div className="pt-2 border-t border-vistaar-border/60">
                      <span className="text-vistaar-muted block text-[10px] uppercase mb-1">Full Original Record Metrics</span>
                      <div className="bg-[#FAF7F0] p-2 rounded border border-vistaar-border text-[10px] space-y-0.5 max-h-28 overflow-y-auto">
                        {Object.entries(fullRecord.metrics).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-vistaar-muted">{k}:</span>
                            <span className="font-bold text-vistaar-text">{v === null ? "NULL (MISSING)" : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-vistaar-border/60">
                    <span className="text-vistaar-muted block text-[10px] uppercase">Raw Source File</span>
                    <span className="text-vistaar-text break-all">{selectedPoint.provenance?.source_file}</span>
                  </div>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Source Line</span>
                    <span className="text-vistaar-text">Line {selectedPoint.provenance?.source_line}</span>
                  </div>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">File SHA-256 Checksum</span>
                    <span className="text-[10px] text-vistaar-muted break-all font-mono">
                      {selectedPoint.provenance?.sha256}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-vistaar-muted py-4 text-center">
                  Click any data point on the chart to inspect its original dataset record.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
