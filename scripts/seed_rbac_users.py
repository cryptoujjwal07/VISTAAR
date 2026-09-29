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
    print("Connected.")

    canonical_users = [
        {
            "id": "usr_superadmin01",
            "email": "admin@vistaar.ncpor.res.in",
            "password_hash": hash_pw("VistaarAdmin@2026!"),
            "name": "Dr. Thamban Meloth (Director / Super Admin)",
            "role": "SUPER_ADMIN",
            "persona": None,
            "organization": "National Centre for Polar and Ocean Research (NCPOR)",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "usr_editor001",
            "email": "editor@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Editor@Vistaar2026!"),
            "name": "Payal Agrawal (Lead Outreach Editor)",
            "role": "OUTREACH_EDITOR",
            "persona": None,
            "organization": "MoES Outreach & Science Communication Division",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "usr_scientist01",
            "email": "scientist@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Scientist@Vistaar2026!"),
            "name": "Dr. Ayushman Gupta (Field Scientist - Himansh & Maitri)",
            "role": "FIELD_SCIENTIST",
            "persona": None,
            "organization": "NCPOR Cryosphere Science Wing",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "usr_public001",
            "email": "student@vistaar.ncpor.res.in",
            "password_hash": hash_pw("Student@Vistaar2026!"),
            "name": "Aarav Sharma (High School Student)",
            "role": "PUBLIC_USER",
            "persona": "STUDENT",
            "organization": "Kendriya Vidyalaya Vasco, Goa",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    for u in canonical_users:
        db.users.update_one(
            {"email": u["email"]},
            {"$set": u},
            upsert=True
        )
        print(f"Seeded user: {u['email']} [{u['role']}]")

    print("\nCanonical RBAC users seeded successfully into MongoDB Atlas!")

if __name__ == "__main__":
    seed_users()
