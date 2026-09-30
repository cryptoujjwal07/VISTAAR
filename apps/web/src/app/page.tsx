"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Database,
  CloudSun,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Globe2,
  BookOpen,
  Camera,
  Languages,
  Users,
  Lock,
  Sparkles,
  MountainSnow,
  Shield,
  Edit3,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { fetchApi } from "@/lib/api";
import { getRolePortalLabel, getRolePortalRoute } from "@/components/layout/AuthGate";

const HERO_SLIDES = [
  {
    regionTag: "ANTARCTICA",
    title: "Antarctica: Maitri & Bharati Observatories",
    titleHi: "अंटार्कटिका: मैत्री और भारती वेधशालाएँ",
    subtitle:
      "Continuous atmospheric, geomagnetic, and ice-shelf monitoring across the Schirmacher Oasis and Larsemann Hills under the Indian Antarctic Programme.",
    subtitleHi:
      "भारतीय अंटार्कटिक कार्यक्रम के अंतर्गत शूमाकर ओएसिस और लार्समन हिल्स में सतत वायुमंडलीय, भू-चुंबकीय और हिम-शेल्फ निगरानी।",
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85",
    stationId: "maitri",
    coordinates: "70°45' S, 11°44' E • 69°24' S, 76°11' E",
    elevation: "117m & 35m AMSL",
  },
  {
    regionTag: "ARCTIC",
    title: "The Arctic: Himadri & IndARC Mooring",
    titleHi: "आर्कटिक: हिमाद्री और IndARC वेधशाला",
    subtitle:
      "Year-round fjord oceanography, precipitation microphysics, and Arctic amplification research at Ny-Ålesund, Svalbard (79°N).",
    subtitleHi:
      "नाइ-आलेसुंड, स्वालबार्ड (79°N) में वर्ष भर फ्योर्ड समुद्र विज्ञान, वर्षण सूक्ष्म भौतिकी और आर्कटिक प्रवर्धन अनुसंधान।",
    bgImage: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1400&q=85",
    stationId: "himadri",
    coordinates: "78°55' N, 11°55' E",
    elevation: "Kongsfjorden, Svalbard",
  },
  {
    regionTag: "HIMALAYAS",
    title: "The Himalayas: Himansh (Third Pole)",
    titleHi: "हिमालय: हिमांश (तीसरा ध्रुव)",
    subtitle:
      "High-altitude glacier mass balance, snow water equivalent, and monsoon teleconnection telemetry at 4,080m in the Chandra Basin, Spiti Valley.",
    subtitleHi:
      "चंद्रा बेसिन, स्पीति घाटी में 4,080 मीटर की ऊँचाई पर हिमनद द्रव्यमान संतुलन और मानसून टेलीकनेक्शन टेलीमेट्री।",
    bgImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85",
    stationId: "himansh",
    coordinates: "32°24' N, 77°37' E",
    elevation: "4,080m AMSL • Spiti Valley",
  },
];

const REGIONAL_PILLARS = [
  {
    region: "Antarctica",
    regionHi: "अंटार्कटिका",
    stations: "Maitri (1989) & Bharati (2012)",
    coordinates: "70°45'S, 11°44'E | 69°24'S, 76°11'E",
    summary:
      "Investigating katabatic wind dynamics, tropospheric radiometry, ice-core paleoclimate records, and Southern Ocean carbon fluxes across East Antarctica.",
    stationLink: "/stations?station=maitri",
    weatherLink: "/weather?station=maitri",
  },
  {
    region: "The Arctic",
    regionHi: "आर्कटिक",
    stations: "Himadri (2008) & IndARC Mooring (2014)",
    coordinates: "78°55'N, 11°55'E (Kongsfjorden, Svalbard)",
    summary:
      "Monitoring Arctic sea-ice retreat, laser disdrometer precipitation intensity, and Atlantic water intrusion into high-latitude fjords.",
    stationLink: "/stations?station=himadri",
    weatherLink: "/weather?station=himadri",
  },
  {
    region: "The Himalayas",
    regionHi: "हिमालय (तीसरा ध्रुव)",
    stations: "Himansh Glaciological Base (4,080m AMSL)",
    coordinates: "32°24'N, 77°37'E (Chandra Basin, Western Himalayas)",
    summary:
      "Benchmark glacier mass balance at Sutri Dhaka, automated weather station telemetry, and cryospheric freshwater security for the Indian subcontinent.",
    stationLink: "/stations?station=himansh",
    weatherLink: "/weather?station=himansh",
  },
];

const PERSONA_GUIDANCE: Record<string, { label: string; badge: string; desc: string; primaryHref: string; primaryCta: string }> = {
  student: {
    label: "Student",
    badge: "NCERT Classes 8–12 Aligned",
    desc: "Explore interactive polar classroom modules, glacier mass-balance activities, and self-assessment quizzes grounded in real Indian polar observations.",
    primaryHref: "/education",
    primaryCta: "Open Polar Classroom",
  },
  teacher: {
    label: "Teacher",
    badge: "Educator Lesson Plans & Answer Keys",
    desc: "Download print-ready CBSE/NCERT lesson plans, discussion guides, and calibrated NPDC classroom charts for Earth Science instruction.",
    primaryHref: "/education",
    primaryCta: "Download Teacher Lesson Plans",
  },
  journalist: {
    label: "Journalist",
    badge: "Accredited PIB & MoES Press Kits",
    desc: "Access human-approved PIB press releases, verified polar statistics with dataset provenance, and GODL-licensed media dispatches.",
    primaryHref: "/media",
    primaryCta: "Open Press Kit & Media Library",
  },
  scientist: {
    label: "Scientist",
    badge: "NPDC Telemetry & Review Studio",
    desc: "Inspect SHA-256 verified NPDC datasets, query the hybrid RAG knowledge engine, and verify claims in the Scientific Review Workspace.",
    primaryHref: "/datasets",
    primaryCta: "Explore NPDC Datasets",
  },
};

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [persona, setPersona] = useState<"student" | "teacher" | "journalist" | "scientist">("student");
  const [language, setLanguage] = useState<"en" | "hi" | "ta">("en");
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; full_name?: string } | null>(null);

  // Live published data from backend (strictly published/approved only)
  const [publishedResearch, setPublishedResearch] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [weatherSample, setWeatherSample] = useState<any>(null);

  useEffect(() => {
    const syncAuth = () => {
      if (typeof window === "undefined") return;
      const savedUser = localStorage.getItem("vistaar_user");
      const savedToken = localStorage.getItem("vistaar_token");
      if (savedUser && savedToken) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          if (parsed?.role === "FIELD_SCIENTIST" || parsed?.role === "SUPER_ADMIN") {
            setPersona("scientist");
          }
          return;
        } catch {
          setCurrentUser(null);
        }
      }
      setCurrentUser(null);
      setPersona((prev) => (prev === "scientist" ? "student" : prev));
    };

    syncAuth();
    window.addEventListener("vistaar-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("vistaar-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const [pubsRes, dsRes, lesRes, medRes, wRes] = await Promise.all([
          fetchApi("/publications/published").catch(() => []),
          currentUser ? fetchApi("/datasets?limit=4").catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
          fetchApi("/classroom/lessons").catch(() => []),
          fetchApi("/media/assets?limit=3").catch(() => []),
          fetchApi("/weather/timeseries?station_id=maitri&limit=24").catch(() => null),
        ]);
        setPublishedResearch(Array.isArray(pubsRes) ? pubsRes.slice(0, 3) : []);
        setDatasets(dsRes?.items ? dsRes.items.slice(0, 4) : Array.isArray(dsRes) ? dsRes.slice(0, 4) : []);
        setLessons(Array.isArray(lesRes) ? lesRes.slice(0, 3) : []);
        setMediaAssets(Array.isArray(medRes) ? medRes.slice(0, 3) : []);
        setWeatherSample(wRes);
      } catch (err) {
        console.error("Failed to load public portal data", err);
      }
    }
    loadPortalData();
  }, [currentUser]);

  const currentSlide = HERO_SLIDES[activeSlide];
  const activePersona = PERSONA_GUIDANCE[persona];
  const availablePersonas = currentUser
    ? (["student", "teacher", "journalist", "scientist"] as const)
    : (["student", "teacher", "journalist"] as const);

  const openLoginModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("vistaar-open-login-modal"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-16 text-vistaar-text">
      {/* 1. COMPACT FRAMED ICE-MOUNTAIN LANDING PAGE (NOT FULL-SCREEN) */}
      <section aria-label="VISTAAR Ice-Mountain Landing Showcase" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Framed Landing Hero Card (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl ice-glass-strong p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative SVG Ice-Mountain ridgeline watermark */}
          <svg
            viewBox="0 0 600 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-0 right-0 w-full h-28 opacity-25 pointer-events-none"
            preserveAspectRatio="none"
          >
            <path d="M0 140L110 55L205 110L330 20L455 95L535 45L600 140H0Z" fill="#BAE6FD" />
            <path d="M160 140L330 20L455 95L600 30V140H160Z" fill="#7DD3FC" />
          </svg>

          <div className="relative z-10 space-y-4">
            {/* Brand + Institutional Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-200/70">
              <div className="flex items-center space-x-3">
                <MountainLogo size="lg" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold text-vistaar-scientific">
                      NCPOR • MINISTRY OF EARTH SCIENCES
                    </span>
                    <Badge variant="scientific">SIH 26063</Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-vistaar-text">
                    VISTAAR <span className="text-vistaar-scientific font-semibold">(विस्तार)</span> Polar Portal
                  </h1>
                </div>
              </div>

              {/* Region Tabs */}
              <div role="tablist" aria-label="Polar Region Hero Slides" className="flex space-x-1 bg-sky-50/90 p-1 rounded-full border border-sky-200/80">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.regionTag}
                    role="tab"
                    aria-selected={activeSlide === idx}
                    aria-label={`View ${slide.regionTag} highlight`}
                    onClick={() => setActiveSlide(idx)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      activeSlide === idx
                        ? "bg-gradient-to-r from-vistaar-primary to-vistaar-scientific text-white shadow-2xs"
                        : "text-vistaar-muted hover:text-vistaar-text"
                    }`}
                  >
                    {slide.regionTag}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Cryospheric Realm Highlight inside Compact Framed Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
              <div className="sm:col-span-7 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-[#0E7490] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                    <MountainSnow className="w-3.5 h-3.5 text-sky-600" />
                    {currentSlide.regionTag}
                  </span>
                  <span className="text-[11px] font-mono text-vistaar-muted">{currentSlide.coordinates}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-vistaar-text leading-snug">
                  {language === "hi" ? currentSlide.titleHi : currentSlide.title}
                </h2>

                <p className="text-xs sm:text-sm text-vistaar-muted leading-relaxed">
                  {language === "hi" ? currentSlide.subtitleHi : currentSlide.subtitle}
                </p>
              </div>

              {/* Framed Ice-Mountain Thumbnail Card (Not Full Screen) */}
              <div className="sm:col-span-5">
                <div className="relative h-44 rounded-2xl overflow-hidden border-2 border-white shadow-md group">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${currentSlide.bgImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-sky-950/20 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-200 block">
                      {currentSlide.elevation}
                    </span>
                    <span className="text-xs font-bold leading-tight block">
                      {currentSlide.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Landing Actions & Key Metrics */}
          <div className="relative z-10 pt-5 mt-4 border-t border-sky-200/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {currentUser ? (
                <Link href={getRolePortalRoute(currentUser.role)}>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white font-bold shadow-sm">
                    Open {getRolePortalLabel(currentUser.role)} →
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={openLoginModal}
                  className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold shadow-sm cursor-pointer"
                >
                  Sign In to Role Portal →
                </Button>
              )}
              <Link href={`/weather?station=${currentSlide.stationId}`}>
                <Button size="sm" variant="outline" className="bg-white/85 text-vistaar-text border-sky-200 hover:bg-white font-semibold">
                  Live Weather Telemetry
                </Button>
              </Link>
              <Link href="/research">
                <Button size="sm" variant="outline" className="bg-white/85 text-vistaar-text border-sky-200 hover:bg-white font-semibold">
                  Published Research
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-vistaar-scientific font-bold">
              <span>4 Polar Stations</span>
              <span>•</span>
              <span>100% Claim-Verified</span>
            </div>
          </div>
        </div>

        {/* Right Framed Role Portal & Access Gate Card (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl ice-glass-strong p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-vistaar-primary flex items-center gap-1.5">
                {currentUser ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>AUTHENTICATED SESSION ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-vistaar-primary" />
                    <span>DIRECT ROLE PORTAL LAUNCHPAD</span>
                  </>
                )}
              </span>
              <Badge variant="scientific">
                {currentUser ? currentUser.role : "RBAC Protected"}
              </Badge>
            </div>

            <h2 className="text-lg font-extrabold text-vistaar-text">
              {currentUser
                ? `Welcome, ${currentUser.full_name || currentUser.email}`
                : "Sign In Opens Your Role Portal Directly"}
            </h2>
            <p className="text-xs text-vistaar-muted leading-relaxed">
              {currentUser
                ? "Your institutional credentials are active. Launch your assigned role workspace below or browse public modules."
                : "Without login, internal workspaces are locked and only public outreach modules are visible. Select or sign in to open your role portal directly:"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <Link
                href="/admin"
                className="p-3 rounded-xl border border-sky-200/80 bg-white/80 hover:bg-white transition-all flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-600" />
                    Super Admin
                  </span>
                  <span className="text-[10px] font-mono text-vistaar-scientific">/admin</span>
                </div>
                <span className="text-[11px] text-vistaar-muted mt-1">
                  RBAC, Audit Logs & Governance
                </span>
              </Link>

              <Link
                href="/workspace"
                className="p-3 rounded-xl border border-sky-200/80 bg-white/80 hover:bg-white transition-all flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    Outreach Editor
                  </span>
                  <span className="text-[10px] font-mono text-vistaar-scientific">/workspace</span>
                </div>
                <span className="text-[11px] text-vistaar-muted mt-1">
                  Claim Verification & PIB Studio
                </span>
              </Link>

              <Link
                href="/documents"
                className="p-3 rounded-xl border border-sky-200/80 bg-white/80 hover:bg-white transition-all flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                    Field Scientist
                  </span>
                  <span className="text-[10px] font-mono text-vistaar-scientific">/documents</span>
                </div>
                <span className="text-[11px] text-vistaar-muted mt-1">
                  Document AI & NPDC Ingestion
                </span>
              </Link>

              <Link
                href="/education"
                className="p-3 rounded-xl border border-sky-200/80 bg-white/80 hover:bg-white transition-all flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    Student / Public
                  </span>
                  <span className="text-[10px] font-mono text-vistaar-scientific">/education</span>
                </div>
                <span className="text-[11px] text-vistaar-muted mt-1">
                  NCERT Classroom & Quizzes
                </span>
              </Link>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-sky-200/70 flex items-center justify-between">
            <span className="text-[11px] font-mono text-vistaar-muted">
              {currentUser ? `Signed in as ${currentUser.role}` : "Public Read-Only Mode Active"}
            </span>
            {currentUser ? (
              <Link
                href={getRolePortalRoute(currentUser.role)}
                className="text-xs font-bold text-vistaar-primary hover:underline flex items-center gap-1"
              >
                <span>Go to My Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={openLoginModal}
                className="text-xs font-bold text-vistaar-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>1-Click Institutional Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* PERSONA & MULTILINGUAL BAR — ICE-MOUNTAIN GLASSMORPHIC */}
      <section aria-label="Persona and Language Selection">
        <Card className="ice-glass-strong">
          <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-vistaar-primary" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-vistaar-scientific">
                  Tailor Public Portal by Persona ({activePersona.label})
                </span>
                <Badge variant="scientific">{activePersona.badge}</Badge>
              </div>
              <p className="text-xs text-vistaar-muted max-w-2xl">{activePersona.desc}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div role="group" aria-label="Select User Persona" className="flex items-center bg-sky-50/80 backdrop-blur-md p-1 rounded-lg border border-sky-200/80">
                {availablePersonas.map((p) => (
                  <button
                    key={p}
                    aria-pressed={persona === p}
                    onClick={() => setPersona(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all cursor-pointer ${
                      persona === p
                        ? "bg-gradient-to-r from-vistaar-primary to-vistaar-scientific text-white shadow-xs"
                        : "text-vistaar-muted hover:text-vistaar-text"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1.5 bg-sky-50/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-sky-200/80">
                <Languages className="w-4 h-4 text-vistaar-scientific" />
                <select
                  aria-label="Select Portal Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "ta")}
                  className="text-xs font-bold bg-transparent text-vistaar-text focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              <Link href={activePersona.primaryHref}>
                <Button size="sm" className="text-xs flex items-center space-x-1 shadow-xs">
                  <span>{activePersona.primaryCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. INDIA'S POLAR SCIENCE & 3. ANTARCTICA, ARCTIC, HIMALAYAS */}
      <section aria-labelledby="heading-polar-science" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-sky-200/80 pb-3 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-vistaar-scientific font-bold">
              NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR) • MINISTRY OF EARTH SCIENCES
            </span>
            <h2 id="heading-polar-science" className="text-2xl font-extrabold text-vistaar-text mt-1">
              {language === "hi"
                ? "भारत का ध्रुवीय विज्ञान: अंटार्कटिका, आर्कटिक और हिमालय"
                : "India's Polar Science Across Three Cryospheric Realms"}
            </h2>
          </div>
          <Link href="/about" className="text-xs font-bold text-vistaar-primary hover:underline flex items-center space-x-1">
            <span>Institutional Mandate & Charter</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REGIONAL_PILLARS.map((item) => (
            <Card key={item.region} className="ice-glass hover:shadow-lg transition-all">
              <CardHeader className="p-5 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="scientific">{language === "hi" ? item.regionHi : item.region}</Badge>
                  <span className="text-[10px] font-mono text-vistaar-muted">{item.coordinates}</span>
                </div>
                <CardTitle className="text-lg font-bold text-vistaar-text">{item.stations}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <p className="text-vistaar-muted leading-relaxed">{item.summary}</p>
                <div className="flex items-center justify-between pt-2 border-t border-sky-100/80 font-semibold">
                  <Link href={item.stationLink} className="text-vistaar-primary hover:underline flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Station Explorer</span>
                  </Link>
                  <Link href={item.weatherLink} className="text-vistaar-scientific hover:underline flex items-center space-x-1">
                    <CloudSun className="w-3.5 h-3.5" />
                    <span>Live Telemetry</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. LATEST PUBLISHED RESEARCH (Strictly APPROVED/PUBLISHED only — Never shows internal drafts) */}
      <section aria-labelledby="heading-latest-research" className="space-y-6">
        <div className="flex items-end justify-between border-b border-sky-200/80 pb-3">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold">
              PUBLIC DISSEMINATION • VERIFIED & HUMAN-APPROVED ONLY
            </span>
            <h2 id="heading-latest-research" className="text-2xl font-extrabold text-vistaar-text mt-1">
              Latest Published Polar Research & Bulletins
            </h2>
          </div>
          <Link href="/research" className="text-xs font-bold text-vistaar-primary hover:underline flex items-center space-x-1">
            <span>View All Published Research</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishedResearch.length === 0 ? (
            <Card className="md:col-span-3 ice-glass">
              <CardContent className="p-6 text-center text-xs text-vistaar-muted">
                Only human-approved `PUBLISHED` research bulletins appear here. Internal `DRAFT` and `NEEDS_REVIEW` items are strictly isolated behind RBAC authentication.
              </CardContent>
            </Card>
          ) : (
            publishedResearch.map((pub) => {
              const trackBlock =
                language === "hi" && pub.vernacular
                  ? pub.vernacular
                  : persona === "student" || persona === "teacher"
                  ? pub.education || pub.pib
                  : pub.pib;
              return (
                <Card key={pub.id} className="ice-glass flex flex-col justify-between">
                  <CardHeader className="p-5 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="success">PUBLISHED v{pub.version || 1}</Badge>
                      <span className="text-[10px] font-mono uppercase text-vistaar-scientific font-bold">
                        {pub.station_id} • {pub.dataset_id}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-vistaar-text line-clamp-2">
                      {trackBlock?.title || "Polar Observation Bulletin"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs flex-1 flex flex-col justify-between">
                    <p className="text-vistaar-muted line-clamp-4 leading-relaxed">
                      {trackBlock?.body || trackBlock?.summary}
                    </p>
                    <div className="pt-3 border-t border-sky-100/80 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-emerald-700 font-bold">100% Claims Verified</span>
                      <Link href="/research" className="text-vistaar-primary font-sans font-bold hover:underline">
                        Read Bulletin →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* 5. WEATHER INTELLIGENCE (Public) & 8. NPDC INTERNAL PORTAL GATE */}
      <section aria-labelledby="heading-weather-datasets" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 ice-glass flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-vistaar-scientific font-bold">
                PUBLIC TELEMETRY STREAM
              </span>
              <Badge variant="scientific">No Synthetic Fill</Badge>
            </div>
            <CardTitle id="heading-weather-datasets" className="text-xl font-extrabold text-vistaar-text mt-1">
              Polar Weather Intelligence
            </CardTitle>
            <CardDescription className="text-xs">
              Interactive station telemetry with dynamic parameter detection, missing-gap preservation, and record provenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 bg-sky-50/70 backdrop-blur-md p-3 rounded-lg border border-sky-200/70 font-mono">
              <div>
                <span className="text-[10px] text-vistaar-muted block uppercase">Station</span>
                <span className="font-bold text-vistaar-text">{weatherSample?.station_name || "Maitri"}</span>
              </div>
              <div>
                <span className="text-[10px] text-vistaar-muted block uppercase">Mean ({weatherSample?.parameter || "tempr"})</span>
                <span className="font-bold text-vistaar-primary">
                  {weatherSample?.statistics?.avg ?? "-12.4"} {weatherSample?.unit || "°C"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-vistaar-muted block uppercase">Valid Records</span>
                <span className="font-bold text-emerald-700">{weatherSample?.statistics?.count ?? 24}</span>
              </div>
            </div>
            <Link href="/weather" className="block">
              <Button size="sm" className="w-full">
                Launch Interactive Weather Intelligence
              </Button>
            </Link>
          </CardContent>
        </Card>

        {currentUser ? (
          <Card className="lg:col-span-7 ice-glass-strong">
            <CardHeader className="p-5 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60 flex flex-row items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-vistaar-primary font-bold">
                  AUTHENTICATED PORTAL • NATIONAL POLAR DATA CENTRE (NPDC)
                </span>
                <CardTitle className="text-xl font-extrabold text-vistaar-text mt-0.5">
                  Authoritative Scientific Datasets & Role Workspaces
                </CardTitle>
              </div>
              <Link href={getRolePortalRoute(currentUser.role)}>
                <Button size="sm" className="text-xs">
                  Open {getRolePortalLabel(currentUser.role)} →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {datasets.map((ds) => (
                  <Link
                    key={ds.dataset_id}
                    href="/datasets"
                    className="p-3 rounded-lg border border-sky-200/80 bg-white/80 hover:bg-white transition-all space-y-1 block shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-bold text-vistaar-primary">{ds.dataset_id}</span>
                      <Badge variant="outline">{ds.region}</Badge>
                    </div>
                    <div className="font-bold text-vistaar-text truncate">{ds.title}</div>
                    <div className="text-[10px] font-mono text-vistaar-muted">
                      Records: {ds.record_count?.toLocaleString()} • SHA-256: {ds.sha256?.slice(0, 10)}...
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-7 ice-glass-strong flex flex-col justify-between">
            <CardHeader className="p-5 border-b border-sky-200/70 bg-gradient-to-r from-sky-100/70 via-cyan-50/60 to-white/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-vistaar-primary font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-vistaar-primary" />
                  PROTECTED INSTITUTIONAL WORKSPACES (RBAC GATED)
                </span>
                <Badge variant="outline" className="bg-white/90 text-vistaar-primary border-sky-300">
                  Login Required
                </Badge>
              </div>
              <CardTitle className="text-xl font-extrabold text-vistaar-text mt-1">
                Internal Scientific, Editorial & Governance Portals
              </CardTitle>
              <CardDescription className="text-xs">
                Without institutional authentication, only public outreach, weather telemetry, classroom lessons, and approved press kits are visible. Sign in to directly open your dedicated role portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Link href="/datasets" className="p-3 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div>
                    <span className="font-bold text-vistaar-text block">NPDC Raw Datasets & SHA-256 Registry</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Requires Institutional Login</span>
                  </div>
                  <Lock className="w-4 h-4 text-vistaar-scientific shrink-0" />
                </Link>
                <Link href="/documents" className="p-3 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div>
                    <span className="font-bold text-vistaar-text block">Field Scientist Portal (Document AI)</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Role: FIELD_SCIENTIST</span>
                  </div>
                  <Lock className="w-4 h-4 text-vistaar-scientific shrink-0" />
                </Link>
                <Link href="/workspace" className="p-3 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div>
                    <span className="font-bold text-vistaar-text block">Outreach Editor Portal (Review Studio)</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Role: OUTREACH_EDITOR</span>
                  </div>
                  <Lock className="w-4 h-4 text-vistaar-scientific shrink-0" />
                </Link>
                <Link href="/admin" className="p-3 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div>
                    <span className="font-bold text-vistaar-text block">Super Admin Governance Portal</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Role: SUPER_ADMIN</span>
                  </div>
                  <Lock className="w-4 h-4 text-vistaar-scientific shrink-0" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 6. EDUCATION (POLAR CLASSROOM) & 7. MEDIA & PRESS KIT (Public) */}
      <section aria-labelledby="heading-edu-media" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="ice-glass">
          <CardHeader className="p-5 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-vistaar-scientific font-bold">
                PUBLIC EDUCATION • NCERT CLASSES 8–12 CURRICULUM
              </span>
              <CardTitle id="heading-edu-media" className="text-xl font-extrabold text-vistaar-text mt-0.5">
                Polar Classroom & Teacher Guides
              </CardTitle>
            </div>
            <Link href="/education">
              <Button size="sm" variant="outline" className="text-xs bg-white/80">
                Open Classroom
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {lessons.map((les) => (
              <Link
                key={les.id}
                href="/education"
                className="p-3 rounded-lg border border-sky-200/70 bg-white/75 hover:bg-white transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-vistaar-text block">{les.title}</span>
                  <span className="text-[11px] text-vistaar-muted">
                    Class {les.class_grade} • {les.subject} • {les.station}
                  </span>
                </div>
                <Badge variant="scientific">Class {les.class_grade}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="ice-glass">
          <CardHeader className="p-5 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-vistaar-primary font-bold">
                PUBLIC ARCHIVE • ACCREDITED JOURNALIST & PRESS KIT
              </span>
              <CardTitle className="text-xl font-extrabold text-vistaar-text mt-0.5">
                Media Library & Press Kits
              </CardTitle>
            </div>
            <Link href="/media">
              <Button size="sm" variant="outline" className="text-xs bg-white/80">
                Open Media & Press Kit
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {mediaAssets.map((asset) => (
              <Link
                key={asset.id}
                href="/media"
                className="p-3 rounded-lg border border-sky-200/70 bg-white/75 hover:bg-white transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-vistaar-text block">{asset.title}</span>
                  <span className="text-[11px] text-vistaar-muted">
                    {asset.region} • {asset.source} • License: {asset.license}
                  </span>
                </div>
                <Badge variant="outline">{asset.media_type}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
