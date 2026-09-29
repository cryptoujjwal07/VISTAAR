"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Newspaper, Download, ShieldCheck, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function MediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [pressKitStation, setPressKitStation] = useState<string>("bharati");
  const [pressKit, setPressKit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMedia() {
      try {
        const [assetRes, kitRes] = await Promise.all([
          fetchApi("/media/assets"),
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
  }, [pressKitStation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            <Newspaper className="w-4 h-4" />
            <span>Official Media & Communications Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Media Library & Journalist Press Kits
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Accredited high-resolution imagery, approved PIB releases, and verified statistical briefings.
          </p>
        </div>
      </div>

      {/* Journalist Press Kit Generator Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vistaar-text">Automated Journalist Press Kit</h2>
            <p className="text-xs text-vistaar-muted">
              Select an observatory to compile verified factual briefings and accredited media assets.
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
            <CardHeader className="p-6 border-b border-vistaar-border bg-amber-50/40">
              <div className="flex items-center justify-between">
                <Badge variant="scientific">{pressKit.region}</Badge>
                <span className="text-xs font-mono font-bold text-amber-900">
                  Provider: {pressKit.provider}
                </span>
              </div>
              <CardTitle className="text-xl font-bold mt-2">
                Press Briefing: {pressKit.station_name}
              </CardTitle>
              <CardDescription className="text-xs text-vistaar-muted">
                Authoritative Primary Instrument: <strong>{pressKit.key_instrument}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-vistaar-bg rounded-lg border border-vistaar-border text-xs leading-relaxed whitespace-pre-line font-sans">
                <strong className="block text-sm mb-2 text-vistaar-text">
                  {pressKit.official_press_release?.title}
                </strong>
                {pressKit.official_press_release?.body}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-vistaar-muted">
                <span className="italic">{pressKit.license_guidance}</span>
                <Button size="sm" variant="outline" className="flex items-center space-x-1.5">
                  <Download className="w-4 h-4" />
                  <span>Download Verified Press Kit (PDF)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Public Photo & Media Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-vistaar-text">Official Photographic Archive</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {assets.map((ast) => (
            <Card key={ast.asset_id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-44 bg-gray-200 relative overflow-hidden">
                <img
                  src={ast.url}
                  alt={ast.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <Badge variant="scientific" className="absolute top-2 right-2 shadow-sm">
                  {ast.region}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                <h4 className="font-bold text-xs text-vistaar-text line-clamp-1">{ast.title}</h4>
                <p className="text-[11px] text-vistaar-muted line-clamp-2 leading-relaxed">
                  {ast.caption}
                </p>
                <div className="flex justify-between items-center pt-2 border-t border-vistaar-border/60 text-[10px] text-vistaar-muted font-mono">
                  <span>{ast.provider}</span>
                  <span className="text-emerald-700 font-semibold">{ast.license}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
