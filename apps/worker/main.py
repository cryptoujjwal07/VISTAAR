import asyncio
import sys
import argparse
from apps.api.core.config import settings
from apps.api.core.database import connect_to_mongo, close_mongo_connection
from apps.api.core.queue import job_queue
from apps.api.core.logging import get_logger
from apps.worker.tasks.ingestion import process_dataset_background
from apps.worker.tasks.outreach import process_outreach_generation_background
from apps.worker.tasks.exports import process_batch_export_background

logger = get_logger("vistaar.worker")

async def run_worker(once: bool = False):
    logger.info("Initializing VISTAAR Asynchronous Worker...")
    logger.info(f"Worker Configuration: Environment={settings.ENVIRONMENT}, QueueMode={'In-Memory/Redis-compatible' if settings.USE_IN_MEMORY_QUEUE else 'Redis'}")

    # Verify MongoDB Atlas connection
    await connect_to_mongo()
    await job_queue.start()
    logger.info("VISTAAR Worker successfully connected and listening for background tasks.")

    if once:
        # Enqueue and execute a test diagnostic task
        logger.info("Running diagnostic test task in worker...")
        job_id = await job_queue.enqueue(
            "DIAGNOSTIC_HEALTH_CHECK",
            process_batch_export_background,
            export_id="diag_001",
            format_type="JSON",
            items=["maitri", "bharati", "himansh", "himadri"]
        )
        # Wait briefly for execution
        await asyncio.sleep(1.0)
        job = job_queue.get_job(job_id)
        logger.info(f"Diagnostic task {job_id} result: {job['status']}")
        await job_queue.stop()
        await close_mongo_connection()
        logger.info("Worker self-check completed cleanly.")
        return 0

    # Long-running worker loop
    try:
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Stopping VISTAAR Worker...")
    finally:
        await job_queue.stop()
        await close_mongo_connection()
        logger.info("VISTAAR Worker terminated cleanly.")
    return 0

def main():
    parser = argparse.ArgumentParser(description="VISTAAR Asynchronous Background Worker")
    parser.add_argument("--once", action="store_true", help="Run diagnostic health check and exit")
    args = parser.parse_args()

    exit_code = asyncio.run(run_worker(once=args.once))
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
