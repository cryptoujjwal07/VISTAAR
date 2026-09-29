"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Award,
  User,
  Users,
  Download,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi, API_BASE_URL } from "@/lib/api";

export default function EducationPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [progressMap, setProgressMap] = useState<Record<string, { score: number; total: number; percentage: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vistaar_classroom_progress");
        if (saved) {
          setProgressMap(JSON.parse(saved));
        }
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  useEffect(() => {
    async function loadLessons() {
      setLoading(true);
      try {
        const q = gradeFilter ? `?class_grade=${gradeFilter}` : "";
        const res = await fetchApi(`/classroom/lessons${q}`);
        const list = Array.isArray(res) ? res : [];
        setLessons(list);
        if (list.length > 0) {
          setSelectedLesson(list[0]);
          setUserAnswers(new Array(list[0].quiz?.length || 3).fill(-1));
          setQuizResult(null);
        }
      } catch (e) {
        console.error("Failed to load lessons", e);
      } finally {
        setLoading(false);
      }
    }
    loadLessons();
  }, [gradeFilter]);

  function handleSelectLesson(les: any) {
    setSelectedLesson(les);
    setUserAnswers(new Array(les.quiz?.length || 3).fill(-1));
    setQuizResult(null);
  }

  function handleOptionSelect(qIdx: number, optIdx: number) {
    const updated = [...userAnswers];
    updated[qIdx] = optIdx;
    setUserAnswers(updated);
  }

  async function handleSubmitQuiz() {
    if (!selectedLesson) return;
    try {
      const res = await fetchApi("/classroom/quiz/submit", {
        method: "POST",
        body: JSON.stringify({
          lesson_id: selectedLesson.id,
          answers: userAnswers,
        }),
      });
      setQuizResult(res);
      const nextProgress = {
        ...progressMap,
        [selectedLesson.id]: {
          score: res.score,
          total: res.total_questions,
          percentage: res.percentage,
        },
      };
      setProgressMap(nextProgress);
      if (typeof window !== "undefined") {
        localStorage.setItem("vistaar_classroom_progress", JSON.stringify(nextProgress));
      }
    } catch (e) {
      console.error("Failed to evaluate quiz", e);
    }
  }

  const completedCount = lessons.filter((l) => progressMap[l.id] !== undefined).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const viz = selectedLesson?.real_data_visualization;
  const vizPoints: any[] = viz?.points || [];
  const vizValues = vizPoints.map((p) => Number(p.value));
  const vizMin = vizValues.length > 0 ? Math.min(...vizValues) : 0;
  const vizMax = vizValues.length > 0 ? Math.max(...vizValues) : 1;
  const vizSpan = vizMax - vizMin || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FAF7F0] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-vistaar-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>NCERT Aligned Polar Science Platform (Classes 8–12)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            VISTAAR Classroom Studio
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Interactive inquiry-based lessons grounded in real NPDC meteorological and cryospheric observations with controlled scientific provenance.
          </p>
        </div>

        {/* Grade Filter & Student/Teacher Mode Switch */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-md border border-vistaar-border bg-[#FAF7F0] text-vistaar-text"
          >
            <option value="">All Grades (Classes 8–12)</option>
            <option value="8">Class 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>

          <div className="flex items-center bg-[#FAF7F0] border border-vistaar-border rounded-lg p-1 shadow-xs">
            <button
              onClick={() => setIsTeacherMode(false)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                !isTeacherMode ? "bg-vistaar-primary text-white" : "text-vistaar-muted hover:text-vistaar-text"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Mode</span>
            </button>
            <button
              onClick={() => setIsTeacherMode(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                isTeacherMode ? "bg-vistaar-scientific text-white" : "text-vistaar-muted hover:text-vistaar-text"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Teacher Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Mode Progress Bar */}
      {!isTeacherMode && (
        <div className="bg-white p-4 rounded-xl border border-vistaar-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-vistaar-text">
              <span>Student Curriculum Progress (Classes 8–12)</span>
              <span className="font-mono text-vistaar-primary">
                {completedCount} / {lessons.length} Modules Completed ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#FAF7F0] rounded-full overflow-hidden border border-vistaar-border">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-mono bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Controlled Approved Curriculum</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Lessons List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-vistaar-muted">
            Curriculum Lesson Modules ({lessons.length})
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="p-6 bg-white rounded-lg border border-vistaar-border text-xs text-vistaar-muted text-center">
                Loading approved classroom modules...
              </div>
            ) : (
              lessons.map((les) => {
                const prog = progressMap[les.id];
                return (
                  <div
                    key={les.id}
                    onClick={() => handleSelectLesson(les)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedLesson?.id === les.id
                        ? "border-vistaar-primary bg-white shadow-md ring-1 ring-vistaar-primary/30"
                        : "border-vistaar-border bg-white/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="scientific">Class {les.class_grade}</Badge>
                      {prog ? (
                        <Badge variant="success">
                          Completed • {prog.score}/{prog.total}
                        </Badge>
                      ) : (
                        <span className="text-[11px] font-mono text-vistaar-muted">{les.subject}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-vistaar-text">{les.title}</h3>
                    <p className="text-xs text-vistaar-muted mt-1 font-mono">{les.station}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Lesson, Visualization, Key Terms, Sources & Quiz (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLesson ? (
            <Card className="bg-white border-vistaar-border shadow-xs">
              <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="scientific">NCERT Class {selectedLesson.class_grade}</Badge>
                    <span className="text-xs font-mono text-vistaar-primary font-bold">
                      Dataset: {viz?.dataset_id || selectedLesson.real_dataset_ref}
                    </span>
                    {selectedLesson.provenance?.sha256 && (
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        SHA-256: {selectedLesson.provenance.sha256.slice(0, 12)}...
                      </span>
                    )}
                  </div>
                  {isTeacherMode && (
                    <a
                      href={`${API_BASE_URL}/classroom/lessons/${selectedLesson.id}/export`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Teacher Lesson Plan &amp; Key</span>
                      </Button>
                    </a>
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-vistaar-text">{selectedLesson.title}</CardTitle>
                <CardDescription className="text-xs text-vistaar-muted mt-1">
                  Observatory Station: <strong>{selectedLesson.station}</strong> • Concept:{" "}
                  <strong>{selectedLesson.scientific_concept || selectedLesson.subject}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6 text-xs">
                {/* 1. Learning Objective */}
                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-md">
                  <span className="block text-xs font-bold text-vistaar-primary uppercase tracking-wide">
                    1. Learning Objective
                  </span>
                  <p className="text-vistaar-text mt-1 leading-relaxed">{selectedLesson.learning_objective}</p>
                </div>

                {/* 2. Scientific Concept & Explanation */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-vistaar-text">2. Scientific Concept &amp; Explanation</h4>
                  <p className="text-vistaar-text leading-relaxed">{selectedLesson.concept_summary}</p>
                  {selectedLesson.explanation && (
                    <p className="text-vistaar-muted leading-relaxed">{selectedLesson.explanation}</p>
                  )}
                </div>

                {/* 3. Real Indian Polar Example */}
                {selectedLesson.real_indian_polar_example && (
                  <div className="p-4 bg-[#FAF7F0] border border-vistaar-border rounded-md space-y-1">
                    <span className="block text-xs font-bold text-vistaar-scientific uppercase tracking-wide">
                      3. Real Indian Polar Observatory Case Study
                    </span>
                    <p className="text-vistaar-text leading-relaxed">{selectedLesson.real_indian_polar_example}</p>
                  </div>
                )}

                {/* 4. Real Data Visualization & Student Activity (Prompt 19) */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-emerald-700" />
                      <span>4. Real Indian Polar Data Visualization &amp; Activity</span>
                    </span>
                    <Link
                      href={`/weather?station=${selectedLesson.station_id || "himansh"}`}
                      className="inline-flex items-center text-[11px] font-semibold text-vistaar-primary hover:underline"
                    >
                      Open Full Weather Telemetry <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>

                  {vizPoints.length > 0 && (
                    <div className="bg-white p-3.5 rounded-lg border border-vistaar-border space-y-2">
                      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-vistaar-muted">
                        <span>
                          Parameter: <strong className="text-vistaar-text">{viz.parameter}</strong> ({viz.unit}) • Station:{" "}
                          <strong className="text-vistaar-text">{viz.station_id?.toUpperCase()}</strong>
                        </span>
                        <span>
                          Min: <strong>{viz.statistics?.min} {viz.unit}</strong> | Max:{" "}
                          <strong>{viz.statistics?.max} {viz.unit}</strong> | Mean:{" "}
                          <strong>{viz.statistics?.avg} {viz.unit}</strong>
                        </span>
                      </div>
                      <div className="h-24 flex items-end gap-1 pt-2 px-1 border-b border-vistaar-border/60">
                        {vizPoints.map((pt: any, idx: number) => {
                          const normHeight = Math.max(
                            14,
                            Math.round(((Number(pt.value) - vizMin) / vizSpan) * 76)
                          );
                          return (
                            <div
                              key={idx}
                              title={`${pt.timestamp}: ${pt.value} ${pt.unit} (${pt.record_id})`}
                              className="flex-1 bg-vistaar-primary/80 hover:bg-vistaar-primary rounded-t transition-all"
                              style={{ height: `${normHeight}px` }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-vistaar-muted">
                        <span>Start: {vizPoints[0]?.timestamp?.slice(0, 16)}</span>
                        <span>Source File: {viz.original_filename || viz.dataset_id}</span>
                        <span>End: {vizPoints[vizPoints.length - 1]?.timestamp?.slice(0, 16)}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-vistaar-text leading-relaxed">
                    <strong>Classroom Activity:</strong> {selectedLesson.activity}
                  </p>
                </div>

                {/* 5. Key Terms Glossary */}
                {selectedLesson.key_terms && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-vistaar-text">5. Key Scientific Terms</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedLesson.key_terms.map((kt: any, i: number) => (
                        <div key={i} className="p-3 rounded border border-vistaar-border bg-[#FAF7F0]">
                          <strong className="block text-vistaar-primary mb-1">{kt.term}</strong>
                          <span className="text-[11px] text-vistaar-muted leading-snug block">{kt.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Interactive 3-Question Quiz */}
                <div className="pt-4 border-t border-vistaar-border space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-vistaar-text flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-vistaar-primary" />
                      <span>6. Observation Comprehension Quiz (3 Questions — Approved Content Only)</span>
                    </h4>
                    {isTeacherMode && <Badge variant="warning">Teacher Answer Key Enabled</Badge>}
                  </div>

                  <div className="space-y-4">
                    {selectedLesson.quiz?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="space-y-2.5 bg-[#FAF7F0]/60 p-4 rounded-lg border border-vistaar-border">
                        <span className="text-xs font-bold text-vistaar-text block">
                          Q{qIdx + 1}. {q.question}
                        </span>
                        <div className="space-y-2">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isSelected = userAnswers[qIdx] === optIdx;
                            const isCorrectAnswer = isTeacherMode && q.correct_index === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center space-x-2.5 p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                                  isSelected
                                    ? "border-vistaar-primary bg-blue-50 font-semibold text-vistaar-primary"
                                    : isCorrectAnswer
                                    ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-900"
                                    : "border-vistaar-border bg-white text-vistaar-text hover:bg-[#FAF7F0]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${qIdx}`}
                                  checked={isSelected}
                                  onChange={() => handleOptionSelect(qIdx, optIdx)}
                                />
                                <span>{opt}</span>
                                {isCorrectAnswer && (
                                  <span className="ml-auto text-[10px] uppercase font-bold text-emerald-700">
                                    Verified Answer Key
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isTeacherMode && (
                    <div className="flex justify-end">
                      <Button size="md" onClick={handleSubmitQuiz} disabled={userAnswers.includes(-1)}>
                        Submit Quiz for Verification
                      </Button>
                    </div>
                  )}

                  {quizResult && (
                    <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-emerald-900">
                          Quiz Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
                        </span>
                        <Badge variant="success">Verified &amp; Saved to Progress</Badge>
                      </div>
                      <div className="space-y-2 text-xs text-emerald-950">
                        {quizResult.feedback?.map((fb: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2">
                            {fb.is_correct ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            )}
                            <span>
                              Question {idx + 1}: {fb.explanation}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Authoritative Sources */}
                {selectedLesson.sources && (
                  <div className="pt-3 border-t border-vistaar-border text-[11px] font-mono text-vistaar-muted space-y-1">
                    <strong className="uppercase text-vistaar-text block">7. Authoritative Scientific Sources &amp; Provenance:</strong>
                    {selectedLesson.sources.map((src: string, idx: number) => (
                      <div key={idx}>• {src}</div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="py-20 text-center text-sm text-vistaar-muted">
              Select a lesson from the list to begin learning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
