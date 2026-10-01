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
  const [activeTab, setActiveTab] = useState<"generator" | "myLessons" | "classes" | "progress">("generator");

  // AI Content Generator Form State
  const [selectedGrade, setSelectedGrade] = useState("9");
  const [selectedSubject, setSelectedSubject] = useState("Science & Environmental Physics");
  const [selectedTopic, setSelectedTopic] = useState("Glacier Mass Balance & Cryospheric Albedo");
  const [selectedStation, setSelectedStation] = useState("himansh");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");
  const [contentType, setContentType] = useState<"LESSON" | "QUIZ" | "ACTIVITY" | "WORKSHEET">("LESSON");
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
          title: `कक्षा ${selectedGrade} के लिए पाठ: ${selectedTopic}`,
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
          title: `Class ${selectedGrade} Curriculum: ${selectedTopic}`,
          grade: selectedGrade,
          subject: selectedSubject,
          station: selectedStation.toUpperCase(),
          learningObjective: "Students will explain how solar radiation absorption and surface albedo govern glacier mass balance.",
          concept: "Surface Albedo (α) and Cryospheric Energy Conservation.",
          realObservation: "Calibrated pyranometers at NCPOR's Himansh Station (4,080m in Chandra Basin) record direct and reflected shortwave solar fluxes.",
          quiz: [
            {
              question: "Why does bare glacier ice melt faster than fresh snowfall?",
              options: [
                "Bare ice has lower albedo (0.35) and absorbs significantly more solar radiation",
                "Bare ice has higher albedo",
                "Bare ice is warmer than air",
              ],
              correctIndex: 0,
            },
          ],
          activity: "Inspect the Himansh AWS telemetry chart to calculate the number of positive degree days in July.",
        });
      }
      setIsGenerating(false);
    }, 800);
  }

  function handleSaveGeneratedToClass() {
    if (!generatedOutput) return;

    const newLesson: TeacherLesson = {
      id: `t_les_${Date.now()}`,
      title: generatedOutput.title,
      grade: parseInt(generatedOutput.grade) || 9,
      subject: generatedOutput.subject,
      topic: selectedTopic,
      station: generatedOutput.station,
      content: `${generatedOutput.concept} ${generatedOutput.realObservation}`,
      quizQuestions: generatedOutput.quiz || [],
      status: "PUBLISHED_TO_CLASS",
    };

    setLessons([newLesson, ...lessons]);
    setActiveTab("myLessons");
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-12 space-y-10">
      {/* Header Banner */}
      <div className="ice-glass-strong rounded-3xl p-8 sm:p-12 border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-300/20 to-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase tracking-widest bg-amber-50/90 px-3.5 py-1.5 rounded-full border border-amber-200">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              <span>{lang === "hi" ? "एनसीईआरटी ध्रुवीय विज्ञान शिक्षक पोर्टल" : "NCERT Polar Science Educator Hub"}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight">
              {lang === "hi" ? "शिक्षक कक्षा एवं एआई पाठ जनरेटर" : "Teacher Classroom & AI Studio"}
            </h1>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              {lang === "hi"
                ? "प्रामाणिक ध्रुवीय वैज्ञानिक अनुसंधान को कक्षा 5 से 12 तक के पाठ, क्विज़, वर्कशीट और असाइनमेंट में बदलें। पूर्ण द्विभाषी समर्थन।"
                : "Transform verified polar science research into syllabus-aligned NCERT lessons, quizzes, hands-on activities, and assignments for Classes 5 to 12."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="px-5 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-800 font-bold border border-sky-200 shadow-sm flex items-center space-x-2 cursor-pointer transition-all"
            >
              <Languages className="w-4 h-4 text-sky-600" />
              <span>{lang === "en" ? "हिंदी में देखें (HI)" : "Switch to English (EN)"}</span>
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-sky-700 text-white font-bold shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{lang === "hi" ? "नया पाठ बनाएं" : "Create with AI"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-8 mt-8 border-t border-sky-200/80">
          {[
            { id: "generator", label: lang === "hi" ? "एआई सामग्री जनरेटर" : "AI Content Generator", icon: Sparkles },
            { id: "myLessons", label: lang === "hi" ? "मेरे प्रकाशित पाठ" : "My Published Lessons", icon: BookOpen },
            { id: "classes", label: lang === "hi" ? "मेरी कक्षाएं एवं असाइनमेंट" : "My Classes & Assignments", icon: Users },
            { id: "progress", label: lang === "hi" ? "छात्र प्रगति रिपोर्ट" : "Student Progress & Analytics", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-amber-700 text-white shadow-md shadow-amber-700/20"
                    : "bg-white/60 text-slate-700 hover:bg-white border border-sky-200/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AI CONTENT GENERATOR */}
      {activeTab === "generator" && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl space-y-6">
            <div className="border-b border-sky-200 pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                {lang === "hi" ? "ध्रुवीय अनुसंधान से कक्षा पाठ तैयार करें" : "Synthesize Classroom Content with VISTAAR AI"}
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                {lang === "hi"
                  ? "कक्षा, विषय, कठिनाई स्तर और ध्रुवीय अनुसंधान चुनें। एआई एनसीईआरटी-मान्यता प्राप्त पाठ और क्विज़ तैयार करेगा।"
                  : "Select class grade, subject topic, difficulty, and station evidence. VISTAAR AI produces grounded educational content."}
              </p>
            </div>

            <form onSubmit={handleGenerateContent} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{lang === "hi" ? "कक्षा (Grade)" : "Class Grade *"}</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sky-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g.toString()}>
                        Class {g} (कक्षा {g})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{lang === "hi" ? "सामग्री प्रकार" : "Content Format *"}</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sky-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="LESSON">Interactive Lesson & Explanation</option>
                    <option value="QUIZ">Classroom Quiz & Verified Answer Key</option>
                    <option value="ACTIVITY">Hands-on Telemetry Activity</option>
                    <option value="WORKSHEET">Printable Student Worksheet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{lang === "hi" ? "ध्रुवीय वेधशाला" : "Observatory Evidence *"}</label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sky-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="himansh">Himansh (Himalayas, 4,080m)</option>
                    <option value="maitri">Maitri (Antarctica)</option>
                    <option value="bharati">Bharati (Antarctica)</option>
                    <option value="himadri">Himadri (Arctic 79°N)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">{lang === "hi" ? "पाठ का विषय" : "Curriculum Topic *"}</label>
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  placeholder="e.g. Glacier Mass Balance, Katabatic Winds, Third Pole Water Cycle"
                  className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sky-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-sky-700 text-white font-bold text-sm shadow-md hover:shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? "Transforming Scientific Record with VISTAAR AI..." : "Generate NCERT Lesson & Quiz"}
              </button>
            </form>
          </div>

          {/* Generated Result Card with Edit & Publish */}
          {generatedOutput && (
            <div className="ice-glass rounded-3xl p-6 sm:p-8 border border-white space-y-6 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-200">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    NCERT Class {generatedOutput.grade} • {generatedOutput.subject}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">{generatedOutput.title}</h3>
                </div>

                <button
                  onClick={handleSaveGeneratedToClass}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to My Students</span>
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-800 leading-relaxed font-medium">
                <div className="bg-white/70 p-4 rounded-2xl border border-sky-100 space-y-1">
                  <h4 className="font-bold text-sky-800 uppercase text-xs tracking-wider">Learning Objective:</h4>
                  <p>{generatedOutput.learningObjective}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-base">Scientific Concept & Explanation:</h4>
                  <p>{generatedOutput.concept}</p>
                  <p className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                    <strong>Real Indian Polar Observatory Evidence:</strong> {generatedOutput.realObservation}
                  </p>
                </div>

                {generatedOutput.activity && (
                  <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 space-y-1">
                    <h4 className="font-bold text-sky-800 text-xs uppercase tracking-wider">Hands-on Telemetry Activity:</h4>
                    <p>{generatedOutput.activity}</p>
                  </div>
                )}

                {generatedOutput.quiz && generatedOutput.quiz.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-900 text-base">Classroom Quiz & Verified Answer Key:</h4>
                    {generatedOutput.quiz.map((q: any, i: number) => (
                      <div key={i} className="p-3 bg-white/80 rounded-2xl border border-sky-100 space-y-1.5">
                        <div className="font-bold text-xs text-slate-900">Q{i + 1}: {q.question}</div>
                        <ul className="text-xs space-y-1 pl-4 list-disc text-slate-700">
                          {q.options.map((opt: string, optIdx: number) => (
                            <li key={optIdx} className={optIdx === q.correctIndex ? "font-bold text-emerald-700" : ""}>
                              {opt} {optIdx === q.correctIndex && "(Correct ✓)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY PUBLISHED LESSONS */}
      {activeTab === "myLessons" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-sky-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Published Classroom Lessons</h2>
              <p className="text-sm text-slate-600 font-medium">Lessons actively assigned to students across your classes.</p>
            </div>
            <button
              onClick={() => setActiveTab("generator")}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-all text-sm shadow-md flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Lesson</span>
            </button>
          </div>

          <div className="space-y-4">
            {lessons.map((les) => (
              <div
                key={les.id}
                className="ice-glass rounded-2xl p-6 border border-white hover:border-amber-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Class {les.grade}
                    </span>
                    <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {les.station}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {les.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{les.subject}</span>
                </div>

                <h3 className="text-lg font-black text-slate-900">{les.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{les.content}</p>

                <div className="pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Quiz Included: {les.quizQuestions.length} Questions</span>
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/education"
                      className="px-4 py-2 rounded-xl bg-white text-slate-800 border border-sky-200 hover:bg-sky-50 transition-colors"
                    >
                      Preview Student View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLASSES & ASSIGNMENTS */}
      {activeTab === "classes" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Active Class Groups</h2>
            <p className="text-sm text-slate-600 font-medium">Manage student rosters, assigned polar science modules, and deadlines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                className: "Class 9-A Science",
                students: 34,
                activeAssignment: "Himansh Glacier Mass Balance Telemetry",
                deadline: "2026-10-10",
                completion: "82%",
              },
              {
                className: "Class 11 Physics & Geography",
                students: 28,
                activeAssignment: "Maitri Katabatic Wind Vectors Analysis",
                deadline: "2026-10-15",
                completion: "65%",
              },
            ].map((cls, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-6 border border-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">{cls.className}</h3>
                  <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                    {cls.students} Students
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Current Module:</strong> {cls.activeAssignment}</div>
                  <div><strong>Deadline:</strong> {cls.deadline}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Class Completion</span>
                    <span>{cls.completion}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: cls.completion }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT PROGRESS */}
      {activeTab === "progress" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Student Competency & Progress Overview</h2>
            <p className="text-sm text-slate-600 font-medium">Verified quiz scores and telemetry activity engagement across all registered students.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-2">
              <span className="text-xs font-bold text-sky-800 uppercase">Total Quizzes Attempted</span>
              <div className="text-3xl font-black text-slate-950">142</div>
              <p className="text-xs text-slate-600">Across 62 registered students</p>
            </div>
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase">Average Scientific Score</span>
              <div className="text-3xl font-black text-emerald-700">86.4%</div>
              <p className="text-xs text-slate-600">+12% over baseline evaluation</p>
            </div>
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-2">
              <span className="text-xs font-bold text-indigo-800 uppercase">Polar Explorer Badges Earned</span>
              <div className="text-3xl font-black text-indigo-700">88</div>
              <p className="text-xs text-slate-600">Glaciology, Katabatic & Telemetry badges</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
