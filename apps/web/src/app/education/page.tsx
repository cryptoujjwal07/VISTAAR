"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Award,
  User,
  Users,
  Download,
  BookOpen,
  ShieldCheck
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLessons() {
      setLoading(true);
      try {
        const q = gradeFilter ? `?class_grade=${gradeFilter}` : "";
        const res = await fetchApi(`/classroom/lessons${q}`);
        setLessons(res);
        if (res.length > 0) {
          setSelectedLesson(res[0]);
          setUserAnswers(new Array(res[0].quiz?.length || 3).fill(-1));
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
    } catch (e) {
      console.error("Failed to evaluate quiz", e);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FAF7F0] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-vistaar-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>NCERT Aligned Polar Science Platform (Classes 8–12)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            VISTAAR Classroom Studio
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Interactive inquiry-based lessons grounded in real NPDC meteorological and cryospheric observations.
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Lessons List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-vistaar-muted">
            Curriculum Lesson Modules ({lessons.length})
          </h2>
          <div className="space-y-3">
            {lessons.map((les) => (
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
                  <span className="text-[11px] font-mono text-vistaar-muted">{les.subject}</span>
                </div>
                <h3 className="font-bold text-sm text-vistaar-text">{les.title}</h3>
                <p className="text-xs text-vistaar-muted mt-1 font-mono">{les.station}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Lesson, Key Terms, Sources & Quiz (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLesson ? (
            <Card className="bg-white border-vistaar-border shadow-sm">
              <CardHeader className="p-6 border-b border-vistaar-border bg-[#FAF7F0]/50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="scientific">NCERT Class {selectedLesson.class_grade}</Badge>
                    <span className="text-xs font-mono text-vistaar-primary font-bold">
                      Dataset: {selectedLesson.real_dataset_ref}
                    </span>
                  </div>
                  {isTeacherMode && (
                    <a
                      href={`${API_BASE_URL}/classroom/lessons/${selectedLesson.id}/export`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Teacher Lesson Plan & Key</span>
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
                  <h4 className="text-sm font-bold text-vistaar-text">2. Scientific Concept & Explanation</h4>
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

                {/* 4. Hands-On Polar Data Activity */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-md space-y-1">
                  <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    4. Hands-On Polar Data Activity
                  </span>
                  <p className="text-vistaar-text leading-relaxed">{selectedLesson.activity}</p>
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
                      <span>6. Observation Comprehension Quiz (3 Questions)</span>
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
                        <Badge variant="success">Verified</Badge>
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
                    <strong className="uppercase text-vistaar-text block">Authoritative Scientific Sources:</strong>
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
