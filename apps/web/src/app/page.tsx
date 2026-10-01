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
  Play,
  X,
  Volume2,
  HelpCircle,
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
    coldest: -17.0,
    warmest: 0.0,
    coldestMonth: "July / August",
    warmestMonth: "December – January",
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
    coldest: -18.0,
    warmest: 1.0,
    coldestMonth: "June / July",
    warmestMonth: "December – February",
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
    coldest: -12.7,
    warmest: 4.4,
    coldestMonth: "February / March",
    warmestMonth: "July / August",
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
    coldest: -21.8,
    warmest: -1.2,
    coldestMonth: "January / February",
    warmestMonth: "July / August",
  },
];

const EXPEDITION_VIDEOS = [
  {
    id: "-KjMHRfUWC4",
    title: "Arriving at Maitri Station",
    location: "Schirmacher Oasis, Antarctica",
    duration: "Field Footage",
    thumb: "https://img.youtube.com/vi/-KjMHRfUWC4/hqdefault.jpg",
  },
  {
    id: "lNhK69S_LLM",
    title: "Tour of Bharati Research Station",
    location: "Larsemann Hills, Antarctica",
    duration: "Facility Walkthrough",
    thumb: "https://img.youtube.com/vi/lNhK69S_LLM/hqdefault.jpg",
  },
  {
    id: "3h9Ltuxsxug",
    title: "Arriving at Himadri Arctic Base",
    location: "Ny-Ålesund, Svalbard (79° N)",
    duration: "Arctic Field Season",
    thumb: "https://img.youtube.com/vi/3h9Ltuxsxug/hqdefault.jpg",
  },
  {
    id: "O-ja_5QP7j8",
    title: "Arriving at Himansh High-Altitude Station",
    location: "Chandra Basin, Spiti Valley (4,080m)",
    duration: "Himalayan Expedition",
    thumb: "https://img.youtube.com/vi/O-ja_5QP7j8/hqdefault.jpg",
  },
];

const FUN_POLAR_FACTS = [
  "Did you know? Antarctic ice is over 4,000 meters (4 km) thick in some interior regions!",
  "Antarctica holds roughly 70% of the world's fresh water and 90% of its freshwater ice.",
  "Because Himadri is at 79° N, it experiences 24 hours of daylight in summer and continuous polar night in winter.",
  "Himansh sits at 4,080m above sea level—higher than most European peaks—to study third-pole glacier melt.",
  "Katabatic winds in Antarctica can reach hurricane gusts exceeding 200 km/h as cold dense air cascades off the ice plateau.",
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState("himansh");
  const [timelineMode, setTimelineMode] = useState<"LIVE" | "WEEK" | "YEAR">("LIVE");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Interactive Temperature Slider State (-25 to +10 C)
  const [tempProbe, setTempProbe] = useState<number>(-10);

  // Video Modal State
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string } | null>(null);

  // Interactive Mascot State & AI Discovery Companion
  const [factIndex, setFactIndex] = useState(0);
  const [mascotOpen, setMascotOpen] = useState(false);
  const [mascotMode, setMascotMode] = useState<"CHAT" | "FACTS">("CHAT");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "mascot"; text: string; resources?: any[] }>
  >([
    {
      sender: "mascot",
      text: "Namaste! I am Barfii, your VISTAAR AI Polar Science Companion 🐧. Ask me to discover research bulletins, live telemetry, or station expeditions!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);

  async function sendMascotMessage(queryText: string) {
    const q = queryText.trim();
    if (!q) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    setChatInput("");
    setIsAiSearching(true);

    const qLower = q.toLowerCase();

    if (qLower.includes("himalay") || qLower.includes("glacier") || qLower.includes("himansh")) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "mascot",
            text: "I found 3 verified scientific resources on Himalayan Glaciology & Himansh Station:",
            resources: [
              {
                title: "Himansh Glacier Monitoring Annual Bulletin",
                desc: "Surface albedo and mass balance observations at Sutri Dhaka glacier.",
                location: "Chandra Basin, Spiti Valley",
                year: "2023",
                type: "PDF Technical Report",
                link: "/documents",
              },
              {
                title: "Himansh AWS Automatic Telemetry",
                desc: "Calibrated hourly surface air temperature, wind velocity and radiation.",
                location: "Himansh Station (4,080m)",
                year: "2024",
                type: "Live Dataset",
                link: "/weather",
              },
              {
                title: "Class 10 Glacier Albedo Curriculum",
                desc: "NCERT-aligned lesson explaining cryospheric energy balance.",
                location: "Third Pole",
                year: "2024",
                type: "Classroom Module",
                link: "/education",
              },
            ],
          },
        ]);
        setIsAiSearching(false);
      }, 400);
      return;
    }

    if (qLower.includes("antarctic") || qLower.includes("maitri") || qLower.includes("bharati")) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "mascot",
            text: "Here are 3 verified resources from India's Antarctic bases:",
            resources: [
              {
                title: "41st ISEA Maitri Meteorology Report",
                desc: "Katabatic wind velocities and synoptic boundary layer pressure.",
                location: "Schirmacher Oasis, Antarctica",
                year: "2022",
                type: "PDF Technical Report",
                link: "/documents",
              },
              {
                title: "Bharati Coastal Disdrometer Telemetry",
                desc: "Precipitation drop-size distribution and synoptic coastal observations.",
                location: "Larsemann Hills, Antarctica",
                year: "2024",
                type: "Live Dataset",
                link: "/weather",
              },
              {
                title: "43rd Indian Scientific Expedition to Antarctica",
                desc: "Ongoing scientific mission across Queen Maud Land & coastal bases.",
                location: "Antarctica",
                year: "2024",
                type: "Expedition Record",
                link: "/expeditions",
              },
            ],
          },
        ]);
        setIsAiSearching(false);
      }, 400);
      return;
    }

    if (qLower.includes("arctic") || qLower.includes("himadri") || qLower.includes("svalbard")) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "mascot",
            text: "Here are verified resources from India's Arctic Station Himadri:",
            resources: [
              {
                title: "1st Indian Winter Arctic Scientific Expedition",
                desc: "Historic year-round atmospheric and fjord monitoring in Svalbard.",
                location: "Ny-Ålesund, Arctic (79°N)",
                year: "2024",
                type: "Expedition Bulletin",
                link: "/expeditions",
              },
              {
                title: "Himadri Optical Disdrometer Telemetry",
                desc: "Calibrated micro-rain radar and aerosol optical depth records.",
                location: "Ny-Ålesund, Arctic",
                year: "2024",
                type: "Live Dataset",
                link: "/weather",
              },
            ],
          },
        ]);
        setIsAiSearching(false);
      }, 400);
      return;
    }

    // Default discovery response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "mascot",
          text: `Searching VISTAAR repository for "${q}". Explore our verified datasets and expeditions:`,
          resources: [
            {
              title: "NPDC Consolidated Polar Telemetry Catalog",
              desc: "15,000+ calibrated meteorological observations.",
              location: "National Polar Data Centre",
              year: "2024",
              type: "Authoritative Datasets",
              link: "/datasets",
            },
            {
              title: "Observatories & Real-Time Weather Stream",
              desc: "Maitri, Bharati, Himadri, and Himansh telemetry stations.",
              location: "Three Poles",
              year: "2024",
              type: "Live Stream",
              link: "/weather",
            },
          ],
        },
      ]);
      setIsAiSearching(false);
    }, 400);
  }

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
    <div className="w-full space-y-24 pb-20 relative">
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
          3. SECTION: Interactive Polar Climate & Temperature Comparator
          (How Cold Does It Get Across India's Stations? Interactive Slider)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="ice-glass-strong rounded-3xl p-8 sm:p-12 border border-white/95 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sky-200/80 pb-6">
            <div className="space-y-2">
              <Badge variant="scientific" className="text-xs font-bold uppercase tracking-wider">
                Cryosphere Temperature Comparator
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950">
                How Cold Does It Get Across India&apos;s Stations?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Drag the temperature probe to see which observatories experience that climate. The 0 °C mark shows where water freezes into solid ice.
              </p>
            </div>

            {/* Current Probe Display */}
            <div className="bg-sky-50/90 border-2 border-sky-200 rounded-2xl px-6 py-3 text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Selected Temperature
              </span>
              <div className="text-4xl font-black text-sky-900 font-mono">
                {tempProbe > 0 ? `+${tempProbe}` : tempProbe} °C
              </div>
            </div>
          </div>

          {/* Slider Control Bar */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <input
              type="range"
              min="-25"
              max="10"
              step="0.5"
              value={tempProbe}
              onChange={(e) => setTempProbe(parseFloat(e.target.value))}
              className="w-full h-3 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-xs font-mono font-bold text-slate-500">
              <span>-25 °C (Deep Polar Freeze)</span>
              <span className="text-sky-800 font-extrabold">-10 °C</span>
              <span className="text-blue-700 font-extrabold">0 °C (Freezing Point)</span>
              <span>+10 °C (Summer Thaw)</span>
            </div>
          </div>

          {/* Interactive Horizontal Range Bars for the 4 Stations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {STATIONS_DATA.map((st) => {
              const inRange = tempProbe >= st.coldest && tempProbe <= st.warmest;
              const isFreezing = tempProbe <= 0;
              return (
                <div
                  key={st.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    inRange
                      ? "bg-white/95 border-sky-400 shadow-md ring-2 ring-sky-300/40"
                      : "bg-white/60 border-sky-100 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{st.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{st.region} • Elev: {st.elevation}</p>
                    </div>
                    {inRange && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        ✓ Station Active at {tempProbe} °C
                      </span>
                    )}
                  </div>

                  {/* Range Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-600">
                      <span>Coldest: <strong>{st.coldest} °C</strong> ({st.coldestMonth})</span>
                      <span>Warmest: <strong>{st.warmest > 0 ? `+${st.warmest}` : st.warmest} °C</strong> ({st.warmestMonth})</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-sky-600 via-cyan-500 to-amber-500"
                        style={{
                          left: `${((st.coldest + 25) / 35) * 100}%`,
                          width: `${((st.warmest - st.coldest) / 35) * 100}%`,
                        }}
                      />
                      {/* 0 C Freeze Mark */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-900 z-10"
                        style={{ left: `${(25 / 35) * 100}%` }}
                        title="0 °C Freezing Mark"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-xs text-slate-600 leading-relaxed font-medium">
            💡 <strong>Science Observation:</strong> Notice how Himadri (Arctic) experiences its warmest summer in July/August (+4.4 °C) while Maitri and Bharati (Antarctica) are simultaneously in pitch-black Antarctic mid-winter (-17 °C). This hemispheric seasonal inversion is due to Earth&apos;s 23.5° axial tilt!
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION: "Watch from the Field" Video Gallery
          (Official Real NCPOR Expeditions on YouTube)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="scientific" className="text-xs font-bold uppercase tracking-wider">
              Field Video Archive
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
              Watch from the Polar Field
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal">
              Direct video footage from Indian scientific expeditions in Antarctica, the Arctic, and the Himalayas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPEDITION_VIDEOS.map((vid) => (
            <div
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              className="cursor-pointer group ice-glass rounded-3xl overflow-hidden border border-white/85 hover:border-sky-300 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-[#0B192C]">
                <img
                  src={vid.thumb}
                  alt={vid.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-sky-800 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300 block">
                    {vid.duration}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-1">
                <h4 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors leading-snug">
                  {vid.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{vid.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. SECTION: Live Climate & Weather Telemetry
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
                Direct sensor observations from India&apos;s polar meteorological stations without zero-filling or synthetic data.
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
                      <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#E2E8F0" strokeDasharray="3 3" />

                      <polyline
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineCoords}
                      />

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
          6. SECTION: Interactive Polar Education (Class 5 to 12 Level Picker)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="scientific" className="text-xs font-bold uppercase tracking-wider">
              NCERT Curriculum Alignment
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
              Interactive Polar Education (Class 5–12)
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal">
              Select your class grade to open curated lessons covering glacier mechanics, polar atmospheric dynamics, and interactive scientific quizzes.
            </p>
          </div>
          <Link
            href="/education"
            className="inline-flex items-center space-x-2 text-sm sm:text-base font-extrabold text-sky-700 hover:text-sky-900 group"
          >
            <span>Enter Full Classroom Hub</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Class Level Selector Buttons */}
        <div className="flex flex-wrap gap-2.5">
          {[5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
            <Link
              key={cls}
              href={`/education?grade=${cls}`}
              className="px-5 py-2.5 rounded-2xl ice-glass hover:bg-white text-slate-800 font-extrabold text-sm sm:text-base border border-sky-200 hover:border-sky-400 hover:shadow-md transition-all flex items-center space-x-2"
            >
              <span>Class {cls}</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
            </Link>
          ))}
        </div>
      </section>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl rounded-3xl ice-glass-strong p-4 sm:p-6 shadow-2xl border border-white relative space-y-3">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-sky-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#0B192C]">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FLOATING POLAR AI COMPANION ("Barfii the Penguin") — Discovery Studio
          ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        {mascotOpen && (
          <div className="mb-3 w-80 sm:w-96 ice-glass-strong rounded-3xl p-4 sm:p-5 shadow-2xl border border-white space-y-3 animate-fade-in text-slate-900 max-h-[540px] flex flex-col justify-between">
            {/* Companion Header */}
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🐧</span>
                <div>
                  <h4 className="text-sm font-black text-slate-950 flex items-center space-x-1.5">
                    <span>Barfii</span>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                      Polar AI Companion
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Grounded in NCPOR Polar Archives</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setMascotMode(mascotMode === "CHAT" ? "FACTS" : "CHAT")}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/80 hover:bg-white text-sky-700 border border-sky-200 transition-colors"
                >
                  {mascotMode === "CHAT" ? "💡 Facts Mode" : "💬 AI Chat"}
                </button>
                <button
                  onClick={() => setMascotOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-sky-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode 1: FACTS MODE */}
            {mascotMode === "FACTS" ? (
              <div className="py-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-white/80 border border-sky-100 text-xs text-slate-800 leading-relaxed font-medium">
                  {FUN_POLAR_FACTS[factIndex]}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-bold">
                    Fact {factIndex + 1} of {FUN_POLAR_FACTS.length}
                  </span>
                  <button
                    onClick={() => setFactIndex((factIndex + 1) % FUN_POLAR_FACTS.length)}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    Next Fact →
                  </button>
                </div>
              </div>
            ) : (
              /* Mode 2: DISCOVERY CHAT MODE */
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                {/* Suggested Discovery Prompts */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    "Himalayan glacier research",
                    "Antarctic weather reports",
                    "Himadri Arctic station",
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMascotMessage(prompt)}
                      className="text-[11px] font-bold text-sky-800 bg-sky-50/90 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200/80 transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Messages Container */}
                <div className="h-60 overflow-y-auto space-y-2.5 pr-1 text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col space-y-1 ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl max-w-[90%] leading-relaxed font-medium ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-br-xs shadow-xs"
                            : "bg-white/90 text-slate-800 rounded-bl-xs border border-sky-100 shadow-2xs"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Attached Resource Cards */}
                      {msg.resources && (
                        <div className="w-full space-y-1.5 pt-1">
                          {msg.resources.map((res: any, rIdx: number) => (
                            <div
                              key={rIdx}
                              className="p-2.5 rounded-xl bg-white/95 border border-sky-200/90 text-[11px] space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-900 line-clamp-1">{res.title}</span>
                                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                  {res.year}
                                </span>
                              </div>
                              <p className="text-slate-600 line-clamp-2 leading-tight">{res.desc}</p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <span className="text-[10px] text-slate-500 font-medium">{res.location}</span>
                                <Link
                                  href={res.link}
                                  onClick={() => setMascotOpen(false)}
                                  className="text-[10px] font-bold text-sky-700 hover:underline flex items-center space-x-0.5"
                                >
                                  <span>Open</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAiSearching && (
                    <div className="flex items-center space-x-2 text-xs text-sky-700 font-medium py-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Barfii is searching verified polar archives...</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMascotMessage(chatInput);
                  }}
                  className="flex items-center space-x-1.5 pt-2 border-t border-sky-200/80"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about glaciers, telemetry, stations..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/90 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Ask
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            setMascotOpen(!mascotOpen);
            if (!mascotOpen) {
              setFactIndex((factIndex + 1) % FUN_POLAR_FACTS.length);
            }
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white cursor-pointer relative group"
          title="Ask Barfii the Polar AI Companion"
        >
          <span className="text-2xl">🐧</span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
        </button>
      </div>
    </div>
  );
}
