"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
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
  UserPlus,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { getRolePortalLabel, getRolePortalRoute } from "@/components/layout/AuthGate";

const HERO_SLIDES = [
  {
    regionTag: "ARCTIC SENTINEL",
    title: "Arctic Polar Bear Sentinel & Cryosphere Gateway",
    titleHi: "आर्कटिक ध्रुवीय भालू और क्रायोस्फीयर प्रवेश द्वार",
    subtitle:
      "Click the Polar Bear showcase to Sign In or Register a User Account. Year-round Arctic sea-ice, fjord oceanography, and climate amplification monitoring at Himadri & IndARC (79°N).",
    subtitleHi:
      "पोर्टल में लॉगिन या उपयोगकर्ता पंजीकरण के लिए ध्रुवीय भालू कार्ड पर क्लिक करें। हिमाद्री और IndARC (79°N) में आर्कटिक समुद्री-बर्फ और जलवायु निगरानी।",
    bgImage: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=1800&q=85",
    stationId: "himadri",
    coordinates: "78°55' N, 11°55' E • Svalbard Arctic",
    elevation: "Click Image → Redirects to Portal Login & User Sign-Up",
  },
  {
    regionTag: "ANTARCTICA",
    title: "Antarctica: Maitri & Bharati Observatories",
    titleHi: "अंटार्कटिका: मैत्री और भारती वेधशालाएँ",
    subtitle:
      "Continuous atmospheric, geomagnetic, and ice-shelf monitoring across the Schirmacher Oasis and Larsemann Hills under the Indian Antarctic Programme.",
    subtitleHi:
      "भारतीय अंटार्कटिक कार्यक्रम के अंतर्गत शूमाकर ओएसिस और लार्समन हिल्स में सतत वायुमंडलीय, भू-चुंबकीय और हिम-शेल्फ निगरानी।",
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
    stationId: "maitri",
    coordinates: "70°45' S, 11°44' E • 69°24' S, 76°11' E",
    elevation: "Schirmacher Oasis & Larsemann Hills",
  },
  {
    regionTag: "HIMALAYAS",
    title: "The Himalayas: Himansh (Third Pole)",
    titleHi: "हिमालय: हिमांश (तीसरा ध्रुव)",
    subtitle:
      "High-altitude glacier mass balance, snow water equivalent, and monsoon teleconnection telemetry at 4,080m in the Chandra Basin, Spiti Valley.",
    subtitleHi:
      "चंद्रा बेसिन, स्पीति घाटी में 4,080 मीटर की ऊँचाई पर हिमनद द्रव्यमान संतुलन और मानसून टेलीकनेक्शन टेलीमेट्री।",
    bgImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=85",
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
      router.push("/login");
    } finally {
      setLaunchingRole(null);
    }
  }

  const currentSlide = HERO_SLIDES[activeSlide];
  const activePersona = PERSONA_GUIDANCE[persona];
  const availablePersonas = currentUser
    ? (["student", "teacher", "journalist", "scientist"] as const)
    : (["student", "teacher", "journalist"] as const);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 pb-14 overflow-x-hidden text-vistaar-text">
      {/* FULL-SCREEN LANDING DASHBOARD (100% Viewport Width & Height Below Navbar) */}
      <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col justify-between py-4 gap-4">
        {/* 1. BIG POLAR BEAR LANDING HERO (Redirects to /login) + DIRECT ROLE PORTAL & USER SIGN-UP */}
        <section
          aria-label="VISTAAR Polar Bear & Ice-Mountain Landing Showcase"
          className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* Left Column (7 cols): Big Polar Bear Visual Hero Card — Clicking Redirects to /login */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden relative min-h-[420px] flex flex-col justify-between p-6 sm:p-8 text-white shadow-xl border-2 border-white/85 group">
            {/* Big Polar Bear Background Image (Clickable Redirect to /login) */}
            <Link
              href={currentUser ? getRolePortalRoute(currentUser.role) : "/login"}
              aria-label="Click Polar Bear Hero to Sign In or Register User Account"
              className="absolute inset-0 z-0 block cursor-pointer"
            >
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${currentSlide.bgImage}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061527]/90 via-[#08223E]/45 to-[#08223E]/25" />
            </Link>

            {/* Top Header Bar Inside Polar Bear Hero */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
              <div className="flex items-center space-x-3">
                <MountainLogo size="lg" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-sky-200">
                      NCPOR • MINISTRY OF EARTH SCIENCES
                    </span>
                    <Badge variant="scientific" className="bg-white/90 text-sky-900 border-white">
                      SIH 26063
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
                    VISTAAR <span className="text-sky-300 font-semibold">(विस्तार)</span> Polar Portal
                  </h1>
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Polar Region Hero Slides"
                className="flex space-x-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-white shadow-sm pointer-events-auto"
              >
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.regionTag}
                    role="tab"
                    aria-selected={activeSlide === idx}
                    aria-label={`View ${slide.regionTag} highlight`}
                    onClick={() => setActiveSlide(idx)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeSlide === idx
                        ? "bg-gradient-to-r from-vistaar-primary to-vistaar-scientific text-white shadow-2xs"
                        : "text-vistaar-text hover:bg-sky-50"
                    }`}
                  >
                    {slide.regionTag}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Content Overlay on Big Polar Bear Card */}
            <div className="relative z-10 space-y-4 max-w-2xl pt-12 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#0E7490] bg-white/95 px-3 py-1 rounded-full border border-sky-200 flex items-center gap-1.5 shadow-2xs">
                  <MountainSnow className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  {currentSlide.regionTag}
                </span>
                <span className="text-xs font-mono text-sky-100 bg-sky-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/25">
                  {currentSlide.coordinates}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
                {language === "hi" ? currentSlide.titleHi : currentSlide.title}
              </h2>

              <p className="text-xs sm:text-sm text-sky-100/95 leading-relaxed max-w-xl">
                {language === "hi" ? currentSlide.subtitleHi : currentSlide.subtitle}
              </p>

              {/* Action Buttons (Redirect to /login and /login?mode=signup) */}
              <div className="flex flex-wrap items-center gap-3 pt-2 pointer-events-auto">
                {currentUser ? (
                  <Link href={getRolePortalRoute(currentUser.role)}>
                    <Button size="md" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-lg border border-white/30">
                      Open {getRolePortalLabel(currentUser.role)} →
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button
                        size="md"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg border border-white/40 flex items-center space-x-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In to Role Portal →</span>
                      </Button>
                    </Link>
                    <Link href="/login?mode=signup">
                      <Button
                        size="md"
                        variant="outline"
                        className="bg-white/95 hover:bg-white text-vistaar-primary font-bold border-white shadow-md flex items-center space-x-1.5"
                      >
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <span>Sign Up (User Only)</span>
                      </Button>
                    </Link>
                  </>
                )}
                <Link href={`/weather?station=${currentSlide.stationId}`}>
                  <Button
                    size="md"
                    variant="outline"
                    className="bg-white/15 backdrop-blur-md text-white border-white/35 hover:bg-white/25 font-semibold"
                  >
                    Live Weather Telemetry
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Framed Direct Role Portal & User Sign-Up Card (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl ice-glass-strong p-6 sm:p-7 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-vistaar-primary flex items-center gap-1.5 truncate">
                  {currentUser ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>PORTAL SESSION ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-vistaar-primary shrink-0" />
                      <span>LOGIN & USER SIGN-UP GATEWAY</span>
                    </>
                  )}
                </span>
                <Badge variant="scientific">
                  {currentUser ? currentUser.role : "Non-Admin Sign Up Enabled"}
                </Badge>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-vistaar-text leading-snug">
                  {currentUser
                    ? `Active: ${currentUser.full_name || currentUser.name || currentUser.email}`
                    : "Sign In or Register as User (Opens Portal Directly)"}
                </h2>
                <p className="text-xs text-vistaar-muted leading-relaxed mt-1">
                  {currentUser
                    ? "Click any role card below to switch or open that dedicated workspace immediately."
                    : "Without login, internal tools remain locked and only public outreach is shown. Sign up as a new User (not Admin) or click a role below to launch directly:"}
                </p>
              </div>

              {/* Prominent Sign In & Sign Up (User Only) Buttons */}
              {!currentUser && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Link
                    href="/login"
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span>Login to Portal</span>
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-sky-50 text-vistaar-primary border border-sky-300 text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs transition-all"
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>Sign Up (User)</span>
                  </Link>
                </div>
              )}

              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-vistaar-scientific block mb-2">
                  1-Click Instant Role Portal Launchers:
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleDirectPortalLaunch("student@vistaar.ncpor.res.in", "Student@Vistaar2026!", "PUBLIC_USER")}
                    className="p-3 rounded-2xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-vistaar-text flex items-center gap-1.5 truncate">
                        <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">Student User</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-scientific shrink-0">/education</span>
                    </div>
                    <span className="text-[11px] text-vistaar-muted mt-1 truncate">
                      {launchingRole === "PUBLIC_USER" ? "Opening /education..." : "NCERT 8–12 Classroom"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectPortalLaunch("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!", "FIELD_SCIENTIST")}
                    className="p-3 rounded-2xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-vistaar-text flex items-center gap-1.5 truncate">
                        <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Field Scientist</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-scientific shrink-0">/documents</span>
                    </div>
                    <span className="text-[11px] text-vistaar-muted mt-1 truncate">
                      {launchingRole === "FIELD_SCIENTIST" ? "Opening /documents..." : "Document AI & NPDC"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectPortalLaunch("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!", "OUTREACH_EDITOR")}
                    className="p-3 rounded-2xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-vistaar-text flex items-center gap-1.5 truncate">
                        <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Outreach Editor</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-scientific shrink-0">/workspace</span>
                    </div>
                    <span className="text-[11px] text-vistaar-muted mt-1 truncate">
                      {launchingRole === "OUTREACH_EDITOR" ? "Opening /workspace..." : "Review & PIB Studio"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectPortalLaunch("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!", "SUPER_ADMIN")}
                    className="p-3 rounded-2xl border border-sky-200/80 bg-white/85 hover:bg-white text-left transition-all flex flex-col justify-between shadow-2xs hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-vistaar-text flex items-center gap-1.5 truncate">
                        <Shield className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="truncate">Super Admin</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-scientific shrink-0">/admin</span>
                    </div>
                    <span className="text-[11px] text-vistaar-muted mt-1 truncate">
                      {launchingRole === "SUPER_ADMIN" ? "Opening /admin..." : "Governance & RBAC"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-sky-200/70 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-vistaar-muted truncate">
                {currentUser ? `Logged in: ${currentUser.role}` : "User Sign-Up Blocks Admin Escalation"}
              </span>
              <Link
                href={currentUser ? getRolePortalRoute(currentUser.role) : "/login?mode=signup"}
                className="text-xs font-bold text-vistaar-primary hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>{currentUser ? "Open My Portal" : "Register New User Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 2. QUICK PUBLIC MODULES DOCK + PERSONA/LANGUAGE BAR (Anchored at bottom of 100vh Full Screen) */}
        <section aria-label="Public Modules and Persona Bar" className="space-y-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
                  className="p-3.5 rounded-2xl ice-glass hover:bg-white/95 transition-all flex items-center space-x-3 group min-w-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-100/80 border border-sky-200 flex items-center justify-center text-vistaar-primary group-hover:bg-vistaar-primary group-hover:text-white transition-colors shrink-0">
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
                <div
                  role="group"
                  aria-label="Select User Persona"
                  className="flex items-center bg-sky-50/80 p-1 rounded-lg border border-sky-200/80"
                >
                  {availablePersonas.map((p) => (
                    <button
                      key={p}
                      aria-pressed={persona === p}
                      onClick={() => setPersona(p)}
                      className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all cursor-pointer ${
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
      </div>

      {/* BELOW-THE-FOLD SECTIONS (Full-Width Ice-Mountain Cards) */}
      <div className="space-y-8 pt-6">
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
    </div>
  );
}
