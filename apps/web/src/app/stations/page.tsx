"use client";

import { useEffect, useState } from "react";
import { Compass, Database, CloudSun, MapPin, Calendar, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

export default function StationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetchApi("/weather/stations");
        setStations(res);
      } catch (e) {
        console.error("Failed to load stations", e);
      } finally {
        setLoading(false);
      }
    }
    loadStations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-vistaar-border pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
          <Compass className="w-4 h-4" />
          <span>India’s Polar & High-Altitude Research Infrastructure</span>
        </div>
        <h1 className="text-3xl font-extrabold text-vistaar-text">
          Permanent Research Observatories
        </h1>
        <p className="text-sm text-vistaar-muted mt-1">
          Explore India's year-round scientific stations across Antarctica, the Arctic, and the Himalayan Third Pole.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-2 py-20 text-center text-sm text-vistaar-muted">
            Loading station profiles from MongoDB Atlas...
          </div>
        ) : (
          stations.map((st) => (
            <Card key={st.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-6 border-b border-vistaar-border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={st.status === "ACTIVE" ? "success" : "default"}>
                    {st.status}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-vistaar-scientific">
                    {st.region}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold">{st.name}</CardTitle>
                <CardDescription className="text-xs text-vistaar-muted flex items-center space-x-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-vistaar-muted" />
                  <span>{st.location}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-vistaar-bg p-3.5 rounded border border-vistaar-border font-mono">
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Latitude / Longitude</span>
                    <span className="font-bold text-vistaar-text">{st.coordinates?.lat}°, {st.coordinates?.lng}°</span>
                  </div>
                  <div>
                    <span className="text-vistaar-muted block text-[10px] uppercase">Elevation</span>
                    <span className="font-bold text-vistaar-text">{st.coordinates?.elevation} meters</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link href={`/weather?station=${st.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full text-xs flex items-center justify-center space-x-1.5">
                      <CloudSun className="w-4 h-4" />
                      <span>Live Weather Series</span>
                    </Button>
                  </Link>
                  <Link href={`/datasets?station=${st.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-center space-x-1.5">
                      <Database className="w-4 h-4" />
                      <span>Station Datasets</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
