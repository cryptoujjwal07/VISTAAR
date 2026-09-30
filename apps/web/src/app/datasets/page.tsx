"use client";

import { useEffect, useState } from "react";
import { Database, Search, Download, Table as TableIcon, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { API_BASE, fetchApi } from "@/lib/api";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  // Cursor-paginated record inspector state (Prompt 27: never load huge datasets into browser memory)
  const [inspectedDataset, setInspectedDataset] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsTotal, setRecordsTotal] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await fetchApi("/datasets?limit=50");
        setDatasets(res.items || []);
      } catch (e) {
        console.error("Failed to load datasets", e);
      } finally {
        setLoading(false);
      }
    }
    loadDatasets();
  }, []);

  async function inspectDatasetRecords(ds: any, cursorToken?: string | null) {
    setInspectedDataset(ds);
    setRecordsLoading(true);
    try {
      const url = cursorToken
        ? `/datasets/${ds.dataset_id}/records?limit=20&cursor=${encodeURIComponent(cursorToken)}`
        : `/datasets/${ds.dataset_id}/records?limit=20`;
      const res = await fetchApi(url);
      if (cursorToken) {
        // Keep browser memory bounded to at most 100 rows by sliding window if needed
        setRecords((prev) => [...prev.slice(-80), ...(res.records || [])]);
      } else {
        setRecords(res.records || []);
      }
      setRecordsTotal(res.total || 0);
      setNextCursor(res.next_cursor || null);
    } catch (e) {
      console.error("Failed to load dataset records", e);
    } finally {
      setRecordsLoading(false);
    }
  }

  const filtered = datasets.filter((ds) => {
    const titleStr = (ds.title || ds.dataset_name || "").toLowerCase();
    const idStr = (ds.dataset_id || "").toLowerCase();
    const provStr = (ds.provider || "").toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = titleStr.includes(q) || idStr.includes(q) || provStr.includes(q);
    const matchesRegion =
      selectedRegion === "ALL" || ds.region?.toLowerCase().includes(selectedRegion.toLowerCase());
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-scientific uppercase tracking-wide mb-1">
            <Database className="w-4 h-4" />
            <span>National Polar Data Centre (NPDC) Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Authoritative Polar Scientific Datasets
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Official datasets from Antarctica, Arctic, and Himalayan expeditions cataloged with cryptographic SHA-256 provenance, cursor pagination, and chunked streaming.
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-mono font-bold text-vistaar-primary">
            {datasets.length}
          </span>
          <span className="text-xs text-vistaar-muted block uppercase tracking-wider">
            Datasets Ingested & Verified
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-vistaar-muted" />
          <input
            type="text"
            placeholder="Search datasets by title, instrument, provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-vistaar-border bg-white text-xs text-vistaar-text focus:outline-none focus:ring-2 focus:ring-vistaar-primary"
          />
        </div>

        {/* Region Filters */}
        <div className="flex space-x-2">
          {["ALL", "Antarctica", "Arctic", "Himalayas"].map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                selectedRegion === reg
                  ? "bg-vistaar-primary text-white border-vistaar-primary"
                  : "bg-white text-vistaar-text border-vistaar-border hover:bg-vistaar-bg"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Cursor-Paginated Large Table Inspector (Prompt 27) */}
      {inspectedDataset && (
        <Card className="border-vistaar-primary/40 bg-white shadow-sm">
          <CardHeader className="p-4 border-b border-vistaar-border bg-vistaar-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <TableIcon className="w-4 h-4 text-vistaar-primary" />
                <span>Windowed Telemetry Inspector: {inspectedDataset.title || inspectedDataset.dataset_id}</span>
                <Badge variant="scientific" className="font-mono text-[10px]">
                  Showing {records.length} of {recordsTotal.toLocaleString()} rows (Bounded Memory)
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">
                Cursor-paginated windowing prevents loading huge datasets into browser memory.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={`${API_BASE}/datasets/${inspectedDataset.dataset_id}/records/stream?format=csv`}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-vistaar-border bg-white hover:bg-vistaar-bg text-xs font-semibold text-vistaar-primary"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Stream CSV</span>
              </a>
              <a
                href={`${API_BASE}/datasets/${inspectedDataset.dataset_id}/records/stream?format=ndjson`}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-vistaar-border bg-white hover:bg-vistaar-bg text-xs font-semibold text-vistaar-scientific"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stream NDJSON</span>
              </a>
              <Button size="sm" variant="outline" onClick={() => setInspectedDataset(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="overflow-x-auto max-h-72 border border-vistaar-border rounded">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="bg-slate-100 sticky top-0 border-b border-vistaar-border text-[11px] uppercase text-vistaar-muted">
                  <tr>
                    <th className="p-2">Record ID</th>
                    <th className="p-2">Timestamp (UTC)</th>
                    <th className="p-2">Metrics</th>
                    <th className="p-2">Quality Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vistaar-border">
                  {records.map((rec: any) => (
                    <tr key={rec.record_id} className="hover:bg-vistaar-bg/40">
                      <td className="p-2 font-bold text-vistaar-primary">{rec.record_id}</td>
                      <td className="p-2 text-vistaar-text">{rec.timestamp}</td>
                      <td className="p-2 text-vistaar-text">
                        {Object.entries(rec.metrics || {})
                          .slice(0, 4)
                          .map(([k, v]) => `${k}: ${v ?? "NULL"}`)
                          .join(" | ")}
                      </td>
                      <td className="p-2">
                        {Object.entries(rec.quality_flags || {})
                          .slice(0, 2)
                          .map(([k, v]) => `${k}:${v}`)
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {nextCursor && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={recordsLoading}
                  onClick={() => inspectDatasetRecords(inspectedDataset, nextCursor)}
                  className="flex items-center space-x-1"
                >
                  <span>{recordsLoading ? "Loading Cursor Window..." : "Load Next 20 Rows (Cursor)"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Datasets Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-sm text-vistaar-muted">
            Loading authoritative NPDC catalog from MongoDB Atlas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-vistaar-muted">
            No datasets found matching your search criteria.
          </div>
        ) : (
          filtered.map((ds) => (
            <Card key={ds.dataset_id} className="hover:border-vistaar-primary/50 transition-colors">
              <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="scientific">{ds.region}</Badge>
                    <span className="text-xs font-mono font-semibold text-vistaar-primary">
                      {ds.dataset_id}
                    </span>
                    <Badge variant={ds.ingestion_status === "COMPLETED" ? "success" : "default"}>
                      {ds.ingestion_status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-vistaar-text">{ds.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-vistaar-muted">
                    <span>Provider: <strong className="text-vistaar-text">{ds.provider}</strong></span>
                    <span>Instrument: <strong className="text-vistaar-text">{ds.instrument}</strong></span>
                    <span>Format: <strong className="text-vistaar-text font-mono uppercase">{ds.format}</strong></span>
                    {ds.quality_summary?.row_count && (
                      <span>Rows: <strong className="text-vistaar-text font-mono">{ds.quality_summary.row_count.toLocaleString()}</strong></span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-vistaar-muted break-all">
                    SHA-256: {ds.sha256}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  {ds.parameters && ds.parameters.length > 0 && (
                    <div className="flex flex-wrap gap-1 md:max-w-xs justify-end">
                      {ds.parameters.slice(0, 3).map((p: string) => (
                        <span key={p} className="px-2 py-0.5 bg-vistaar-bg border border-vistaar-border rounded text-[10px] text-vistaar-text font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => inspectDatasetRecords(ds, null)}
                      className="text-xs flex items-center space-x-1"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Inspect Rows (Cursor)</span>
                    </Button>
                    <a
                      href={`${API_BASE}/datasets/${ds.dataset_id}/records/stream?format=csv`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded border border-vistaar-border bg-vistaar-bg/60 hover:bg-vistaar-bg text-xs font-semibold text-vistaar-primary"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Stream CSV</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
