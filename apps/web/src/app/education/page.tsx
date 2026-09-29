"use client";

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, CheckCircle, XCircle, Award, HelpCircle, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function EducationPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLessons() {
      try {
        const res = await fetchApi("/classroom/lessons");
        setLessons(res);
        if (res.length > 0) {
          setSelectedLesson(res[0]);
          setUserAnswers(new Array(res[0].quiz?.length || 3).fill(-1));
        }
      } catch (e) {
        console.error("Failed to load lessons", e);
      } finally {
        setLoading(false);
      }
    }
    loadLessons();
  }, []);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>NCERT Aligned Polar Science Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            VISTAAR Classroom Studio (Classes 8–12)
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Interactive inquiry-based learning powered by genuine NPDC meteorological and cryospheric measurements.
          </p>
        </div>

        {/* Student vs Teacher Mode Switch */}
        <div className="flex items-center bg-vistaar-surface border border-vistaar-border rounded-lg p-1 shadow-sm">
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

      {/* Main Grid: Lesson Browser & Active Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Lessons List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-vistaar-muted">
            Curriculum Lesson Modules
          </h2>
          <div className="space-y-3">
            {lessons.map((les) => (
              <div
                key={les.id}
                onClick={() => handleSelectLesson(les)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedLesson?.id === les.id
                    ? "border-vistaar-primary bg-white shadow-md ring-1 ring-vistaar-primary/30"
                    : "border-vistaar-border bg-vistaar-surface hover:bg-vistaar-bg"
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

        {/* Right: Active Lesson & Quiz (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLesson ? (
            <Card>
              <CardHeader className="p-6 border-b border-vistaar-border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="scientific">NCERT Class {selectedLesson.class_grade} Science</Badge>
                  <span className="text-xs font-mono text-vistaar-primary font-bold">
                    Dataset: {selectedLesson.real_dataset_ref}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold">{selectedLesson.title}</CardTitle>
                <CardDescription className="text-xs text-vistaar-muted mt-1">
                  Station: <strong>{selectedLesson.station}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Learning Objective */}
                <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-md">
                  <span className="block text-xs font-bold text-vistaar-primary uppercase tracking-wide">
                    Learning Objective
                  </span>
                  <p className="text-xs text-vistaar-text mt-1 leading-relaxed">
                    {selectedLesson.learning_objective}
                  </p>
                </div>

                {/* Concept Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-vistaar-text">Scientific Concept</h4>
                  <p className="text-xs text-vistaar-muted leading-relaxed">
                    {selectedLesson.concept_summary}
                  </p>
                </div>

                {/* Real Polar Observation Activity */}
                <div className="p-4 bg-vistaar-bg border border-vistaar-border rounded-md space-y-2">
                  <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Hands-On Polar Data Activity
                  </span>
                  <p className="text-xs text-vistaar-text leading-relaxed">
                    {selectedLesson.activity}
                  </p>
                </div>

                {/* Interactive 3-Question Quiz */}
                <div className="pt-4 border-t border-vistaar-border space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-vistaar-text flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-vistaar-primary" />
                      <span>Observation Comprehension Quiz (3 Questions)</span>
                    </h4>
                    {isTeacherMode && (
                      <Badge variant="warning">Teacher Answer Key Enabled</Badge>
                    )}
                  </div>

                  <div className="space-y-6">
                    {selectedLesson.quiz?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="space-y-3 bg-vistaar-bg/40 p-4 rounded-lg border border-vistaar-border">
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
                                    ? "border-green-400 bg-green-50 font-semibold text-green-900"
                                    : "border-vistaar-border bg-white text-vistaar-text hover:bg-vistaar-bg"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${qIdx}`}
                                  checked={isSelected}
                                  onChange={() => handleOptionSelect(qIdx, optIdx)}
                                  className="text-vistaar-primary focus:ring-vistaar-primary"
                                />
                                <span>{opt}</span>
                                {isCorrectAnswer && (
                                  <span className="ml-auto text-[10px] uppercase font-bold text-green-700">
                                    Correct Key
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
                      <Button
                        size="md"
                        onClick={handleSubmitQuiz}
                        disabled={userAnswers.includes(-1)}
                      >
                        Submit Quiz for Verification
                      </Button>
                    </div>
                  )}

                  {/* Quiz Results Card */}
                  {quizResult && (
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-green-900">
                          Quiz Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
                        </span>
                        <Badge variant="success">Graded</Badge>
                      </div>
                      <div className="space-y-2 text-xs text-green-950">
                        {quizResult.feedback?.map((fb: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2">
                            {fb.is_correct ? (
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <span>Question {idx + 1}: {fb.explanation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
