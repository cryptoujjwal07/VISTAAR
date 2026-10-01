import uuid
from datetime import datetime, timezone
from pymongo import MongoClient
import bcrypt

MONGODB_URI = "mongodb+srv://ayushmang06_db_user:1234567890@polarbearvistaar.qmtf9h5.mongodb.net/?appName=polarbearVISTAAR"
DB_NAME = "vistaar_production"

def hash_pw(password: str) -> str:
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def seed_users():
    print(f"Connecting to MongoDB Atlas [{DB_NAME}]...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=15000)
    db = client[DB_NAME]
    db.command("ping")
    print("Connected successfully.")

    # 1. Clean up automated test accounts (e.g. scientist_a_*, scientist_b_*, student_*@school.edu)
    delete_result = db.users.delete_many({
        "$or": [
            {"email": {"$regex": r"^scientist_[ab]_"}},
            {"email": {"$regex": r"^student_[a-f0-9]{6}@school\.edu$"}},
            {"email": "intruder@domain.com"}
        ]
    })
    print(f"Cleaned up {delete_result.deleted_count} ephemeral test accounts.")

    # 2. Canonical 5 Core Authenticated Roles + Platform Administrators
    now = datetime.now(timezone.utc).isoformat()
    canonical_users = [
        {
            "id": "usr_admin001",
            "email": "admin@vistaar.ncpor.res.in",
            "password_hash": hash_pw("VistaarAdmin@2026!"),
            "name": "Dr. Thamban Meloth",
            "designation": "Director, NCPOR / Super Administrator",
            "role": "ADMIN",
            "persona": "ADMIN",
            "organization": "National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "usr_scientist001",
            "email": "scientist@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Scientist@Vistaar2026!"),
            "name": "Dr. Ayushman Gupta",
            "designation": "Lead Cryosphere Scientist & Expedition Deputy",
            "role": "SCIENTIST",
            "persona": "SCIENTIST",
            "organization": "NCPOR Cryosphere Science & Glaciology Wing",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "usr_researcher001",
            "email": "researcher@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Researcher@Vistaar2026!"),
            "name": "Dr. Priya Sen",
            "designation": "Senior Polar Researcher & Climate Analyst",
            "role": "RESEARCHER",
            "persona": "RESEARCHER",
            "organization": "MoES Polar Climate Research Division",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "usr_teacher001",
            "email": "teacher@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Teacher@Vistaar2026!"),
            "name": "Sunita Sharma",
            "designation": "Senior Science Educator & Polar Curriculum Specialist",
            "role": "TEACHER",
            "persona": "TEACHER",
            "organization": "Kendriya Vidyalaya Sangathan / NCERT Polar Outreach",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "usr_student001",
            "email": "student@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Student@Vistaar2026!"),
            "name": "Aarav Sharma",
            "designation": "High School Science Student (Grade 11)",
            "role": "STUDENT",
            "persona": "STUDENT",
            "organization": "Kendriya Vidyalaya Vasco, Goa",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "usr_editor001",
            "email": "editor@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Editor@Vistaar2026!"),
            "name": "Payal Agrawal",
            "designation": "Lead Outreach & Media Communications Editor",
            "role": "ADMIN",
            "persona": "ADMIN",
            "organization": "MoES Science Dissemination & Press Information Bureau",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "usr_root001",
            "email": "ayushmang06@gmail.com",
            "password_hash": hash_pw("VistaarAdmin@2026!"),
            "name": "Ayushman Gupta",
            "designation": "System Administrator",
            "role": "ADMIN",
            "persona": "ADMIN",
            "organization": "National Centre for Polar and Ocean Research (NCPOR)",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
    ]

    for u in canonical_users:
        db.users.update_one(
            {"email": u["email"]},
            {"$set": u},
            upsert=True
        )
        print(f"[OK] Seeded user: {u['email']} [{u['role']}] - {u['name']}")

    total_users = db.users.count_documents({})
    print(f"\nAll 5 core authenticated roles seeded! Total users in database: {total_users}")

if __name__ == "__main__":
    seed_users()
