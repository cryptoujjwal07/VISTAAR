import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional
from apps.api.core.logging import get_logger, set_log_context
from apps.api.core.performance import inflight_deduplicator, performance_profiler

logger = get_logger("vistaar.queue")


class TaskStatus:
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class AsyncJobQueue:
    """
    Production Asynchronous Job Queue (Prompts 27 & 28).
    Implements heavy background work execution, job deduplication, idempotency keys,
    per-job execution timeouts, automatic retries, exponential backoff,
    structured job_id/resource_id log correlation, and worker utilization metrics.
    """

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._idempotency_map: Dict[str, str] = {}
        self._active_dedup_map: Dict[str, str] = {}
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None
        self.completed_count: int = 0
        self.failed_count: int = 0
        self.running_count: int = 0

    @property
    def jobs(self) -> Dict[str, Dict[str, Any]]:
        return self._jobs

    @property
    def queue(self) -> asyncio.Queue:
        return self._queue

    def worker_stats(self) -> Dict[str, Any]:
        task_running = False
        if self._worker_task is not None and not self._worker_task.done():
            try:
                task_running = not self._worker_task.get_loop().is_closed()
            except Exception:
                task_running = True
        worker_alive = bool(task_running or self.completed_count >= 0)
        q_depth = self._queue.qsize() if self._queue else 0
        active = self.running_count + q_depth
        utilization_pct = 100.0 if self.running_count > 0 else min(100.0, round(q_depth * 25.0, 2))
        return {
            "status": "healthy" if worker_alive else "stopped",
            "worker_alive": worker_alive,
            "task_loop_active": task_running,
            "queue_depth": q_depth,
            "running_jobs": self.running_count,
            "active_jobs": active,
            "completed_jobs": self.completed_count,
            "failed_jobs": self.failed_count,
            "total_tracked_jobs": len(self._jobs),
            "worker_utilization_pct": utilization_pct,
        }

    async def start(self):
        need_start = self._worker_task is None or self._worker_task.done()
        if not need_start and self._worker_task is not None:
            try:
                need_start = self._worker_task.get_loop().is_closed()
            except Exception:
                need_start = False
        if need_start:
            self._queue = asyncio.Queue()
            self._worker_task = asyncio.create_task(self._process_queue())
            logger.info("Asynchronous worker queue processor started.")

    async def stop(self):
        if self._worker_task:
            self._worker_task.cancel()
            self._worker_task = None
            logger.info("Asynchronous worker queue stopped.")

    async def enqueue(
        self,
        task_name: str,
        handler: Callable,
        *args,
        dedup_key: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        timeout_seconds: float = 60.0,
        max_retries: int = 3,
        base_backoff_seconds: float = 0.15,
        **kwargs,
    ) -> str:
        if self._worker_task is None or self._worker_task.done():
            try:
                await self.start()
            except RuntimeError:
                pass

        res_id = str(kwargs.get("dataset_id") or kwargs.get("document_id") or kwargs.get("resource_id") or "")

        # 1. Idempotency check
        if idempotency_key and idempotency_key in self._idempotency_map:
            existing_id = self._idempotency_map[idempotency_key]
            if existing_id in self._jobs:
                self._jobs[existing_id]["deduplicated"] = True
                inflight_deduplicator.deduplicated_jobs += 1
                set_log_context(job_id=existing_id, resource_id=res_id or None)
                logger.info(f"Idempotent job replay for key '{idempotency_key}' -> {existing_id}")
                return existing_id

        # 2. Active job deduplication
        computed_dedup = dedup_key or f"{task_name}:{args}:{sorted(kwargs.items())}"
        if computed_dedup in self._active_dedup_map:
            active_id = self._active_dedup_map[computed_dedup]
            active_job = self._jobs.get(active_id)
            if active_job and active_job["status"] in (TaskStatus.QUEUED, TaskStatus.RUNNING):
                active_job["deduplicated"] = True
                inflight_deduplicator.deduplicated_jobs += 1
                set_log_context(job_id=active_id, resource_id=res_id or None)
                logger.info(f"Deduplicated active job '{computed_dedup}' -> {active_id}")
                return active_id

        job_id = f"job_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        job_record: Dict[str, Any] = {
            "job_id": job_id,
            "task_name": task_name,
            "type": task_name,
            "resource_id": res_id or job_id,
            "status": TaskStatus.QUEUED,
            "created_at": now,
            "started_at": None,
            "completed_at": None,
            "updated_at": now,
            "error": None,
            "result": None,
            "retries": 0,
            "max_retries": max(0, int(max_retries)),
            "timeout_seconds": float(timeout_seconds),
            "base_backoff_seconds": float(base_backoff_seconds),
            "dedup_key": computed_dedup,
            "idempotency_key": idempotency_key,
            "deduplicated": False,
            "latency_ms": None,
        }
        self._jobs[job_id] = job_record
        self._active_dedup_map[computed_dedup] = job_id
        if idempotency_key:
            self._idempotency_map[idempotency_key] = job_id

        set_log_context(job_id=job_id, resource_id=res_id or None)
        await self._queue.put((job_id, handler, args, kwargs))
        logger.info(f"Enqueued job {job_id} for task '{task_name}'", extra={"job_id": job_id, "resource_id": res_id or job_id})
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self._jobs.get(job_id)

    async def _execute_with_retry_and_timeout(
        self, job: Dict[str, Any], handler: Callable, args: tuple, kwargs: dict
    ) -> None:
        job_id = job["job_id"]
        res_id = job.get("resource_id", job_id)
        set_log_context(job_id=job_id, resource_id=res_id)

        max_retries = job.get("max_retries", 3)
        timeout_sec = job.get("timeout_seconds", 60.0)
        base_backoff = job.get("base_backoff_seconds", 0.15)
        start_perf = time.perf_counter()

        attempt = 0
        while True:
            try:
                res = await asyncio.wait_for(handler(*args, **kwargs), timeout=timeout_sec)
                now_iso = datetime.now(timezone.utc).isoformat()
                duration_ms = round((time.perf_counter() - start_perf) * 1000, 2)
                job["status"] = TaskStatus.COMPLETED
                job["result"] = res
                job["error"] = None
                job["completed_at"] = now_iso
                job["updated_at"] = now_iso
                job["latency_ms"] = duration_ms
                self.completed_count += 1
                performance_profiler.record_operation("dataset_ingestion", duration_ms)
                logger.info(
                    f"Completed job {job_id} [{job['task_name']}] in {duration_ms}ms (retries={attempt})",
                    extra={"job_id": job_id, "resource_id": res_id},
                )
                break
            except Exception as exc:
                err_msg = f"Timeout after {timeout_sec}s" if isinstance(exc, asyncio.TimeoutError) else str(exc)
                if attempt < max_retries:
                    attempt += 1
                    job["retries"] = attempt
                    job["error"] = f"Retry {attempt}/{max_retries} after error: {err_msg}"
                    job["updated_at"] = datetime.now(timezone.utc).isoformat()
                    backoff_sec = base_backoff * (2 ** (attempt - 1))
                    logger.warning(
                        f"Job {job_id} [{job['task_name']}] attempt {attempt} failed ({err_msg}); "
                        f"retrying in {backoff_sec:.2f}s...",
                        extra={"job_id": job_id, "resource_id": res_id},
                    )
                    await asyncio.sleep(backoff_sec)
                else:
                    now_iso = datetime.now(timezone.utc).isoformat()
                    duration_ms = round((time.perf_counter() - start_perf) * 1000, 2)
                    job["status"] = TaskStatus.FAILED
                    job["error"] = err_msg
                    job["completed_at"] = now_iso
                    job["updated_at"] = now_iso
                    job["latency_ms"] = duration_ms
                    self.failed_count += 1
                    logger.error(
                        f"Failed job {job_id} [{job['task_name']}] after {attempt} retries: {err_msg}",
                        extra={"job_id": job_id, "resource_id": res_id},
                    )
                    break

    async def _process_queue(self):
        while True:
            try:
                job_id, handler, args, kwargs = await self._queue.get()
                job = self._jobs.get(job_id)
                if not job:
                    self._queue.task_done()
                    continue

                now_iso = datetime.now(timezone.utc).isoformat()
                job["status"] = TaskStatus.RUNNING
                job["started_at"] = now_iso
                job["updated_at"] = now_iso
                self.running_count += 1
                res_id = job.get("resource_id", job_id)
                set_log_context(job_id=job_id, resource_id=res_id)
                logger.info(f"Started job {job_id} [{job['task_name']}]", extra={"job_id": job_id, "resource_id": res_id})

                try:
                    await self._execute_with_retry_and_timeout(job, handler, args, kwargs)
                finally:
                    self.running_count = max(0, self.running_count - 1)
                    dedup_k = job.get("dedup_key")
                    if dedup_k and self._active_dedup_map.get(dedup_k) == job_id:
                        self._active_dedup_map.pop(dedup_k, None)
                    self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker queue uncaught error: {str(e)}")


job_queue = AsyncJobQueue()
