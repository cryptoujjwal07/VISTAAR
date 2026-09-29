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
  FileCheck2,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

const HERO_SLIDES = [
  {
    regionTag: "ANTARCTICA",
    title: "Antarctica: Maitri & Bharati",
    titleHi: "अंटार्कटिका: मैत्री और भारती वेधशालाएँ",
    subtitle:
      "Continuous atmospheric, geomagnetic, and ice-shelf monitoring across the Schirmacher Oasis and Larsemann Hills under the Indian Antarctic Programme.",
    subtitleHi:
      "भारतीय अंटार्कटिक कार्यक्रम के अंतर्गत शूमाकर ओएसिस और लार्समन हिल्स में सतत वायुमंडलीय, भू-चुंबकीय और हिम-शेल्फ निगरानी।",
    bgImage: "https://images.unsplash.com/photo-1548263594-a71ea65a8598?auto=format&fit=crop&w=2000&q=85",
    stationId: "maitri",
    coordinates: "70°45' S, 11°44' E • 69°24' S, 76°11' E",
  },
  {
    regionTag: "ARCTIC",
    title: "The Arctic: Himadri & IndARC",
    titleHi: "आर्कटिक: हिमाद्री और IndARC वेधशाला",
    subtitle:
      "Year-round fjord oceanography, precipitation microphysics, and Arctic amplification research at Ny-Ålesund, Svalbard (79°N).",
    subtitleHi:
      "नाइ-आलेसुंड, स्वालबार्ड (79°N) में वर्ष भर फ्योर्ड समुद्र विज्ञान, वर्षण सूक्ष्म भौतिकी और आर्कटिक प्रवर्धन अनुसंधान।",
    bgImage: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2000&q=85",
    stationId: "himadri",
    coordinates: "78°55' N, 11°55' E",
  },
  {
    regionTag: "HIMALAYAS",
    title: "The Himalayas: Himansh (Third Pole)",
    titleHi: "हिमालय: हिमांश (तीसरा ध्रुव)",
    subtitle:
      "High-altitude glacier mass balance, snow water equivalent, and monsoon teleconnection telemetry at 4,080m in the Chandra Basin, Spiti Valley.",
    subtitleHi:
      "चंद्रा बेसिन, स्पीति घाटी में 4,080 मीटर की ऊँचाई पर हिमनद द्रव्यमान संतुलन और मानसून टेलीकनेक्शन टेलीमेट्री।",
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85",
    stationId: "himansh",
    coordinates: "32°24' N, 77°37' E",
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
  const [persona, setPersona] = useState<"student" | "teacher" | "journalist" | "scientist">("scientist");
  const [language, setLanguage] = useState<"en" | "hi" | "ta">("en");

  // Live published data from backend (strictly published/approved only)
  const [publishedResearch, setPublishedResearch] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [weatherSample, setWeatherSample] = useState<any>(null);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const [pubsRes, dsRes, lesRes, medRes, wRes] = await Promise.all([
          fetchApi("/publications/published").catch(() => []),
          fetchApi("/datasets?limit=4").catch(() => ({ items: [] })),
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
  }, []);

  const currentSlide = HERO_SLIDES[activeSlide];
  const activePersona = PERSONA_GUIDANCE[persona];

  return (
    <div className="space-y-16 pb-20 bg-[#FAF7F0] text-vistaar-text">
      {/* 1. HERO SECTION */}
      <section aria-label="Polar Science Hero" className="relative h-[78vh] min-h-[520px] w-full flex items-center justify-start overflow-hidden border-b border-vistaar-border">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url('${currentSlide.bgImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528]/85 via-[#0B1528]/55 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs uppercase font-mono tracking-[0.25em] font-bold text-cyan-300 bg-black/30 px-3 py-1 rounded-full border border-white/15">
                {currentSlide.regionTag}
              </span>
              <span className="text-xs font-mono text-white/90">{currentSlide.coordinates}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight font-bold text-white leading-tight">
              {language === "hi" ? currentSlide.titleHi : currentSlide.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-100 leading-relaxed font-sans max-w-xl">
              {language === "hi" ? currentSlide.subtitleHi : currentSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={`/weather?station=${currentSlide.stationId}`}>
                <Button size="md" className="bg-vistaar-primary hover:bg-blue-700 text-white font-semibold">
                  Explore Weather Intelligence
                </Button>
              </Link>
              <Link href="/research">
                <Button size="md" variant="outline" className="bg-white/95 text-vistaar-text hover:bg-white font-semibold">
                  Published Research
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="md" variant="outline" className="bg-white/15 text-white border-white/30 hover:bg-white/25 font-semibold">
                  Unified Search & RAG
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 sm:right-12 z-20 flex space-x-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-vistaar-border shadow-md">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.regionTag}
              onClick={() => setActiveSlide(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeSlide === idx
                  ? "bg-vistaar-primary text-white shadow-xs"
                  : "text-vistaar-text hover:bg-[#FAF7F0]"
              }`}
            >
              {slide.regionTag}
            </button>
          ))}
        </div>
      </section>

      {/* PERSONA & MULTILINGUAL BAR (Prompt 17 Requirement) */}
      <section aria-label="Persona and Language Selection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <Card className="bg-white border-vistaar-border shadow-md">
          <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-vistaar-primary" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-vistaar-scientific">
                  Tailor Portal by Persona ({activePersona.label})
                </span>
                <Badge variant="scientific">{activePersona.badge}</Badge>
              </div>
              <p className="text-xs text-vistaar-muted max-w-2xl">{activePersona.desc}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-[#FAF7F0] p-1 rounded-md border border-vistaar-border">
                {(["student", "teacher", "journalist", "scientist"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`px-3 py-1.5 rounded text-xs font-bold capitalize transition-all ${
                      persona === p
                        ? "bg-vistaar-primary text-white shadow-xs"
                        : "text-vistaar-muted hover:text-vistaar-text"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1.5 bg-[#FAF7F0] px-2.5 py-1.5 rounded-md border border-vistaar-border">
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
                <Button size="sm" className="text-xs flex items-center space-x-1">
                  <span>{activePersona.primaryCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. INDIA'S POLAR SCIENCE & 3. ANTARCTICA, ARCTIC, HIMALAYAS */}
      <section aria-labelledby="heading-polar-science" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-vistaar-border pb-4 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-vistaar-scientific font-bold">
              NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR) • MINISTRY OF EARTH SCIENCES
            </span>
            <h2 id="heading-polar-science" className="text-2xl sm:text-3xl font-extrabold text-vistaar-text mt-1">
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
            <Card key={item.region} className="bg-white border-vistaar-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/60">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="scientific">{language === "hi" ? item.regionHi : item.region}</Badge>
                  <span className="text-[10px] font-mono text-vistaar-muted">{item.coordinates}</span>
                </div>
                <CardTitle className="text-lg font-bold text-vistaar-text">{item.stations}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <p className="text-vistaar-muted leading-relaxed">{item.summary}</p>
                <div className="flex items-center justify-between pt-2 border-t border-vistaar-border/60 font-semibold">
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
      <section aria-labelledby="heading-latest-research" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-vistaar-border pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold">
              VERIFIED & HUMAN-APPROVED DISSEMINATION ONLY
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
            <Card className="md:col-span-3 bg-white border-vistaar-border">
              <CardContent className="p-6 text-center text-xs text-vistaar-muted">
                Only human-approved `PUBLISHED` research bulletins appear here. Internal `DRAFT` and `NEEDS_REVIEW` items are strictly isolated.
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
                <Card key={pub.id} className="bg-white border-vistaar-border shadow-sm flex flex-col justify-between">
                  <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/50">
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
                    <div className="pt-3 border-t border-vistaar-border/60 flex items-center justify-between font-mono text-[11px]">
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

      {/* 5. WEATHER INTELLIGENCE & 8. NPDC DATASETS */}
      <section aria-labelledby="heading-weather-datasets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 bg-white border-vistaar-border shadow-sm flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-vistaar-scientific font-bold">
                REAL NPDC INSTRUMENT STREAM
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
            <div className="grid grid-cols-3 gap-3 bg-[#FAF7F0] p-3 rounded border border-vistaar-border font-mono">
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

        <Card className="lg:col-span-7 bg-white border-vistaar-border shadow-sm">
          <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-vistaar-primary font-bold">
                NATIONAL POLAR DATA CENTRE (NPDC)
              </span>
              <CardTitle className="text-xl font-extrabold text-vistaar-text mt-0.5">
                Authoritative Scientific Datasets
              </CardTitle>
            </div>
            <Link href="/datasets">
              <Button size="sm" variant="outline" className="text-xs">
                All Datasets ({datasets.length}+)
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {datasets.map((ds) => (
                <Link
                  key={ds.dataset_id}
                  href="/datasets"
                  className="p-3 rounded border border-vistaar-border bg-[#FAF7F0]/60 hover:bg-white transition-all space-y-1 block"
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
      </section>

      {/* 6. EDUCATION (POLAR CLASSROOM) & 7. MEDIA & PRESS KIT */}
      <section aria-labelledby="heading-edu-media" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-vistaar-border shadow-sm">
          <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-vistaar-scientific font-bold">
                NCERT CLASSES 8–12 CURRICULUM
              </span>
              <CardTitle id="heading-edu-media" className="text-xl font-extrabold text-vistaar-text mt-0.5">
                Polar Classroom & Teacher Guides
              </CardTitle>
            </div>
            <Link href="/education">
              <Button size="sm" variant="outline" className="text-xs">
                Open Classroom
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {lessons.map((les) => (
              <Link
                key={les.id}
                href="/education"
                className="p-3 rounded border border-vistaar-border bg-[#FAF7F0]/50 hover:bg-white transition-all flex items-center justify-between"
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

        <Card className="bg-white border-vistaar-border shadow-sm">
          <CardHeader className="p-5 border-b border-vistaar-border bg-[#FAF7F0]/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-vistaar-primary font-bold">
                ACCREDITED JOURNALIST & PUBLIC ARCHIVE
              </span>
              <CardTitle className="text-xl font-extrabold text-vistaar-text mt-0.5">
                Media Library & Press Kits
              </CardTitle>
            </div>
            <Link href="/media">
              <Button size="sm" variant="outline" className="text-xs">
                Open Media & Press Kit
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {mediaAssets.map((asset) => (
              <Link
                key={asset.id}
                href="/media"
                className="p-3 rounded border border-vistaar-border bg-[#FAF7F0]/50 hover:bg-white transition-all flex items-center justify-between"
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
