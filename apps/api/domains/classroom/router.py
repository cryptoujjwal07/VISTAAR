from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
from pydantic import BaseModel
from apps.api.core.database import get_database

router = APIRouter(prefix="/classroom", tags=["VISTAAR Classroom Studio"])

class QuizSubmission(BaseModel):
    lesson_id: str
    answers: List[int] # selected option indices

@router.get("/lessons")
async def list_lessons(class_grade: Optional[int] = Query(None, ge=8, le=12)):
    # Curated real-observation polar lessons for grades 8 to 12
    lessons = [
        {
            "id": "les_cryo_01",
            "title": "Glacial Mass Balance & Third Pole Climate at Himansh",
            "class_grade": 10,
            "subject": "Physics & Environmental Science",
            "station": "Himansh (Spiti Valley, 4080m)",
            "learning_objective": "Understand how solar radiation (incoming vs reflected) governs Himalayan glacier melt.",
            "concept_summary": "At Himansh station, pyranometers measure downwelling solar radiation (sdn_avg) and upwelling radiation (sup_avg). The ratio represents surface albedo.",
            "real_dataset_ref": "ds_himansh_aws",
            "activity": "Calculate the albedo ratio using observed sup_avg and sdn_avg values from the Himansh dataset.",
            "quiz": [
                {
                    "question": "What does a high surface albedo on a Himalayan glacier indicate?",
                    "options": [
                        "Fresh snow reflecting most sunlight back into space",
                        "High rate of solar absorption and glacier melting",
                        "Heavy atmospheric moisture and rain",
                        "High wind speeds blowing debris"
                    ],
                    "correct_index": 0
                },
                {
                    "question": "Why is the Himalayan region referred to as the 'Third Pole'?",
                    "options": [
                        "It has three major mountain ranges",
                        "It contains the largest concentration of snow and ice outside the Arctic and Antarctic",
                        "It was discovered by three Indian polar expeditions",
                        "It experiences three different monsoon seasons"
                    ],
                    "correct_index": 1
                },
                {
                    "question": "At what altitude is India's Himansh research station located?",
                    "options": ["1,200 meters", "2,500 meters", "4,080 meters", "6,200 meters"],
                    "correct_index": 2
                }
            ]
        },
        {
            "id": "les_antarctica_02",
            "title": "Katabatic Winds and Thermal Inversion at Maitri",
            "class_grade": 9,
            "subject": "Geography & Earth Science",
            "station": "Maitri (Schirmacher Oasis, Antarctica)",
            "learning_objective": "Examine extreme temperature swings and high-velocity katabatic winds originating from the Antarctic ice sheet.",
            "concept_summary": "Dense, cold air on the continental polar plateau cascades down toward coastal oasis areas under gravity, creating hurricane-force katabatic wind bursts.",
            "real_dataset_ref": "ds_maitri_imd",
            "activity": "Examine Maitri's wind speed time series to identify sudden gale episodes.",
            "quiz": [
                {
                    "question": "What drives katabatic winds in Antarctica?",
                    "options": [
                        "Dense, chilled air sliding down high slopes under gravitational force",
                        "Ocean tides pushing atmospheric fronts inland",
                        "Geothermal heating at the South Pole",
                        "Solar radiation heating the rocky nunataks"
                    ],
                    "correct_index": 0
                },
                {
                    "question": "Where is India's Maitri station situated?",
                    "options": [
                        "Larsemann Hills",
                        "Schirmacher Oasis",
                        "Svalbard Archipelago",
                        "Chandra Basin"
                    ],
                    "correct_index": 1
                },
                {
                    "question": "In what year was Maitri station commissioned?",
                    "options": ["1981", "1983", "1989", "2012"],
                    "correct_index": 2
                }
            ]
        }
    ]

    if class_grade:
        return [l for l in lessons if l["class_grade"] == class_grade]
    return lessons

@router.get("/lessons/{lesson_id}")
async def get_lesson_detail(lesson_id: str):
    lessons = await list_lessons()
    found = next((l for l in lessons if l["id"] == lesson_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson module not found")
    return found

@router.post("/quiz/submit")
async def evaluate_quiz(sub: QuizSubmission):
    lessons = await list_lessons()
    found = next((l for l in lessons if l["id"] == sub.lesson_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    quiz = found["quiz"]
    score = 0
    feedback = []

    for i, q in enumerate(quiz):
        user_ans = sub.answers[i] if i < len(sub.answers) else -1
        correct = (user_ans == q["correct_index"])
        if correct:
            score += 1
        feedback.append({
            "question_index": i,
            "is_correct": correct,
            "correct_index": q["correct_index"],
            "explanation": f"The verified scientific answer is: '{q['options'][q['correct_index']]}'."
        })

    return {
        "lesson_id": sub.lesson_id,
        "total_questions": len(quiz),
        "score": score,
        "percentage": round((score / len(quiz)) * 100, 1),
        "feedback": feedback
    }
