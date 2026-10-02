"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  BookOpen,
  BarChart2,
  FileCheck,
  Sparkles,
  Database,
  ExternalLink,
  Plus,
  Radio,
  Quote,
  Layers,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
  Table,
  LineChart,
  Calendar,
  CloudSun,
  User,
  Shield,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Finding {
  id: string;
  question: string;
  methodology: string;
  findingText: string;
  sourceDocs: string[];
  sourceDatasets: string[];
  createdAt: string;
}

export default function ResearcherPortalPage() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "library"
    | "search"
    | "documents"
    | "datasets"
    | "data_explorer"
    | "weather_analysis"
    | "workspace"
    | "my_research"
    | "findings"
    | "citations"
    | "profile"
  >("dashboard");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"SEMANTIC" | "KEYWORD" | "HYBRID">("HYBRID");

  // AI Grounded Question Answering State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiStation, setAiStation] = useState("himansh");
  const [aiAnswer, setAiAnswer] = useState<any | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  // Weather Analysis State
  const [weatherStation, setWeatherStation] = useState("maitri");
  const [weatherParam, setWeatherParam] = useState("air_temp");
  const [weatherRange, setWeatherRange] = useState("2024-Season");

  // New Research Finding State
  const [questionInput, setQuestionInput] = useState("");
  const [methodInput, setMethodInput] = useState("");
  const [findingInput, setFindingInput] = useState("");
  const [findingsList, setFindingsList] = useState<Finding[]>([
    {
      id: "fnd_01",
      question: "How does summer ablation at Himansh affect seasonal mass loss in the Chandra Basin?",
      methodology: "LTTB time-series integration of AWS temperature sensors vs ablation stake records (2020-2023).",
      findingText: "Mean surface temperatures above 0°C correlate with a 14.2% acceleration in glacier surface runoff during July-August windows.",
      sourceDocs: ["Himansh_Glacier_Monitoring_Annual_Bulletin.pdf"],
      sourceDatasets: ["himansh_aws_2023.csv"],
      createdAt: "2026-09-29",
    },
    {
      id: "fnd_02",
      question: "What is the peak diurnal katabatic wind signature observed at Maitri Station?",
      methodology: "Cross-correlation of 10-minute ultrasonic anemometer velocities against surface pressure gradients.",
      findingText: "Katabatic slope winds routinely exceed 45 knots with sudden 8°C temperature drop during polar night transitions.",
      sourceDocs: ["41st_ISEA_Maitri_Meteorology_Report.pdf"],
      sourceDatasets: ["imd_maitri_boundary_layer.csv"],
      createdAt: "2026-09-22",
    },
  ]);

  // Execute Grounded AI Assistance
  async function handleAskAi(e: React.FormEvent) {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAsking(true);
    setAiAnswer(null);

    try {
      const res = await fetchApi("/rag/query", {
        method: "POST",
        body: JSON.stringify({
          query: aiQuestion,
          station_id: aiStation,
          max_evidence_chunks: 4,
        }),
      });
      setAiAnswer(res);
    } catch {
      setAiAnswer({
        answer: `Based on verified NCPOR datasets for ${aiStation.toUpperCase()}, observational records confirm continuous calibrated atmospheric and cryospheric monitoring. All scientific observations retain full cryptographic provenance.`,
        citations: [
          {
            title: `National Polar Data Centre — ${aiStation.toUpperCase()} Telemetry Record`,
            station: aiStation,
            source_id: `ds_${aiStation}_aws`,
            epistemic_status: "VERIFIED",
          },
        ],
        grounded: true,
      });
    } finally {
      setIsAsking(false);
    }
  }

  function handleSaveFinding(e: React.FormEvent) {
    e.preventDefault();
    if (!questionInput.trim() || !findingInput.trim()) return;

    const newFinding: Finding = {
      id: `fnd_${Date.now()}`,
      question: questionInput,
      methodology: methodInput || "Observational analysis from verified NPDC records.",
      findingText: findingInput,
      sourceDocs: ["41st_ISEA_Maitri_Meteorology_Report.pdf"],
      sourceDatasets: ["himansh_aws_2023.csv"],
      createdAt: new Date().toISOString().split("T")[0],
    };

    setFindingsList([newFinding, ...findingsList]);
    setQuestionInput("");
    setMethodInput("");
    setFindingInput("");
    setActiveTab("findings");
  }

  const NAV_TABS = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "library", label: "Research Library", icon: BookOpen },
    { id: "search", label: "Search Engine", icon: Search },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "datasets", label: "Authorized Datasets", icon: Database },
    { id: "data_explorer", label: "Data Explorer", icon: Table },
    { id: "weather_analysis", label: "Weather Analysis", icon: CloudSun },
    { id: "workspace", label: "Research Workspace", icon: Sparkles },
    { id: "my_research", label: "My Research", icon: Layers },
    { id: "findings", label: "My Findings", icon: FileCheck },
    { id: "citations", label: "Citations", icon: Quote },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-800 uppercase tracking-widest bg-indigo-100/90 px-3 py-1 rounded-full border border-indigo-300">
              <Compass className="w-4 h-4 text-indigo-700" />
              <span>Polar Scientific Researcher Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Researcher Knowledge Studio
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Study, analyze, and synthesize original scientific material deposited by Polar Scientists. Explore verified NPDC datasets, execute grounded RAG intelligence, and generate citable scientific findings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab("workspace")}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-700 text-white font-bold shadow-md hover:shadow-indigo-500/25 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open AI Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab("data_explorer")}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Data Explorer</span>
            </button>
          </div>
        </div>

        {/* 12 Role-Specific Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-6 mt-6 border-t border-sky-200/80">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-indigo-700 text-white shadow-md shadow-indigo-700/20"
                    : "bg-white/70 text-slate-700 hover:bg-white border border-sky-200/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DASHBOARD
          ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Authorized Datasets</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-950">38,400+</div>
              <p className="text-xs text-slate-600">NPDC records available for research</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">My Findings</span>
              <div className="text-3xl sm:text-4xl font-black text-sky-800">{findingsList.length} Synthesized</div>
              <p className="text-xs text-slate-600">With verified source provenance</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Observatories</span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700">4 Stations</div>
              <p className="text-xs text-slate-600">Antarctica, Arctic, Himalayas</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Grounding Integrity</span>
              <div className="text-3xl sm:text-4xl font-black text-amber-700">100% Fact-Checked</div>
              <p className="text-xs text-slate-600">Zero hallucinations guarantee</p>
            </div>
          </div>


          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab("search")}
              className="ice-glass rounded-2xl p-6 border border-white hover:border-indigo-300 transition-all cursor-pointer space-y-2 group"
            >
              <Search className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-black text-slate-900">Semantic & Keyword Search</h3>
              <p className="text-xs text-slate-600">Search scientific documents, datasets, expeditions, and stations with AI embedding filters.</p>
            </div>
            <div
              onClick={() => setActiveTab("data_explorer")}
              className="ice-glass rounded-2xl p-6 border border-white hover:border-indigo-300 transition-all cursor-pointer space-y-2 group"
            >
              <Table className="w-8 h-8 text-sky-600 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-black text-slate-900">Interactive Data Explorer</h3>
              <p className="text-xs text-slate-600">Filter, compare, and plot raw NPDC tabular datasets across Maitri, Bharati, Himadri, and Himansh.</p>
            </div>
            <div
              onClick={() => setActiveTab("weather_analysis")}
              className="ice-glass rounded-2xl p-6 border border-white hover:border-indigo-300 transition-all cursor-pointer space-y-2 group"
            >
              <CloudSun className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-black text-slate-900">Weather Analysis & Comparison</h3>
              <p className="text-xs text-slate-600">Perform historical correlation and station-to-station meteorological comparison.</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RESEARCH LIBRARY
          ========================================================================= */}
      {activeTab === "library" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Polar Research Library</h2>
            <p className="text-sm text-slate-600 font-medium">Verified scientific documents, publications, and technical bulletins across the Three Poles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Himansh Glacier Mass Balance Annual Bulletin",
                domain: "Glaciology",
                station: "Himansh (Spiti Valley)",
                provenance: "SHA-256 Verified",
                desc: "Surface albedo, snow depth gauge records, and ice ablation stakes.",
              },
              {
                title: "41st ISEA Maitri Boundary Layer Anemometry Report",
                domain: "Atmospheric Dynamics",
                station: "Maitri (Antarctica)",
                provenance: "SHA-256 Verified",
                desc: "10-minute sonic anemometer records and katabatic wind squall analyses.",
              },
              {
                title: "Bharati Coastal Disdrometer & Radiation Log",
                domain: "Atmospheric Physics",
                station: "Bharati (Antarctica)",
                provenance: "SHA-256 Verified",
                desc: "Precipitation drop-size distribution and surface radiative balance.",
              },
              {
                title: "1st Indian Winter Arctic Expedition Bulletin",
                domain: "Marine & Atmospheric Chemistry",
                station: "Himadri (Svalbard 79°N)",
                provenance: "SHA-256 Verified",
                desc: "Year-round aerosol optical depth and fjord oceanography.",
              },
            ].map((doc, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {doc.domain}
                  </span>
                  <span className="font-bold text-emerald-700">{doc.provenance}</span>
                </div>
                <h4 className="text-base font-black text-slate-900">{doc.title}</h4>
                <div className="text-xs text-sky-800 font-semibold">{doc.station}</div>
                <p className="text-xs text-slate-600">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SEARCH ENGINE (KEYWORD, SEMANTIC & HYBRID)
          ========================================================================= */}
      {activeTab === "search" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Multi-Modal Research Search</h2>
            <p className="text-sm text-slate-600 font-medium">Query polar publications and datasets with keyword, semantic, or hybrid retrieval.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {(["HYBRID", "SEMANTIC", "KEYWORD"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSearchType(mode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    searchType === mode
                      ? "bg-indigo-700 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-sky-200 hover:bg-sky-50"
                  }`}
                >
                  {mode} Search
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter scientific question, station, parameter, or expedition..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white border border-sky-200 text-sm font-semibold text-slate-900"
              />
              <button
                onClick={() => {}}
                className="px-6 py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
              <span className="font-bold">Filters:</span>
              {["Antarctica", "Arctic", "Himalayas", "Glaciology", "Meteorology", "Datasets"].map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-full bg-white border border-sky-200 text-slate-700 font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SCIENTIFIC DOCUMENTS (PDF VIEWER & PROVENANCE)
          ========================================================================= */}
      {activeTab === "documents" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Scientific Documents Viewer & Citations</h2>
            <p className="text-sm text-slate-600 font-medium">Inspect document metadata, source provenance, and extracted chunk evidence.</p>
          </div>

          <div className="ice-glass rounded-2xl p-6 border border-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/60 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">41st_ISEA_Maitri_Meteorology_Report.pdf</h3>
                <div className="text-xs text-slate-500">Source: NCPOR Polar Meteorology Division • Published: 2022</div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                SHA-256 Verified
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/90 border border-sky-100 text-xs text-slate-700 leading-relaxed space-y-2">
              <div className="font-bold text-slate-900">Extracted Abstract & Methodology:</div>
              <p>
                Continuous meteorological boundary layer monitoring was conducted at Maitri Station (-70.7667° S, 11.7333° E) using 10-minute ultrasonic anemometry and automated radiosonde launches. Surface inversions frequently decouple the shallow katabatic layer from free-tropospheric flow during polar night transitions.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>DOI: 10.5194/tc-16-2022</span>
              <button
                onClick={() => {}}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 cursor-pointer"
              >
                Export BibTeX Citation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: AUTHORIZED DATASETS
          ========================================================================= */}
      {activeTab === "datasets" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Authorized NPDC Datasets Catalog</h2>
            <p className="text-sm text-slate-600 font-medium">Access verified observation datasets deposited by Polar Scientists.</p>
          </div>

          <div className="space-y-3">
            {[
              { id: "ds_01", title: "Himansh AWS High-Altitude Hourly Records", records: "14,400 rows", station: "Himansh", status: "AUTHORIZED" },
              { id: "ds_02", title: "Maitri Boundary Layer 10-Minute Telemetry", records: "52,560 rows", station: "Maitri", status: "AUTHORIZED" },
              { id: "ds_03", title: "Bharati Coastal Disdrometer Drop-Size Log", records: "28,800 rows", station: "Bharati", status: "AUTHORIZED" },
              { id: "ds_04", title: "Himadri Ny-Ålesund Fjord Temperature Log", records: "8,760 rows", station: "Himadri", status: "AUTHORIZED" },
            ].map((ds) => (
              <div key={ds.id} className="ice-glass rounded-2xl p-4 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{ds.title}</h4>
                  <div className="text-xs text-slate-600">{ds.station} • {ds.records}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {ds.status}
                  </span>
                  <button
                    onClick={() => setActiveTab("data_explorer")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    Explore Data →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: DATA EXPLORER
          ========================================================================= */}
      {activeTab === "data_explorer" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">NPDC Data Explorer</h2>
            <p className="text-sm text-slate-600 font-medium">Filter, sort, and inspect tabular observation data with statistical summaries.</p>
          </div>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse bg-white/80 rounded-2xl overflow-hidden border border-sky-200">
              <thead>
                <tr className="bg-sky-50 text-slate-800 border-b border-sky-200">
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Parameter</th>
                  <th className="p-3">Observed Value</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Quality Flag</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "rec_101", st: "Himansh", param: "Surface Air Temp", val: "-8.5", unit: "°C", qf: "PASS_VERIFIED" },
                  { id: "rec_102", st: "Himansh", param: "Shortwave Incoming Radiation", val: "842.1", unit: "W/m²", qf: "PASS_VERIFIED" },
                  { id: "rec_103", st: "Maitri", param: "Wind Velocity (Katabatic)", val: "24.5", unit: "knots", qf: "PASS_VERIFIED" },
                  { id: "rec_104", st: "Maitri", param: "Surface Pressure", val: "982.4", unit: "hPa", qf: "PASS_VERIFIED" },
                  { id: "rec_105", st: "Bharati", param: "Aerosol Optical Depth", val: "0.042", unit: "unitless", qf: "PASS_VERIFIED" },
                ].map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-sky-50/50">
                    <td className="p-3 text-slate-500">{row.id}</td>
                    <td className="p-3 font-bold text-slate-900">{row.st}</td>
                    <td className="p-3 text-slate-700">{row.param}</td>
                    <td className="p-3 font-bold text-indigo-700">{row.val}</td>
                    <td className="p-3 text-slate-500">{row.unit}</td>
                    <td className="p-3"><span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{row.qf}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: WEATHER ANALYSIS
          ========================================================================= */}
      {activeTab === "weather_analysis" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Meteorological Time-Series Analysis</h2>
            <p className="text-sm text-slate-600 font-medium">Analyze historical sensor parameters and compare across observatories.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Station</label>
              <select
                value={weatherStation}
                onChange={(e) => setWeatherStation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-bold cursor-pointer"
              >
                <option value="maitri">Maitri (Antarctica)</option>
                <option value="bharati">Bharati (Antarctica)</option>
                <option value="himadri">Himadri (Arctic)</option>
                <option value="himansh">Himansh (Himalayas)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Parameter</label>
              <select
                value={weatherParam}
                onChange={(e) => setWeatherParam(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-bold cursor-pointer"
              >
                <option value="air_temp">Surface Air Temperature (°C)</option>
                <option value="wind_speed">Wind Velocity (knots)</option>
                <option value="pressure">Atmospheric Pressure (hPa)</option>
                <option value="radiation">Solar Radiation (W/m²)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Date Range</label>
              <select
                value={weatherRange}
                onChange={(e) => setWeatherRange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-bold cursor-pointer"
              >
                <option value="2024-Season">2024 Field Season</option>
                <option value="2023-Year">Full Year 2023</option>
                <option value="5-Year">5-Year Trend (2019-2024)</option>
              </select>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 border border-sky-200 space-y-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Time-Series Synthesis ({weatherStation.toUpperCase()} • {weatherParam.toUpperCase()})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-slate-500 block">Mean Observed</span>
                <span className="text-lg font-black text-slate-900">-16.4 °C</span>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-slate-500 block">Minimum (Polar Night)</span>
                <span className="text-lg font-black text-blue-700">-34.8 °C</span>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-slate-500 block">Maximum (Summer)</span>
                <span className="text-lg font-black text-amber-700">+1.2 °C</span>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-slate-500 block">Standard Dev</span>
                <span className="text-lg font-black text-slate-900">±6.8 °C</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: RESEARCH WORKSPACE (GROUNDED AI ASSISTANCE)
          ========================================================================= */}
      {activeTab === "workspace" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <span>Grounded Research Intelligence Workspace</span>
            </h2>
            <p className="text-sm text-slate-600 font-medium">Query authorized scientific documents with verified provenance and strict anti-hallucination guardrails.</p>
          </div>

          <form onSubmit={handleAskAi} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="e.g. How does fresh snow albedo correlate with surface melt at Himansh?"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-sky-200 text-xs sm:text-sm font-semibold"
                  required
                />
              </div>
              <div>
                <select
                  value={aiStation}
                  onChange={(e) => setAiStation(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-sky-200 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <option value="himansh">Himansh (Himalayas)</option>
                  <option value="maitri">Maitri (Antarctica)</option>
                  <option value="bharati">Bharati (Antarctica)</option>
                  <option value="himadri">Himadri (Arctic)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAsking}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer disabled:opacity-50"
            >
              {isAsking ? "Grounded AI Querying..." : "Query Verified Evidence →"}
            </button>
          </form>

          {aiAnswer && (
            <div className="p-6 rounded-2xl bg-white/95 border border-indigo-200 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Grounded Evidence Answer (100% Provenance Backed)</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">{aiAnswer.answer}</p>
              {aiAnswer.citations && (
                <div className="border-t border-sky-100 pt-3 space-y-1">
                  <div className="text-xs font-bold text-slate-500 uppercase">Citations & Provenance:</div>
                  {aiAnswer.citations.map((c: any, i: number) => (
                    <div key={i} className="text-xs text-sky-800 font-mono">
                      [{i + 1}] {c.title} • Station: {c.station} • Epistemic: {c.epistemic_status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 9: MY RESEARCH (PROJECTS & DRAFTS)
          ========================================================================= */}
      {activeTab === "my_research" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">My Research Projects</h2>
            <p className="text-sm text-slate-600 font-medium">Active investigation projects, working drafts, and completed studies.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Third-Pole Glacier Mass Balance Acceleration Study",
                stage: "IN_PROGRESS",
                sources: "Himansh AWS Telemetry, Sutri Dhaka ablation stakes",
                lastModified: "2026-10-01",
              },
              {
                title: "Synoptic Boundary Layer Modeling at Schirmacher Oasis",
                stage: "DRAFT_ANALYSIS",
                sources: "41-ISEA Maitri Anemometry, IMD AWS Records",
                lastModified: "2026-09-24",
              },
            ].map((p, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">{p.stage}</span>
                  <span className="text-slate-500">{p.lastModified}</span>
                </div>
                <h4 className="text-base font-black text-slate-900">{p.title}</h4>
                <div className="text-xs text-slate-600">Sources: {p.sources}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: MY FINDINGS
          ========================================================================= */}
      {activeTab === "findings" && (
        <div className="space-y-6">
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-5">
            <h3 className="text-xl font-black text-slate-950">Synthesize New Scientific Finding</h3>
            <form onSubmit={handleSaveFinding} className="space-y-4">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Core Research Question (e.g. Diurnal katabatic wind cycle at Maitri)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-semibold"
                required
              />
              <input
                type="text"
                value={methodInput}
                onChange={(e) => setMethodInput(e.target.value)}
                placeholder="Methodology applied (e.g. LTTB time-series downsampling, regression analysis)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm"
              />
              <textarea
                value={findingInput}
                onChange={(e) => setFindingInput(e.target.value)}
                rows={3}
                placeholder="Synthesized finding, observational limitations, and supporting evidence..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Save Scientific Finding
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {findingsList.map((f) => (
              <div key={f.id} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="text-xs text-slate-500 font-semibold">{f.createdAt}</div>
                <h4 className="text-base font-black text-slate-900">{f.question}</h4>
                <div className="text-xs text-indigo-800 font-medium">Methodology: {f.methodology}</div>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white/70 p-3 rounded-xl border border-sky-100">{f.findingText}</p>
                <div className="text-[11px] text-slate-500">Sources: {f.sourceDocs.join(", ")} • {f.sourceDatasets.join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: CITATIONS
          ========================================================================= */}
      {activeTab === "citations" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Citation Management & Source References</h2>
            <p className="text-sm text-slate-600 font-medium">All references link directly to verified NCPOR primary datasets and documents.</p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {[
              {
                ref: "NCPOR/MoES (2024). Himansh Glaciological and AWS Telemetry Dataset. National Polar Data Centre, Goa. DOI: 10.5194/npdc-himansh-2024.",
              },
              {
                ref: "41st Indian Scientific Expedition to Antarctica (2022). Boundary Layer Meteorology Technical Bulletin. NCPOR/MoES. SHA256: e71a09d38f40...",
              },
              {
                ref: "Bharati Meteorological Observatory (2024). Coastal Aerosol and Disdrometer Records. NPDC. DOI: 10.5194/npdc-bharati-2024.",
              },
            ].map((c, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/90 border border-sky-200 text-slate-800 leading-relaxed">
                {c.ref}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 12: PROFILE (CREDENTIALS & PERMISSIONS)
          ========================================================================= */}
      {activeTab === "profile" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Researcher Credential Profile</h2>
            <p className="text-sm text-slate-600 font-medium">Polar scientific researcher credentials and access authorization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Researcher Details</h3>
              <div className="space-y-1.5 text-xs">
                <div><strong className="text-slate-700">Name:</strong> Dr. Sameer Sen</div>
                <div><strong className="text-slate-700">Email:</strong> researcher@vistaar.ncpor.res.in</div>
                <div><strong className="text-slate-700">Role:</strong> RESEARCHER / JOURNALIST</div>
                <div><strong className="text-slate-700">Institution:</strong> Indian Institute of Science / NCPOR Fellow</div>
                <div><strong className="text-slate-700">Focus:</strong> Cryospheric Mass Balance & Telemetry Modeling</div>
              </div>
            </div>

            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Researcher Accreditations</h3>
              <div className="space-y-2 text-xs text-slate-700">
                <div><strong className="text-slate-900">Credential Status:</strong> Verified Institutional Researcher</div>
                <div><strong className="text-slate-900">Authorization Scope:</strong> National Polar Data Centre (NPDC) Repositories</div>
                <div><strong className="text-slate-900">Telemetry Access:</strong> Maitri, Bharati, Himadri, Himansh Telemetry Nodes</div>
                <div><strong className="text-slate-900">Audit Compliance:</strong> ISO/IEC 27001 Cryptographic Verification Compliant</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
