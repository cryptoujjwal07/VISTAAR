#!/usr/bin/env python3
"""
VISTAAR Production MongoDB Atlas Data Model Initialization & Migration Tool
Conforms to Prompt 06:
Initializes all 21 prompt-mandated collections, compound indexes,
role permissions, station models, and dataset metadata.
"""

import os
import json
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://ayushmang06_db_user:1234567890@polarbearvistaar.qmtf9h5.mongodb.net/?appName=polarbearVISTAAR"
)
DB_NAME = os.getenv("MONGODB_DB_NAME", "vistaar_production")

# All 21 collections mandated by Prompt 06
COLLECTIONS = [
    "users",
    "roles",
    "documents",
    "document_pages",
    "document_chunks",
    "datasets",
    "dataset_metadata",
    "dataset_records",
    "media_assets",
    "expeditions",
    "stations",
    "claims",
    "claim_verifications",
    "generated_content",
    "review_tasks",
    "translations",
    "quizzes",
    "publications",
    "audit_events",
    "notifications",
    "jobs"
]

def init_data_model():
    print(f"Connecting to MongoDB Atlas [{DB_NAME}]...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=8000)
    db = client[DB_NAME]
    
    # 1. Verify connection
    db.command("ping")
    print("Connection established successfully.")

    # 2. Ensure all 21 collections exist
    existing = db.list_collection_names()
    for col in COLLECTIONS:
        if col not in existing:
            db.create_collection(col)
            print(f"+ Created collection: {col}")

    # 3. Create Compound & Unique Indexes
    print("Initializing production indexes across all 21 collections...")

    # users
    db.users.create_index("email", unique=True)
    db.users.create_index("role")

    # roles
    db.roles.create_index("role_id", unique=True)

    # documents
    db.documents.create_index("document_id", unique=True)
    db.documents.create_index("status")
    db.documents.create_index("sha256")

    # document_pages
    db.document_pages.create_index([("document_id", 1), ("page_number", 1)], unique=True)

    # document_chunks
    db.document_chunks.create_index("chunk_id", unique=True)
    db.document_chunks.create_index([("document_id", 1), ("page_number", 1)])
    db.document_chunks.create_index([("content", TEXT)])

    # datasets
    db.datasets.create_index("dataset_id", unique=True)
    db.datasets.create_index([("station_id", 1), ("instrument", 1)])

    # dataset_metadata
    db.dataset_metadata.create_index("dataset_id", unique=True)
    db.dataset_metadata.create_index("station_id")

    # dataset_records
    db.dataset_records.create_index([("station_id", 1), ("timestamp", 1)])
    db.dataset_records.create_index([("dataset_id", 1), ("timestamp", 1)])
    db.dataset_records.create_index("record_id", unique=True)
    db.dataset_records.create_index("provenance.sha256")

    # media_assets
    db.media_assets.create_index("asset_id", unique=True)
    db.media_assets.create_index([("station_id", 1), ("category", 1)])

    # expeditions
    db.expeditions.create_index("expedition_id", unique=True)
    db.expeditions.create_index("status")

    # stations
    db.stations.create_index("station_id", unique=True)
    db.stations.create_index("region")

    # claims
    db.claims.create_index("claim_id", unique=True)
    db.claims.create_index([("source_type", 1), ("source_id", 1)])
    db.claims.create_index("status")

    # claim_verifications
    db.claim_verifications.create_index("verification_id", unique=True)
    db.claim_verifications.create_index("claim_id")

    # generated_content
    db.generated_content.create_index("content_id", unique=True)
    db.generated_content.create_index([("publication_id", 1), ("track", 1)])

    # review_tasks
    db.review_tasks.create_index("task_id", unique=True)
    db.review_tasks.create_index([("status", 1), ("assigned_to", 1)])

    # translations
    db.translations.create_index("id", unique=True)
    db.translations.create_index([("publication_id", 1), ("target_language", 1)])

    # quizzes
    db.quizzes.create_index("quiz_id", unique=True)
    db.quizzes.create_index("module_id")

    # publications
    db.publications.create_index("id", unique=True)
    db.publications.create_index([("status", 1), ("created_at", -1)])
    db.publications.create_index("station_id")

    # audit_events
    db.audit_events.create_index("event_id", unique=True)
    db.audit_events.create_index([("resource_id", 1), ("timestamp", -1)])
    db.audit_events.create_index("actor_id")
    db.audit_events.create_index("timestamp")

    # notifications
    db.notifications.create_index("notification_id", unique=True)
    db.notifications.create_index([("recipient_id", 1), ("read", 1)])

    # jobs
    db.jobs.create_index("job_id", unique=True)
    db.jobs.create_index([("status", 1), ("created_at", 1)])

    print("Compound & unique indexes configured.")

    # 4. Seed Canonical Roles
    roles = [
        {
            "role_id": "SUPER_ADMIN",
            "name": "Super Administrator",
            "permissions": ["all"],
            "description": "Full access to platform administration, user management, and system logs."
        },
        {
            "role_id": "RESEARCHER",
            "name": "NCPOR Polar Scientist",
            "permissions": ["dataset:read", "dataset:upload", "claims:verify", "weather:analyze"],
            "description": "Access to scientific telemetry, calibration tools, and claim verification."
        },
        {
            "role_id": "OUTREACH_EDITOR",
            "name": "Outreach & Press Editor",
            "permissions": ["content:generate", "content:edit", "publication:approve", "export:pib"],
            "description": "Review and publish multi-track outreach bulletins, PIB releases, and educational kits."
        },
        {
            "role_id": "PUBLIC_USER",
            "name": "General Public / Student",
            "permissions": ["public:read", "classroom:view", "media:download"],
            "description": "Public portal access to published scientific knowledge, quizzes, and telemetry charts."
        }
    ]
    for r in roles:
        db.roles.update_one({"role_id": r["role_id"]}, {"$set": r}, upsert=True)
    print("Roles seeded.")

    # 5. Seed Canonical Stations
    stations = [
        {
            "station_id": "maitri",
            "name": "Maitri Research Station",
            "region": "Antarctica",
            "sub_region": "Schirmacher Oasis, Queen Maud Land",
            "coordinates": {"latitude": -70.7667, "longitude": 11.7333, "elevation_meters": 117},
            "established": 1989,
            "status": "ACTIVE",
            "description": "India's second Antarctic research station, conducting meteorology, geomagnetism, seismology, and environmental monitoring."
        },
        {
            "station_id": "bharati",
            "name": "Bharati Research Station",
            "region": "Antarctica",
            "sub_region": "Larsemann Hills",
            "coordinates": {"latitude": -69.4072, "longitude": 76.1956, "elevation_meters": 35},
            "established": 2012,
            "status": "ACTIVE",
            "description": "India's third Antarctic station, facilitating oceanographic, atmospheric, and paleoclimate research."
        },
        {
            "station_id": "himadri",
            "name": "Himadri Research Station",
            "region": "Arctic",
            "sub_region": "Ny-Ålesund, Spitsbergen, Svalbard",
            "coordinates": {"latitude": 78.9272, "longitude": 11.9281, "elevation_meters": 10},
            "established": 2008,
            "status": "ACTIVE",
            "description": "India's Arctic research station located at 79°N, monitoring fjord dynamics, aerosols, and microbial diversity."
        },
        {
            "station_id": "himansh",
            "name": "Himansh Glaciological Station",
            "region": "Himalayas",
            "sub_region": "Spiti Valley, Chandra Basin, Himachal Pradesh",
            "coordinates": {"latitude": 32.4042, "longitude": 77.6167, "elevation_meters": 4080},
            "established": 2016,
            "status": "ACTIVE",
            "description": "High-altitude Himalayan research station observing cryospheric mass balance and climate-monsoon linkages."
        }
    ]
    for s in stations:
        db.stations.update_one({"station_id": s["station_id"]}, {"$set": s}, upsert=True)
    print("Stations seeded.")

    # 6. Seed Canonical Expeditions
    expeditions = [
        {
            "expedition_id": "isea-43",
            "name": "43rd Indian Scientific Expedition to Antarctica",
            "target": "Antarctica",
            "season": "2023 - 2024",
            "status": "COMPLETED",
            "lead_institute": "NCPOR"
        },
        {
            "expedition_id": "arctic-winter-1",
            "name": "1st Indian Winter Arctic Scientific Expedition",
            "target": "Arctic (Ny-Ålesund)",
            "season": "2023 - 2024",
            "status": "COMPLETED",
            "lead_institute": "NCPOR"
        },
        {
            "expedition_id": "so-expedition-12",
            "name": "12th Indian Southern Ocean Expedition",
            "target": "Southern Ocean",
            "season": "2024 - 2025",
            "status": "ACTIVE",
            "lead_institute": "NCPOR"
        },
        {
            "expedition_id": "himansh-himalaya-8",
            "name": "8th Cryosphere Field Campaign (Chandra Basin)",
            "target": "Himalayas",
            "season": "2024",
            "status": "ACTIVE",
            "lead_institute": "NCPOR"
        }
    ]
    for exp in expeditions:
        db.expeditions.update_one({"expedition_id": exp["expedition_id"]}, {"$set": exp}, upsert=True)
    print("Expeditions seeded.")

    # Verify counts
    print("\n--- MongoDB Atlas Collection Audit ---")
    for col in COLLECTIONS:
        cnt = db[col].count_documents({})
        idx_count = len(db[col].index_information())
        print(f"[{col}] documents: {cnt}, indexes: {idx_count}")

    print("\nPrompt 06 MongoDB Data Model initialized and certified.")

if __name__ == "__main__":
    init_data_model()
