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
  Navigation, 
  MapPin, 
  Thermometer, 
  Wind, 
  Calendar, 
  Eye, 
  ChevronRight,
  Flame,
  Globe2,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

const HERO_SLIDES = [
  {
    regionTag: "NORTH",
    title: "The Arctic",
    subtitle: "Discover the remote beauty of the North and India's year-round atmospheric research at Himadri, Ny-Ålesund.",
    bgImage: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2000&q=85",
    stationId: "himadri",
    coordinates: "78°55' N, 11°55' E"
  },
  {
    regionTag: "SOUTH",
    title: "Antarctica",
    subtitle: "Investigating global teleconnections, ice shelf dynamics and geomagnetic fields across Bharati & Maitri.",
    bgImage: "https://images.unsplash.com/photo-1548263594-a71ea65a8598?auto=format&fit=crop&w=2000&q=85",
    stationId: "bharati",
    coordinates: "69°24' S, 76°11' E"
  },
  {
    regionTag: "THIRD POLE",
    title: "The Himalayas",
    subtitle: "High-altitude glacier mass balance and cryospheric freshwater security at Himansh (4,080m), Chandra Basin.",
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85",
    stationId: "himansh",
    coordinates: "32°24' N, 77°37' E"
  }
];

const POLAR_DESTINATIONS = [
  {
    id: "bharati",
    name: "Bharati Station",
    sector: "Larsemann Hills, Antarctica",
    coords: "69°24'S, 76°11'E",
    img: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
    tag: "Active Observatory"
  },
  {
    id: "maitri",
    name: "Maitri Station",
    sector: "Schirmacher Oasis, Antarctica",
    coords: "70°45'S, 11°44'E",
    img: "https://images.unsplash.com/photo-1548263594-a71ea65a8598?auto=format&fit=crop&w=800&q=80",
    tag: "Continuous Since 1989"
  },
  {
    id: "himadri",
    name: "Himadri Arctic Base",
    sector: "Ny-Ålesund, Svalbard (79°N)",
    coords: "78°55'N, 11°55'E",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    tag: "Arctic Atmospheric Lab"
  },
  {
    id: "himansh",
    name: "Himansh Cryo Station",
    sector: "Spiti Valley (4,080m)",
    coords: "32°24'N, 77°37'E",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    tag: "Third Pole Glaciology"
  },
  {
    id: "vasiliy",
    name: "Expedition Vessel",
    sector: "Southern Ocean Transect",
    coords: "40°S to 70°S Roaring Forties",
    img: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    tag: "Oceanographic Cruise"
  },
  {
    id: "glacier",
    name: "Sutri Dhaka Glacier",
    sector: "Western Himalayas",
    coords: "4,500m Benchmark Site",
    img: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?auto=format&fit=crop&w=800&q=80",
    tag: "Mass Balance Basin"
  }
];

const WILDLIFE_PROFILES: Record<string, any> = {
  polar_bear: {
    name: "POLAR BEAR (Ursus maritimus)",
    region: "Arctic (Svalbard & High Latitudes)",
    status: "VULNERABLE (IUCN)",
    description: "The polar bear is the world's largest bear and apex marine predator of the Arctic, spending most of its life on the sea ice hunting seals. India's atmospheric measurements at Himadri track the retreat of summer sea ice extent that directly impacts hunting platforms.",
    quote: "Due to major reductions of sea ice in the Arctic over the past decades as a result of climate warming, polar bears face extended fasting periods and habitat fragmentation.",
    img: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80",
    metrics: { population: "~26,000", seaIceLoss: "-12.6% / decade", range: "Circumpolar Arctic" }
  },
  emperor_penguin: {
    name: "EMPEROR PENGUIN (Aptenodytes forsteri)",
    region: "Continental Antarctica (Coastal Fast Ice)",
    status: "NEAR THREATENED",
    description: "The tallest and heaviest of all living penguin species, endemic to Antarctica. Colonies near Bharati in the Larsemann Hills rely on stable landfast sea ice from April through December to raise their chicks.",
    quote: "Catastrophic breeding failures occur when Antarctic landfast ice breaks up prematurely before fledglings develop waterproof adult feathers.",
    img: "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=800&q=80",
    metrics: { population: "~600,000", breedingTemp: "-50°C", range: "Coastal Antarctica" }
  },
  snow_leopard: {
    name: "SNOW LEOPARD (Panthera uncia)",
    region: "Himalayas / Spiti Valley (Third Pole)",
    status: "VULNERABLE",
    description: "The 'Ghost of the Mountains' roams the high alpine steppes surrounding India's Himansh research station in Spiti Valley. Glacier recession shifts alpine vegetation zones and pastoral pressures upward into snow leopard territory.",
    quote: "Third pole cryospheric thawing influences alpine hydrology, snowline boundaries, and prey species distribution throughout the Spiti and Chandra basins.",
    img: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=800&q=80",
    metrics: { population: "~400-700 (India)", elevationRange: "3,000 - 5,400m", range: "High Himalayas" }
  }
};

const EXPEDITION_TIMELINE = [
  { date: "15 APRIL", km: "12.26 KM", temp: "-25°C", wind: "28 kts", note: "Reached Ice Edge sector. Calibrated disdrometer sensors against blowing drift snow." },
  { date: "14 APRIL", km: "10.40 KM", temp: "-28°C", wind: "34 kts", note: "Glacier traverse across crevasse field. GPS telemetry verified with base station." },
  { date: "13 APRIL", km: "08.40 KM", temp: "-31°C", wind: "42 kts", note: "Severe katabatic squall. Automated AWS mast secured; barometric pressure plunged to 962 hPa." },
  { date: "12 APRIL", km: "05.15 KM", temp: "-35°C", wind: "22 kts", note: "Ice core borehole drilling down to 40 meters for paleoclimate gas isotope analysis." },
  { date: "11 APRIL", km: "02.08 KM", temp: "-38°C", wind: "18 kts", note: "Initial departure from base shelter. Frostbite checks completed for all field scientists." }
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeWildlife, setActiveWildlife] = useState("polar_bear");
  const [selectedTimelineIdx, setSelectedTimelineIdx] = useState(0);

  const currentSlide = HERO_SLIDES[activeSlide];
  const wildlife = WILDLIFE_PROFILES[activeWildlife];
  const activeDispatch = EXPEDITION_TIMELINE[selectedTimelineIdx];

  return (
    <div className="space-y-20 pb-24 bg-vistaar-bg text-vistaar-text">
      {/* 1. Dramatic Polar Hero (Visual reference: Image 1) */}
      <section className="relative h-[85vh] min-h-[560px] w-full flex items-center justify-start overflow-hidden">
        {/* Background Photo with deep atmospheric gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
          style={{ backgroundImage: `url('${currentSlide.bgImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528]/90 via-[#0B1528]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-vistaar-bg via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <span className="text-xs uppercase font-mono tracking-[0.3em] font-bold text-cyan-300">
                {currentSlide.regionTag}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs font-mono text-white/80">{currentSlide.coordinates}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif tracking-tight font-normal text-white leading-tight">
              {currentSlide.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-sans max-w-xl">
              {currentSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link href={`/weather?station=${currentSlide.stationId}`}>
                <button className="px-6 py-2.5 rounded-full bg-[#1B2838] hover:bg-vistaar-primary text-white text-xs font-semibold tracking-wider transition-all duration-300 shadow-lg border border-white/20">
                  Learn More
                </button>
              </Link>
              <Link href="/workspace">
                <button className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider backdrop-blur-md transition-all border border-white/20">
                  Review Studio
                </button>
              </Link>
              <Link href="/datasets">
                <button className="px-6 py-2.5 rounded-full bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 text-xs font-semibold tracking-wider backdrop-blur-md transition-all border border-cyan-400/30">
                  NPDC Datasets
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Sector Switcher Navigation Tabs */}
        <div className="absolute bottom-6 right-6 sm:right-12 z-20 flex space-x-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/15">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.title}
              onClick={() => setActiveSlide(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSlide === idx
                  ? "bg-white text-vistaar-text shadow"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {slide.regionTag}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Institutional Expedition Pillars (Visual reference: Image 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        <div className="space-y-2 max-w-3xl mx-auto">
          <span className="text-xs uppercase font-mono tracking-widest text-vistaar-scientific font-bold">
            PARTEZ À LA DÉCOUVERTE DES TERRES POLAIRES, AUSTRALES ET HIMALAYENNES
          </span>
          <h2 className="text-3xl font-serif text-vistaar-text">
            Découvrez L’Archipel Scientifique de l'Inde
          </h2>
          <div className="w-16 h-0.5 bg-vistaar-primary mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white rounded-lg border border-vistaar-border space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-vistaar-primary flex items-center justify-center">
              <Compass className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-sm tracking-wider uppercase text-vistaar-text">TERRES DE GLACE</h3>
            <p className="text-xs text-vistaar-muted leading-relaxed">
              Dynamique des calottes glaciaires, forages carottiers profonds et bilan de masse glaciaire en Antarctique et en Himalaya.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-vistaar-border space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-50 text-vistaar-scientific flex items-center justify-center">
              <CloudSun className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-sm tracking-wider uppercase text-vistaar-text">TERRES SAUVAGES</h3>
            <p className="text-xs text-vistaar-muted leading-relaxed">
              Surveillance continue de l’atmosphère polaire, vents catabatiques extrêmes, radars MRR et radiométrie HATPRO.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-vistaar-border space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Globe2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-sm tracking-wider uppercase text-vistaar-text">TERRES VIVANTES</h3>
            <p className="text-xs text-vistaar-muted leading-relaxed">
              Téléconnexions climatiques globales, impact du dégel de la banquise sur la mousson indienne et préservation de la biodiversité.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Destination Matrix with Glacial Blue Overlays (Visual reference: Image 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-vistaar-border pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-vistaar-primary font-bold">
              OBSERVATOIRES ET MISSIONS NATIONALES
            </span>
            <h2 className="text-2xl font-serif text-vistaar-text">Votre Prochaine Destination Scientifique</h2>
          </div>
          <Link href="/stations" className="text-xs font-semibold text-vistaar-primary hover:underline flex items-center space-x-1">
            <span>Explorer tous les postes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {POLAR_DESTINATIONS.map((dest) => (
            <Link key={dest.id} href={`/weather?station=${dest.id}`} className="group relative h-64 rounded-lg overflow-hidden border border-vistaar-border shadow-sm block">
              <img
                src={dest.img}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Cyan / Blue Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E3860]/95 via-[#0E7490]/40 to-transparent group-hover:from-[#1D4ED8]/95 transition-colors" />

              <div className="absolute bottom-0 inset-x-0 p-3 text-white space-y-1">
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-cyan-200 block">
                  {dest.tag}
                </span>
                <h4 className="font-bold text-xs leading-snug">{dest.name}</h4>
                <p className="text-[10px] text-white/80 line-clamp-1">{dest.sector}</p>
                <span className="text-[9px] font-mono text-cyan-300 block">{dest.coords}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Interactive Expedition Map & Waypoint Radar (Visual reference: Image 3) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-[#1C2630] rounded-xl text-white p-6 sm:p-8 space-y-6 shadow-xl border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-700 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold">
                  EXPEDITION ROUTE TRACKER • LIVE FIELD TELEMETRY
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-white mt-1">
                Indian Antarctic & Arctic Field Navigation Radar
              </h2>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono bg-black/40 px-4 py-2 rounded-lg border border-white/10">
              <span className="text-gray-400">CURRENT POSITION:</span>
              <span className="text-cyan-400 font-bold">88°35' N, 16°12' E</span>
              <span className="text-gray-400">TEMP:</span>
              <span className="text-red-400 font-bold">-25.4°C</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Topographic Route Radar (Circular Magnifier matching Image 3) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-4">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-4 border-gray-600 bg-gradient-to-b from-[#2A3B4C] to-[#15202B] p-2 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Radar Grid Circles */}
                <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-16 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-28 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-cyan-500/15" />
                  <div className="h-full w-px bg-cyan-500/15 absolute" />
                </div>

                {/* Connected Route Polyline */}
                <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 100 100">
                  <polyline
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="2 1"
                    points="20,80 30,65 42,70 55,45 68,50 82,25"
                  />
                  {/* Waypoint Dots */}
                  <circle cx="20" cy="80" r="3" fill="#EF4444" />
                  <circle cx="30" cy="65" r="2.5" fill="#EF4444" />
                  <circle cx="42" cy="70" r="2.5" fill="#EF4444" />
                  <circle cx="55" cy="45" r="2.5" fill="#EF4444" />
                  <circle cx="68" cy="50" r="2.5" fill="#EF4444" />
                  <circle cx="82" cy="25" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                  <text x="82" y="18" fill="#10B981" fontSize="5" textAnchor="middle" fontWeight="bold">FINISH</text>
                  <text x="20" y="88" fill="#EF4444" fontSize="5" textAnchor="middle">CAMP 01</text>
                </svg>

                {/* Radar Overlay Label */}
                <div className="absolute bottom-4 text-center">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 bg-black/60 px-3 py-1 rounded-full border border-white/10">
                    ENLARGED 15X • FIELD RADAR
                  </span>
                </div>
              </div>
            </div>

            {/* Field Waypoint Data & Daily Progress */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-black/30 p-5 rounded-lg border border-gray-700 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-cyan-400 border-b border-gray-700/80 pb-2 font-bold">
                  <span>WAYPOINT LOG — SECTOR 04</span>
                  <Badge variant="scientific">GPS ACCURATE</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-gray-300">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Elevation</span>
                    <span className="font-bold text-white">4,080m AMSL</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Barometric Pressure</span>
                    <span className="font-bold text-white">612 hPa</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Wind Vector</span>
                    <span className="font-bold text-white">SSE 181° @ 14 m/s</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Surface Albedo</span>
                    <span className="font-bold text-white">0.82 (Fresh Snow)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-700/80 text-[11px] text-gray-400">
                  Authoritative telemetry continuously transmitted to NCPOR Goa via INSAT satellite uplinks.
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/weather" className="flex-1">
                  <button className="w-full py-2.5 rounded-lg bg-vistaar-primary hover:bg-blue-600 text-white text-xs font-semibold tracking-wider transition-colors shadow">
                    View Live Weather Charts
                  </button>
                </Link>
                <Link href="/explore" className="flex-1">
                  <button className="w-full py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold tracking-wider transition-colors border border-gray-500">
                    Expedition Archive
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Polar Biodiversity & Habitat Explorer (Visual reference: Image 3) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-vistaar-border pb-4">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold">
            BIOGEOGRAPHY & CRYOSPHERIC HABITATS
          </span>
          <h2 className="text-2xl font-serif text-vistaar-text">Polar Wildlife & Ecosystem Vulnerability</h2>
        </div>

        <div className="bg-[#1C2630] rounded-xl overflow-hidden shadow-lg border border-gray-700 grid grid-cols-1 lg:grid-cols-12 text-white">
          {/* Wildlife Selector Tabs (Left vertical rail) */}
          <div className="lg:col-span-3 bg-[#15202B] border-r border-gray-700 p-4 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-3">
              SELECT POLAR SPECIES
            </span>
            {Object.keys(WILDLIFE_PROFILES).map((key) => {
              const sp = WILDLIFE_PROFILES[key];
              const isSelected = activeWildlife === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveWildlife(key)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-vistaar-primary text-white shadow"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="block font-bold">{sp.name.split(" (")[0]}</span>
                  <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{sp.region}</span>
                </button>
              );
            })}
          </div>

          {/* Wildlife Photo & Biology Detail (Center/Right) */}
          <div className="lg:col-span-9 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="rounded-lg overflow-hidden border border-gray-700 h-64 shadow-inner">
                <img
                  src={wildlife.img}
                  alt={wildlife.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Badge variant="scientific">{wildlife.status}</Badge>
                  <h3 className="text-xl font-bold font-serif text-white">{wildlife.name}</h3>
                  <p className="text-xs text-cyan-300 font-mono">{wildlife.region}</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {wildlife.description}
                </p>
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded border border-white/10 font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase block">Population</span>
                    <span className="font-bold text-white">{wildlife.metrics.population}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase block">Sea Ice Metric</span>
                    <span className="font-bold text-cyan-400">{wildlife.metrics.seaIceLoss || wildlife.metrics.breedingTemp}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase block">Biome Range</span>
                    <span className="font-bold text-white">{wildlife.metrics.range}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Impact Quote */}
            <div className="border-t border-gray-700/80 pt-4 flex items-start space-x-3 text-xs text-gray-300 italic">
              <span className="text-3xl text-cyan-400 font-serif leading-none">“</span>
              <p className="leading-relaxed">
                {wildlife.quote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Expedition Diary & Field Dispatch Timeline (Visual reference: Image 3) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-vistaar-border pb-4">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            JOURNAL DE BORD DES CHERCHEURS
          </span>
          <h2 className="text-2xl font-serif text-vistaar-text">Chroniques des Expéditions Polaires</h2>
        </div>

        <div className="bg-white rounded-xl border border-vistaar-border shadow-sm p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Vertical Date & Distance Log (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-2 border-r border-vistaar-border/60 pr-6">
            <span className="text-[10px] uppercase font-mono tracking-wider text-vistaar-muted block mb-3">
              EXPEDITION FIELD DIARY LOGS
            </span>
            {EXPEDITION_TIMELINE.map((item, idx) => (
              <div
                key={item.date}
                onClick={() => setSelectedTimelineIdx(idx)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  selectedTimelineIdx === idx
                    ? "border-vistaar-primary bg-blue-50/60 shadow-sm"
                    : "border-vistaar-border/60 bg-vistaar-bg/40 hover:bg-white"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-vistaar-text block">{item.date}</span>
                  <span className="text-[10px] text-vistaar-muted font-mono">{item.note.slice(0, 45)}...</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-vistaar-primary block">{item.km}</span>
                  <span className="text-[10px] text-red-600 font-semibold">{item.temp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Field Entry & Frost Portrait (Right 7 cols) */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-6 items-center">
            {/* Field Researcher Photo */}
            <div className="w-full md:w-56 h-64 rounded-lg overflow-hidden border border-vistaar-border flex-shrink-0 relative shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                alt="Scientist in polar weather gear"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono">
                {activeDispatch.temp} • {activeDispatch.wind}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-vistaar-scientific font-bold">
                  JOURNAL ENTRY — {activeDispatch.date}
                </span>
                <h3 className="font-bold text-sm text-vistaar-text">
                  Ice Cap Traverse & Atmospheric Profiling
                </h3>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 font-serif italic text-xs leading-relaxed">
                “So excited, but look me in the eye and tell me it's not cold up here! The wind chill pushes down toward -48°C, but our sensor masts are transmitting flawlessly.”
              </div>

              <p className="text-vistaar-muted leading-relaxed font-sans">
                {activeDispatch.note} All samples and meteorological records are automatically logged into the VISTAAR repository with provenance intact.
              </p>

              <div className="pt-2 border-t border-vistaar-border flex items-center justify-between text-[11px] font-mono text-vistaar-muted">
                <span>Distance Traversed: <strong>{activeDispatch.km}</strong></span>
                <span className="text-vistaar-primary font-semibold">NCPOR FIELD TEAM</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
