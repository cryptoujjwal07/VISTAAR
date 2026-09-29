from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel
from apps.api.core.database import get_database

router = APIRouter(prefix="/classroom", tags=["VISTAAR Classroom Studio"])


class QuizSubmission(BaseModel):
    lesson_id: str
    answers: List[int]


CURATED_POLAR_LESSONS: List[Dict[str, Any]] = [
    {
        "id": "les_cryo_01",
        "title": "Glacial Mass Balance & Third Pole Climate at Himansh",
        "class_grade": 10,
        "subject": "Physics & Environmental Science",
        "station": "Himansh (Spiti Valley, 4,080 m)",
        "station_id": "himansh",
        "learning_objective": "Understand how solar radiation (incoming vs reflected) and temperature govern Himalayan glacier mass balance.",
        "scientific_concept": "Surface Albedo & Cryospheric Energy Balance",
        "concept_summary": "At Himansh station in the Chandra Basin, calibrated pyranometers and thermistors measure surface air temperature and solar radiation. The ratio of upwelling to downwelling shortwave radiation defines surface albedo (α).",
        "explanation": "Fresh snow has a high albedo (α ≈ 0.80–0.90), reflecting most incoming solar energy. As summer ablation exposes darker glacier ice (α ≈ 0.30–0.45), solar absorption accelerates meltwater runoff into the Indus basin.",
        "real_indian_polar_example": "NCPOR's Himansh station (commissioned 2016 at 4,080 m a.s.l. in Spiti Valley) continuously monitors Sutri Dhaka and Batal glaciers using Automatic Weather Stations (AWS) and ablation stakes.",
        "real_dataset_ref": "ds_himansh_aws",
        "visualization_parameter": "tempr",
        "activity": "Inspect the Himansh AWS temperature time series to identify sub-zero accumulation periods vs positive degree-day ablation windows.",
        "key_terms": [
            {"term": "Surface Albedo (α)", "definition": "Ratio of reflected solar radiation to incident solar radiation at the cryosphere surface."},
            {"term": "Mass Balance (m w.e.)", "definition": "Net gain or loss of glacier ice mass over a hydrological year, expressed in meters of water equivalent."},
            {"term": "Third Pole", "definition": "The Hindu Kush–Himalaya–Tibetan Plateau region holding the largest ice mass outside the polar regions."},
        ],
        "sources": [
            "National Polar Data Centre (NPDC), MoES — Himansh AWS Telemetry Dataset (ds_himansh_aws)",
            "NCPOR Technical Report: Cryosphere Mass Balance & AWS Telemetry in the Chandra Basin (doc_himansh_glaciology_2023)",
        ],
        "quiz": [
            {
                "question": "What does a high surface albedo on a Himalayan glacier indicate?",
                "options": [
                    "Fresh snow reflecting most sunlight back into space",
                    "High rate of solar absorption and glacier melting",
                    "Heavy atmospheric moisture and rain",
                    "High wind speeds blowing debris",
                ],
                "correct_index": 0,
            },
            {
                "question": "Why is the Himalayan region referred to as the 'Third Pole'?",
                "options": [
                    "It has three major mountain ranges",
                    "It contains the largest concentration of snow and ice outside the Arctic and Antarctic",
                    "It was discovered by three Indian polar expeditions",
                    "It experiences three different monsoon seasons",
                ],
                "correct_index": 1,
            },
            {
                "question": "At what altitude is India's Himansh research station located?",
                "options": ["1,200 meters", "2,500 meters", "4,080 meters", "6,200 meters"],
                "correct_index": 2,
            },
        ],
    },
    {
        "id": "les_antarctica_02",
        "title": "Katabatic Winds and Thermal Inversion at Maitri",
        "class_grade": 9,
        "subject": "Geography & Atmospheric Physics",
        "station": "Maitri (Schirmacher Oasis, East Antarctica)",
        "station_id": "maitri",
        "learning_objective": "Examine extreme polar temperature inversions and gravity-driven katabatic wind dynamics on the East Antarctic plateau.",
        "scientific_concept": "Gravity-Driven Katabatic Flow & Barometric Gradients",
        "concept_summary": "Radiative cooling over the high East Antarctic ice sheet creates a dense, intensely cold surface air layer that accelerates downslope toward coastal oases like Schirmacher Oasis.",
        "explanation": "Because cold air is denser than warmer ambient air aloft, gravitational acceleration pulls the air mass down the ice-sheet topography, producing sustained high-velocity katabatic winds recorded by Maitri's meteorological towers.",
        "real_indian_polar_example": "India's second Antarctic research base, Maitri (70°45'58\"S, 11°43'56\"E), logs continuous synoptic weather observations across Schirmacher Oasis and Lake Priyadarshini.",
        "real_dataset_ref": "ds_maitri_imd",
        "visualization_parameter": "tempr",
        "activity": "Compare Maitri's observed surface wind speed and barometric pressure drops during Antarctic blizzard events.",
        "key_terms": [
            {"term": "Katabatic Wind", "definition": "High-density cold air flowing downslope from polar ice plateaus under gravitational force."},
            {"term": "Schirmacher Oasis", "definition": "A 35 km² ice-free rocky plateau in Queen Maud Land hosting India's Maitri station."},
            {"term": "Thermal Inversion", "definition": "Atmospheric layer where temperature increases with altitude due to intense radiative surface cooling."},
        ],
        "sources": [
            "National Polar Data Centre (NPDC), MoES — Maitri Surface Meteorological Dataset",
            "NCPOR / IMD Technical Bulletin: Meteorological & Katabatic Wind Observations at Maitri Station (doc_test_polar_maitri)",
        ],
        "quiz": [
            {
                "question": "What drives katabatic winds in Antarctica?",
                "options": [
                    "Dense, chilled air sliding down high slopes under gravitational force",
                    "Ocean tides pushing atmospheric fronts inland",
                    "Geothermal heating at the South Pole",
                    "Solar radiation heating the rocky nunataks",
                ],
                "correct_index": 0,
            },
            {
                "question": "Where is India's Maitri station situated?",
                "options": ["Larsemann Hills", "Schirmacher Oasis", "Svalbard Archipelago", "Chandra Basin"],
                "correct_index": 1,
            },
            {
                "question": "In what year was Maitri station commissioned?",
                "options": ["1981", "1983", "1989", "2012"],
                "correct_index": 2,
            },
        ],
    },
    {
        "id": "les_arctic_03",
        "title": "Arctic Amplification & Fjord Hydrometeorology at Himadri",
        "class_grade": 11,
        "subject": "Earth Sciences & Climatology",
        "station": "Himadri (Ny-Ålesund, Svalbard, Arctic)",
        "station_id": "himadri",
        "learning_objective": "Analyze Arctic precipitation phase transitions and teleconnections with the Indian Summer Monsoon.",
        "scientific_concept": "Arctic Amplification & Disdrometer Microphysics",
        "concept_summary": "Laser optical disdrometers (OTT-PARSIVEL) and micro rain radars at Himadri measure hydrometeor size, fall velocity, and precipitation intensity at 79°N.",
        "explanation": "Rapid sea-ice loss in the Barents–Kara Sea alters meridional temperature gradients and Rossby wave propagation, linking high-Arctic warming to extreme rainfall variability over South Asia.",
        "real_indian_polar_example": "Commissioned in 2008 at Ny-Ålesund (Svalbard) and upgraded for year-round winter expeditions in 2023, Himadri operates alongside the IndARC sub-surface mooring in Kongsfjorden.",
        "real_dataset_ref": "ds_himadri_parsivel",
        "visualization_parameter": "intensity",
        "activity": "Examine precipitation intensity records from Himadri's disdrometer to distinguish snow vs liquid rain episodes in the Arctic.",
        "key_terms": [
            {"term": "Arctic Amplification", "definition": "Faster surface warming of the Arctic relative to the global average due to sea-ice albedo feedback."},
            {"term": "Optical Disdrometer", "definition": "Laser sensor measuring individual raindrop and snowflake diameter and fall velocity."},
            {"term": "IndARC Mooring", "definition": "India's sub-surface oceanographic observatory deployed in Kongsfjorden, Svalbard."},
        ],
        "sources": [
            "National Polar Data Centre (NPDC) — Himadri Disdrometer & MRR-2 Precipitation Telemetry",
        ],
        "quiz": [
            {
                "question": "Which instrument at Himadri measures raindrop size and velocity using a laser beam?",
                "options": [
                    "OTT-PARSIVEL Optical Disdrometer",
                    "Seismograph",
                    "Bathythermograph",
                    "Fluxgate Magnetometer",
                ],
                "correct_index": 0,
            },
            {
                "question": "Where is India's Arctic station Himadri located?",
                "options": ["Greenland", "Ny-Ålesund, Svalbard (79°N)", "Reykjavik, Iceland", "Baffin Island"],
                "correct_index": 1,
            },
            {
                "question": "What is the name of India's underwater moored observatory in Kongsfjorden?",
                "options": ["Sagar Kanya", "IndARC", "Dakshin Gangotri", "Samudra"],
                "correct_index": 1,
            },
        ],
    },
    {
        "id": "les_bharati_04",
        "title": "Boundary Layer Profiling & Sea-Ice Dynamics at Bharati",
        "class_grade": 12,
        "subject": "Atmospheric Physics & Oceanography",
        "station": "Bharati (Larsemann Hills, Antarctica)",
        "station_id": "bharati",
        "learning_objective": "Evaluate coastal Antarctic boundary-layer humidity, pressure, and microwave radiometer temperature profiles.",
        "scientific_concept": "Tropospheric Profiling & Coastal Polynya Exchange",
        "concept_summary": "Bharati station utilizes multi-channel microwave radiometers (HATPRO) and AWS sensors to profile atmospheric temperature and relative humidity up to 10 km altitude.",
        "explanation": "Positioned along the Amery Ice Shelf and Prydz Bay sector in Larsemann Hills, Bharati tracks air–sea–ice heat fluxes that drive Antarctic Bottom Water formation.",
        "real_indian_polar_example": "Commissioned in March 2012, Bharati is India's third Antarctic research station, engineered as an aerodynamic, zero-emission modular structure on stilts.",
        "real_dataset_ref": "ds_bharati_hatpro",
        "visualization_parameter": "rh",
        "activity": "Inspect Bharati's relative humidity and barometric pressure series across coastal synoptic cyclone passages.",
        "key_terms": [
            {"term": "Microwave Radiometer", "definition": "Passive remote-sensing instrument measuring atmospheric brightness temperatures to retrieve humidity and thermal profiles."},
            {"term": "Larsemann Hills", "definition": "An ice-free coastal oasis along Prydz Bay in East Antarctica where Bharati station operates."},
            {"term": "Polynya", "definition": "An area of persistent open water surrounded by sea ice, critical for ocean–atmosphere heat exchange."},
        ],
        "sources": [
            "National Polar Data Centre (NPDC) — Bharati Station Atmospheric & Radiometer Dataset",
        ],
        "quiz": [
            {
                "question": "In which Antarctic coastal oasis is India's Bharati station located?",
                "options": ["Larsemann Hills", "McMurdo Dry Valleys", "Schirmacher Oasis", "Bunger Hills"],
                "correct_index": 0,
            },
            {
                "question": "What does the HATPRO Microwave Radiometer at Bharati measure?",
                "options": [
                    "Deep bedrock seismic waves",
                    "Vertical profiles of atmospheric temperature and humidity",
                    "Ocean floor bathymetry",
                    "Ice core isotope ratios",
                ],
                "correct_index": 1,
            },
            {
                "question": "In what year was Bharati station commissioned?",
                "options": ["1983", "1995", "2012", "2021"],
                "correct_index": 2,
            },
        ],
    },
    {
        "id": "les_intro_05",
        "title": "Introduction to India's Polar Missions & Weather Instruments",
        "class_grade": 8,
        "subject": "General Science",
        "station": "All Indian Polar Stations (Maitri, Bharati, Himadri, Himansh)",
        "station_id": "himansh",
        "learning_objective": "Identify how thermometer, barometer, anemometer, and hygrometer sensors operate in extreme sub-zero environments.",
        "scientific_concept": "Automated Meteorological Instrumentation & Units",
        "concept_summary": "Polar weather stations use automated electronic sensors to log temperature (°C), atmospheric pressure (hPa), wind speed (m/s or knots), and relative humidity (%) every hour.",
        "explanation": "Because extreme blizzards and polar nights make manual readings dangerous, Automatic Weather Stations (AWS) transmit calibrated data via satellite to NCPOR in Goa.",
        "real_indian_polar_example": "The National Centre for Polar and Ocean Research (NCPOR) in Vasco da Gama, Goa archives all Indian polar observations in the National Polar Data Centre (NPDC).",
        "real_dataset_ref": "ds_himansh_aws",
        "visualization_parameter": "tempr",
        "activity": "Compare standard SI meteorological units (°C, hPa, m/s, %) and convert wind speeds between knots and m/s.",
        "key_terms": [
            {"term": "Anemometer", "definition": "Instrument used to measure wind speed (calibrated in m/s or knots)."},
            {"term": "Barometer (hPa)", "definition": "Sensor measuring atmospheric pressure in hectopascals (hPa)."},
            {"term": "NPDC", "definition": "National Polar Data Centre at NCPOR, Goa — India's official repository for polar science data."},
        ],
        "sources": [
            "National Polar Data Centre (NPDC), NCPOR / Ministry of Earth Sciences",
        ],
        "quiz": [
            {
                "question": "Which standard unit is used by NCPOR weather stations to measure atmospheric pressure?",
                "options": ["Hectopascals (hPa)", "Degrees Celsius (°C)", "Knots (kt)", "Watts per square meter (W/m²)"],
                "correct_index": 0,
            },
            {
                "question": "Where is the headquarters of India's National Centre for Polar and Ocean Research (NCPOR)?",
                "options": ["New Delhi", "Vasco da Gama, Goa", "Chennai", "Shimla"],
                "correct_index": 1,
            },
            {
                "question": "Why are Automatic Weather Stations (AWS) essential in Antarctica and the Himalayas?",
                "options": [
                    "They warm up the surrounding snow",
                    "They continuously record calibrated measurements during extreme blizzards and polar nights",
                    "They replace research vessels",
                    "They melt ice cores automatically",
                ],
                "correct_index": 1,
            },
        ],
    },
]


@router.get("/lessons")
async def list_lessons(class_grade: Optional[int] = Query(None, ge=8, le=12)):
    if class_grade:
        return [l for l in CURATED_POLAR_LESSONS if l["class_grade"] == class_grade]
    return CURATED_POLAR_LESSONS


@router.get("/lessons/{lesson_id}")
async def get_lesson_detail(lesson_id: str):
    found = next((l for l in CURATED_POLAR_LESSONS if l["id"] == lesson_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson module not found")
    return found


@router.get("/lessons/{lesson_id}/export")
async def export_teacher_lesson_plan(lesson_id: str):
    """Generates printable Teacher Lesson Plan with answer key and NPDC source references (Prompt 19 & 32)."""
    found = next((l for l in CURATED_POLAR_LESSONS if l["id"] == lesson_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson module not found")

    terms_html = "".join(
        f"<li><strong>{t['term']}:</strong> {t['definition']}</li>" for t in found.get("key_terms", [])
    )
    quiz_html = "".join(
        f"<div style='margin-bottom:12px;'><strong>Q{i+1}. {q['question']}</strong><br/>"
        f"<em>Verified Answer Key:</em> {q['options'][q['correct_index']]}</div>"
        for i, q in enumerate(found.get("quiz", []))
    )
    sources_html = "".join(f"<li>{s}</li>" for s in found.get("sources", []))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Teacher Lesson Plan — {found['title']}</title>
<style>
  body {{ font-family: Georgia, serif; background: #FAF7F0; color: #17202A; margin: 36px; line-height: 1.6; }}
  .sheet {{ max-width: 820px; margin: auto; background: #FFFFFF; border: 1px solid #E7E0D5; padding: 36px; border-radius: 8px; }}
  .badge {{ display: inline-block; background: #DBEAFE; color: #1E40AF; padding: 4px 10px; font-family: monospace; font-size: 12px; border-radius: 4px; }}
  h1 {{ color: #0E7490; font-size: 22px; margin-top: 10px; }}
  h2 {{ color: #2563EB; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #E7E0D5; padding-bottom: 4px; margin-top: 22px; }}
  .box {{ background: #FAF7F0; border: 1px solid #E7E0D5; padding: 14px; border-radius: 6px; margin-top: 10px; font-size: 14px; }}
</style>
</head>
<body>
  <div class="sheet">
    <span class="badge">NCPOR VISTAAR CLASSROOM STUDIO • NCERT CLASS {found['class_grade']} ({found['subject']})</span>
    <h1>{found['title']}</h1>
    <p><strong>Observatory Station:</strong> {found['station']} | <strong>NPDC Dataset Reference:</strong> <code>{found['real_dataset_ref']}</code></p>
    <h2>1. Learning Objective</h2>
    <p>{found['learning_objective']}</p>
    <h2>2. Scientific Concept & Explanation</h2>
    <p><strong>{found['scientific_concept']}:</strong> {found['concept_summary']}</p>
    <p>{found['explanation']}</p>
    <h2>3. Real Indian Polar Observatory Case Study</h2>
    <div class="box">{found['real_indian_polar_example']}</div>
    <h2>4. Student Data Activity</h2>
    <div class="box">{found['activity']}</div>
    <h2>5. Key Scientific Terms</h2>
    <ul>{terms_html}</ul>
    <h2>6. Teacher Quiz & Verified Answer Key</h2>
    <div class="box">{quiz_html}</div>
    <h2>7. Authoritative Scientific Sources</h2>
    <ul>{sources_html}</ul>
  </div>
</body>
</html>"""
    return Response(content=html, media_type="text/html")


@router.post("/quiz/submit")
async def evaluate_quiz(sub: QuizSubmission):
    found = next((l for l in CURATED_POLAR_LESSONS if l["id"] == sub.lesson_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    quiz = found["quiz"]
    score = 0
    feedback = []

    for i, q in enumerate(quiz):
        user_ans = sub.answers[i] if i < len(sub.answers) else -1
        correct = user_ans == q["correct_index"]
        if correct:
            score += 1
        feedback.append({
            "question_index": i,
            "is_correct": correct,
            "correct_index": q["correct_index"],
            "explanation": f"Verified scientific answer: '{q['options'][q['correct_index']]}' (Source: {found['real_dataset_ref']}).",
        })

    return {
        "lesson_id": sub.lesson_id,
        "total_questions": len(quiz),
        "score": score,
        "percentage": round((score / len(quiz)) * 100, 1),
        "sources": found.get("sources", []),
        "feedback": feedback,
    }
