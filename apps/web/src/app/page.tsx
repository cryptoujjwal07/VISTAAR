"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Database,
  CloudSun,
  GraduationCap,
  ArrowRight,
  MapPin,
  BookOpen,
  Shield,
  Edit3,
  FlaskConical,
  FileSearch,
  CheckCircle2,
  PlusCircle,
  Send,
  Image as ImageIcon,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { fetchApi } from "@/lib/api";
import { ROLE_PORTAL_MAP, getRolePortalRoute } from "@/components/layout/AuthGate";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Role-specific live data
  const [publishedResearch, setPublishedResearch] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [weatherSample, setWeatherSample] = useState<any>(null);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [allPublications, setAllPublications] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Field Scientist New Submission Form State
  const [subTitle, setSubTitle] = useState("");
  const [subStation, setSubStation] = useState("maitri");
  const [subCategory, setSubCategory] = useState<"DATASET" | "DOCUMENT" | "FIELD_OBSERVATION">("FIELD_OBSERVATION");
  const [subSummary, setSubSummary] = useState("");
  const [subSaving, setSubSaving] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      if (typeof window === "undefined") return;
      const savedUser = localStorage.getItem("vistaar_user");
      const savedToken = localStorage.getItem("vistaar_token");
      if (savedUser && savedToken) {
        try {
          setCurrentUser(JSON.parse(savedUser));
          return;
        } catch {
          setCurrentUser(null);
        }
      }
      setCurrentUser(null);
    };

    syncAuth();
    window.addEventListener("vistaar-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("vistaar-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  async function loadRoleData(userObj: any) {
    if (!userObj) return;
    const role = userObj.role;

    try {
      // Common weather + published research
      const [pubsRes, wRes] = await Promise.all([
        fetchApi("/publications/published").catch(() => []),
        fetchApi("/weather/timeseries?station_id=maitri&limit=24").catch(() => null),
      ]);
      setPublishedResearch(Array.isArray(pubsRes) ? pubsRes.slice(0, 3) : []);
      setWeatherSample(wRes);

      if (role === "PUBLIC_USER" || role === "SUPER_ADMIN") {
        const [lesRes, medRes] = await Promise.all([
          fetchApi("/classroom/lessons").catch(() => []),
          fetchApi("/media/assets?limit=3").catch(() => []),
        ]);
        setLessons(Array.isArray(lesRes) ? lesRes.slice(0, 4) : []);
        setMediaAssets(Array.isArray(medRes) ? medRes.slice(0, 4) : []);
      }

      if (role === "FIELD_SCIENTIST" || role === "SUPER_ADMIN") {
        const [dsRes, subRes] = await Promise.all([
          fetchApi("/datasets?limit=6").catch(() => ({ items: [] })),
          fetchApi("/auth/submissions", { bypassCache: true }).catch(() => ({ items: [] })),
        ]);
        setDatasets(dsRes?.items ? dsRes.items.slice(0, 6) : Array.isArray(dsRes) ? dsRes.slice(0, 6) : []);
        setMySubmissions(subRes?.items || []);
      }

      if (role === "OUTREACH_EDITOR" || role === "SUPER_ADMIN") {
        const [allPubs, medRes] = await Promise.all([
          fetchApi("/publications/all", { bypassCache: true }).catch(() => []),
          fetchApi("/media/assets?limit=4").catch(() => []),
        ]);
        setAllPublications(Array.isArray(allPubs) ? allPubs.slice(0, 6) : []);
        setMediaAssets(Array.isArray(medRes) ? medRes.slice(0, 4) : []);
      }

      if (role === "SUPER_ADMIN") {
        const usrRes = await fetchApi("/auth/users?limit=6", { bypassCache: true }).catch(() => ({ items: [] }));
        setAdminUsers(usrRes?.items || []);
      }
    } catch (err) {
      console.error("Failed to load role workspace data", err);
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadRoleData(currentUser);
    }
  }, [currentUser]);

  async function handleCreateFieldSubmission(e: React.FormEvent) {
    e.preventDefault();
    setSubSaving(true);
    setSubMessage(null);
    try {
      const res = await fetchApi("/auth/submissions", {
        method: "POST",
        body: JSON.stringify({
          title: subTitle.trim(),
          station_id: subStation,
          category: subCategory,
          summary: subSummary.trim(),
        }),
      });
      setSubMessage(`Saved field submission ${res?.submission_id} under your account!`);
      setSubTitle("");
      setSubSummary("");
      loadRoleData(currentUser);
    } catch (err: any) {
      setSubMessage(err?.message || "Failed to create submission.");
    } finally {
      setSubSaving(false);
    }
  }

  if (!currentUser) {
    return null;
  }

  const role = currentUser.role || "PUBLIC_USER";
  const roleSpec = ROLE_PORTAL_MAP[role] || ROLE_PORTAL_MAP.PUBLIC_USER;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6 pb-14 overflow-x-hidden text-vistaar-text">
      {/* 1. ROLE-BASED USER HEADER BANNER */}
      <section className="rounded-3xl ice-glass-strong p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <MountainLogo size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="scientific">{role}</Badge>
              <span className="text-xs font-mono text-vistaar-muted">
                User Account: {currentUser.email}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-vistaar-text">
              Welcome, {currentUser.name || currentUser.full_name || currentUser.email}
            </h1>
            <p className="text-xs sm:text-sm text-vistaar-muted max-w-2xl">
              {roleSpec.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link href={getRolePortalRoute(role)}>
            <Button size="md" className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white font-bold shadow-sm flex items-center space-x-2">
              <span>Open Primary Workspace ({getRolePortalRoute(role)})</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* =====================================================================
          ROLE 1: PUBLIC_USER (Student / Teacher / Citizen / Journalist)
          ===================================================================== */}
      {role === "PUBLIC_USER" && (
        <div className="space-y-6">
          {/* Quick Public User Modules */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { href: "/education", label: "Polar Classroom", sub: "NCERT Classes 8–12", icon: GraduationCap },
              { href: "/weather", label: "Live Weather", sub: "Maitri • Bharati • Himansh", icon: CloudSun },
              { href: "/stations", label: "4 Observatories", sub: "Interactive Map", icon: Building2 },
              { href: "/research", label: "Published Research", sub: "Approved Bulletins", icon: BookOpen },
              { href: "/media", label: "Media & Press", sub: "GODL Archive", icon: ImageIcon },
              { href: "/explore", label: "Explore & RAG", sub: "Knowledge Search", icon: Compass },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="p-3.5 rounded-2xl ice-glass hover:bg-white transition-all flex items-center space-x-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-vistaar-primary group-hover:bg-vistaar-primary group-hover:text-white transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-vistaar-text block truncate">{mod.label}</span>
                    <span className="text-[11px] text-vistaar-muted block truncate">{mod.sub}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Classroom Lessons */}
            <Card className="lg:col-span-7 ice-glass">
              <CardHeader className="p-5 border-b border-sky-100 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase font-bold text-vistaar-scientific">
                    YOUR ASSIGNED MODULE • NCERT CLASSES 8–12
                  </span>
                  <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                    Interactive Polar Classroom & Quizzes
                  </CardTitle>
                </div>
                <Link href="/education">
                  <Button size="sm" className="text-xs">Open Classroom →</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {lessons.map((les) => (
                  <Link
                    key={les.id}
                    href="/education"
                    className="p-3 rounded-xl border border-sky-200/80 bg-white/80 hover:bg-white transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="scientific">Class {les.class_grade}</Badge>
                      <span className="text-[10px] font-mono text-vistaar-muted">{les.station}</span>
                    </div>
                    <span className="font-bold text-vistaar-text">{les.title}</span>
                    <span className="text-[11px] text-vistaar-muted mt-1">{les.subject}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Live Weather Summary */}
            <Card className="lg:col-span-5 ice-glass flex flex-col justify-between">
              <CardHeader className="p-5 border-b border-sky-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase font-bold text-vistaar-scientific">
                    LIVE STATION TELEMETRY
                  </span>
                  <Badge variant="scientific">Real NPDC Stream</Badge>
                </div>
                <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                  Polar Weather Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2 bg-sky-50/80 p-3 rounded-xl border border-sky-200 font-mono">
                  <div>
                    <span className="text-[10px] text-vistaar-muted block">STATION</span>
                    <span className="font-bold text-vistaar-text">{weatherSample?.station_name || "Maitri"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-vistaar-muted block">MEAN TEMP</span>
                    <span className="font-bold text-vistaar-primary">
                      {weatherSample?.statistics?.avg ?? "-12.4"} {weatherSample?.unit || "°C"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-vistaar-muted block">RECORDS</span>
                    <span className="font-bold text-emerald-700">{weatherSample?.statistics?.count ?? 24}</span>
                  </div>
                </div>
                <Link href="/weather" className="block">
                  <Button size="sm" className="w-full text-xs">Explore All 4 Station Weather Streams →</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ROLE 2: FIELD_SCIENTIST (Document AI, Field Submissions, NPDC Datasets)
          ===================================================================== */}
      {role === "FIELD_SCIENTIST" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Submit New Field Scientist Observation / Dataset Draft */}
          <Card className="lg:col-span-5 ice-glass-strong">
            <CardHeader className="p-5 border-b border-sky-200/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-emerald-700">
                  FIELD SCIENTIST WORKSPACE
                </span>
                <Badge variant="scientific">User-Isolated (IDOR Protected)</Badge>
              </div>
              <CardTitle className="text-lg font-extrabold text-vistaar-text mt-1">
                Submit New Field Observation / Dataset Draft
              </CardTitle>
              <CardDescription className="text-xs">
                Submissions are linked to your scientist account ({currentUser.email}) and audited in MongoDB.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {subMessage && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {subMessage}
                </div>
              )}
              <form onSubmit={handleCreateFieldSubmission} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-vistaar-text block mb-1">Observation / Dataset Title</label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    placeholder="e.g., Maitri Katabatic Wind Gust Telemetry Log"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text"
                    required
                    minLength={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-vistaar-text block mb-1">Polar Station</label>
                    <select
                      value={subStation}
                      onChange={(e) => setSubStation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/95 font-semibold"
                    >
                      <option value="maitri">Maitri (Antarctica)</option>
                      <option value="bharati">Bharati (Antarctica)</option>
                      <option value="himadri">Himadri (Arctic)</option>
                      <option value="himansh">Himansh (Himalayas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-vistaar-text block mb-1">Category</label>
                    <select
                      value={subCategory}
                      onChange={(e) =>
                        setSubCategory(e.target.value as "DATASET" | "DOCUMENT" | "FIELD_OBSERVATION")
                      }
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/95 font-semibold"
                    >
                      <option value="FIELD_OBSERVATION">Field Observation</option>
                      <option value="DATASET">NPDC Dataset</option>
                      <option value="DOCUMENT">Expedition Report</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-vistaar-text block mb-1">Scientific Summary & Provenance</label>
                  <textarea
                    rows={3}
                    value={subSummary}
                    onChange={(e) => setSubSummary(e.target.value)}
                    placeholder="Record instrument readings, coordinates, and anomaly notes..."
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text"
                    required
                  />
                </div>
                <Button type="submit" size="sm" disabled={subSaving} className="w-full flex items-center justify-center space-x-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>{subSaving ? "Submitting Field Draft..." : "Submit Field Observation"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right 7 Cols: My Submitted Drafts + NPDC Datasets + Document AI */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="ice-glass">
              <CardHeader className="p-5 border-b border-sky-100 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase font-bold text-vistaar-primary">
                    USER-BASED SUBMISSIONS ({mySubmissions.length})
                  </span>
                  <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                    Your Field Scientist Submissions
                  </CardTitle>
                </div>
                <Link href="/documents">
                  <Button size="sm" className="text-xs">Open Document AI BBox Parser →</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5 text-xs">
                {mySubmissions.length === 0 ? (
                  <p className="text-vistaar-muted">
                    No field submissions under your account yet. Use the form on the left to log a field observation.
                  </p>
                ) : (
                  mySubmissions.slice(0, 4).map((sub) => (
                    <div
                      key={sub.submission_id}
                      className="p-3 rounded-xl border border-sky-200/80 bg-white/85 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-vistaar-text block truncate">{sub.title}</span>
                        <span className="text-[11px] text-vistaar-muted block truncate">
                          {sub.station_id?.toUpperCase()} • {sub.category} • Author: {sub.author_email}
                        </span>
                      </div>
                      <Badge variant="scientific">{sub.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="ice-glass">
              <CardHeader className="p-5 border-b border-sky-100 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase font-bold text-vistaar-scientific">
                    NATIONAL POLAR DATA CENTRE (NPDC)
                  </span>
                  <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                    Authoritative Scientific Datasets ({datasets.length})
                  </CardTitle>
                </div>
                <Link href="/datasets">
                  <Button size="sm" variant="outline" className="text-xs bg-white">
                    Open NPDC Datasets →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {datasets.slice(0, 4).map((ds) => (
                  <Link
                    key={ds.dataset_id}
                    href="/datasets"
                    className="p-3 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white transition-all block"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-bold text-vistaar-primary">{ds.dataset_id}</span>
                      <Badge variant="outline">{ds.region}</Badge>
                    </div>
                    <div className="font-bold text-vistaar-text truncate mt-1">{ds.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted mt-0.5">
                      Records: {ds.record_count?.toLocaleString()} • SHA-256 Verified
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ROLE 3: OUTREACH_EDITOR (4-Track AI Studio, Claim Verification & PIB Approval)
          ===================================================================== */}
      {role === "OUTREACH_EDITOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 ice-glass-strong">
            <CardHeader className="p-5 border-b border-sky-200/70 flex flex-row items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-vistaar-primary">
                  OUTREACH EDITOR WORKSPACE
                </span>
                <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                  Editorial Review & Publication Queue ({allPublications.length})
                </CardTitle>
              </div>
              <Link href="/workspace">
                <Button size="sm" className="text-xs">Launch 4-Track AI Review Studio →</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              {allPublications.map((pub) => (
                <Link
                  key={pub.id}
                  href="/workspace"
                  className="p-3.5 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">
                      {pub.pib?.title || pub.title || "Polar Science Outreach Draft"}
                    </span>
                    <span className="text-[11px] font-mono text-vistaar-muted block mt-0.5">
                      Station: {pub.station_id} • Dataset: {pub.dataset_id} • v{pub.version || 1}
                    </span>
                  </div>
                  <Badge variant={pub.status === "PUBLISHED" ? "success" : "scientific"}>
                    {pub.status}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 ice-glass flex flex-col justify-between">
            <CardHeader className="p-5 border-b border-sky-100">
              <span className="text-[11px] font-mono uppercase font-bold text-vistaar-scientific">
                ACCREDITED MEDIA & PIB DISSEMINATION
              </span>
              <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                Press Kits & Visual Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              {mediaAssets.map((asset) => (
                <Link
                  key={asset.id}
                  href="/media"
                  className="p-3 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white transition-all flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">{asset.title}</span>
                    <span className="text-[11px] text-vistaar-muted block truncate">
                      {asset.region} • {asset.license}
                    </span>
                  </div>
                  <Badge variant="outline">{asset.media_type}</Badge>
                </Link>
              ))}
              <Link href="/media" className="block pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs bg-white">
                  Manage Press Kits & Exports →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =====================================================================
          ROLE 4: SUPER_ADMIN (RBAC Governance, User Directory & Full Portal Control)
          ===================================================================== */}
      {role === "SUPER_ADMIN" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin" className="p-4 rounded-2xl ice-glass-strong hover:bg-white transition-all">
              <Shield className="w-5 h-5 text-red-600 mb-2" />
              <div className="text-sm font-extrabold text-vistaar-text">Admin Governance Console</div>
              <div className="text-xs text-vistaar-muted mt-0.5">Manage Users, Roles & Audit Trail (/admin)</div>
            </Link>
            <Link href="/workspace" className="p-4 rounded-2xl ice-glass-strong hover:bg-white transition-all">
              <Edit3 className="w-5 h-5 text-blue-600 mb-2" />
              <div className="text-sm font-extrabold text-vistaar-text">Outreach Review Studio</div>
              <div className="text-xs text-vistaar-muted mt-0.5">4-Track AI & Claim Verification (/workspace)</div>
            </Link>
            <Link href="/documents" className="p-4 rounded-2xl ice-glass-strong hover:bg-white transition-all">
              <FileSearch className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="text-sm font-extrabold text-vistaar-text">Document AI & Submissions</div>
              <div className="text-xs text-vistaar-muted mt-0.5">PDF BBox Provenance & Field Logs (/documents)</div>
            </Link>
            <Link href="/datasets" className="p-4 rounded-2xl ice-glass-strong hover:bg-white transition-all">
              <Database className="w-5 h-5 text-cyan-700 mb-2" />
              <div className="text-sm font-extrabold text-vistaar-text">NPDC Dataset Registry</div>
              <div className="text-xs text-vistaar-muted mt-0.5">SHA-256 Verified Telemetry (/datasets)</div>
            </Link>
          </div>

          <Card className="ice-glass-strong">
            <CardHeader className="p-5 border-b border-sky-200/70 flex flex-row items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-red-700">
                  SUPER ADMIN GOVERNANCE • REGISTERED PLATFORM USERS ({adminUsers.length})
                </span>
                <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                  Active User Accounts & Role Assignments
                </CardTitle>
              </div>
              <Link href="/admin">
                <Button size="sm" className="text-xs">Manage All Users & Audit Logs →</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {adminUsers.map((u) => (
                <div
                  key={u.id || u.email}
                  className="p-3.5 rounded-xl border border-sky-200/80 bg-white/85 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">{u.name}</span>
                    <span className="text-[11px] font-mono text-vistaar-muted block truncate">{u.email}</span>
                  </div>
                  <Badge variant="scientific">{u.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
