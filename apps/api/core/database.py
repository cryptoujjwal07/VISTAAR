import asyncio
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from apps.api.core.config import settings
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.database")

PRODUCTION_COMPOUND_INDEXES: List[str] = [
    "users.email (unique)",
    "datasets.dataset_id (unique)",
    "datasets.(station_id, instrument)",
    "datasets.(region, station_id)",
    "dataset_records.(station_id, timestamp)",
    "dataset_records.(dataset_id, timestamp)",
    "dataset_records.record_id",
    "documents.document_id (unique)",
    "documents.sha256",
    "documents.(station_id, status, created_at)",
    "document_chunks.(document_id, page_number)",
    "document_chunks.(document_id, chunk_id) (unique)",
    "document_chunks.(document_id, is_table, page_number)",
    "document_tables.(document_id, page_number)",
    "claims.claim_id (unique)",
    "claims.status",
    "claim_verifications.(status, verified_at)",
    "publications.id (unique)",
    "publications.(status, created_at)",
    "publications.(station_id, status)",
    "audit_events.(resource_id, timestamp)",
    "audit_events.timestamp",
    "rag_traces.query_id",
    "rag_traces.created_at",
    "translations.created_at",
    "jobs.(status, created_at)",
]


class DatabaseManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None
    initialized_indexes: List[str] = list(PRODUCTION_COMPOUND_INDEXES)


db_manager = DatabaseManager()


def get_database() -> AsyncIOMotorDatabase:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    needs_reinit = False
    if db_manager.client is None:
        needs_reinit = True
    elif loop is not None:
        try:
            client_loop = db_manager.client.get_io_loop()
            if client_loop != loop or client_loop.is_closed():
                needs_reinit = True
        except Exception:
            needs_reinit = True

    if needs_reinit:
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=15000,
            maxPoolSize=50,
            minPoolSize=10,
        )
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]

    return db_manager.db


async def connect_to_mongo():
    logger.info("Connecting to MongoDB Atlas...")
    try:
        get_database()
        await db_manager.client.admin.command("ping")
        logger.info(f"Connected successfully to MongoDB Atlas database: {settings.MONGODB_DB_NAME}")
        await init_db_indexes()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {str(e)}")
        raise e


async def close_mongo_connection():
    logger.info("Closing MongoDB Atlas connection...")
    if db_manager.client:
        db_manager.client.close()
        db_manager.client = None
        db_manager.db = None
        logger.info("MongoDB Atlas connection closed.")


async def init_db_indexes():
    """Create essential compound indexes for production queries, cursor pagination, deduplication, and vector retrieval (Prompt 27)."""
    try:
        db = get_database()
        await asyncio.gather(
            # Users
            db.users.create_index("email", unique=True),
            # Datasets
            db.datasets.create_index("dataset_id", unique=True),
            db.datasets.create_index([("station_id", 1), ("instrument", 1)]),
            db.datasets.create_index([("region", 1), ("station_id", 1)]),
            # Dataset records (Time-series & provenance queries)
            db.dataset_records.create_index([("station_id", 1), ("timestamp", 1)]),
            db.dataset_records.create_index([("dataset_id", 1), ("timestamp", 1)]),
            db.dataset_records.create_index("record_id"),
            # Documents & SHA-256 deduplication
            db.documents.create_index("document_id", unique=True),
            db.documents.create_index("sha256"),
            db.documents.create_index([("station_id", 1), ("status", 1), ("created_at", -1)]),
            # Document chunks & tables
            db.document_chunks.create_index([("document_id", 1), ("page_number", 1)]),
            db.document_chunks.create_index([("document_id", 1), ("chunk_id", 1)], unique=True),
            db.document_chunks.create_index([("document_id", 1), ("is_table", 1), ("page_number", 1)]),
            db.document_tables.create_index([("document_id", 1), ("page_number", 1)]),
            # Claims & verifications
            db.claims.create_index("claim_id", unique=True),
            db.claims.create_index("status"),
            db.claim_verifications.create_index([("status", 1), ("verified_at", -1)]),
            # Publications
            db.publications.create_index("id", unique=True),
            db.publications.create_index([("status", 1), ("created_at", -1)]),
            db.publications.create_index([("station_id", 1), ("status", 1)]),
            # Audit events, RAG traces, Translations & Jobs
            db.audit_events.create_index([("resource_id", 1), ("timestamp", -1)]),
            db.audit_events.create_index("timestamp"),
            db.rag_traces.create_index("query_id"),
            db.rag_traces.create_index([("created_at", -1)]),
            db.translations.create_index([("created_at", -1)]),
            db.jobs.create_index([("status", 1), ("created_at", 1)]),
            return_exceptions=True,
        )
        db_manager.initialized_indexes = list(PRODUCTION_COMPOUND_INDEXES)
        logger.info("Database compound indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"Index initialization warning: {str(e)}")
