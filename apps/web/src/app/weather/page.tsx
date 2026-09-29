"use client";

import { useEffect, useState } from "react";
import { CloudSun, Database, Info, Calendar, Filter, FileCode2, ArrowDownUp, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function WeatherPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("himansh");
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  // Load available stations
  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetchApi("/weather/stations");
        setStations(res);
        if (res.length > 0 && !selectedStation) {
          setSelectedStation(res[0].id);
        }
      } catch (e) {
        console.error("Failed to load stations", e);
      }
    }
    loadStations();
  }, []);

  // Load time series data when station or parameter changes
  useEffect(() => {
    if (!selectedStation) return;
    async function loadTimeSeries() {
      setLoading(true);
      try {
        const query = selectedParam ? `?station_id=${selectedStation}&parameter=${selectedParam}` : `?station_id=${selectedStation}`;
        const res = await fetchApi(`/weather/timeseries${query}`);
        setData(res);
        if (!selectedParam && res.parameter) {
          setSelectedParam(res.parameter);
        }
        if (res.points?.length > 0) {
          setSelectedPoint(res.points[0]);
        }
      } catch (e) {
        console.error("Failed to load time series", e);
      } finally {
        setLoading(false);
      }
    }
    loadTimeSeries();
  }, [selectedStation, selectedParam]);

  // Compute SVG Polyline points
  const points = data?.points || [];
  const stats = data?.statistics;
  const minVal = stats?.min ?? 0;
  const maxVal = stats?.max ?? 100;
  const range = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = 240;
  const padding = 30;

  const polylineCoords = points.map((pt: any, idx: number) => {
    const x = padding + (idx / Math.max(points.length - 1, 1)) * (svgWidth - 2 * padding);
    const y = svgHeight - padding - ((pt.value - minVal) / range) * (svgHeight - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-scientific uppercase tracking-wide mb-1">
            <CloudSun className="w-4 h-4" />
            <span>National Polar Data Centre (NPDC) Stream</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Polar Weather & Environmental Intelligence
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Dynamic, multi-station observation time series directly connected to calibrated instrumentation.
          </p>
        </div>

        {/* Station Selectors */}
        <div className="flex flex-wrap gap-2">
          {stations.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedStation(st.id);
                setSelectedParam("");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                selectedStation === st.id
                  ? "bg-vistaar-primary text-white border-vistaar-primary shadow-sm"
                  : "bg-white text-vistaar-text border-vistaar-border hover:bg-vistaar-bg"
              }`}
            >
              {st.name.replace(" Station", "").replace(" Research", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Parameter Selector & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Main Chart Card */}
          <Card>
            <CardHeader className="p-5 pb-3 border-b border-vistaar-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center space-x-2">
                  <span>{data?.station_name || "Station"}</span>
                  <Badge variant="scientific">{data?.unit || ""}</Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Authoritative Dataset: <code className="font-mono text-vistaar-primary font-bold">{data?.dataset_id}</code>
                </CardDescription>
              </div>

              {/* Dynamic Parameter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {data?.available_parameters?.map((p: string) => (
                  <button
                    key={p}
                    onClick={() => setSelectedParam(p)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      data.parameter === p
                        ? "bg-vistaar-scientific text-white border-vistaar-scientific font-semibold"
                        : "bg-vistaar-bg text-vistaar-text border-vistaar-border hover:bg-white"
                    }`}
                  >
                    {p.replace("_", " ")}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-sm text-vistaar-muted">
                  Loading observation time series from MongoDB Atlas...
                </div>
              ) : points.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-vistaar-muted">
                  No observations recorded for the specified parameters.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Interactive SVG Chart */}
                  <div className="relative border border-vistaar-border rounded-lg bg-vistaar-bg/50 p-2 overflow-x-auto">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 overflow-visible">
                      {/* Grid Lines */}
                      <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E7E0D5" strokeDasharray="3 3" />
                      <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#E7E0D5" strokeDasharray="3 3" />
                      <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#E7E0D5" strokeDasharray="3 3" />

                      {/* Y-Axis Value Labels */}
                      <text x={padding - 5} y={padding + 4} textAnchor="end" fontSize="10" fill="#5F6B76">{maxVal}</text>
                      <text x={padding - 5} y={svgHeight / 2 + 3} textAnchor="end" fontSize="10" fill="#5F6B76">{((maxVal + minVal) / 2).toFixed(1)}</text>
                      <text x={padding - 5} y={svgHeight - padding + 4} textAnchor="end" fontSize="10" fill="#5F6B76">{minVal}</text>

                      {/* Polyline */}
                      <polyline
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineCoords}
                      />

                      {/* Data Points */}
                      {points.map((pt: any, i: number) => {
                        const cx = padding + (i / Math.max(points.length - 1, 1)) * (svgWidth - 2 * padding);
                        const cy = svgHeight - padding - ((pt.value - minVal) / range) * (svgHeight - 2 * padding);
                        const isSelected = selectedPoint?.record_id === pt.record_id;
                        return (
                          <circle
                            key={pt.record_id}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 6 : 3}
                            className={`cursor-pointer transition-all ${
                              isSelected ? "fill-vistaar-danger stroke-white stroke-2" : "fill-vistaar-scientific hover:fill-vistaar-primary"
                            }`}
                            onClick={() => setSelectedPoint(pt)}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex justify-between items-center text-xs text-vistaar-muted font-mono px-1">
                    <span>Earliest: {points[0]?.timestamp?.slice(0, 10)}</span>
                    <span className="text-vistaar-scientific font-semibold">
                      Click any point to inspect verifiable record provenance
                    </span>
                    <span>Latest: {points[points.length - 1]?.timestamp?.slice(0, 10)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Statistics & Record Provenance */}
        <div className="space-y-6">
          {/* Summary Stats Card */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-vistaar-border">
              <CardTitle className="text-sm font-bold flex items-center space-x-1.5">
                <Filter className="w-4 h-4 text-vistaar-primary" />
                <span>Verified Metric Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-vistaar-border/60">
                <span className="text-vistaar-muted">Observed Points:</span>
                <span className="font-mono font-bold text-vistaar-text">{stats?.count?.toLocaleString() || 0}</span>
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
                <span className="text-vistaar-muted">Calculated Average:</span>
                <span className="font-mono font-bold text-vistaar-primary">
                  {stats?.avg !== undefined ? `${stats.avg} ${stats.unit}` : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Point Provenance Card */}
          <Card className="border-vistaar-primary/40 bg-vistaar-surface shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-vistaar-border bg-blue-50/50">
              <CardTitle className="text-sm font-bold text-vistaar-primary flex items-center space-x-1.5">
                <FileCode2 className="w-4 h-4" />
                <span>Selected Record Provenance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs font-mono">
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
                  Click a data point on the chart to inspect its provenance.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
