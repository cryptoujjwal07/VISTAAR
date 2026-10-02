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
  CloudSun,
  FileText,
  User,
  Activity,
  CheckSquare,
  Globe2,
  Eye,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function StudentPortalPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "explore"
    | "lessons"
    | "quizzes"
    | "activities"
    | "articles"
    | "videos"
    | "polar_explorer"
    | "weather"
    | "assignments"
    | "progress"
    | "profile"
  >("home");

  // Quiz State
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(2);
  const [totalAttempted, setTotalAttempted] = useState(3);

  // Weather station selected
  const [selectedStation, setSelectedStation] = useState("maitri");

  // Assignment submission state
  const [submittedAssignment, setSubmittedAssignment] = useState(false);

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

  const NAV_TABS = [
    { id: "home", label: "Dashboard", icon: Compass },
    { id: "explore", label: "Explore", icon: Globe2 },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "quizzes", label: "Quizzes", icon: HelpCircle },
    { id: "activities", label: "Activities", icon: Activity },
    { id: "articles", label: "Articles", icon: FileText },
    { id: "videos", label: "Videos", icon: Video },
    { id: "polar_explorer", label: "Polar Explorer", icon: MapPin },
    { id: "weather", label: "Polar Weather", icon: CloudSun },
    { id: "assignments", label: "Assignments", icon: CheckSquare },
    { id: "progress", label: "Progress", icon: Award },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-10 space-y-8 max-w-7xl mx-auto">
      {/* Student Banner */}
      <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-400/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-sky-800 uppercase tracking-widest bg-sky-100/90 px-3 py-1 rounded-full border border-sky-300">
              <Sparkles className="w-4 h-4 text-sky-700" />
              <span>{lang === "hi" ? "छात्र ध्रुवीय अन्वेषक पोर्टल" : "Student Polar Explorer Studio"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              {lang === "hi" ? "ध्रुवीय विज्ञान सीखें एवं अन्वेषण करें" : "Discover India's Polar Science"}
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              {lang === "hi"
                ? "अंटार्कटिका, आर्कटिक और हिमालय (तीसरा ध्रुव) के वास्तविक वैज्ञानिक शोध, लाइव मौसम एवं NCERT पाठों का अन्वेषण करें।"
                : "Explore authentic polar science, live station weather, NCERT curriculum lessons, and interactive quiz challenges across Antarctica, the Arctic, and the Himalayas."}
            </p>
          </div>

          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="px-4 py-2 rounded-xl bg-white border border-sky-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer self-start md:self-auto"
          >
            <Languages className="w-4 h-4 text-sky-600" />
            <span>{lang === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
          </button>
        </div>

        {/* 12 Student Navigation Tabs */}
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
                    ? "bg-sky-700 text-white shadow-md shadow-sky-700/20"
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
          TAB 1: HOME / DASHBOARD
          ========================================================================= */}
      {activeTab === "home" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Completed Lessons</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-950">4 Modules</div>
              <p className="text-xs text-slate-600">Albedo, Katabatic Winds, Stations</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quiz Score</span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700">92%</div>
              <p className="text-xs text-slate-600">Great accuracy across assessments</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Badges Earned</span>
              <div className="text-3xl sm:text-4xl font-black text-indigo-700">3 Badges</div>
              <p className="text-xs text-slate-600">Polar Scholar, Glacier Explorer</p>
            </div>
            <div className="ice-glass rounded-3xl p-6 border border-white space-y-1.5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Assignment</span>
              <div className="text-3xl sm:text-4xl font-black text-amber-700">{submittedAssignment ? "0" : "1"}</div>
              <p className="text-xs text-slate-600">{submittedAssignment ? "All work submitted" : "Due in 3 days"}</p>
            </div>
          </div>

          {/* Quick Learning Recommendations */}
          <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white space-y-4">
            <h3 className="text-lg font-black text-slate-950">Recommended Learning Today</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab("lessons")}
                className="ice-glass rounded-2xl p-4 border border-sky-200/80 hover:border-sky-400 transition-all cursor-pointer space-y-2"
              >
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">Module 1</span>
                <h4 className="text-sm font-black text-slate-900">Why does snow reflect sunlight? (Albedo)</h4>
                <p className="text-xs text-slate-600">Study live pyranometer observations from Himansh Station.</p>
              </div>
              <div
                onClick={() => setActiveTab("polar_explorer")}
                className="ice-glass rounded-2xl p-4 border border-sky-200/80 hover:border-sky-400 transition-all cursor-pointer space-y-2"
              >
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">Exploration</span>
                <h4 className="text-sm font-black text-slate-900">Virtual Tour: Maitri & Bharati Stations</h4>
                <p className="text-xs text-slate-600">Discover life and science inside India&apos;s Antarctic habitats.</p>
              </div>
              <div
                onClick={() => setActiveTab("quizzes")}
                className="ice-glass rounded-2xl p-4 border border-sky-200/80 hover:border-sky-400 transition-all cursor-pointer space-y-2"
              >
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Challenge</span>
                <h4 className="text-sm font-black text-slate-900">Katabatic Wind Speed Challenge</h4>
                <p className="text-xs text-slate-600">Take a 3-minute quiz and earn the Polar Scholar badge.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EXPLORE (POLAR SCIENCE REGIONS)
          ========================================================================= */}
      {activeTab === "explore" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Explore the Three Poles</h2>
            <p className="text-sm text-slate-600 font-medium">Discover the geographical and scientific significance of Antarctica, Arctic, and Himalayas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                region: "Antarctica (South Pole)",
                highlight: "Maitri & Bharati",
                desc: "Home to 90% of the world's ice and 70% of freshwater. India conducts year-round atmospheric and geological research here.",
              },
              {
                region: "Arctic (North Pole)",
                highlight: "Himadri Station (79°N)",
                desc: "Located in Svalbard, Norway. Studies Arctic warming (amplification), Kongsfjorden fjord biology, and marine ecosystems.",
              },
              {
                region: "Himalayas (The Third Pole)",
                highlight: "Himansh Station (4,080m)",
                desc: "Largest ice storage outside poles, supplying water to billions. Himansh monitors Spiti Valley glaciers like Sutri Dhaka.",
              },
            ].map((reg, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white space-y-2.5">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">{reg.highlight}</span>
                <h4 className="text-lg font-black text-slate-900">{reg.region}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{reg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LESSONS
          ========================================================================= */}
      {activeTab === "lessons" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Assigned Curriculum Lessons</h2>
            <p className="text-sm text-slate-600 font-medium">NCERT-aligned interactive modules assigned by your school teacher.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "les_01",
                title: "Understanding Surface Albedo & Cryospheric Energy Balance",
                class: "Grade 9-A Science",
                station: "Himansh (Spiti Valley)",
                text: "Albedo measures the reflectivity of a surface from 0 to 1. Fresh Himalayan snow reflects 85% of sunlight (albedo = 0.85). As melting exposes bare dark ice, albedo drops to 0.35, accelerating solar absorption and runoff.",
              },
              {
                id: "les_02",
                title: "Antarctic Katabatic Winds: Nature's Gravity Chute",
                class: "Grade 9-A Science",
                station: "Maitri (Antarctica)",
                text: "Dense cold air forms over the vast Antarctic ice plateau. Driven by gravity, this cold heavy air rushes down coastal slopes, generating hurricane-force katabatic gusts that routinely surpass 100 km/h.",
              },
            ].map((l) => (
              <div key={l.id} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-800">{l.class}</span>
                  <span className="text-slate-500 font-semibold">{l.station}</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">{l.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-sky-100">{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: QUIZZES
          ========================================================================= */}
      {activeTab === "quizzes" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-3xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Interactive Polar Science Quiz</h2>
              <p className="text-xs text-slate-600 font-medium">Test your understanding with real evidence from station records.</p>
            </div>
            <div className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Score: {score} / {totalAttempted}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{currentQ.question}</h3>
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isCorrect = idx === currentQ.correctIndex;
                const isSelected = userAnswer === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                      isAnswered
                        ? isCorrect
                          ? "bg-emerald-100/90 border-emerald-300 text-emerald-950 font-bold"
                          : isSelected
                          ? "bg-red-100/90 border-red-300 text-red-950"
                          : "bg-white/60 border-slate-200 text-slate-500"
                        : "bg-white/90 hover:bg-white border-sky-200 text-slate-800"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium space-y-1 animate-fade-in">
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Scientific Explanation:</span>
                </div>
                <p>{currentQ.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ACTIVITIES
          ========================================================================= */}
      {activeTab === "activities" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Hands-on Polar Science Activities</h2>
            <p className="text-sm text-slate-600 font-medium">Engage in real scientific problem-solving exercises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Calculate Daily Glacier Melt at Himansh",
                desc: "Using a sample 24-hour temperature and radiation record, identify hours where temperature exceeds 0°C to compute melt degree-hours.",
                status: "COMPLETED",
              },
              {
                title: "Compare Wind Speed: Maitri vs Your City",
                desc: "Look up Maitri's live katabatic wind reading (-17°C, 24.5 kts) and compare it against your local weather report.",
                status: "READY TO START",
              },
            ].map((act, i) => (
              <div key={i} className="ice-glass rounded-2xl p-5 border border-white space-y-3">
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">{act.status}</span>
                <h4 className="text-base font-black text-slate-900">{act.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{act.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ARTICLES
          ========================================================================= */}
      {activeTab === "articles" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Simplified Scientific Articles</h2>
            <p className="text-sm text-slate-600 font-medium">Easy-to-understand explanations of breakthrough Indian polar expeditions.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "How India Maintains Year-Round Science at Bharati Station",
                desc: "Learn about the green aerodynamic architecture of Bharati in Larsemann Hills, designed to withstand polar blizzards while leaving zero environmental footprint.",
                author: "NCPOR Outreach Team",
                readTime: "4 min read",
              },
              {
                title: "The Cryospheric Highway: Sutri Dhaka Glacier in Himachal Pradesh",
                desc: "An exploration of why Himansh Station was built at 4,080 meters to understand how melting glaciers impact India's river systems.",
                author: "Glaciology Division",
                readTime: "5 min read",
              },
            ].map((art, idx) => (
              <div key={idx} className="ice-glass rounded-2xl p-5 border border-white space-y-2">
                <div className="text-xs text-slate-500 font-semibold">{art.author} • {art.readTime}</div>
                <h4 className="text-base font-black text-slate-900">{art.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{art.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: VIDEOS
          ========================================================================= */}
      {activeTab === "videos" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Approved Educational Videos</h2>
            <p className="text-sm text-slate-600 font-medium">Watch real expedition documentary footage and station tours.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { id: "-KjMHRfUWC4", title: "Helicopter Arrival at Maitri Station", location: "Schirmacher Oasis, Antarctica" },
              { id: "lNhK69S_LLM", title: "Walkthrough of Green Bharati Station", location: "Larsemann Hills, Antarctica" },
            ].map((v) => (
              <div key={v.id} className="ice-glass rounded-2xl p-4 border border-white space-y-3">
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
                  <div className="text-xs text-slate-500">{v.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: POLAR EXPLORER (INTERACTIVE STATIONS)
          ========================================================================= */}
      {activeTab === "polar_explorer" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Interactive Polar Explorer</h2>
            <p className="text-sm text-slate-600 font-medium">Explore India&apos;s four permanent stations across the globe.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Maitri", region: "Antarctica Inland", year: "1989", elev: "117 m", icon: "❄️" },
              { name: "Bharati", region: "Antarctica Coast", year: "2012", elev: "35 m", icon: "🏛️" },
              { name: "Himadri", region: "Arctic (79°N)", year: "2008", elev: "10 m", icon: "🐻‍❄️" },
              { name: "Himansh", region: "Himalayas", year: "2016", elev: "4,080 m", icon: "🏔️" },
            ].map((st) => (
              <div key={st.name} className="ice-glass rounded-2xl p-5 border border-white space-y-2 text-center">
                <div className="text-3xl">{st.icon}</div>
                <h4 className="text-lg font-black text-slate-900">{st.name}</h4>
                <div className="text-xs text-sky-800 font-bold">{st.region}</div>
                <div className="text-xs text-slate-500">Established {st.year} • Elev: {st.elev}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: WEATHER (PUBLIC POLAR WEATHER)
          ========================================================================= */}
      {activeTab === "weather" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Live Polar Station Weather</h2>
            <p className="text-sm text-slate-600 font-medium">Check real-time temperatures and wind conditions at Indian polar research bases.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: "maitri", name: "Maitri", temp: "-17.0 °C", wind: "24.5 kts", cond: "Katabatic Squall" },
              { id: "bharati", name: "Bharati", temp: "-14.5 °C", wind: "18.2 kts", cond: "Coastal Breeze" },
              { id: "himadri", name: "Himadri", temp: "-4.2 °C", wind: "12.0 kts", cond: "Arctic High" },
              { id: "himansh", name: "Himansh", temp: "-8.5 °C", wind: "15.4 kts", cond: "High Altitude Clear" },
            ].map((st) => (
              <div
                key={st.id}
                onClick={() => setSelectedStation(st.id)}
                className={`ice-glass rounded-2xl p-4 border transition-all cursor-pointer space-y-1 ${
                  selectedStation === st.id ? "border-sky-500 bg-sky-50/70" : "border-white"
                }`}
              >
                <div className="text-xs font-bold text-slate-500 uppercase">{st.name}</div>
                <div className="text-2xl font-black text-sky-900">{st.temp}</div>
                <div className="text-xs text-slate-600">Wind: {st.wind}</div>
                <div className="text-[11px] text-emerald-800 font-medium">{st.cond}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: ASSIGNMENTS
          ========================================================================= */}
      {activeTab === "assignments" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">My Class Assignments</h2>
            <p className="text-sm text-slate-600 font-medium">Submit your homework and review grading comments from your teacher.</p>
          </div>

          <div className="ice-glass rounded-2xl p-6 border border-white space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-800">Grade 9-A Science</span>
              <span className="font-bold text-amber-800">Due: Oct 12, 2026</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Report: Why is Himansh Observatory located at 4,080m in Chandra Basin?
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Write a 150-word report explaining how high elevation allows scientists to observe upper-atmospheric conditions and monitor the benchmark Sutri Dhaka glacier.
            </p>

            {submittedAssignment ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Assignment Submitted Successfully! Under review by teacher.</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <textarea
                  rows={4}
                  placeholder="Type your assignment report here or describe your research findings..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm"
                />
                <button
                  onClick={() => setSubmittedAssignment(true)}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs sm:text-sm hover:bg-sky-700 cursor-pointer shadow-md"
                >
                  Submit Assignment to Teacher →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: PROGRESS
          ========================================================================= */}
      {activeTab === "progress" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl font-black text-slate-950">Learning Progress & Badges</h2>
            <p className="text-sm text-slate-600 font-medium">Track your learning achievements across modules, quizzes, and activities.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Polar Glaciology Master", desc: "Completed Albedo & Mass balance unit", icon: "🏔️" },
              { title: "Antarctic Meteorology Scout", desc: "Completed Katabatic winds challenge", icon: "❄️" },
              { title: "Arctic Telemetry Scholar", desc: "Explored Himadri Station records", icon: "🐻‍❄️" },
            ].map((b, i) => (
              <div key={i} className="ice-glass rounded-2xl p-5 border border-white text-center space-y-2">
                <div className="text-3xl">{b.icon}</div>
                <h4 className="text-base font-black text-slate-900">{b.title}</h4>
                <p className="text-xs text-slate-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 12: PROFILE
          ========================================================================= */}
      {activeTab === "profile" && (
        <div className="ice-glass-strong rounded-3xl p-6 sm:p-10 border border-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-sky-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Student Profile & Clear Boundaries</h2>
            <p className="text-sm text-slate-600 font-medium">Student account status and platform permissions overview.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Student Details</h3>
              <div className="space-y-1.5 text-xs">
                <div><strong className="text-slate-700">Name:</strong> Rahul Verma</div>
                <div><strong className="text-slate-700">Email:</strong> student@vistaar.ncpor.res.in</div>
                <div><strong className="text-slate-700">Role:</strong> STUDENT / PUBLIC_USER</div>
                <div><strong className="text-slate-700">Class:</strong> Grade 9-A Science</div>
                <div><strong className="text-slate-700">School:</strong> Kendriya Vidyalaya Polar Chapter</div>
              </div>
            </div>

            <div className="ice-glass rounded-2xl p-5 border border-white space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Learning Accreditations</h3>
              <div className="space-y-2 text-xs text-slate-700">
                <div><strong className="text-slate-900">Enrollment Status:</strong> Active Junior Polar Explorer</div>
                <div><strong className="text-slate-900">Curriculum Track:</strong> Grade 9-10 Polar Cryosphere & Atmospheric Science</div>
                <div><strong className="text-slate-900">Earned Badges:</strong> Antarctica Scout, Glaciology Novice</div>
                <div><strong className="text-slate-900">Verification:</strong> Kendriya Vidyalaya Polar Outreach Chapter</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
