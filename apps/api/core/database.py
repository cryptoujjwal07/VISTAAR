import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from apps.api.core.config import settings
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.database")

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

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
            minPoolSize=10
        )
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
        
    return db_manager.db

async def connect_to_mongo():
    logger.info("Connecting to MongoDB Atlas...")
    try:
        db = get_database()
        # Verify connection
        await db_manager.client.admin.command('ping')
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
    """Create essential compound indexes for production queries and vector search compatibility"""
    try:
        db = get_database()
        # Users
        await db.users.create_index("email", unique=True)
        # Datasets
        await db.datasets.create_index("dataset_id", unique=True)
        await db.datasets.create_index([("station_id", 1), ("instrument", 1)])
        # Dataset records (Time-series queries)
        await db.dataset_records.create_index([("station_id", 1), ("timestamp", 1)])
        await db.dataset_records.create_index([("dataset_id", 1), ("timestamp", 1)])
        # Documents
        await db.documents.create_index("document_id", unique=True)
        # Document chunks
        await db.document_chunks.create_index([("document_id", 1), ("page_number", 1)])
        await db.document_chunks.create_index([("document_id", 1), ("chunk_id", 1)], unique=True)
        # Claims
        await db.claims.create_index("claim_id", unique=True)
        await db.claims.create_index("status")
        # Publications
        await db.publications.create_index("id", unique=True)
        await db.publications.create_index("status")
        # Audit events
        await db.audit_events.create_index([("resource_id", 1), ("timestamp", -1)])
        await db.audit_events.create_index("timestamp")
        # Jobs
        await db.jobs.create_index([("status", 1), ("created_at", 1)])
        logger.info("Database compound indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"Index initialization warning: {str(e)}")
