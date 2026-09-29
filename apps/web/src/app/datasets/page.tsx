"use client";

import { useEffect, useState } from "react";
import { Database, Filter, Search, CheckCircle, AlertTriangle, FileCode2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");

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

  const filtered = datasets.filter((ds) => {
    const matchesSearch =
      ds.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.dataset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.provider.toLowerCase().includes(searchTerm.toLowerCase());
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
            Official datasets from Antarctica, Arctic, and Himalayan expeditions cataloged with cryptographic SHA-256 provenance.
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

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  {ds.parameters && ds.parameters.length > 0 && (
                    <div className="flex flex-wrap gap-1 md:max-w-xs justify-end">
                      {ds.parameters.slice(0, 3).map((p: string) => (
                        <span key={p} className="px-2 py-0.5 bg-vistaar-bg border border-vistaar-border rounded text-[10px] text-vistaar-text font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
