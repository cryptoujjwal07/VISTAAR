"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Radio,
  Video,
  Play,
  Languages,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function StudentPortalPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [activeTab, setActiveTab] = useState<"lessons" | "quiz" | "explorer" | "progress">("lessons");

  // Quiz State
  const [selectedLessonId, setSelectedLessonId] = useState("les_01");
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(2);
  const [totalAttempted, setTotalAttempted] = useState(3);

  const sampleQuestions: Question[] = [
    {
      id: "q_01",
      question:
        lang === "hi"
          ? "हिमालयी हिमनदों में 'एल्बिडो' (Albedo) से क्या अभिप्राय है?"
          : "What does the term 'Surface Albedo' mean in Himalayan glaciology?",
      options:
        lang === "hi"
          ? [
              "हिमनद की सतह द्वारा वापस अंतरिक्ष में परावर्तित सौर विकिरण का अनुपात",
              "बर्फ के नीचे बहने वाले पानी की गति",
              "पहाड़ों पर चलने वाली गर्म हवा",
            ]
          : [
              "The ratio of solar radiation reflected back from the glacier surface",
              "The flow velocity of subglacial meltwater",
              "The density of mountain fog",
            ],
      correctIndex: 0,
      explanation:
        lang === "hi"
          ? "ताजा बर्फ 80-90% धूप परावर्तित करती है, जिससे पिघलन धीमी होती है। (स्रोत: हिमांश वेधशाला, एनसीपीओआर)"
          : "Fresh snow has a high albedo (0.80–0.90), reflecting most incoming solar energy. (Source: NPDC Himansh AWS)",
    },
    {
      id: "q_02",
      question:
        lang === "hi"
          ? "अंटार्कटिका में 'मैत्री' स्टेशन पर 'कैटाबैटिक पवनें' कैसे उत्पन्न होती हैं?"
          : "How are Katabatic winds formed at Maitri Station in Antarctica?",
      options:
        lang === "hi"
          ? [
              "भारी ठंडी हवा का ढलान की ओर गुरुत्वाकर्षण के कारण तीव्र वेग से उतरना",
              "समुद्र में उठने वाली ज्वारीय लहरों से",
              "सूर्य के सीधे संपर्क से",
            ]
          : [
              "Dense cold air descending rapidly down ice slopes driven by gravity",
              "Tidal waves rising in the Southern Ocean",
              "Direct tropical air masses",
            ],
      correctIndex: 0,
      explanation:
        lang === "hi"
          ? "अंटार्कटिक बर्फ की चादर पर बनी ठंडी सघन हवा ढलानों से नीचे बहती है। (स्रोत: 41-आईएसईए रिपोर्ट)"
          : "Dense air chilled over the polar ice plateau rushes down coastal slopes under gravitational pull. (Source: 41-ISEA Maitri Meteorology Report)",
    },
  ];

  const currentQ = sampleQuestions[0];

  function handleOptionSelect(idx: number) {
    if (isAnswered) return;
    setUserAnswer(idx);
    setIsAnswered(true);
    if (idx === currentQ.correctIndex) {
      setScore(score + 1);
    }
    setTotalAttempted(totalAttempted + 1);
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-12 space-y-10">
      {/* Header Banner */}
      <div className="ice-glass-strong rounded-3xl p-8 sm:p-12 border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-400/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-sky-800 uppercase tracking-widest bg-sky-100/90 px-3.5 py-1.5 rounded-full border border-sky-200">
              <Compass className="w-4 h-4 text-sky-700 animate-spin-slow" />
              <span>{lang === "hi" ? "छात्र ध्रुवीय अन्वेषक पोर्टल" : "Student Polar Explorer Studio"}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight">
              {lang === "hi" ? "ध्रुवीय विज्ञान सीखें एवं अन्वेषण करें" : "Discover India's Polar Science"}
            </h1>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              {lang === "hi"
                ? "अंटार्कटिका, आर्कटिक और हिमालय के वास्तविक वेधशाला डेटा के साथ सीखें। क्विज़ हल करें, पदक जीतें और ध्रुवीय मौसम देखें।"
                : "Explore real scientific observations from Maitri, Bharati, Himadri, and Himansh stations. Solve quizzes, earn polar badges, and inspect live climate telemetry."}
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
              onClick={() => setActiveTab("quiz")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 text-white font-bold shadow-lg hover:shadow-cyan-500/25 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Award className="w-4 h-4" />
              <span>{lang === "hi" ? "दैनिक क्विज़ हल करें" : "Take Polar Quiz"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-8 mt-8 border-t border-sky-200/80">
          {[
            { id: "lessons", label: lang === "hi" ? "इंटरैक्टिव पाठ" : "Interactive Lessons", icon: BookOpen },
            { id: "quiz", label: lang === "hi" ? "ध्रुवीय क्विज़" : "Polar Quizzes & Badges", icon: Award },
            { id: "explorer", label: lang === "hi" ? "वेधशाला अन्वेषक" : "Station Explorer", icon: Compass },
            { id: "progress", label: lang === "hi" ? "मेरी प्रगति" : "My Learning Progress", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-sky-700 text-white shadow-md shadow-sky-700/20"
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

      {/* TAB 1: INTERACTIVE LESSONS */}
      {activeTab === "lessons" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: "les_01",
                grade: "Class 9-10",
                title: lang === "hi" ? "सतही एल्बिडो और हिमनद पिघलन" : "Surface Albedo and Glacier Mass Balance",
                station: "Himansh (4,080 m)",
                region: "Himalayas",
                summary:
                  lang === "hi"
                    ? "हिमालय के हिमांश स्टेशन से प्राप्त डेटा के आधार पर समझें कि बर्फ और नीली बर्फ सौर ऊर्जा को कैसे परावर्तित करती है।"
                    : "Learn how fresh snow and exposed blue ice absorb solar radiation in the Chandra Basin using calibrated AWS pyranometers.",
                color: "from-sky-500/10 to-blue-500/10",
              },
              {
                id: "les_02",
                grade: "Class 11-12",
                title: lang === "hi" ? "अंटार्कटिका की कैटाबैटिक पवनें" : "Antarctic Katabatic Wind Dynamics",
                station: "Maitri (Schirmacher Oasis)",
                region: "Antarctica",
                summary:
                  lang === "hi"
                    ? "मैत्री स्टेशन पर 45 नॉट से अधिक गति से चलने वाली गुरुत्वाकर्षण-चालित पवनों का वैज्ञानिक अध्ययन।"
                    : "Discover how gravity-driven air currents accelerate across Antarctic ice shelves at speeds exceeding 50 knots.",
                color: "from-cyan-500/10 to-emerald-500/10",
              },
              {
                id: "les_03",
                grade: "Class 7-8",
                title: lang === "hi" ? "आर्कटिक प्रवर्धन और हिमाद्रि" : "Arctic Amplification & Himadri Research",
                station: "Himadri (Ny-Ålesund 79°N)",
                region: "Arctic",
                summary:
                  lang === "hi"
                    ? "सवालों के जरिए जानें कि ध्रुवों का तापमान बाकी दुनिया की तुलना में तेजी से क्यों बढ़ रहा है।"
                    : "Investigate why the Arctic warms three times faster than the global average using Svalbard atmospheric disdrometers.",
                color: "from-indigo-500/10 to-sky-500/10",
              },
            ].map((les) => (
              <div
                key={les.id}
                className="ice-glass rounded-3xl p-6 border border-white hover:border-sky-300 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {les.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{les.region}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{les.title}</h3>
                  <div className="text-xs text-sky-700 font-bold flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{les.station}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{les.summary}</p>
                </div>

                <div className="pt-4 border-t border-sky-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedLessonId(les.id);
                      setIsAnswered(false);
                      setUserAnswer(null);
                      setActiveTab("quiz");
                    }}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{lang === "hi" ? "क्विज़ हल करें" : "Attempt Quiz"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href="/weather"
                    className="text-[11px] font-bold text-slate-600 bg-white/80 px-2.5 py-1 rounded-xl border border-sky-200 hover:bg-sky-50"
                  >
                    Live Telemetry
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: POLAR QUIZZES & BADGES */}
      {activeTab === "quiz" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-sky-200 pb-4">
            <div>
              <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                {lang === "hi" ? "ध्रुवीय विज्ञान क्विज़" : "Interactive Polar Knowledge Quiz"}
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                {lang === "hi" ? "प्रश्न 1: सतही एल्बिडो" : "Question: Cryosphere Albedo Dynamics"}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-bold">Current Score</span>
              <div className="text-2xl font-black text-sky-700">{score} / {totalAttempted}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{currentQ.question}</h3>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = "bg-white/90 hover:bg-white text-slate-800 border-sky-200";
                if (isAnswered) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold";
                  } else if (userAnswer === idx) {
                    btnStyle = "bg-red-100 text-red-900 border-red-300";
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === currentQ.correctIndex && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                    {isAnswered && userAnswer === idx && idx !== currentQ.correctIndex && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1 animate-fade-in">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                  {lang === "hi" ? "वैज्ञानिक सत्यापन एवं संदर्भ:" : "Scientific Explanation & Source:"}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STATION EXPLORER */}
      {activeTab === "explorer" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200 pb-4">
            <h2 className="text-2xl font-black text-slate-950">
              {lang === "hi" ? "भारत के 4 ध्रुवीय अनुसंधान केंद्र" : "India's 4 Polar Research Stations"}
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Explore the observatories where Indian scientists collect live climate and ice telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Maitri",
                location: "Schirmacher Oasis, Antarctica",
                temp: "-12.4°C",
                feature: "Freshwater Lake Priyadarshini & AWS",
                tag: "Antarctica (70°S)",
              },
              {
                name: "Bharati",
                location: "Larsemann Hills, Antarctica",
                temp: "-8.7°C",
                feature: "Aerodynamic elevated module on stilts",
                tag: "Antarctica (69°S)",
              },
              {
                name: "Himadri",
                location: "Ny-Ålesund, Svalbard, Arctic",
                temp: "+2.1°C",
                feature: "Atmospheric optical disdrometer laboratory",
                tag: "Arctic (79°N)",
              },
              {
                name: "Himansh",
                location: "Spiti Valley, Chandra Basin",
                temp: "-1.8°C",
                feature: "Highest glacier lab at 4,080 meters",
                tag: "Himalayas (Third Pole)",
              },
            ].map((st) => (
              <div key={st.name} className="ice-glass rounded-2xl p-5 border border-white space-y-3">
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                  {st.tag}
                </span>
                <h3 className="text-xl font-black text-slate-950">{st.name}</h3>
                <div className="text-2xl font-black text-sky-700">{st.temp}</div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Site:</strong> {st.location}</div>
                  <div><strong>Key Rig:</strong> {st.feature}</div>
                </div>
                <Link
                  href="/weather"
                  className="block text-center py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                >
                  Live Telemetry
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MY LEARNING PROGRESS */}
      {activeTab === "progress" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200 pb-4">
            <h2 className="text-2xl font-black text-slate-950">
              {lang === "hi" ? "मेरी प्रगति एवं अर्जित पदक" : "My Learning Badges & Competencies"}
            </h2>
            <p className="text-sm text-slate-600 font-medium">Track your completed NCERT modules and polar science badges.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-2">
              <span className="text-xs font-bold text-sky-800 uppercase">Quizzes Completed</span>
              <div className="text-3xl font-black text-slate-950">{totalAttempted}</div>
              <p className="text-xs text-slate-600">Across Glaciology & Katabatic lessons</p>
            </div>
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase">Accuracy Rate</span>
              <div className="text-3xl font-black text-emerald-700">
                {totalAttempted > 0 ? Math.round((score / totalAttempted) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-600">Verified scientific answers</p>
            </div>
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-2">
              <span className="text-xs font-bold text-indigo-800 uppercase">Polar Explorer Badges</span>
              <div className="text-3xl font-black text-indigo-700">2 Earned</div>
              <p className="text-xs text-slate-600">Third Pole & Antarctica Badges</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
