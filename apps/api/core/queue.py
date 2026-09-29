import asyncio
import uuid
from datetime import datetime, timezone
from typing import Callable, Any, Dict, Optional
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.queue")

class TaskStatus:
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class AsyncJobQueue:
    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None

    async def start(self):
        if not self._worker_task:
            self._worker_task = asyncio.create_task(self._process_queue())
            logger.info("Asynchronous worker queue processor started.")

    async def stop(self):
        if self._worker_task:
            self._worker_task.cancel()
            self._worker_task = None
            logger.info("Asynchronous worker queue stopped.")

    async def enqueue(self, task_name: str, handler: Callable, *args, **kwargs) -> str:
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        job_record = {
            "job_id": job_id,
            "task_name": task_name,
            "status": TaskStatus.QUEUED,
            "created_at": now,
            "started_at": None,
            "completed_at": None,
            "error": None,
            "result": None,
            "retries": 0,
            "max_retries": 3
        }
        self._jobs[job_id] = job_record
        await self._queue.put((job_id, handler, args, kwargs))
        logger.info(f"Enqueued job {job_id} for task '{task_name}'")
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self._jobs.get(job_id)

    async def _process_queue(self):
        while True:
            try:
                job_id, handler, args, kwargs = await self._queue.get()
                job = self._jobs.get(job_id)
                if not job:
                    self._queue.task_done()
                    continue

                job["status"] = TaskStatus.RUNNING
                job["started_at"] = datetime.now(timezone.utc).isoformat()
                logger.info(f"Started job {job_id} [{job['task_name']}]")

                try:
                    res = await handler(*args, **kwargs)
                    job["status"] = TaskStatus.COMPLETED
                    job["result"] = res
                    job["completed_at"] = datetime.now(timezone.utc).isoformat()
                    logger.info(f"Completed job {job_id} [{job['task_name']}]")
                except Exception as e:
                    job["status"] = TaskStatus.FAILED
                    job["error"] = str(e)
                    job["completed_at"] = datetime.now(timezone.utc).isoformat()
                    logger.error(f"Failed job {job_id} [{job['task_name']}]: {str(e)}")

                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker queue uncaught error: {str(e)}")

job_queue = AsyncJobQueue()
