"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Database, CloudSun, GraduationCap, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Share2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function HomePage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi("/weather/stations");
        setStations(res);
      } catch (e) {
        console.error("Failed to load stations", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Institutional Hero Section */}
      <section className="relative bg-gradient-to-b from-vistaar-surface to-vistaar-bg border-b border-vistaar-border pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-vistaar-border bg-white text-xs font-semibold text-vistaar-scientific shadow-sm">
            <ShieldCheck className="w-4 h-4 text-vistaar-primary" />
            <span>NCPOR • National Polar Science Dissemination Framework</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-vistaar-text max-w-4xl mx-auto leading-tight">
            India’s Polar Frontier: <br />
            <span className="text-vistaar-primary">Antarctica</span>,{" "}
            <span className="text-vistaar-scientific">Arctic</span> & The{" "}
            <span className="text-emerald-700">Third Pole</span>
          </h1>

          <p className="text-base sm:text-lg text-vistaar-muted max-w-3xl mx-auto leading-relaxed">
            Welcome to <strong>VISTAAR</strong> (विस्तार), the authoritative knowledge portal integrating 
            NPDC scientific datasets, multi-track science communication, and deterministic claim provenance 
            for India’s polar research stations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/weather">
              <Button size="lg" className="flex items-center space-x-2">
                <CloudSun className="w-5 h-5" />
                <span>Explore Live Polar Weather</span>
              </Button>
            </Link>
            <Link href="/workspace">
              <Button variant="outline" size="lg" className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-vistaar-primary" />
                <span>Scientific Review Studio</span>
              </Button>
            </Link>
            <Link href="/datasets">
              <Button variant="outline" size="lg" className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-vistaar-scientific" />
                <span>NPDC Datasets</span>
              </Button>
            </Link>
          </div>

          {/* Quick Persona Access Tabs */}
          <div className="pt-8 max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-wider font-semibold text-vistaar-muted mb-3">
              Explore by Institutional Persona
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <Link href="/education" className="p-3 bg-white rounded-lg border border-vistaar-border hover:border-vistaar-primary transition-colors shadow-sm block">
                <span className="block text-xs font-bold text-vistaar-primary uppercase">Student</span>
                <span className="text-xs text-vistaar-muted">Class 8–12 modules & interactive polar quizzes</span>
              </Link>
              <Link href="/education" className="p-3 bg-white rounded-lg border border-vistaar-border hover:border-vistaar-primary transition-colors shadow-sm block">
                <span className="block text-xs font-bold text-vistaar-scientific uppercase">Teacher</span>
                <span className="text-xs text-vistaar-muted">Curriculum guides, worksheets & answer keys</span>
              </Link>
              <Link href="/media" className="p-3 bg-white rounded-lg border border-vistaar-border hover:border-vistaar-primary transition-colors shadow-sm block">
                <span className="block text-xs font-bold text-amber-700 uppercase">Journalist</span>
                <span className="text-xs text-vistaar-muted">Approved PIB press releases & media kits</span>
              </Link>
              <Link href="/datasets" className="p-3 bg-white rounded-lg border border-vistaar-border hover:border-vistaar-primary transition-colors shadow-sm block">
                <span className="block text-xs font-bold text-emerald-700 uppercase">Scientist</span>
                <span className="text-xs text-vistaar-muted">Authoritative NPDC observations & raw checksums</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real Indian Polar Stations Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-vistaar-border pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-vistaar-text">Permanent Research Stations</h2>
            <p className="text-sm text-vistaar-muted mt-1">
              Active scientific bases across Antarctica, the Arctic Circle, and the Himalayan Third Pole
            </p>
          </div>
          <Link href="/stations" className="text-sm font-semibold text-vistaar-primary hover:underline flex items-center space-x-1 mt-2 sm:mt-0">
            <span>View all observatories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 py-12 text-center text-sm text-vistaar-muted">
              Loading verified station records from MongoDB Atlas...
            </div>
          ) : (
            stations.map((st) => (
              <Card key={st.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={st.status === "ACTIVE" ? "success" : "default"}>
                      {st.status}
                    </Badge>
                    <span className="text-xs font-mono font-medium text-vistaar-muted">
                      {st.region}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{st.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {st.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="bg-vistaar-bg p-3 rounded text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-vistaar-muted">Lat / Long:</span>
                      <span className="font-semibold text-vistaar-text">
                        {st.coordinates?.lat}°, {st.coordinates?.lng}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vistaar-muted">Elevation:</span>
                      <span className="font-semibold text-vistaar-text">
                        {st.coordinates?.elevation} m
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/weather?station=${st.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Weather Data
                      </Button>
                    </Link>
                    <Link href={`/stations?id=${st.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Four-Track Dissemination Studio Concept */}
      <section className="bg-vistaar-surface border-y border-vistaar-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="scientific">Mandatory Four-Track Communication</Badge>
            <h2 className="text-3xl font-bold text-vistaar-text">
              Transforming Complex Polar Science into Accurate Public Understanding
            </h2>
            <p className="text-sm text-vistaar-muted leading-relaxed">
              Every factual statement is deterministically verified against raw NPDC records and PDF research pages. 
              No unapproved synthetic hallucination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg border border-vistaar-border bg-vistaar-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-vistaar-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-vistaar-text">1. Administrative & PIB</h3>
              <p className="text-xs text-vistaar-muted leading-relaxed">
                Formal government bulletins adhering to PIB formatting, authorized official quotes, and strict provenance records.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-vistaar-border bg-vistaar-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 text-vistaar-scientific flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-vistaar-text">2. Social Media Dispatches</h3>
              <p className="text-xs text-vistaar-muted leading-relaxed">
                Concise, engaging scientific updates formatted for X, LinkedIn, and Instagram with hashtags and verified observation stats.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-vistaar-border bg-vistaar-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-vistaar-text">3. Classroom Studio (8–12)</h3>
              <p className="text-xs text-vistaar-muted leading-relaxed">
                NCERT-aligned lesson modules featuring real measurements from Himansh and Maitri, complete with 3-question quizzes.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-vistaar-border bg-vistaar-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-vistaar-text">4. Vernacular & Hindi</h3>
              <p className="text-xs text-vistaar-muted leading-relaxed">
                Preserving numerical precision and scientific terminology across Indian languages via Digital India Bhashini.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
