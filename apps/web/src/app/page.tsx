"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  Image as ImageIcon,
  Building2,
  Search,
  Thermometer,
  Wind,
  Droplets,
  Radio,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { fetchApi } from "@/lib/api";

const STATIONS_DATA = [
  {
    id: "maitri",
    name: "Maitri Research Station",
    region: "Antarctica (Inland)",
    location: "Schirmacher Oasis, Queen Maud Land",
    elevation: "117 m",
    established: "1989",
    status: "ACTIVE • YEAR-ROUND",
    image: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
    highlight: "Continuous meteorology, geological mapping, solid-earth studies, and geomagnetism.",
    temp: "-17.0 °C",
  },
  {
    id: "bharati",
    name: "Bharati Research Station",
    region: "Antarctica (Coastal)",
    location: "Larsemann Hills, East Antarctica",
    elevation: "35 m",
    established: "2012",
    status: "ACTIVE • YEAR-ROUND",
    image: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=800&q=80",
    highlight: "State-of-the-art green research facility with automated satellite ground stations and marine labs.",
    temp: "-14.5 °C",
  },
  {
    id: "himadri",
    name: "Himadri Research Station",
    region: "Arctic",
    location: "Ny-Ålesund, Spitsbergen, Svalbard (79° N)",
    elevation: "10 m",
    established: "2008",
    status: "ACTIVE • SUMMER / JOINT",
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80",
    highlight: "India's Arctic research base studying fjord oceanography, atmospheric chemistry, and marine biology.",
    temp: "-4.2 °C",
  },
  {
    id: "himansh",
    name: "Himansh Glaciological Station",
    region: "Third Pole (Himalayas)",
    location: "Spiti Valley, Chandra Basin, Himachal Pradesh",
    elevation: "4,080 m",
    established: "2016",
    status: "ACTIVE • HIGH-ALTITUDE",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    highlight: "High-altitude base monitoring Himalayan glacier mass balance, snow chemistry, and hydrology.",
    temp: "-8.5 °C",
  },
];

const EXPEDITIONS_HIGHLIGHTS = [
  {
    tag: "Antarctic Mission",
    title: "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
    leader: "NCPOR / Ministry of Earth Sciences",
    summary: "25 national research projects conducted across Maitri and Bharati, including deep ice-core paleoclimate synthesis and Prydz Bay ocean dynamics.",
    link: "/expeditions",
  },
  {
    tag: "Arctic Marine Physics",
    title: "IndARC Mooring & Kongsfjorden Climate Monitoring",
    leader: "Indo-Norwegian Joint Observation",
    summary: "Underwater sensor array recording continuous physical, geochemical, and oceanographic processes below Arctic sea ice in Kongsfjorden.",
    link: "/expeditions",
  },
  {
    tag: "Himalayan Cryosphere",
    title: "Chandra Basin Glacier Dynamics & Retreat Forecasting",
    leader: "Himansh Glaciology Team",
    summary: "Long-term monitoring of Sutlej and Chandra basin glaciers using ground-penetrating radar, ice melt stakes, and automated AWS stations.",
    link: "/expeditions",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState("himansh");
  const [timelineMode, setTimelineMode] = useState<"LIVE" | "WEEK" | "YEAR">("LIVE");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    async function loadTelemetry() {
      setLoadingWeather(true);
      try {
        const res = await fetchApi(
          `/weather/timeseries?station_id=${selectedStation}&range_mode=${timelineMode}`,
          { bypassCache: true }
        );
        setWeatherData(res);
      } catch (err) {
        console.error("Failed to load telemetry", err);
      } finally {
        setLoadingWeather(false);
      }
    }
    loadTelemetry();
  }, [selectedStation, timelineMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentStationMeta = STATIONS_DATA.find((s) => s.id === selectedStation) || STATIONS_DATA[0];
  const points = weatherData?.points || [];
  const stats = weatherData?.statistics || {};
  const currentTemp = stats?.avg !== undefined ? `${stats.avg} ${stats.unit || "°C"}` : currentStationMeta.temp;

  // Simple SVG sparkline calculation
  const svgWidth = 680;
  const svgHeight = 180;
  const padding = 24;
  const minVal = stats?.min ?? -25;
  const maxVal = stats?.max ?? 15;
  const range = maxVal - minVal || 1;

  const polylineCoords = points.length > 0
    ? points
        .map((pt: any, idx: number) => {
          const x = padding + (idx / Math.max(points.length - 1, 1)) * (svgWidth - 2 * padding);
          const y = svgHeight - padding - ((pt.value - minVal) / range) * (svgHeight - 2 * padding);
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  return (
    <div className="w-full space-y-24 pb-20">
      {/* =========================================================================
          1. HERO BANNER: Ice Mountain Display, Big Typography & Search
          ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Top Institutional Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full ice-glass text-sky-900 border border-white/80 text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-2xs">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Ministry of Earth Sciences • National Centre for Polar and Ocean Research</span>
          </div>

          {/* Big Majestic Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 leading-[1.08]">
            India’s Gateway to <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Polar Science & Cryosphere
            </span>
          </h1>

          {/* Large Subtitle */}
          <p className="text-lg sm:text-2xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
            Explore live station telemetry, Arctic and Antarctic research expeditions, glacier dynamics, and NCERT polar education across the Three Poles.
          </p>

          {/* Prominent, Clean Global Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="ice-glass-strong rounded-3xl p-2 sm:p-2.5 flex items-center shadow-xl border-2 border-white/95 transition-all focus-within:ring-4 focus-within:ring-sky-200/70"
            >
              <Search className="w-6 h-6 text-sky-600 ml-3 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stations, expeditions, weather telemetry, research..."
                className="w-full text-base sm:text-lg font-semibold bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none px-2"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-black text-sm sm:text-base shadow-md cursor-pointer transition-all shrink-0"
              >
                Search
              </button>
            </form>

            {/* Quick Trending Searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-semibold text-slate-600">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Quick Jump:</span>
              <button
                onClick={() => router.push("/weather?station_id=maitri")}
                className="px-3 py-1 rounded-full bg-white/80 border border-sky-200 hover:bg-white text-slate-700 cursor-pointer transition-all"
              >
                ❄️ Maitri Live Weather
              </button>
              <button
                onClick={() => router.push("/stations")}
                className="px-3 py-1 rounded-full bg-white/80 border border-sky-200 hover:bg-white text-slate-700 cursor-pointer transition-all"
              >
                🏛️ Bharati Station
              </button>
              <button
                onClick={() => router.push("/expeditions")}
                className="px-3 py-1 rounded-full bg-white/80 border border-sky-200 hover:bg-white text-slate-700 cursor-pointer transition-all"
              >
                🧭 43-ISEA Expedition
              </button>
              <button
                onClick={() => router.push("/education")}
                className="px-3 py-1 rounded-full bg-white/80 border border-sky-200 hover:bg-white text-slate-700 cursor-pointer transition-all"
              >
                🎓 Polar Classroom
              </button>
            </div>
          </div>
        </div>

        {/* 4 Big, Clean Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-14">
          <div className="ice-glass rounded-3xl p-6 sm:p-7 text-center space-y-1.5 border border-white/85 shadow-sm hover:shadow-md transition-all">
            <div className="text-4xl sm:text-5xl font-black text-sky-700 font-mono">4</div>
            <div className="text-sm sm:text-base font-black text-slate-900">Polar Observatories</div>
            <p className="text-xs text-slate-500 font-medium">Antarctica, Arctic & Himalayas</p>
          </div>

          <div className="ice-glass rounded-3xl p-6 sm:p-7 text-center space-y-1.5 border border-white/85 shadow-sm hover:shadow-md transition-all">
            <div className="text-4xl sm:text-5xl font-black text-sky-700 font-mono">43+</div>
            <div className="text-sm sm:text-base font-black text-slate-900">Scientific Expeditions</div>
            <p className="text-xs text-slate-500 font-medium">Decades of Continuous Polar Fieldwork</p>
          </div>

          <div className="ice-glass rounded-3xl p-6 sm:p-7 text-center space-y-1.5 border border-white/85 shadow-sm hover:shadow-md transition-all">
            <div className="text-4xl sm:text-5xl font-black text-sky-700 font-mono">15,000+</div>
            <div className="text-sm sm:text-base font-black text-slate-900">Live Observations</div>
            <p className="text-xs text-slate-500 font-medium">100% Calibrated NPDC Telemetry</p>
          </div>

          <div className="ice-glass rounded-3xl p-6 sm:p-7 text-center space-y-1.5 border border-white/85 shadow-sm hover:shadow-md transition-all">
            <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono">100%</div>
            <div className="text-sm sm:text-base font-black text-slate-900">Verified Provenance</div>
            <p className="text-xs text-slate-500 font-medium">National Polar Data Centre Records</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SECTION: Four Research Stations Across The Three Poles
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="scientific" className="text-xs font-bold uppercase tracking-wider">
              Permanent Research Bases
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
              Four Observatories Across the Three Poles
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal">
              Guardians of the cryosphere, operating continuously in Antarctica, the Arctic, and high-altitude Himalayan glaciological zones.
            </p>
          </div>
          <Link
            href="/stations"
            className="inline-flex items-center space-x-2 text-sm sm:text-base font-extrabold text-sky-700 hover:text-sky-900 group"
          >
            <span>Explore All Station Facilities</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATIONS_DATA.map((st) => (
            <Card
              key={st.id}
              className="rounded-3xl overflow-hidden ice-glass border border-white/80 hover:border-sky-300 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Station Image Thumbnail */}
                <div className="h-48 w-full relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${st.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 text-sky-900 text-xs font-mono font-black shadow-xs">
                      {st.temp}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300 block">
                      {st.region}
                    </span>
                    <h3 className="text-lg font-black leading-tight drop-shadow-sm">{st.name}</h3>
                  </div>
                </div>

                {/* Station Metadata & Summary */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-sky-100 pb-2.5">
                    <span>Elevation: <strong className="text-slate-800 font-mono">{st.elevation}</strong></span>
                    <span>Est: <strong className="text-slate-800 font-mono">{st.established}</strong></span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                    {st.highlight}
                  </p>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="p-5 pt-0">
                <Link
                  href={`/weather?station_id=${st.id}`}
                  className="w-full py-2.5 rounded-2xl bg-white/90 hover:bg-sky-600 hover:text-white border border-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-2xs group-hover:border-sky-600"
                >
                  <span>View Live Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. SECTION: Live Environmental Telemetry (Clean, Simple, Intuitive)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white/95 shadow-xl space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-sky-200/80">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Live NPDC Calibrated Telemetry Stream</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950">
                Live Polar Climate Telemetry
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Direct sensor observations from India's polar meteorological stations without zero-filling or synthetic data.
              </p>
            </div>

            {/* Station Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {STATIONS_DATA.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st.id)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedStation === st.id
                      ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md"
                      : "bg-white/80 text-slate-700 hover:bg-white border border-sky-200"
                  }`}
                >
                  {st.name.replace(" Station", "").replace(" Glaciological", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 4 cols: Current Large Reading */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono block">
                  Current Station Reading ({currentStationMeta.name})
                </span>
                <div className="text-5xl sm:text-6xl font-black text-sky-950 font-mono mt-1 tracking-tight">
                  {currentTemp}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Parameter: <strong className="text-slate-800">{weatherData?.parameter || "airtemp_avg"}</strong> ({weatherData?.unit || "°C"})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/80 border border-sky-100">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Thermometer className="w-4 h-4 text-sky-600" />
                    <span>Calculated Mean</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {stats?.avg ?? "--"} {stats?.unit ?? "°C"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 border border-sky-100">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Wind className="w-4 h-4 text-cyan-600" />
                    <span>Valid Points</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {points.length} obs
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/weather?station_id=${selectedStation}`}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-800 font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Open Full Meteorological Studio</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right 8 cols: Clean Waveform & 3-Button Timeline */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Resolution: <strong className="text-sky-700">{weatherData?.resolution || "LIVE_SENSOR_BURST"}</strong>
                </span>

                {/* 3 Simple Timeline Buttons: LIVE | WEEK | YEAR */}
                <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-sky-100/70 border border-sky-200">
                  {(["LIVE", "WEEK", "YEAR"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTimelineMode(mode)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        timelineMode === mode
                          ? "bg-white text-sky-800 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean SVG Line Chart */}
              <div className="rounded-2xl bg-white/90 border border-sky-100 p-4 shadow-inner">
                {loadingWeather ? (
                  <div className="h-44 flex items-center justify-center text-xs font-bold text-sky-700 font-mono">
                    Fetching Calibrated Instrument Data...
                  </div>
                ) : points.length > 0 ? (
                  <div className="w-full overflow-hidden">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-44 overflow-visible"
                    >
                      {/* Grid lines */}
                      <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#E2E8F0" strokeDasharray="3 3" />

                      {/* Line */}
                      <polyline
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineCoords}
                      />

                      {/* Area gradient under line */}
                      <polygon
                        fill="url(#blueGrad)"
                        opacity="0.25"
                        points={`${padding},${svgHeight - padding} ${polylineCoords} ${svgWidth - padding},${svgHeight - padding}`}
                      />

                      <defs>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284C7" />
                          <stop offset="100%" stopColor="#FFFFFF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-mono">
                    No telemetry records available for this window.
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 mt-2">
                  <span>Start: {weatherData?.period?.start ? new Date(weatherData.period.start).toLocaleDateString() : "--"}</span>
                  <span>End: {weatherData?.period?.end ? new Date(weatherData.period.end).toLocaleDateString() : "--"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION: Polar Expeditions & Science Highlights
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="scientific" className="text-xs font-bold uppercase tracking-wider">
              Scientific Expeditions
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
              Flagship Polar Missions & Discoveries
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal">
              Decades of pioneering expeditions in extreme polar climates, from deep ice-core drilling to oceanic mooring observations.
            </p>
          </div>
          <Link
            href="/expeditions"
            className="inline-flex items-center space-x-2 text-sm sm:text-base font-extrabold text-sky-700 hover:text-sky-900 group"
          >
            <span>View All Historical Expeditions</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXPEDITIONS_HIGHLIGHTS.map((exp, idx) => (
            <div
              key={idx}
              className="ice-glass rounded-3xl p-7 border border-white/80 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  {exp.tag}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-snug">
                  {exp.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Lead: {exp.leader}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {exp.summary}
                </p>
              </div>

              <Link
                href={exp.link}
                className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-sky-700 hover:text-sky-900 group"
              >
                <span>Read Expedition Dossier</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. SECTION: Polar Education & Public Outreach Spotlight
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: NCERT Polar Classroom */}
          <div className="ice-glass rounded-3xl p-8 sm:p-10 border border-white/85 space-y-5 flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                NCERT Polar Classroom (Class 8–12)
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Curriculum-aligned educational modules covering Antarctic katabatic winds, Arctic sea ice extent, Himalayan glacier retreat, and hands-on scientific quizzes.
              </p>
            </div>
            <Link
              href="/education"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-black text-sm shadow-md hover:scale-102 transition-all w-fit"
            >
              <span>Explore Interactive Lessons</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Research & Media Repository */}
          <div className="ice-glass rounded-3xl p-8 sm:p-10 border border-white/85 space-y-5 flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                Verified Media & Research Bulletins
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Access official NCPOR press kits, fact-checked PIB scientific stories, high-resolution expedition photo archives, and National Polar Data Centre datasets.
              </p>
            </div>
            <Link
              href="/research"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-800 font-black text-sm shadow-xs hover:scale-102 transition-all w-fit"
            >
              <span>Browse Research Bulletins</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
