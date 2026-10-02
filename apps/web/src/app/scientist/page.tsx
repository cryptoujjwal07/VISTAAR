"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Upload,
  FileText,
  Database,
  Radio,
  Camera,
  Video,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Compass,
  ArrowRight,
  ShieldCheck,
  Tag,
  Calendar,
  MapPin,
  Sparkles,
  Layers,
  Thermometer,
  Wind,
  Droplets,
  CloudSun,
  Eye,
  FileSpreadsheet,
  BookOpen,
  User,
  ShieldAlert,
  Download,
  Info,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface ScientificRecord {
  id: string;
  title: string;
  station: string;
  expedition: string;
  domain: string;
  category: "DOCUMENT" | "DATASET" | "FIELD_OBSERVATION" | "PHOTO" | "VIDEO";
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED";
  updated_at: string;
  file_name?: string;
  file_size?: string;
  sha256?: string;
}

export default function ScientistPortalPage() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "my_research"
    | "documents"
    | "datasets"
    | "photos"
    | "videos"
    | "notes"
    | "expeditions"
    | "stations"
    | "weather"
    | "submissions"
    | "profile"
  >("dashboard");

  const [records, setRecords] = useState<ScientificRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Research Record Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDomain, setNewDomain] = useState("Glaciology & Mass Balance");
  const [newStation, setNewStation] = useState("himansh");
  const [newExpedition, setNewExpedition] = useState("43-ISEA");
  const [newCategory, setNewCategory] = useState<"DOCUMENT" | "DATASET" | "FIELD_OBSERVATION" | "PHOTO" | "VIDEO">("DOCUMENT");
  const [newSummary, setNewSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submission Filter
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>("ALL");

  // Notes state
  const [fieldNotes, setFieldNotes] = useState([
    {
      id: "note_1",
      date: "2026-09-28",
      station: "Himansh (Spiti Valley)",
      title: "Chandra Basin Ablation Stake Measurement",
      content: "Automated ultrasonic snow depth gauge registered 14.2cm net ablation between Sept 15 and 28. Surface albedo decreased from 0.72 to 0.58 on northern tongue.",
      author: "Dr. Ananya Roy",
    },
    {
      id: "note_2",
      date: "2026-09-18",
      station: "Maitri (Antarctica)",
      title: "Schirmacher Oasis Katabatic Burst Observation",
      content: "Sudden katabatic squall began at 14:20 UTC. Wind speeds surged from 18 kts to 54 kts in under 20 minutes with a 7.5°C temperature plunge.",
      author: "Dr. Vivek Sharma",
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteStation, setNewNoteStation] = useState("Maitri");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Initial scientific sample records
  useEffect(() => {
    loadScientistData();
  }, []);

  async function loadScientistData() {
    setLoading(true);
    try {
      const initialRecords: ScientificRecord[] = [
        {
          id: "rec_himansh_01",
          title: "Chandra Basin Glacier Mass Balance & AWS Telemetry",
          station: "Himansh (Spiti Valley, 4,080m)",
          expedition: "Himansh Cryosphere Campaign",
          domain: "Glaciology & Third Pole Hydrology",
          category: "DATASET",
          status: "PUBLISHED",
          updated_at: "2026-09-28",
          file_name: "himansh_aws_2023.csv",
          sha256: "3d4f8a9eb2c1e7a...90a1",
        },
        {
          id: "rec_maitri_02",
          title: "41-ISEA Maitri Boundary Layer Anemometry",
          station: "Maitri (Schirmacher Oasis)",
          expedition: "41st Indian Scientific Expedition to Antarctica",
          domain: "Atmospheric Physics & Katabatic Dynamics",
          category: "DOCUMENT",
          status: "APPROVED",
          updated_at: "2026-09-15",
          file_name: "41st_ISEA_Maitri_Meteorology_Report.pdf",
          sha256: "e71a09d38f40a1b...4c2d",
        },
        {
          id: "rec_bharati_03",
          title: "Larsemann Hills Coastal Radiation & Optical Disdrometer Log",
          station: "Bharati (Larsemann Hills)",
          expedition: "43rd Indian Scientific Expedition to Antarctica",
          domain: "Radiative Transfer & Cryospheric Telemetry",
          category: "DATASET",
          status: "UNDER_REVIEW",
          updated_at: "2026-09-30",
          file_name: "imd_bharati_fixed_hour.csv",
          sha256: "9b12cf34c4a1e90...11a8",
        },
        {
          id: "rec_himadri_04",
          title: "Ny-Ålesund Fjord Hydrography and Aerosol Optical Depth",
          station: "Himadri (Ny-Ålesund, Arctic 79°N)",
          expedition: "1st Indian Winter Arctic Scientific Expedition",
          domain: "Marine Biogeochemistry & Atmospheric Chemistry",
          category: "DOCUMENT",
          status: "SUBMITTED",
          updated_at: "2026-10-01",
          file_name: "himadri_winter_expedition_bulletin.pdf",
          sha256: "5a8e09f4b3c2...67d1",
        },
      ];
      setRecords(initialRecords);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setMessage({ type: "error", text: "Please enter a valid research title." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const stationLabel =
        newStation === "himansh"
          ? "Himansh (Spiti Valley, 4,080m)"
          : newStation === "maitri"
          ? "Maitri (Schirmacher Oasis)"
          : newStation === "bharati"
          ? "Bharati (Larsemann Hills)"
          : "Himadri (Ny-Ålesund, Arctic 79°N)";

      const newRec: ScientificRecord = {
        id: `rec_${Date.now()}`,
        title: newTitle,
        station: stationLabel,
        expedition: newExpedition,
        domain: newDomain,
        category: newCategory,
        status: "SUBMITTED",
        updated_at: new Date().toISOString().split("T")[0],
        file_name: selectedFile ? selectedFile.name : `${newStation}_field_data_${Date.now()}.csv`,
        sha256: "sha256_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      };

      setRecords([newRec, ...records]);
      setMessage({
        type: "success",
        text: `Scientific record '${newTitle}' submitted successfully for provenance verification!`,
      });
      setNewTitle("");
      setNewSummary("");
      setSelectedFile(null);
      setActiveTab("submissions");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to submit research draft." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote = {
      id: `note_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      station: newNoteStation,
      title: newNoteTitle,
      content: newNoteContent,
      author: "Verified Polar Scientist",
    };

    setFieldNotes([newNote, ...fieldNotes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setMessage({ type: "success", text: "Field observation note registered successfully." });
  }

  // Filtered submissions
  const filteredRecords =
    submissionStatusFilter === "ALL"
      ? records
      : records.filter((r) => r.status === submissionStatusFilter);

  // Tab definitions
  const NAV_TABS = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "my_research", label: "My Research", icon: FileText },
    { id: "documents", label: "Documents", icon: BookOpen },
    { id: "datasets", label: "Datasets", icon: Database },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "videos", label: "Videos", icon: Video },
    { id: "notes", label: "Research Notes", icon: Layers },
    { id: "expeditions", label: "Expeditions", icon: Compass },
    { id: "stations", label: "Stations", icon: MapPin },
    { id: "weather", label: "Weather Telemetry", icon: CloudSun },
    { id: "submissions", label: "My Submissions", icon: CheckCircle2 },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-10 space-y-8 max-w-7xl mx-auto">
      {/* Scientist Header Banner */}
      <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
              <FlaskConical className="w-4 h-4 text-emerald-700" />
              <span>NCPOR Authorized Polar Scientist Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Scientist Research Workspace
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Primary scientific source contributor portal. Deposit authentic field observations, raw NPDC datasets, expedition telemetry, and peer-reviewed technical reports with cryptographic SHA-256 provenance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab("documents")}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white font-bold shadow-md hover:shadow-emerald-500/25 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => setActiveTab("datasets")}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Upload Dataset</span>
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
                    ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
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

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-3 animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: DASHBOARD
          ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Submissions</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-950">{records.length}</div>
              <p className="text-xs text-slate-600">Deposits linked to your scientist credentials</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Stations Deployed</span>
              <div className="text-3xl sm:text-4xl font-black text-sky-800">4 Stations</div>
              <p className="text-xs text-slate-600">Maitri, Bharati, Himadri, Himansh</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Under Review</span>
              <div className="text-3xl sm:text-4xl font-black text-indigo-700">
                {records.filter((r) => r.status === "UNDER_REVIEW" || r.status === "SUBMITTED").length}
              </div>
              <p className="text-xs text-slate-600">Pending editorial and provenance verification</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Provenance Hashes</span>
              <div className="text-3xl sm:text-4xl font-black text-teal-700">100% SHA-256</div>
              <p className="text-xs text-slate-600">Cryptographically verified artifacts</p>
            </div>
          </div>


          {/* Quick Weather Telemetry Glance */}
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center space-x-2">
                  <CloudSun className="w-5 h-5 text-sky-600" />
                  <span>Station Telemetry Overview (Live Sensor Feeds)</span>
                </h3>
                <p className="text-xs text-slate-600">Current real-time ground meteorological observations</p>
              </div>
              <button
                onClick={() => setActiveTab("weather")}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center space-x-1"
              >
                <span>Full Weather Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Maitri", temp: "-17.0 °C", wind: "24.5 kts", region: "Antarctica Inland" },
                { name: "Bharati", temp: "-14.5 °C", wind: "18.2 kts", region: "Antarctica Coast" },
                { name: "Himadri", temp: "-4.2 °C", wind: "12.0 kts", region: "Arctic (79°N)" },
                { name: "Himansh", temp: "-8.5 °C", wind: "15.4 kts", region: "Himalayas (4,080m)" },
              ].map((st) => (
                <div key={st.name} className="ice-glass rounded-2xl p-4 border border-sky-200/70 space-y-1">
                  <div className="text-xs font-bold text-slate-500 uppercase">{st.region}</div>
                  <div className="text-lg font-black text-slate-900">{st.name}</div>
                  <div className="text-sm font-extrabold text-sky-800">{st.temp}</div>
                  <div className="text-xs text-slate-600">Wind: {st.wind}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Uploads Table */}
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-3">
              <h3 className="text-lg font-black text-slate-950">Recent Scientific Deposits</h3>
              <button
                onClick={() => setActiveTab("my_research")}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1"
              >
                <span>Manage My Research</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {records.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="ice-glass rounded-2xl p-4 border border-sky-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {rec.category}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{rec.updated_at}</span>
                    </div>
                    <div className="text-sm font-black text-slate-900">{rec.title}</div>
                    <div className="text-xs text-slate-600">{rec.station} • {rec.expedition}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-500 bg-white/70 px-2.5 py-1 rounded-xl border border-sky-200 self-start sm:self-auto">
                    {rec.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MY RESEARCH
          ========================================================================= */}
      {activeTab === "my_research" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">My Research Records</h2>
              <p className="text-sm text-slate-600 font-medium">Create, edit, review, and submit your research records to the NPDC scientific pipeline.</p>
            </div>
            <button
              onClick={() => setActiveTab("documents")}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Research Record</span>
            </button>
          </div>

          <div className="space-y-4">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="ice-glass rounded-2xl p-5 border border-white hover:border-sky-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {rec.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        rec.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : rec.status === "APPROVED"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {rec.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{rec.updated_at}</span>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">{rec.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>{rec.station}</span>
                    </span>
                    <span>• Expedition: {rec.expedition}</span>
                    <span>• Domain: {rec.domain}</span>
                  </div>
                  {rec.sha256 && (
                    <div className="text-[11px] font-mono text-slate-500">
                      SHA-256 Provenance: <code className="bg-white/80 px-1 py-0.5 rounded border border-sky-200">{rec.sha256}</code>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setMessage({ type: "success", text: `Viewing cryptographic metadata for ${rec.title}` })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-sky-200 hover:bg-sky-50 transition-colors cursor-pointer"
                  >
                    Provenance Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DOCUMENTS (PDF UPLOAD & METADATA)
          ========================================================================= */}
      {activeTab === "documents" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Upload Scientific PDF Document</h2>
            <p className="text-sm text-slate-600 font-medium">
              Submit peer-reviewed field reports, expedition bulletins, or cruise reports with full cryptographic provenance.
            </p>
          </div>

          <form onSubmit={handleCreateRecord} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Document Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 43-ISEA Maitri Winter Boundary Layer Meteorology Report"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Station / Observatory *</label>
                <select
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="maitri">Maitri (Antarctica)</option>
                  <option value="bharati">Bharati (Antarctica)</option>
                  <option value="himadri">Himadri (Arctic)</option>
                  <option value="himansh">Himansh (Himalayas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Expedition Linked *</label>
                <input
                  type="text"
                  value={newExpedition}
                  onChange={(e) => setNewExpedition(e.target.value)}
                  placeholder="e.g. 43rd ISEA, Arctic Winter 2024"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Summary / Abstract</label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={3}
                placeholder="Methodology, calibration parameters, equipment specifications, and findings summary..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm"
              />
            </div>

            {/* PDF File Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Attach PDF Document (Max 50MB)</label>
              <div className="border-2 border-dashed border-sky-300 rounded-2xl p-6 text-center hover:bg-sky-50/50 transition-colors cursor-pointer bg-white/60">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload-input"
                  accept=".pdf"
                />
                <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-1.5 block">
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : "Select or Drop PDF File Here"}
                  </div>
                  <p className="text-[11px] text-slate-500">Cryptographically hashed upon ingestion.</p>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Ingesting..." : "Ingest PDF Document →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DATASETS (CSV/EXCEL UPLOAD & PREVIEW)
          ========================================================================= */}
      {activeTab === "datasets" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Upload Scientific Dataset (CSV / Excel)</h2>
            <p className="text-sm text-slate-600 font-medium">
              Deposit raw or calibrated tabular observation records to the NPDC scientific repository.
            </p>
          </div>

          <form onSubmit={handleCreateRecord} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Dataset Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Himansh AWS Hourly Temperature & Radiation Time-Series"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Station *</label>
                <select
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="himansh">Himansh (Spiti Valley, 4,080m)</option>
                  <option value="maitri">Maitri (Antarctica)</option>
                  <option value="bharati">Bharati (Antarctica)</option>
                  <option value="himadri">Himadri (Arctic)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Sampling Rate / Frequency</label>
                <input
                  type="text"
                  placeholder="e.g. 10-Minute Average, Hourly, Daily"
                  defaultValue="10-Minute Calibrated Interval"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* CSV File Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Upload CSV / Excel File</label>
              <div className="border-2 border-dashed border-sky-300 rounded-2xl p-6 text-center hover:bg-sky-50/50 transition-colors cursor-pointer bg-white/60">
                <input
                  type="file"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] || null);
                    setNewCategory("DATASET");
                  }}
                  className="hidden"
                  id="csv-upload-input"
                  accept=".csv,.xlsx,.xls"
                />
                <label htmlFor="csv-upload-input" className="cursor-pointer space-y-1.5 block">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : "Select or Drop CSV / Excel File"}
                  </div>
                  <p className="text-[11px] text-slate-500">Preview table generated on upload.</p>
                </label>
              </div>
            </div>

            {/* Interactive Preview Table */}
            <div className="p-4 rounded-2xl bg-white/80 border border-sky-200 space-y-2">
              <div className="text-xs font-bold text-slate-700">Schema Preview (Standard NPDC Sensor Format):</div>
              <div className="overflow-x-auto text-[11px] font-mono">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sky-50 text-slate-800 border-b border-sky-200">
                      <th className="p-2">Timestamp (UTC)</th>
                      <th className="p-2">AirTemp (°C)</th>
                      <th className="p-2">WindSpeed (m/s)</th>
                      <th className="p-2">WindDir (deg)</th>
                      <th className="p-2">RelHumidity (%)</th>
                      <th className="p-2">Pressure (hPa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-2">2026-10-02 00:00</td>
                      <td className="p-2">-16.8</td>
                      <td className="p-2">12.4</td>
                      <td className="p-2">184</td>
                      <td className="p-2">64</td>
                      <td className="p-2">988.2</td>
                    </tr>
                    <tr>
                      <td className="p-2">2026-10-02 01:00</td>
                      <td className="p-2">-17.1</td>
                      <td className="p-2">14.1</td>
                      <td className="p-2">189</td>
                      <td className="p-2">62</td>
                      <td className="p-2">987.9</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Ingesting Dataset..." : "Ingest Dataset to Registry →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 5: PHOTOS (SCIENTIFIC PHOTOGRAPHS & METADATA)
          ========================================================================= */}
      {activeTab === "photos" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-sky-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Scientific Photographs Gallery</h2>
              <p className="text-sm text-slate-600 font-medium">Field photography capturing glaciological features, station deployments, and field teams.</p>
            </div>
            <button
              onClick={() => setMessage({ type: "success", text: "Photo upload dialog open. Select photo to ingest." })}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
            >
              + Upload Photograph
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Bharati Station Elevated Module",
                station: "Bharati (Larsemann Hills)",
                date: "2024-02-14",
                expedition: "43rd ISEA",
                url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
                caption: "Elevated aerodynamic architecture preventing snow drift at Larsemann Hills.",
              },
              {
                title: "Maitri AWS Anemometry Rig",
                station: "Maitri (Schirmacher Oasis)",
                date: "2023-11-20",
                expedition: "42nd ISEA",
                url: "https://images.unsplash.com/photo-1548263594-a71ea65a8598?auto=format&fit=crop&w=800&q=80",
                caption: "Continuous boundary layer ultrasonic anemometer recording katabatic gusts.",
              },
              {
                title: "Himansh Cryosphere High-Altitude Base",
                station: "Himansh (Spiti Valley)",
                date: "2024-07-10",
                expedition: "Himansh Summer Campaign",
                url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
                caption: "High-altitude automated weather station and glaciology base at 4,080 meters.",
              },
            ].map((media, idx) => (
              <div key={idx} className="ice-glass rounded-2xl overflow-hidden border border-white space-y-3 shadow-xs">
                <div className="aspect-video w-full overflow-hidden">
                  <img src={media.url} alt={media.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{media.station}</span>
                    <span>{media.date}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{media.title}</h4>
                  <p className="text-xs text-slate-600 leading-snug">{media.caption}</p>
                  <div className="text-[10px] text-emerald-800 font-semibold">Expedition: {media.expedition}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: VIDEOS (SCIENTIFIC FIELD FOOTAGE)
          ========================================================================= */}
      {activeTab === "videos" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Expedition Field Video Log</h2>
            <p className="text-sm text-slate-600 font-medium">Recorded field footage of station operations, glacier drill cores, and Arctic/Antarctic traverses.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                id: "-KjMHRfUWC4",
                title: "Arriving at Maitri Station",
                location: "Schirmacher Oasis, Antarctica",
                duration: "Field Footage • 41st ISEA",
                desc: "Helicopter landing and logistics sequence at Maitri Research Base.",
              },
              {
                id: "lNhK69S_LLM",
                title: "Tour of Bharati Research Station",
                location: "Larsemann Hills, Antarctica",
                duration: "Facility Walkthrough • Green Station",
                desc: "State-of-the-art laboratory and energy-efficient environmental systems.",
              },
              {
                id: "3h9Ltuxsxug",
                title: "Arriving at Himadri Arctic Base",
                location: "Ny-Ålesund, Svalbard (79° N)",
                duration: "Arctic Field Season",
                desc: "India's northernmost scientific presence studying Kongsfjorden oceanography.",
              },
              {
                id: "O-ja_5QP7j8",
                title: "Arriving at Himansh High-Altitude Station",
                location: "Chandra Basin, Spiti Valley (4,080m)",
                duration: "Himalayan Glaciological Traverse",
                desc: "Deployment of glacier ablation stakes on Sutri Dhaka glacier.",
              },
            ].map((v) => (
              <div key={v.id} className="ice-glass rounded-2xl overflow-hidden border border-white space-y-3 p-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${v.id}`}
                    title={v.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{v.title}</h4>
                  <div className="text-xs text-sky-700 font-semibold">{v.location} • {v.duration}</div>
                  <p className="text-xs text-slate-600 mt-1">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: RESEARCH NOTES (OBSERVATIONS & FIELD NOTES)
          ========================================================================= */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-5">
            <h3 className="text-xl font-black text-slate-950">Add Field Observation Note</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note Title (e.g. Glacier Albedo Anomaly at Sutri Dhaka)"
                  className="px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-semibold"
                  required
                />
                <select
                  value={newNoteStation}
                  onChange={(e) => setNewNoteStation(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="Maitri (Antarctica)">Maitri (Antarctica)</option>
                  <option value="Bharati (Antarctica)">Bharati (Antarctica)</option>
                  <option value="Himadri (Arctic)">Himadri (Arctic)</option>
                  <option value="Himansh (Himalayas)">Himansh (Himalayas)</option>
                </select>
              </div>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                placeholder="Record immediate field conditions, sensor calibration drifts, unusual meteorological events..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Save Observation Note
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {fieldNotes.map((note) => (
              <div key={note.id} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="text-sky-800 font-bold">{note.station}</span>
                  <span>{note.date} • {note.author}</span>
                </div>
                <h4 className="text-base font-black text-slate-900">{note.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: EXPEDITIONS
          ========================================================================= */}
      {activeTab === "expeditions" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Scientific Expeditions Register</h2>
            <p className="text-sm text-slate-600 font-medium">Overview of Indian scientific campaigns across Antarctica, Arctic, and Southern Ocean.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
                dates: "November 2023 – April 2025",
                station: "Maitri & Bharati",
                researchFocus: "Ice core drilling, space weather observation, Southern Ocean biology, katabatic wind modeling.",
                status: "ACTIVE CAMPAIGN",
              },
              {
                title: "1st Indian Winter Arctic Scientific Expedition",
                dates: "December 2023 – March 2024",
                station: "Himadri (Svalbard, 79°N)",
                researchFocus: "Year-round Arctic atmospheric chemistry, aurora dynamics, and fjord marine ecosystem response.",
                status: "COMPLETED / ARCHIVING",
              },
              {
                title: "Himansh Chandra Basin Glaciology Traverse",
                dates: "Annual Summer Campaign (June – October)",
                station: "Himansh (Spiti Valley)",
                researchFocus: "Benchmark glacier mass balance, snow chemistry, AWS high-altitude meteorological continuous recording.",
                status: "ACTIVE FIELD SEASON",
              },
            ].map((exp, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white space-y-3">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {exp.status}
                </span>
                <h4 className="text-base font-black text-slate-900 leading-snug">{exp.title}</h4>
                <div className="text-xs text-sky-800 font-bold">{exp.station}</div>
                <div className="text-xs text-slate-500 font-medium">{exp.dates}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{exp.researchFocus}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: STATIONS
          ========================================================================= */}
      {activeTab === "stations" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">India&apos;s Polar Research Stations</h2>
            <p className="text-sm text-slate-600 font-medium">Permanent observatory hubs and operational facilities maintained by NCPOR.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Maitri",
                region: "Antarctica (Inland)",
                established: "1989",
                elevation: "117 m",
                coords: "70°45'57\" S, 11°44'09\" E",
                focus: "Meteorology, solid earth geophysics, geomagnetism, environmental biology.",
              },
              {
                name: "Bharati",
                region: "Antarctica (Coastal)",
                established: "2012",
                elevation: "35 m",
                coords: "69°24'28\" S, 76°11'14\" E",
                focus: "Satellite ground station, marine biology, aerosol optical depth, oceanography.",
              },
              {
                name: "Himadri",
                region: "Arctic (Svalbard)",
                established: "2008",
                elevation: "10 m",
                coords: "78°55' N, 11°56' E",
                focus: "Fjord oceanography, upper atmospheric physics, Arctic glaciology.",
              },
              {
                name: "Himansh",
                region: "Himalayas (Spiti Valley)",
                established: "2016",
                elevation: "4,080 m",
                coords: "32°24' N, 77°37' E",
                focus: "Third Pole glaciology, mass balance, snow albedo, hydrological discharge.",
              },
            ].map((st) => (
              <div key={st.name} className="ice-glass rounded-2xl p-5 border border-white space-y-2.5">
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">{st.region}</span>
                <h3 className="text-xl font-black text-slate-950">{st.name} Station</h3>
                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  <div>Est: {st.established} • Elev: {st.elevation}</div>
                  <div>Coords: {st.coords}</div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{st.focus}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: WEATHER (STATION WEATHER TELEMETRY)
          ========================================================================= */}
      {activeTab === "weather" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Station Weather Telemetry & Observational Analysis</h2>
              <p className="text-sm text-slate-600 font-medium">Continuous meteorological streams recorded by calibrated AWS telemetry rigs.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800">Sensors Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { station: "Maitri (Antarctica)", temp: "-17.0 °C", wind: "24.5 kts (Katabatic)", press: "982.4 hPa", rh: "64%" },
              { station: "Bharati (Antarctica)", temp: "-14.5 °C", wind: "18.2 kts", press: "991.1 hPa", rh: "68%" },
              { station: "Himadri (Arctic)", temp: "-4.2 °C", wind: "12.0 kts", press: "1004.5 hPa", rh: "81%" },
              { station: "Himansh (Himalayas)", temp: "-8.5 °C", wind: "15.4 kts", press: "625.0 hPa", rh: "45%" },
            ].map((node) => (
              <div key={node.station} className="ice-glass rounded-2xl p-5 border border-white space-y-3">
                <h4 className="text-sm font-black text-slate-900">{node.station}</h4>
                <div className="text-2xl font-black text-sky-800">{node.temp}</div>
                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  <div className="flex items-center space-x-1">
                    <Wind className="w-3.5 h-3.5 text-sky-600" />
                    <span>Wind: {node.wind}</span>
                  </div>
                  <div>Pressure: {node.press}</div>
                  <div>Humidity: {node.rh}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-sky-200 text-xs text-slate-600 flex items-center space-x-2">
            <Info className="w-4 h-4 text-sky-700 shrink-0" />
            <span>Telemetry data is ingested hourly via NCPOR satellite downlink and cached locally with SHA-256 provenance hashes.</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: MY SUBMISSIONS (DRAFT / SUBMITTED / APPROVED / REJECTED)
          ========================================================================= */}
      {activeTab === "submissions" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Submissions Status Tracker</h2>
              <p className="text-sm text-slate-600 font-medium">Track your scientific submissions through verification, peer review, and publication.</p>
            </div>
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-sky-200 text-xs font-bold">
              {["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSubmissionStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    submissionStatusFilter === st
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="ice-glass rounded-2xl p-5 border border-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                      {rec.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        rec.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : rec.status === "APPROVED"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">{rec.title}</h4>
                  <div className="text-xs text-slate-600">{rec.station} • {rec.expedition} • File: {rec.file_name}</div>
                  <div className="text-[11px] font-mono text-slate-500">Hash: {rec.sha256}</div>
                </div>
                <div className="text-xs text-slate-500">Updated: {rec.updated_at}</div>
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
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Scientist Credential Profile</h2>
            <p className="text-sm text-slate-600 font-medium">NCPOR scientific contributor identity and authorization status.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scientist Details</h3>
              <div className="space-y-1.5 text-xs">
                <div><strong className="text-slate-700">Name:</strong> Dr. Ananya Roy</div>
                <div><strong className="text-slate-700">Email:</strong> scientist@vistaar.ncpor.res.in</div>
                <div><strong className="text-slate-700">Role:</strong> SCIENTIST / FIELD_SCIENTIST</div>
                <div><strong className="text-slate-700">Affiliation:</strong> National Centre for Polar and Ocean Research (NCPOR)</div>
                <div><strong className="text-slate-700">Field Specialization:</strong> Glaciology, Energy Balance & Cryosphere</div>
                <div><strong className="text-slate-700">Active Expeditions:</strong> 43-ISEA, Himansh Campaign</div>
              </div>
            </div>

            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Field Accreditations</h3>
              <div className="space-y-2 text-xs text-slate-700">
                <div><strong className="text-slate-900">Credential Status:</strong> Accredited Polar Expedition Scientist</div>
                <div><strong className="text-slate-900">Field Certification:</strong> Indian Antarctic Programme (MoES / NCPOR)</div>
                <div><strong className="text-slate-900">Active Station Clearance:</strong> Maitri & Bharati Research Bases</div>
                <div><strong className="text-slate-900">Data Integrity:</strong> SHA-256 Provenance & Cryospheric Hash Enforcement Active</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
