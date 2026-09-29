import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app


@pytest.mark.asyncio
async def test_station_explorer_and_weather_intelligence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for sid in ["maitri", "bharati", "himadri", "himansh"]:
            res = await client.get(f"/api/v1/weather/stations/{sid}/explorer")
            assert res.status_code == 200
            data = res.json()
            assert data["station"]["id"] == sid
            assert "expeditions" in data
            assert "datasets" in data
            assert "documents" in data
            assert "weather_summary" in data
            assert "research_topics" in data
            assert len(data["expeditions"]) >= 1

        # Expedition directory & relational explorer (Prompt 18)
        exps_res = await client.get("/api/v1/weather/expeditions")
        assert exps_res.status_code == 200
        exps = exps_res.json()
        assert len(exps) >= 3
        assert "counts" in exps[0]

        exp_graph_res = await client.get("/api/v1/weather/expeditions/isea-43/explorer")
        assert exp_graph_res.status_code == 200
        exp_graph = exp_graph_res.json()
        assert exp_graph["expedition"]["id"] == "isea-43"
        assert len(exp_graph["timeline"]) >= 3
        assert len(exp_graph["scientific_topics"]) >= 1
        assert "datasets" in exp_graph
        assert "documents" in exp_graph
        assert "media_assets" in exp_graph
        assert "related_education" in exp_graph
        assert "related_public_content" in exp_graph
        assert "provenance" in exp_graph

        # Weather timeseries with missing data integrity
        tel = await client.get("/api/v1/weather/timeseries?station_id=maitri&limit=24")
        assert tel.status_code == 200
        tel_data = tel.json()
        assert tel_data["station_id"] == "maitri"
        assert "statistics" in tel_data
        assert "missing_count" in tel_data["statistics"]
        assert "source_citation" in tel_data



@pytest.mark.asyncio
async def test_classroom_and_printable_teacher_export():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/classroom/lessons")
        assert res.status_code == 200
        lessons = res.json()
        assert isinstance(lessons, list)
        assert len(lessons) >= 5
        # Classes 8-12 must all be supported (Prompt 19)
        grades = {l["class_grade"] for l in lessons}
        assert {8, 9, 10, 11, 12}.issubset(grades)

        first = lessons[0]
        for field in [
            "learning_objective",
            "scientific_concept",
            "explanation",
            "real_indian_polar_example",
            "real_data_visualization",
            "activity",
            "key_terms",
            "quiz",
            "sources",
            "provenance",
        ]:
            assert field in first
        assert len(first["quiz"]) == 3
        assert first["provenance"]["controlled_quiz_source"] is True

        lesson_id = first["id"]
        # Submit quiz in student mode
        quiz_res = await client.post(
            "/api/v1/classroom/quiz/submit",
            json={"lesson_id": lesson_id, "answers": [0, 1, 2]},
        )
        assert quiz_res.status_code == 200
        quiz_data = quiz_res.json()
        assert quiz_data["score"] == 3
        assert quiz_data["percentage"] == 100.0
        assert quiz_data["passed"] is True

        # Printable teacher lesson plan & answer key export
        exp = await client.get(f"/api/v1/classroom/lessons/{lesson_id}/export")
        assert exp.status_code == 200
        assert "text/html" in exp.headers["content-type"]
        assert "NCPOR" in exp.text
        assert "Real Data Visualization" in exp.text



@pytest.mark.asyncio
async def test_media_library_and_press_kit_builder():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        assets = await client.get("/api/v1/media/assets")
        assert assets.status_code == 200
        items = assets.json()
        assert isinstance(items, list)
        # Restricted assets must be hidden from public requests by default
        assert all(not a.get("restricted", False) for a in items)
        assert all(a["asset_id"] != "med_restricted_embargo_raw" for a in items)

        # Verify all 6 media types supported (Prompt 20)
        media_types = {a["media_type"] for a in items}
        assert {"IMAGE", "VIDEO", "FIGURE", "INFOGRAPHIC", "DOCUMENT", "SOCIAL_ASSET"}.issubset(media_types)

        # Verify required metadata & related links
        sample = items[0]
        for field in [
            "asset_id",
            "source",
            "provider",
            "creator",
            "station",
            "expedition",
            "date",
            "caption",
            "description",
            "license",
            "rights_metadata",
            "source_reference",
            "related_links",
        ]:
            assert field in sample

        # Verify filters: station, expedition, topic, media_type, date, source
        filt_res = await client.get(
            "/api/v1/media/assets?station_id=maitri&expedition_id=isea-43&media_type=VIDEO&date=2024&source=NCPOR"
        )
        assert filt_res.status_code == 200
        filt_items = filt_res.json()
        assert len(filt_items) == 1
        assert filt_items[0]["asset_id"] == "med_video_expedition_43"

        # Direct access to restricted asset must return 403 Forbidden
        rest_res = await client.get("/api/v1/media/assets/med_restricted_embargo_raw")
        assert rest_res.status_code == 403

        # Permitted download endpoint
        dl_res = await client.get("/api/v1/media/assets/med_bharati_ext/download")
        assert dl_res.status_code == 200
        assert "PERMITTED MEDIA DOWNLOAD" in dl_res.text

        kit_json = await client.get(
            "/api/v1/media/press-kit?station_id=maitri&expedition_id=isea-43&topic=Katabatic+Wind&start_date=2023-01-01&end_date=2024-12-31"
        )
        assert kit_json.status_code == 200
        kit_data = kit_json.json()
        assert "verified_statistics" in kit_data
        assert len(kit_data["verified_statistics"]) >= 1
        assert "sha256" in kit_data["verified_statistics"][0]["provenance"]
        assert kit_data["release_status"] in ["APPROVED", "PUBLISHED"]
        assert kit_data["governance_status"]["supported_labels"] == [
            "DRAFT",
            "REVIEWED",
            "APPROVED",
            "PUBLISHED",
        ]
        assert "approved_images_and_charts" in kit_data
        assert "source_references" in kit_data

        pk = await client.get("/api/v1/media/press-kit/download?station_id=maitri")
        assert pk.status_code == 200
        assert "Accredited Journalist Press Kit" in pk.text

        pk_pdf = await client.get("/api/v1/media/press-kit/download?station_id=maitri&format=pdf")
        assert pk_pdf.status_code == 200
        assert pk_pdf.headers["content-type"] == "application/pdf"
        assert pk_pdf.content.startswith(b"%PDF-")




@pytest.mark.asyncio
async def test_unified_search_autocomplete_and_rag():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        s_res = await client.get("/api/v1/search?q=Maitri")
        assert s_res.status_code == 200
        s_data = s_res.json()
        assert s_data["total_matches"] >= 1
        assert "facets" in s_data

        auto = await client.get("/api/v1/search/autocomplete?q=mait")
        assert auto.status_code == 200
        assert len(auto.json()["suggestions"]) >= 1

        rag = await client.post("/api/v1/search/rag", json={"query": "Maitri temperature", "top_k": 3})
        assert rag.status_code == 200
        rag_data = rag.json()
        assert "answer" in rag_data
        assert "citations" in rag_data


@pytest.mark.asyncio
async def test_security_headers_and_observability_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        health = await client.get("/health")
        assert health.status_code == 200
        assert health.headers.get("X-Content-Type-Options") == "nosniff"
        assert health.headers.get("X-Frame-Options") == "DENY"

        metrics = await client.get("/health/metrics")
        assert metrics.status_code == 200
        m_data = metrics.json()
        assert "collections" in m_data
        assert "counts" in m_data
        assert "ai_telemetry" in m_data
        assert "storage" in m_data


@pytest.mark.asyncio
async def test_prompt_17_public_portal_isolation_and_published_feed():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Internal workspace list contains items across statuses (including DRAFT / NEEDS_REVIEW)
        internal_res = await client.get("/api/v1/publications")
        assert internal_res.status_code == 200
        internal_items = internal_res.json()["items"]
        unapproved_ids = {
            item["id"] for item in internal_items if item.get("status") != "PUBLISHED"
        }

        # Public feed must strictly exclude DRAFT / AI_GENERATED / NEEDS_REVIEW items
        pub_res = await client.get("/api/v1/publications/published")
        assert pub_res.status_code == 200
        pub_items = pub_res.json()
        assert len(pub_items) >= 1
        assert all(item["status"] == "PUBLISHED" for item in pub_items)
        assert all(item["id"] not in unapproved_ids for item in pub_items)


@pytest.mark.asyncio
async def test_prompt_22_bhashini_localization_and_numerical_preservation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        langs_res = await client.get("/api/v1/localization/languages")
        assert langs_res.status_code == 200
        langs_data = langs_res.json()
        assert langs_data["translation_provider_abstraction"] == "TranslationProvider"
        assert "hi" in langs_data["supported_languages"]
        assert "ta" in langs_data["supported_languages"]

        src_text = (
            "National Centre for Polar and Ocean Research confirmed Temperature of -38.4 °C "
            "and Pressure of 985.2 hPa at Maitri in Schirmacher Oasis from dataset ds_maitri_imd."
        )
        tr_res = await client.post(
            "/api/v1/localization/translate",
            json={"text": src_text, "target_language": "hi", "source_language": "en"},
        )
        assert tr_res.status_code == 200
        tr_data = tr_res.json()
        assert tr_data["validation_passed"] is True
        assert tr_data["terminology_validation_passed"] is True
        assert tr_data["numerical_preservation_passed"] is True
        assert len(tr_data["claim_segments"]) >= 1
        # Verify numbers, units, station, and dataset names are preserved intact
        for token in ["-38.4 °C", "985.2 hPa", "Maitri", "Schirmacher Oasis", "ds_maitri_imd"]:
            assert token in tr_data["translated_text"]



