"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Calendar, MapPin, Award, ArrowRight, ShieldCheck, Thermometer, Wind, Navigation, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ExplorePage() {
  const [activeExpedition, setActiveExpedition] = useState("isea43");

  const EXPEDITIONS = [
    {
      id: "isea43",
      title: "43rd Indian Scientific Expedition to Antarctica (ISEA)",
      leader: "Dr. Sailesh Agrawal, NCPOR",
      period: "November 2023 – March 2024",
      sector: "Larsemann Hills & Schirmacher Oasis",
      tempRange: "-4.2°C to -38.6°C",
      distanceCovered: "14,800 Nautical Miles",
      summary: "Multidisciplinary voyage investigating Antarctic ice shelf calving, paleoclimate gas bubbles trapped in deep ice cores, and geomagnetic storm dynamics.",
      vessel: "Chartered Polar Icebreaker MV Vasiliy Golovnin",
      keyInstruments: ["HATPRO Microwave Radiometer", "MRR-2 Micro Rain Radar", "IIG Fluxgate Magnetometers"],
      waypoints: [
        { name: "Cape Town Departure", lat: "-33.92°", lng: "18.42°", date: "22 Nov 2023" },
        { name: "Southern Ocean Convergence (50°S)", lat: "-50.10°", lng: "25.40°", date: "01 Dec 2023" },
        { name: "Maitri Station Arrival (Priyadarshini Lake)", lat: "-70.76°", lng: "11.73°", date: "14 Dec 2023" },
        { name: "Bharati Station Base (Larsemann Hills)", lat: "-69.40°", lng: "76.19°", date: "28 Dec 2023" },
        { name: "Amery Ice Shelf Monitoring Site", lat: "-69.90°", lng: "71.50°", date: "15 Jan 2024" }
      ]
    },
    {
      id: "arctic2024",
      title: "Indian Arctic Expedition — Ny-Ålesund (79°N)",
      leader: "Atmospheric Sciences Division, NCPOR",
      period: "Year-Round Arctic Campaign 2023–2024",
      sector: "Kongsfjorden, Svalbard Archipelago",
      tempRange: "+4.5°C to -28.2°C",
      distanceCovered: "Continuous Station Telemetry",
      summary: "Tracking the retreat of Arctic sea ice, marine aerosol production, and teleconnections between Arctic amplification and the Indian summer monsoon.",
      vessel: "Norwegian Polar Research Support",
      keyInstruments: ["OTT-PARSIVEL Disdrometer", "Micro Rain Radar", "Aerosol Chemical Speciation Monitor"],
      waypoints: [
        { name: "Longyearbyen Transit", lat: "78.22°", lng: "15.65°", date: "Spring 2023" },
        { name: "Ny-Ålesund Research Village", lat: "78.92°", lng: "11.92°", date: "Summer Campaign" },
        { name: "Kongsfjorden Oceanographic Buoy", lat: "79.02°", lng: "11.60°", date: "Autumn 2023" },
        { name: "Himadri Winterized Post", lat: "78.92°", lng: "11.92°", date: "Winter Phase" }
      ]
    },
    {
      id: "himalaya2024",
      title: "Chandra Basin Glaciological Monitoring Campaign",
      leader: "Cryosphere and Climate Group, NCPOR",
      period: "Seasonal Monitoring (2016 – Present)",
      sector: "Spiti Valley, Himachal Pradesh (4,080m)",
      tempRange: "+16.8°C to -34.6°C",
      distanceCovered: "5 Glacier Basins Instrumented",
      summary: "Third Pole glaciology laboratory tracking benchmark glaciers (Sutri Dhaka, Batal, Samudra Tapu) to quantify snow mass water equivalence and ablation rates.",
      vessel: "High-Altitude Terrestrial Logistics",
      keyInstruments: ["Automatic High-Altitude Weather Station", "Sub-surface Temperature Probes", "Snow Density Sensors"],
      waypoints: [
        { name: "Manali Staging Base", lat: "32.24°", lng: "77.18°", date: "Base Staging" },
        { name: "Rohtang / Atal Pass", lat: "32.37°", lng: "77.24°", date: "Transit Route" },
        { name: "Himansh Station (4,080m)", lat: "32.40°", lng: "77.61°", date: "Continuous AWS" },
        { name: "Sutri Dhaka Glacier Snout (4,500m)", lat: "32.45°", lng: "77.68°", date: "Field Camp" }
      ]
    }
  ];

  const current = EXPEDITIONS.find((e) => e.id === activeExpedition) || EXPEDITIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
            <Compass className="w-4 h-4" />
            <span>National Polar Explorations Archive</span>
          </div>
          <h1 className="text-3xl font-serif text-vistaar-text">
            Indian Scientific Expeditions & Traverses
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Historical and active exploration routes across the Antarctic continent, Arctic fjords, and Himalayan third pole.
          </p>
        </div>

        {/* Expedition Switcher Tabs */}
        <div className="flex flex-wrap gap-2">
          {EXPEDITIONS.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setActiveExpedition(exp.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                activeExpedition === exp.id
                  ? "bg-vistaar-primary text-white border-vistaar-primary shadow-sm"
                  : "bg-white text-vistaar-text border-vistaar-border hover:bg-vistaar-bg"
              }`}
            >
              {exp.title.split(" (")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Expedition Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Expedition Profile & Waypoints (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white">
            <CardHeader className="p-6 border-b border-vistaar-border bg-vistaar-bg/40">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="scientific">{current.sector}</Badge>
                <span className="text-xs font-mono text-vistaar-muted">{current.period}</span>
              </div>
              <CardTitle className="text-xl font-bold font-serif">{current.title}</CardTitle>
              <CardDescription className="text-xs text-vistaar-muted mt-1">
                Expedition Leader: <strong>{current.leader}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              <p className="text-vistaar-text leading-relaxed text-sm font-sans">
                {current.summary}
              </p>

              {/* Expedition Telemetry Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-vistaar-bg p-4 rounded-lg border border-vistaar-border font-mono">
                <div>
                  <span className="text-[10px] text-vistaar-muted uppercase block">Observed Temp</span>
                  <span className="font-bold text-red-600 text-xs">{current.tempRange}</span>
                </div>
                <div>
                  <span className="text-[10px] text-vistaar-muted uppercase block">Logistics / Vessel</span>
                  <span className="font-bold text-vistaar-text text-xs">{current.vessel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-vistaar-muted uppercase block">Traverse Distance</span>
                  <span className="font-bold text-vistaar-primary text-xs">{current.distanceCovered}</span>
                </div>
              </div>

              {/* Waypoint Chronology */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-vistaar-text flex items-center space-x-1.5">
                  <Navigation className="w-4 h-4 text-vistaar-primary" />
                  <span>Sequential Field Waypoints & Coordinates</span>
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-vistaar-border">
                  {current.waypoints.map((wp, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[1.45rem] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-vistaar-primary shadow-sm" />
                      <div className="p-3 bg-white rounded border border-vistaar-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-xs">
                        <div>
                          <span className="font-bold text-vistaar-text block">{wp.name}</span>
                          <span className="text-[10px] text-vistaar-muted font-mono">{wp.date}</span>
                        </div>
                        <span className="text-[11px] font-mono text-vistaar-scientific font-semibold">
                          {wp.lat}, {wp.lng}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Topographic Radar & Instrumentation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Circular Radar Simulation Card */}
          <Card className="bg-[#1C2630] text-white border-gray-700 shadow-xl overflow-hidden">
            <CardHeader className="p-5 border-b border-gray-700 bg-[#15202B]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase font-mono tracking-widest text-cyan-300 font-bold flex items-center space-x-1.5">
                  <Radio className="w-4 h-4 animate-pulse text-red-500" />
                  <span>EXPEDITION SATELLITE RADAR</span>
                </CardTitle>
                <Badge variant="scientific">ENLARGED 15X</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-64 h-64 rounded-full border-2 border-gray-600 bg-gradient-to-b from-[#2A3B4C] to-[#15202B] p-2 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-10 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-20 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-cyan-500/15" />
                  <div className="h-full w-px bg-cyan-500/15 absolute" />
                </div>
                <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100">
                  <polyline
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="25,75 35,55 50,60 70,35 80,25"
                  />
                  <circle cx="25" cy="75" r="3" fill="#EF4444" />
                  <circle cx="35" cy="55" r="2.5" fill="#EF4444" />
                  <circle cx="50" cy="60" r="2.5" fill="#EF4444" />
                  <circle cx="70" cy="35" r="2.5" fill="#EF4444" />
                  <circle cx="80" cy="25" r="4" fill="#10B981" />
                </svg>
              </div>
              <div className="text-center font-mono text-[11px] text-gray-400">
                Satellite link active: INSAT-3DR / Argos Transponder
              </div>
            </CardContent>
          </Card>

          {/* Scientific Instruments Deployed */}
          <Card className="bg-white">
            <CardHeader className="p-4 pb-2 border-b border-vistaar-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-vistaar-muted">
                Calibrated Instruments in Field
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              {current.keyInstruments.map((inst, i) => (
                <div key={i} className="p-2.5 bg-vistaar-bg rounded border border-vistaar-border font-mono text-vistaar-text flex items-center justify-between">
                  <span>{inst}</span>
                  <Badge variant="success">CALIBRATED</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
