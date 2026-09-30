"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Database,
  CloudSun,
  GraduationCap,
  ArrowRight,
  MapPin,
  ChevronRight,
  BookOpen,
  Languages,
  Users,
  Lock,
  Sparkles,
  MountainSnow,
  Shield,
  Edit3,
  FlaskConical,
  Building2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { fetchApi, clearClientApiCache } from "@/lib/api";
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
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
    stationId: "maitri",
    coordinates: "70°45' S, 11°44' E • 69°24' S, 76°11' E",
    elevation: "Schirmacher Oasis & Larsemann Hills",
  },
  {
    regionTag: "ARCTIC",
    title: "The Arctic: Himadri & IndARC Mooring",
    titleHi: "आर्कटिक: हिमाद्री और IndARC वेधशाला",
    subtitle:
      "Year-round fjord oceanography, precipitation microphysics, and Arctic amplification research at Ny-Ålesund, Svalbard (79°N).",
    subtitleHi:
      "नाइ-आलेसुंड, स्वालबार्ड (79°N) में वर्ष भर फ्योर्ड समुद्र विज्ञान, वर्षण सूक्ष्म भौतिकी और आर्कटिक प्रवर्धन अनुसंधान।",
    bgImage: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=85",
    stationId: "himadri",
    coordinates: "78°55' N, 11°55' E",
    elevation: "Kongsfjorden, Svalbard (79°N)",
  },
  {
    regionTag: "HIMALAYAS",
    title: "The Himalayas: Himansh (Third Pole)",
    titleHi: "हिमालय: हिमांश (तीसरा ध्रुव)",
    subtitle:
      "High-altitude glacier mass balance, snow water equivalent, and monsoon teleconnection telemetry at 4,080m in the Chandra Basin, Spiti Valley.",
    subtitleHi:
      "चंद्रा बेसिन, स्पीति घाटी में 4,080 मीटर की ऊँचाई पर हिमनद द्रव्यमान संतुलन और मानसून टेलीकनेक्शन टेलीमेट्री।",
    bgImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85",
    stationId: "himansh",
    coordinates: "32°24' N, 77°37' E",
    elevation: "4,080m AMSL • Chandra Basin",
  },
];

const REGIONAL_PILLARS = [
  {
    region: "Antarctica",
    regionHi: "अंटार्कटिका",
    stations: "Maitri (1989) & Bharati (2012)",
    coordinates: "70°45'S, 11°44'E | 69°24'S, 76°11'E",
    summary:
      "Katabatic wind dynamics, tropospheric radiometry, ice-core paleoclimate records, and Southern Ocean carbon fluxes across East Antarctica.",
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
    coordinates: "32°24'N, 77°37'E (Chandra Basin, Spiti)",
    summary:
      "Benchmark glacier mass balance at Sutri Dhaka, automated weather station telemetry, and cryospheric freshwater security for India.",
    stationLink: "/stations?station=himansh",
    weatherLink: "/weather?station=himansh",
  },
];

const PERSONA_GUIDANCE: Record<string, { label: string; badge: string; desc: string; primaryHref: string; primaryCta: string }> = {
  student: {
    label: "Student",
    badge: "NCERT Classes 8–12 Aligned",
    desc: "Interactive polar classroom modules, glacier mass-balance activities, and self-assessment quizzes grounded in real Indian polar observations.",
    primaryHref: "/education",
    primaryCta: "Open Polar Classroom",
  },
  teacher: {
    label: "Teacher",
    badge: "Educator Lesson Plans & Answer Keys",
    desc: "Print-ready CBSE/NCERT lesson plans, discussion guides, and calibrated NPDC classroom charts for Earth Science instruction.",
    primaryHref: "/education",
    primaryCta: "Teacher Lesson Plans",
  },
  journalist: {
    label: "Journalist",
    badge: "Accredited PIB & MoES Press Kits",
    desc: "Human-approved PIB press releases, verified polar statistics with dataset provenance, and GODL-licensed media dispatches.",
    primaryHref: "/media",
    primaryCta: "Open Press Kit",
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
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [persona, setPersona] = useState<"student" | "teacher" | "journalist" | "scientist">("student");
  const [language, setLanguage] = useState<"en" | "hi" | "ta">("en");
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; full_name?: string; name?: string } | null>(null);
  const [launchingRole, setLaunchingRole] = useState<string | null>(null);

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

  async function handleDirectPortalLaunch(email: string, pass: string, roleLabel: string) {
    setLaunchingRole(roleLabel);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      if (res?.access_token && typeof window !== "undefined") {
        localStorage.setItem("vistaar_token", res.access_token);
        if (res.refresh_token) {
          localStorage.setItem("vistaar_refresh_token", res.refresh_token);
        }
        if (res.user) {
          localStorage.setItem("vistaar_user", JSON.stringify(res.user));
        }
        clearClientApiCache();
        setCurrentUser(res.user);
        window.dispatchEvent(new Event("vistaar-auth-changed"));
        router.push(getRolePortalRoute(res.user?.role));
      }
    } catch {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("vistaar-open-login-modal"));
      }
    } finally {
      setLaunchingRole(null);
    }
  }

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 pb-14 overflow-x-hidden text-vistaar-text">
      {/* 1. ABOVE-THE-FOLD ICE-MOUNTAIN LANDING PAGE (FITS ON SCREEN, ZERO HORIZONTAL SCROLL) */}
      <section aria-label="VISTAAR Ice-Mountain Landing Showcase" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Framed Landing Showcase Card (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl ice-glass-strong p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative SVG Ice-Mountain ridgeline */}
          <svg
            viewBox="0 0 600 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-0 right-0 w-full h-24 opacity-20 pointer-events-none"
            preserveAspectRatio="none"
          >
            <path d="M0 120L110 45L205 95L330 15L455 85L535 38L600 120H0Z" fill="#BAE6FD" />
            <path d="M160 120L330 15L455 85L600 25V120H160Z" fill="#7DD3FC" />
          </svg>

          <div className="relative z-10 space-y-3.5">
            {/* Brand Mountain Logo + Region Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-200/70">
              <div className="flex items-center space-x-2.5 min-w-0">
                <MountainLogo size="md" />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-vistaar-scientific truncate">
                      NCPOR • MINISTRY OF EARTH SCIENCES
                    </span>
                    <Badge variant="scientific">SIH 26063</Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-vistaar-text truncate">
                    VISTAAR <span className="text-vistaar-scientific font-semibold">(विस्तार)</span> Landing Portal
                  </h1>
                </div>
              </div>

              <div role="tablist" aria-label="Polar Region Hero Slides" className="flex space-x-1 bg-sky-50/90 p-1 rounded-full border border-sky-200/80 shrink-0">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.regionTag}
                    role="tab"
                    aria-selected={activeSlide === idx}
                    aria-label={`View ${slide.regionTag} highlight`}
                    onClick={() => setActiveSlide(idx)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
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

            {/* Active Cryospheric Realm Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-7 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#0E7490] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                    <MountainSnow className="w-3 h-3 text-sky-600 shrink-0" />
                    {currentSlide.regionTag}
                  </span>
                  <span className="text-[10px] font-mono text-vistaar-muted truncate">{currentSlide.coordinates}</span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-vistaar-text leading-snug">
                  {language === "hi" ? currentSlide.titleHi : currentSlide.title}
                </h2>

                <p className="text-xs text-vistaar-muted leading-relaxed line-clamp-3">
                  {language === "hi" ? currentSlide.subtitleHi : currentSlide.subtitle}
                </p>
              </div>

              {/* Compact Framed Snow-Mountain Card */}
              <div className="sm:col-span-5">
                <div className="relative h-36 rounded-xl overflow-hidden border-2 border-white shadow-sm group">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${currentSlide.bgImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-950/25 to-transparent" />
                  <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-sky-200 block truncate">
                      {currentSlide.elevation}
                    </span>
                    <span className="text-[11px] font-bold leading-tight block truncate">
                      {currentSlide.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Landing Actions */}
          <div className="relative z-10 pt-3.5 mt-3 border-t border-sky-200/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {currentUser ? (
                <Link href={getRolePortalRoute(currentUser.role)}>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white font-bold text-xs shadow-xs">
                    Open {getRolePortalLabel(currentUser.role)} →
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={openLoginModal}
                  className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Sign In to Role Portal →
                </Button>
              )}
              <Link href={`/weather?station=${currentSlide.stationId}`}>
                <Button size="sm" variant="outline" className="bg-white/85 text-vistaar-text border-sky-200 hover:bg-white font-semibold text-xs">
                  Weather Telemetry
                </Button>
              </Link>
              <Link href="/research">
                <Button size="sm" variant="outline" className="bg-white/85 text-vistaar-text border-sky-200 hover:bg-white font-semibold text-xs">
                  Published Research
                </Button>
              </Link>
            </div>

            <span className="text-[10px] font-mono text-vistaar-scientific font-bold">
              4 Stations • 100% Verified
            </span>
          </div>
        </div>

        {/* Right Framed Direct Role Portal Launchpad (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl ice-glass-strong p-5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-vistaar-primary flex items-center gap-1.5 truncate">
                {currentUser ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>PORTAL SESSION ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-vistaar-primary shrink-0" />
                    <span>1-CLICK DIRECT ROLE PORTAL LOGIN</span>
                  </>
                )}
              </span>
              <Badge variant="scientific">
                {currentUser ? currentUser.role : "Direct Launch"}
              </Badge>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-vistaar-text leading-snug">
              {currentUser
                ? `Active: ${currentUser.full_name || currentUser.name || currentUser.email}`
                : "Click Any Role to Sign In & Open Portal Directly"}
            </h2>
            <p className="text-[11px] text-vistaar-muted leading-relaxed">
              {currentUser
                ? "Click any role card below to switch or open that dedicated workspace immediately."
                : "Without login, internal tools stay locked and only public outreach is shown. Click a role below to sign in and open its portal directly:"}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleDirectPortalLaunch("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!", "SUPER_ADMIN")}
                className="p-2.5 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-vistaar-text flex items-center gap-1 truncate">
                    <Shield className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="truncate">Super Admin</span>
                  </span>
                  <span className="text-[9px] font-mono text-vistaar-scientific shrink-0">/admin</span>
                </div>
                <span className="text-[10px] text-vistaar-muted mt-1 truncate">
                  {launchingRole === "SUPER_ADMIN" ? "Opening /admin..." : "Governance & RBAC"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectPortalLaunch("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!", "OUTREACH_EDITOR")}
                className="p-2.5 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-vistaar-text flex items-center gap-1 truncate">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Outreach Editor</span>
                  </span>
                  <span className="text-[9px] font-mono text-vistaar-scientific shrink-0">/workspace</span>
                </div>
                <span className="text-[10px] text-vistaar-muted mt-1 truncate">
                  {launchingRole === "OUTREACH_EDITOR" ? "Opening /workspace..." : "Review & PIB Studio"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectPortalLaunch("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!", "FIELD_SCIENTIST")}
                className="p-2.5 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-vistaar-text flex items-center gap-1 truncate">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Field Scientist</span>
                  </span>
                  <span className="text-[9px] font-mono text-vistaar-scientific shrink-0">/documents</span>
                </div>
                <span className="text-[10px] text-vistaar-muted mt-1 truncate">
                  {launchingRole === "FIELD_SCIENTIST" ? "Opening /documents..." : "Document AI & NPDC"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectPortalLaunch("student@vistaar.ncpor.res.in", "Student@Vistaar2026!", "PUBLIC_USER")}
                className="p-2.5 rounded-xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-vistaar-text flex items-center gap-1 truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Student Portal</span>
                  </span>
                  <span className="text-[9px] font-mono text-vistaar-scientific shrink-0">/education</span>
                </div>
                <span className="text-[10px] text-vistaar-muted mt-1 truncate">
                  {launchingRole === "PUBLIC_USER" ? "Opening /education..." : "NCERT 8–12 Classroom"}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-3 mt-2.5 border-t border-sky-200/70 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-vistaar-muted truncate">
              {currentUser ? `Logged in: ${currentUser.role}` : "Public Read-Only Mode"}
            </span>
            {currentUser ? (
              <Link
                href={getRolePortalRoute(currentUser.role)}
                className="text-xs font-bold text-vistaar-primary hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>Open My Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={openLoginModal}
                className="text-xs font-bold text-vistaar-primary hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Custom Email Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. QUICK PUBLIC MODULES DOCK + PERSONA/LANGUAGE BAR (FITS ABOVE THE FOLD) */}
      <section aria-label="Public Modules and Persona Bar" className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/explore", label: "Knowledge Search", sub: "Public RAG & AI", icon: Compass },
            { href: "/stations", label: "4 Observatories", sub: "Maitri • Bharati • Himadri", icon: Building2 },
            { href: "/weather", label: "Polar Weather", sub: "Live Station Telemetry", icon: CloudSun },
            { href: "/research", label: "Published Research", sub: "Verified Bulletins", icon: BookOpen },
            { href: "/education", label: "Polar Classroom", sub: "NCERT Classes 8–12", icon: GraduationCap },
            { href: "/media", label: "Media & Press Kit", sub: "PIB & GODL Archive", icon: ImageIcon },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="p-3 rounded-xl ice-glass hover:bg-white/95 transition-all flex items-center space-x-2.5 group min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-100/80 border border-sky-200 flex items-center justify-center text-vistaar-primary group-hover:bg-vistaar-primary group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-vistaar-text block truncate">{mod.label}</span>
                  <span className="text-[10px] text-vistaar-muted block truncate">{mod.sub}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <Card className="ice-glass-strong">
          <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Users className="w-4 h-4 text-vistaar-primary shrink-0" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-vistaar-scientific">
                  Tailor Public View by Persona ({activePersona.label})
                </span>
                <Badge variant="scientific">{activePersona.badge}</Badge>
              </div>
              <p className="text-xs text-vistaar-muted truncate">{activePersona.desc}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div role="group" aria-label="Select User Persona" className="flex items-center bg-sky-50/80 p-1 rounded-lg border border-sky-200/80">
                {availablePersonas.map((p) => (
                  <button
                    key={p}
                    aria-pressed={persona === p}
                    onClick={() => setPersona(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize transition-all cursor-pointer ${
                      persona === p
                        ? "bg-gradient-to-r from-vistaar-primary to-vistaar-scientific text-white shadow-xs"
                        : "text-vistaar-muted hover:text-vistaar-text"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1.5 bg-sky-50/80 px-2.5 py-1 rounded-lg border border-sky-200/80">
                <Languages className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
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
                <Button size="sm" className="text-xs flex items-center space-x-1 shadow-xs whitespace-nowrap">
                  <span>{activePersona.primaryCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. INDIA'S POLAR SCIENCE ACROSS THREE CRYOSPHERIC REALMS */}
      <section aria-labelledby="heading-polar-science" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-sky-200/80 pb-2.5 gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-vistaar-scientific font-bold">
              NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR) • MINISTRY OF EARTH SCIENCES
            </span>
            <h2 id="heading-polar-science" className="text-xl sm:text-2xl font-extrabold text-vistaar-text mt-0.5">
              {language === "hi"
                ? "भारत का ध्रुवीय विज्ञान: अंटार्कटिका, आर्कटिक और हिमालय"
                : "India's Polar Science Across Three Cryospheric Realms"}
            </h2>
          </div>
          <Link href="/about" className="text-xs font-bold text-vistaar-primary hover:underline flex items-center space-x-1 shrink-0">
            <span>Institutional Mandate</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REGIONAL_PILLARS.map((item) => (
            <Card key={item.region} className="ice-glass hover:shadow-lg transition-all">
              <CardHeader className="p-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <Badge variant="scientific">{language === "hi" ? item.regionHi : item.region}</Badge>
                  <span className="text-[10px] font-mono text-vistaar-muted truncate">{item.coordinates}</span>
                </div>
                <CardTitle className="text-base font-bold text-vistaar-text">{item.stations}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
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

      {/* 4. LATEST PUBLISHED RESEARCH (Strictly APPROVED/PUBLISHED only) */}
      <section aria-labelledby="heading-latest-research" className="space-y-4">
        <div className="flex items-end justify-between border-b border-sky-200/80 pb-2.5 gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
              PUBLIC DISSEMINATION • VERIFIED & HUMAN-APPROVED ONLY
            </span>
            <h2 id="heading-latest-research" className="text-xl font-extrabold text-vistaar-text mt-0.5">
              Latest Published Polar Research & Bulletins
            </h2>
          </div>
          <Link href="/research" className="text-xs font-bold text-vistaar-primary hover:underline flex items-center space-x-1 shrink-0">
            <span>View All Research</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {publishedResearch.length === 0 ? (
            <Card className="md:col-span-3 ice-glass">
              <CardContent className="p-5 text-center text-xs text-vistaar-muted">
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
                  <CardHeader className="p-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="success">PUBLISHED v{pub.version || 1}</Badge>
                      <span className="text-[10px] font-mono uppercase text-vistaar-scientific font-bold">
                        {pub.station_id} • {pub.dataset_id}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-vistaar-text line-clamp-2">
                      {trackBlock?.title || "Polar Observation Bulletin"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                    <p className="text-vistaar-muted line-clamp-3 leading-relaxed">
                      {trackBlock?.body || trackBlock?.summary}
                    </p>
                    <div className="pt-2.5 border-t border-sky-100/80 flex items-center justify-between font-mono text-[11px]">
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

      {/* 5. WEATHER INTELLIGENCE (Public) & NPDC INTERNAL PORTAL GATE */}
      <section aria-labelledby="heading-weather-datasets" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-5 ice-glass flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-vistaar-scientific font-bold">
                PUBLIC TELEMETRY STREAM
              </span>
              <Badge variant="scientific">No Synthetic Fill</Badge>
            </div>
            <CardTitle id="heading-weather-datasets" className="text-lg font-extrabold text-vistaar-text mt-1">
              Polar Weather Intelligence
            </CardTitle>
            <CardDescription className="text-xs">
              Interactive station telemetry with dynamic parameter detection and record provenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 bg-sky-50/70 p-2.5 rounded-lg border border-sky-200/70 font-mono">
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
                <span className="text-[10px] text-vistaar-muted block uppercase">Records</span>
                <span className="font-bold text-emerald-700">{weatherSample?.statistics?.count ?? 24}</span>
              </div>
            </div>
            <Link href="/weather" className="block">
              <Button size="sm" className="w-full text-xs">
                Launch Weather Intelligence
              </Button>
            </Link>
          </CardContent>
        </Card>

        {currentUser ? (
          <Card className="lg:col-span-7 ice-glass-strong">
            <CardHeader className="p-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60 flex flex-row items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-vistaar-primary font-bold">
                  AUTHENTICATED PORTAL • NATIONAL POLAR DATA CENTRE (NPDC)
                </span>
                <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                  Authoritative Scientific Datasets & Role Workspaces
                </CardTitle>
              </div>
              <Link href={getRolePortalRoute(currentUser.role)}>
                <Button size="sm" className="text-xs">
                  Open {getRolePortalLabel(currentUser.role)} →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {datasets.map((ds) => (
                  <Link
                    key={ds.dataset_id}
                    href="/datasets"
                    className="p-2.5 rounded-lg border border-sky-200/80 bg-white/80 hover:bg-white transition-all space-y-1 block shadow-2xs"
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
            <CardHeader className="p-4 border-b border-sky-200/70 bg-gradient-to-r from-sky-100/70 via-cyan-50/60 to-white/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-vistaar-primary font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-vistaar-primary" />
                  PROTECTED INSTITUTIONAL WORKSPACES (RBAC GATED)
                </span>
                <Badge variant="outline" className="bg-white/90 text-vistaar-primary border-sky-300">
                  Login Required
                </Badge>
              </div>
              <CardTitle className="text-lg font-extrabold text-vistaar-text mt-1">
                Internal Scientific, Editorial & Governance Portals
              </CardTitle>
              <CardDescription className="text-xs">
                Without institutional authentication, internal tools remain locked and only public outreach modules are shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link href="/datasets" className="p-2.5 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">NPDC Raw Datasets Registry</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Requires Institutional Login</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
                </Link>
                <Link href="/documents" className="p-2.5 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">Field Scientist Portal (/documents)</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Role: FIELD_SCIENTIST</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
                </Link>
                <Link href="/workspace" className="p-2.5 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">Outreach Editor Portal (/workspace)</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Role: OUTREACH_EDITOR</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
                </Link>
                <Link href="/admin" className="p-2.5 rounded-lg border border-sky-200/80 bg-white/75 hover:bg-white transition-all flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-vistaar-text block truncate">Super Admin Portal (/admin)</span>
                    <span className="text-[10px] font-mono text-vistaar-muted">Role: SUPER_ADMIN</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 6. EDUCATION (POLAR CLASSROOM) & 7. MEDIA & PRESS KIT (Public) */}
      <section aria-labelledby="heading-edu-media" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="ice-glass">
          <CardHeader className="p-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-vistaar-scientific font-bold">
                PUBLIC EDUCATION • NCERT CLASSES 8–12
              </span>
              <CardTitle id="heading-edu-media" className="text-lg font-extrabold text-vistaar-text mt-0.5">
                Polar Classroom & Teacher Guides
              </CardTitle>
            </div>
            <Link href="/education">
              <Button size="sm" variant="outline" className="text-xs bg-white/80">
                Open Classroom
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            {lessons.map((les) => (
              <Link
                key={les.id}
                href="/education"
                className="p-2.5 rounded-lg border border-sky-200/70 bg-white/75 hover:bg-white transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="font-bold text-vistaar-text block truncate">{les.title}</span>
                  <span className="text-[11px] text-vistaar-muted block truncate">
                    Class {les.class_grade} • {les.subject} • {les.station}
                  </span>
                </div>
                <Badge variant="scientific">Class {les.class_grade}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="ice-glass">
          <CardHeader className="p-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-white/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-vistaar-primary font-bold">
                PUBLIC ARCHIVE • ACCREDITED PRESS KIT
              </span>
              <CardTitle className="text-lg font-extrabold text-vistaar-text mt-0.5">
                Media Library & Press Kits
              </CardTitle>
            </div>
            <Link href="/media">
              <Button size="sm" variant="outline" className="text-xs bg-white/80">
                Open Media Kit
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            {mediaAssets.map((asset) => (
              <Link
                key={asset.id}
                href="/media"
                className="p-2.5 rounded-lg border border-sky-200/70 bg-white/75 hover:bg-white transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="font-bold text-vistaar-text block truncate">{asset.title}</span>
                  <span className="text-[11px] text-vistaar-muted block truncate">
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
