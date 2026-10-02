"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Languages,
  Plus,
  Edit3,
  Copy,
  Calendar,
  Layers,
  HelpCircle,
  Activity,
  FileSpreadsheet,
  Compass,
  FileText,
  User,
  Shield,
  Download,
  CheckSquare,
} from "lucide-react";

interface TeacherLesson {
  id: string;
  title: string;
  grade: number;
  subject: string;
  topic: string;
  station: string;
  content: string;
  quizQuestions: { question: string; options: string[]; answerIndex: number }[];
  status: "DRAFT" | "PUBLISHED_TO_CLASS";
}

export default function TeacherPortalPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "library"
    | "generator"
    | "lessons"
    | "quizzes"
    | "activities"
    | "classes"
    | "assignments"
    | "progress"
    | "resources"
    | "profile"
  >("dashboard");

  // AI Content Generator Form State
  const [selectedGrade, setSelectedGrade] = useState("9");
  const [selectedSubject, setSelectedSubject] = useState("Science & Environmental Physics");
  const [selectedTopic, setSelectedTopic] = useState("Glacier Mass Balance & Cryospheric Albedo");
  const [selectedStation, setSelectedStation] = useState("himansh");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");
  const [selectedContentType, setSelectedContentType] = useState<
    | "Lesson"
    | "Explanation"
    | "Quiz"
    | "Activity"
    | "Worksheet"
    | "Assignment"
    | "Discussion questions"
    | "Summary"
    | "Article"
  >("Lesson");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<any | null>(null);

  // Teacher Saved Lessons State
  const [lessons, setLessons] = useState<TeacherLesson[]>([
    {
      id: "t_les_01",
      title: "Surface Albedo and Glacier Runoff at Himansh Station",
      grade: 9,
      subject: "Science & Physics",
      topic: "Energy Balance of the Cryosphere",
      station: "Himansh (Spiti Valley, 4,080 m)",
      content:
        "Fresh snow reflects 85% of solar radiation (high albedo α ≈ 0.85). As glacier ablation exposes bare blue ice (α ≈ 0.35), solar absorption accelerates meltwater runoff into the Chandra-Indus basin.",
      quizQuestions: [
        {
          question: "What does an albedo value of 0.85 indicate for Himalayan snow?",
          options: ["85% of sunlight is reflected back into the atmosphere", "85% of ice melted", "High moisture"],
          answerIndex: 0,
        },
      ],
      status: "PUBLISHED_TO_CLASS",
    },
    {
      id: "t_les_02",
      title: "Katabatic Winds and Synoptic Meteorology at Maitri",
      grade: 11,
      subject: "Atmospheric Science & Geography",
      topic: "Antarctic Gravity-Driven Wind Currents",
      station: "Maitri (Antarctica)",
      content:
        "Dense cold air descending from the Antarctic ice sheet accelerates down steep coastal slopes towards Schirmacher Oasis, reaching speeds beyond 50 knots.",
      quizQuestions: [
        {
          question: "What primary force drives katabatic winds in Antarctica?",
          options: ["Gravity acting on dense cold air", "Ocean thermal evaporation", "Solar flares"],
          answerIndex: 0,
        },
      ],
      status: "PUBLISHED_TO_CLASS",
    },
  ]);

  // Handle AI Transformation Generation
  function handleGenerateContent(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedOutput(null);

    setTimeout(() => {
      if (lang === "hi") {
        setGeneratedOutput({
          title: `कक्षा ${selectedGrade} के लिए ${selectedContentType}: ${selectedTopic}`,
          grade: selectedGrade,
          subject: selectedSubject,
          station: selectedStation.toUpperCase(),
          learningObjective: "विद्यार्थी समझ सकेंगे कि हिमालयी हिमनदों में सौर ऊर्जा का परावर्तन और द्रव्यमान संतुलन कैसे काम करता है।",
          concept: "सतही एल्बिडो (Surface Albedo) और क्रायोस्फेरिक ऊर्जा संतुलन।",
          realObservation: "हिमांश वेधशाला (4,080 मीटर) में स्वचालित मौसम केंद्र (AWS) द्वारा निरंतर तापमान और विकिरण का मापन किया जाता है।",
          quiz: [
            {
              question: "हिमालय के ताजे बर्फ का एल्बिडो कितना होता है?",
              options: ["लगभग 80% से 90% सौर विकिरण परावर्तित करता है", "केवल 10% विकिरण परावर्तित करता है", "शून्य"],
              correctIndex: 0,
            },
          ],
          activity: "दैनिक तापमान समय-श्रृंखला देखकर शून्य से नीचे (जमाव) और शून्य से ऊपर (पिघलन) के दिनों की पहचान करें।",
        });
      } else {
        setGeneratedOutput({
          title: `Class ${selectedGrade} ${selectedContentType}: ${selectedTopic}`,
          grade: selectedGrade,
          subject: selectedSubject,
          station: selectedStation.toUpperCase(),
          learningObjective:
            "Students understand surface solar radiation reflection and mass balance dynamics using real observations from NCPOR stations.",
          concept:
            "Cryospheric albedo dynamics: Fresh snow reflects 80-90% of solar radiation. As surface albedo drops to 0.35, meltwater discharge accelerates.",
          realObservation:
            "Himansh Glaciological Observatory AWS records confirm positive net radiation during July-August triggering rapid runoff.",
          quiz: [
            {
              question: "How does high albedo affect Himalayan glacier longevity?",
              options: [
                "It reflects solar radiation, slowing ice melt",
                "It absorbs geothermal energy",
                "It causes sudden snow sublimation",
              ],
              correctIndex: 0,
            },
          ],
          activity:
            "Calculate daily albedo change from AWS pyranometer incoming vs reflected shortwave solar radiation values.",
        });
      }
      setIsGenerating(false);
    }, 600);
  }

  const NAV_TABS = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "library", label: "Research Library", icon: BookOpen },
    { id: "generator", label: "AI Generator", icon: Sparkles },
    { id: "lessons", label: "Lessons", icon: FileText },
    { id: "quizzes", label: "Quizzes", icon: HelpCircle },
    { id: "activities", label: "Activities", icon: Activity },
    { id: "classes", label: "My Classes", icon: Users },
    { id: "assignments", label: "Assignments", icon: CheckSquare },
    { id: "progress", label: "Student Progress", icon: Award },
    { id: "resources", label: "Resources", icon: Layers },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-10 space-y-8 max-w-7xl mx-auto">
      {/* Teacher Header Banner */}
      <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase tracking-widest bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              <span>Polar Educator Classroom Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Teacher Polar Science Studio
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Transform authentic polar scientific research into NCERT-aligned classroom modules, quizzes, interactive activities, and assignments for your students in English and Hindi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="px-4 py-2 rounded-xl bg-white border border-amber-200 text-amber-900 font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Languages className="w-4 h-4 text-amber-700" />
              <span>{lang === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer"
            >
              + Generate Content
            </button>
          </div>
        </div>

        {/* 11 Navigation Tabs */}
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
                    ? "bg-amber-700 text-white shadow-md shadow-amber-700/20"
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
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Active Classes</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-950">3 Classes</div>
              <p className="text-xs text-slate-600">Grade 9-A, 10-B, 11-Science</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Published Lessons</span>
              <div className="text-3xl sm:text-4xl font-black text-sky-800">{lessons.length} Modules</div>
              <p className="text-xs text-slate-600">Aligned with NCERT curriculum</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Students Enrolled</span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700">84 Students</div>
              <p className="text-xs text-slate-600">Active learning progress</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Avg Quiz Score</span>
              <div className="text-3xl sm:text-4xl font-black text-indigo-700">88.4%</div>
              <p className="text-xs text-slate-600">High engagement on polar units</p>
            </div>
          </div>

          {/* Recent Lessons */}
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white space-y-4">
            <h3 className="text-lg font-black text-slate-950">Active Classroom Modules</h3>
            <div className="space-y-3">
              {lessons.map((les) => (
                <div key={les.id} className="ice-glass rounded-2xl p-4 border border-sky-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-amber-900">Class {les.grade} • {les.subject}</div>
                    <div className="text-base font-black text-slate-900">{les.title}</div>
                    <div className="text-xs text-slate-600">{les.station}</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    {les.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RESEARCH LIBRARY (SELECT RESEARCH AS SOURCE)
          ========================================================================= */}
      {activeTab === "library" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Scientific Research Library for Educators</h2>
            <p className="text-sm text-slate-600 font-medium">Browse verified scientific papers and select them as sources to generate classroom lessons.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Himansh Glacier Mass Balance Annual Bulletin",
                topic: "Glacier Energy Balance & Albedo",
                station: "Himansh",
                desc: "Surface albedo observations showing how snow reflectiveness decreases as bare ice is exposed.",
              },
              {
                title: "41st ISEA Maitri Meteorology Report",
                topic: "Gravity-Driven Katabatic Winds",
                station: "Maitri",
                desc: "Severe gravity wind acceleration down Antarctic ice slopes reaching over 50 knots.",
              },
            ].map((res, i) => (
              <div key={i} className="ice-glass rounded-2xl p-5 border border-white space-y-3">
                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">{res.station}</span>
                <h4 className="text-base font-black text-slate-900">{res.title}</h4>
                <p className="text-xs text-slate-600">{res.desc}</p>
                <button
                  onClick={() => {
                    setSelectedTopic(res.topic);
                    setActiveTab("generator");
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                >
                  Use as Lesson Source →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: AI CONTENT GENERATOR
          ========================================================================= */}
      {activeTab === "generator" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
              <span>AI Educational Content Generator</span>
            </h2>
            <p className="text-sm text-slate-600 font-medium">Generate curriculum materials grounded in verified polar research.</p>
          </div>

          <form onSubmit={handleGenerateContent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Class / Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <option value="6">Class 6 (Middle)</option>
                  <option value="8">Class 8 (Middle)</option>
                  <option value="9">Class 9 (Secondary)</option>
                  <option value="10">Class 10 (Secondary)</option>
                  <option value="11">Class 11 (Higher Secondary)</option>
                  <option value="12">Class 12 (Higher Secondary)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <option value="Science & Environmental Physics">Science & Physics</option>
                  <option value="Geography & Earth Sciences">Geography & Earth Sciences</option>
                  <option value="Climate Change & Cryosphere">Climate Change Studies</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Content Type (9 Formats)</label>
                <select
                  value={selectedContentType}
                  onChange={(e) => setSelectedContentType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <option value="Lesson">Lesson</option>
                  <option value="Explanation">Explanation</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Activity">Activity</option>
                  <option value="Worksheet">Worksheet</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Discussion questions">Discussion questions</option>
                  <option value="Summary">Summary</option>
                  <option value="Article">Article</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Topic</label>
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Station Telemetry Source</label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <option value="himansh">Himansh (Himalayas - High Altitude)</option>
                  <option value="maitri">Maitri (Antarctica - Oasis)</option>
                  <option value="bharati">Bharati (Antarctica - Coastal)</option>
                  <option value="himadri">Himadri (Arctic - Ny-Ålesund)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? "Synthesizing with VISTAAR AI..." : `Generate ${selectedContentType} →`}
            </button>
          </form>

          {/* Generated Result Preview */}
          {generatedOutput && (
            <div className="p-6 rounded-2xl bg-white/95 border border-amber-300 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h4 className="text-lg font-black text-slate-900">{generatedOutput.title}</h4>
                <button
                  onClick={() => {
                    const newL: TeacherLesson = {
                      id: `les_${Date.now()}`,
                      title: generatedOutput.title,
                      grade: parseInt(selectedGrade),
                      subject: selectedSubject,
                      topic: selectedTopic,
                      station: selectedStation,
                      content: generatedOutput.concept,
                      quizQuestions: generatedOutput.quiz,
                      status: "PUBLISHED_TO_CLASS",
                    };
                    setLessons([newL, ...lessons]);
                    setActiveTab("lessons");
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Publish to My Class →
                </button>
              </div>

              <div className="text-xs text-slate-700 space-y-2">
                <div><strong className="text-slate-900">Learning Objective:</strong> {generatedOutput.learningObjective}</div>
                <div><strong className="text-slate-900">Core Concept:</strong> {generatedOutput.concept}</div>
                <div><strong className="text-slate-900">Real Observatory Data:</strong> {generatedOutput.realObservation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: LESSONS
          ========================================================================= */}
      {activeTab === "lessons" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Class Lessons Management</h2>
              <p className="text-sm text-slate-600 font-medium">Create, edit, preview, and publish lessons to your students.</p>
            </div>
            <button
              onClick={() => setActiveTab("generator")}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 cursor-pointer"
            >
              + Create New Lesson
            </button>
          </div>

          <div className="space-y-4">
            {lessons.map((les) => (
              <div key={les.id} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900">Class {les.grade} • {les.subject}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{les.status}</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">{les.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{les.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: QUIZZES
          ========================================================================= */}
      {activeTab === "quizzes" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Class Quizzes & Assessments</h2>
            <p className="text-sm text-slate-600 font-medium">Create and assign question banks with automated grading.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Glacier Albedo & Cryospheric Energy Balance Quiz",
                questions: 5,
                classAssigned: "Grade 9-A",
                submissions: "26 / 28 completed",
              },
              {
                title: "Antarctic Katabatic Winds Meteorology Quiz",
                questions: 6,
                classAssigned: "Grade 11-Science",
                submissions: "32 / 32 completed",
              },
            ].map((q, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-black text-slate-900">{q.title}</h4>
                  <div className="text-xs text-slate-600">{q.classAssigned} • {q.questions} Questions • {q.submissions}</div>
                </div>
                <button
                  onClick={() => {}}
                  className="px-4 py-2 rounded-xl bg-white border border-sky-200 text-xs font-bold text-slate-800 hover:bg-sky-50 cursor-pointer self-start sm:self-auto"
                >
                  View Responses
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ACTIVITIES
          ========================================================================= */}
      {activeTab === "activities" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Interactive Classroom Activities</h2>
            <p className="text-sm text-slate-600 font-medium">Hands-on student exercises using real polar telemetry graphs and data tables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Himansh Glacier Melt Tracker Activity",
                desc: "Students calculate cumulative melting days using live high-altitude Spiti temperature telemetry.",
                grade: "Grade 9-10",
              },
              {
                title: "Katabatic Squall Arrival Timeline",
                desc: "Plot wind velocity vs surface temperature drop from Maitri ultrasonic sensors.",
                grade: "Grade 11-12",
              },
            ].map((act, i) => (
              <div key={i} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <span className="text-xs font-bold text-sky-800">{act.grade}</span>
                <h4 className="text-base font-black text-slate-900">{act.title}</h4>
                <p className="text-xs text-slate-600">{act.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: MY CLASSES
          ========================================================================= */}
      {activeTab === "classes" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">My Classes & Student Rosters</h2>
            <p className="text-sm text-slate-600 font-medium">Manage student groups, assigned polar science units, and participation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Grade 9-A Science", count: 28, units: "Himalayan Glaciology", code: "POLAR-9A" },
              { name: "Grade 10-B Earth Science", count: 30, units: "Antarctic Stations & Weather", code: "POLAR-10B" },
              { name: "Grade 11-Science Physics", count: 26, units: "Atmospheric Telemetry & Radiation", code: "POLAR-11S" },
            ].map((cls, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">{cls.code}</div>
                <h4 className="text-lg font-black text-slate-900">{cls.name}</h4>
                <div className="text-xs text-slate-600">{cls.count} Students Enrolled</div>
                <div className="text-xs text-sky-800 font-semibold">Active Unit: {cls.units}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: ASSIGNMENTS
          ========================================================================= */}
      {activeTab === "assignments" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Class Assignments & Deadlines</h2>
            <p className="text-sm text-slate-600 font-medium">Review student submissions and assign polar research projects.</p>
          </div>

          <div className="space-y-3">
            {[
              { title: "Report: Why is Himansh located at 4,080m in Chandra Basin?", deadline: "Oct 12, 2026", status: "PENDING_REVIEW" },
              { title: "Comparison Chart: Maitri vs Bharati Station Architecture", deadline: "Oct 18, 2026", status: "ASSIGNED" },
            ].map((asg, i) => (
              <div key={i} className="ice-glass rounded-2xl p-4 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{asg.title}</h4>
                  <div className="text-xs text-slate-600">Deadline: {asg.deadline}</div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                  {asg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: STUDENT PROGRESS
          ========================================================================= */}
      {activeTab === "progress" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Student Learning Progress & Analytics</h2>
            <p className="text-sm text-slate-600 font-medium">Track completed modules, quiz mastery, and interactive exploration badges.</p>
          </div>

          <div className="space-y-3">
            {[
              { name: "Rahul Verma", grade: "9-A", completed: "4 of 4 units", score: "94%", badge: "Polar Glaciology Master" },
              { name: "Priya Sharma", grade: "9-A", completed: "4 of 4 units", score: "90%", badge: "Antarctica Explorer" },
              { name: "Aarav Patel", grade: "10-B", completed: "3 of 4 units", score: "86%", badge: "Arctic Telemetry Scholar" },
            ].map((st, i) => (
              <div key={i} className="ice-glass rounded-2xl p-4 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">{st.name} ({st.grade})</div>
                  <div className="text-xs text-slate-600">Progress: {st.completed} • Score: {st.score}</div>
                </div>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 self-start sm:self-auto">
                  🎖️ {st.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: RESOURCES
          ========================================================================= */}
      {activeTab === "resources" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Educational Media & Teaching Resources</h2>
            <p className="text-sm text-slate-600 font-medium">Approved polar visual assets, station diagrams, and printable worksheets.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Bharati Station Aerodynamic Layout Diagram", type: "PDF Schematic" },
              { title: "Himalayan Glacier Albedo Color Scale Chart", type: "Printable Worksheet" },
              { title: "Ny-Ålesund Arctic Midnight Sun Video", type: "Educational Clip" },
            ].map((r, i) => (
              <div key={i} className="ice-glass rounded-2xl p-4 border border-white space-y-2">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{r.type}</span>
                <h4 className="text-sm font-black text-slate-900">{r.title}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: PROFILE
          ========================================================================= */}
      {activeTab === "profile" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Teacher Credential Profile</h2>
            <p className="text-sm text-slate-600 font-medium">Educator profile, assigned classes, and pedagogical authorization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Educator Details</h3>
              <div className="space-y-1.5 text-xs">
                <div><strong className="text-slate-700">Name:</strong> Meera Joshi</div>
                <div><strong className="text-slate-700">Email:</strong> teacher@vistaar.ncpor.res.in</div>
                <div><strong className="text-slate-700">Role:</strong> TEACHER</div>
                <div><strong className="text-slate-700">School:</strong> Kendriya Vidyalaya / NCPOR Polar Outreach School</div>
                <div><strong className="text-slate-700">Subject:</strong> Secondary Science & Environmental Studies</div>
              </div>
            </div>

            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Role Permissions</h3>
              <div className="space-y-2 text-xs">
                <div className="text-emerald-800 font-bold">Teacher CAN:</div>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                  <li>Use authorized scientific research</li>
                  <li>Generate educational content with AI</li>
                  <li>Create lessons, quizzes, activities, worksheets</li>
                  <li>Manage own classes and assign work</li>
                  <li>View own students&apos; progress in EN/Hindi</li>
                </ul>

                <div className="text-red-700 font-bold pt-2">Teacher CANNOT:</div>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                  <li>Modify original scientific research</li>
                  <li>Modify scientific datasets</li>
                  <li>Manage system users or permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
