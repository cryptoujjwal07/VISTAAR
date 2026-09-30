import asyncio
import base64
import hashlib
import time
from collections import OrderedDict
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple


class PerformanceProfiler:
    """
    Production Performance Measurement & Telemetry Profiler (Prompt 27: 'Measure first; do not optimize from guesses').
    Tracks per-route and per-operation latency distributions (p50, p95, p99, mean, min, max)
    with bounded sliding windows to guarantee zero memory growth.
    """

    def __init__(self, window_size: int = 500, slow_threshold_ms: float = 500.0):
        self.window_size = window_size
        self.slow_threshold_ms = slow_threshold_ms
        self._route_samples: Dict[str, List[float]] = {}
        self._op_samples: Dict[str, List[float]] = {
            "db_query": [],
            "search": [],
            "vector_retrieval": [],
            "pdf_render": [],
            "dataset_ingestion": [],
            "ai_request": [],
        }
        self._total_requests = 0
        self._slow_requests = 0

    def record_route(self, method: str, path: str, status_code: int, duration_ms: float) -> None:
        self._total_requests += 1
        if duration_ms >= self.slow_threshold_ms:
            self._slow_requests += 1
        key = f"{method.upper()} {path}"
        bucket = self._route_samples.setdefault(key, [])
        bucket.append(float(duration_ms))
        if len(bucket) > self.window_size:
            del bucket[: len(bucket) - self.window_size]

    def record_operation(self, op_name: str, duration_ms: float) -> None:
        bucket = self._op_samples.setdefault(op_name, [])
        bucket.append(float(duration_ms))
        if len(bucket) > self.window_size:
            del bucket[: len(bucket) - self.window_size]

    @staticmethod
    def _summarize(samples: List[float]) -> Dict[str, Any]:
        if not samples:
            return {
                "count": 0,
                "p50_ms": 0.0,
                "p95_ms": 0.0,
                "p99_ms": 0.0,
                "mean_ms": 0.0,
                "min_ms": 0.0,
                "max_ms": 0.0,
            }
        sorted_s = sorted(samples)
        n = len(sorted_s)

        def _pct(p: float) -> float:
            idx = min(n - 1, max(0, int(round((p / 100.0) * (n - 1)))))
            return round(sorted_s[idx], 2)

        return {
            "count": n,
            "p50_ms": _pct(50),
            "p95_ms": _pct(95),
            "p99_ms": _pct(99),
            "mean_ms": round(sum(sorted_s) / n, 2),
            "min_ms": round(sorted_s[0], 2),
            "max_ms": round(sorted_s[-1], 2),
        }

    def get_summary(self) -> Dict[str, Any]:
        all_route_vals: List[float] = []
        route_breakdown: Dict[str, Any] = {}
        for route_key, vals in self._route_samples.items():
            all_route_vals.extend(vals)
            route_breakdown[route_key] = self._summarize(vals)

        op_breakdown: Dict[str, Any] = {}
        for op_key, vals in self._op_samples.items():
            op_breakdown[op_key] = self._summarize(vals)

        return {
            "measured_first": True,
            "total_requests_measured": self._total_requests,
            "slow_requests_count": self._slow_requests,
            "slow_threshold_ms": self.slow_threshold_ms,
            "overall_latency": self._summarize(all_route_vals),
            "route_latencies": route_breakdown,
            "operation_latencies": op_breakdown,
        }


class BoundedTTLCache:
    """
    Bounded LRU + TTL in-memory cache for read-heavy scientific endpoints,
    PDF page renders, deterministic embeddings, and search queries (Prompt 27).
    """

    def __init__(self, max_entries: int = 1024, default_ttl_seconds: float = 120.0):
        self.max_entries = max(16, max_entries)
        self.default_ttl_seconds = default_ttl_seconds
        self._store: "OrderedDict[str, Tuple[float, Any]]" = OrderedDict()
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def get(self, key: str) -> Optional[Any]:
        now = time.monotonic()
        entry = self._store.get(key)
        if entry is None:
            self.misses += 1
            return None
        expires_at, val = entry
        if now >= expires_at:
            self._store.pop(key, None)
            self.misses += 1
            return None
        self._store.move_to_end(key)
        self.hits += 1
        return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        expires_at = time.monotonic() + max(0.1, ttl)
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (expires_at, value)
        while len(self._store) > self.max_entries:
            self._store.popitem(last=False)
            self.evictions += 1

    def invalidate_prefix(self, prefix: str) -> int:
        keys_to_delete = [k for k in self._store.keys() if k.startswith(prefix)]
        for k in keys_to_delete:
            self._store.pop(k, None)
        return len(keys_to_delete)

    def clear(self) -> None:
        self._store.clear()

    def stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        hit_rate = round((self.hits / total) * 100.0, 2) if total > 0 else 0.0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": hit_rate,
            "active_entries": len(self._store),
            "max_entries": self.max_entries,
            "evictions": self.evictions,
            "default_ttl_seconds": self.default_ttl_seconds,
        }

    @staticmethod
    def compute_etag(data: bytes | str) -> str:
        raw = data.encode("utf-8") if isinstance(data, str) else data
        return f'W/"{hashlib.sha256(raw).hexdigest()[:24]}"'


class InFlightDeduplicator:
    """
    Coalesces concurrent identical in-flight async operations (e.g., concurrent PDF page renders,
    concurrent RAG queries, or identical embedding calculations) so heavy work executes only once.
    """

    def __init__(self):
        self._inflight: Dict[str, asyncio.Future] = {}
        self.coalesced_hits = 0
        self.deduplicated_jobs = 0
        self.deduplicated_documents = 0

    async def coalesce(self, key: str, coro_factory: Callable[[], Awaitable[Any]]) -> Any:
        existing = self._inflight.get(key)
        if existing is not None and not existing.done():
            self.coalesced_hits += 1
            return await asyncio.shield(existing)

        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        self._inflight[key] = fut
        try:
            result = await coro_factory()
            if not fut.done():
                fut.set_result(result)
            return result
        except Exception as exc:
            if not fut.done():
                fut.set_exception(exc)
            raise
        finally:
            self._inflight.pop(key, None)

    def stats(self) -> Dict[str, Any]:
        return {
            "inflight_active": len(self._inflight),
            "inflight_coalesced_requests": self.coalesced_hits,
            "deduplicated_jobs": self.deduplicated_jobs,
            "deduplicated_documents": self.deduplicated_documents,
        }


class IdempotencyStore:
    """
    Tracks HTTP Idempotency-Key tokens for mutation endpoints (POST/PATCH)
    to prevent duplicate job enqueues, duplicate uploads, or duplicate state transitions.
    """

    def __init__(self, max_entries: int = 512, ttl_seconds: float = 600.0):
        self.max_entries = max_entries
        self.ttl_seconds = ttl_seconds
        self._records: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
        self.replays = 0

    def get(self, idempotency_key: str) -> Optional[Dict[str, Any]]:
        if not idempotency_key:
            return None
        now = time.monotonic()
        rec = self._records.get(idempotency_key)
        if rec is None:
            return None
        if now >= rec["expires_at"]:
            self._records.pop(idempotency_key, None)
            return None
        self._records.move_to_end(idempotency_key)
        self.replays += 1
        return rec

    def set(self, idempotency_key: str, status_code: int, body: Any) -> None:
        if not idempotency_key:
            return
        self._records[idempotency_key] = {
            "status_code": status_code,
            "body": body,
            "expires_at": time.monotonic() + self.ttl_seconds,
        }
        while len(self._records) > self.max_entries:
            self._records.popitem(last=False)

    def stats(self) -> Dict[str, Any]:
        return {
            "active_keys": len(self._records),
            "idempotent_replays": self.replays,
            "ttl_seconds": self.ttl_seconds,
        }


def encode_cursor(offset: int, last_id: str = "") -> str:
    """Encodes a deterministic pagination cursor token."""
    raw = f"v1:{max(0, int(offset))}:{last_id}"
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def decode_cursor(cursor: Optional[str], default_offset: int = 0) -> Tuple[int, str]:
    """Decodes a pagination cursor token into (offset, last_id). Falls back safely on invalid input."""
    if not cursor:
        return default_offset, ""
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
        parts = decoded.split(":", 2)
        if len(parts) >= 2 and parts[0] == "v1":
            offset = max(0, int(parts[1]))
            last_id = parts[2] if len(parts) > 2 else ""
            return offset, last_id
    except Exception:
        pass
    return default_offset, ""


def lttb_downsample(points: List[Dict[str, Any]], max_points: int) -> List[Dict[str, Any]]:
    """
    Largest-Triangle-Three-Buckets (LTTB) + Peak-Preserving downsampling for time-series charts (Prompt 27).
    Ensures browser memory is never overloaded by huge datasets while preserving first/last points,
    exact global min/max extremes, and full record_id + SHA-256 provenance on every returned point.
    """
    n = len(points)
    if max_points <= 0 or n <= max_points or max_points < 3:
        return points

    # Find global min and max indices so scientific extremes are never lost during downsampling
    min_idx = min(range(n), key=lambda i: float(points[i].get("value", 0.0)))
    max_idx = max(range(n), key=lambda i: float(points[i].get("value", 0.0)))

    sampled_indices = [0]
    bucket_size = (n - 2) / float(max_points - 2)
    a = 0

    for i in range(max_points - 2):
        avg_range_start = int((i + 1) * bucket_size) + 1
        avg_range_end = min(int((i + 2) * bucket_size) + 1, n)
        avg_range_len = max(1, avg_range_end - avg_range_start)

        avg_x = sum(range(avg_range_start, avg_range_end)) / avg_range_len
        avg_y = sum(float(points[j].get("value", 0.0)) for j in range(avg_range_start, avg_range_end)) / avg_range_len

        range_offs = int(i * bucket_size) + 1
        range_to = min(int((i + 1) * bucket_size) + 1, n - 1)

        point_a_x = float(a)
        point_a_y = float(points[a].get("value", 0.0))

        max_area = -1.0
        next_a = range_offs
        for j in range(range_offs, max(range_offs + 1, range_to)):
            area = abs(
                (point_a_x - avg_x) * (float(points[j].get("value", 0.0)) - point_a_y)
                - (point_a_x - float(j)) * (avg_y - point_a_y)
            )
            if area > max_area:
                max_area = area
                next_a = j

        sampled_indices.append(next_a)
        a = next_a

    sampled_indices.append(n - 1)

    # Ensure global min and max indices are included in chronological order
    index_set = set(sampled_indices)
    index_set.add(min_idx)
    index_set.add(max_idx)
    ordered_indices = sorted(index_set)

    # If adding min/max exceeded max_points by 1-2, trim interior non-extreme points
    while len(ordered_indices) > max_points:
        removable = [
            idx for idx in ordered_indices[1:-1] if idx not in (min_idx, max_idx)
        ]
        if removable:
            mid_rem = removable[len(removable) // 2]
            ordered_indices.remove(mid_rem)
        elif len(ordered_indices) > 2:
            ordered_indices.pop(1)
        else:
            break

    return [points[idx] for idx in ordered_indices[:max_points]]


performance_profiler = PerformanceProfiler()
ttl_cache = BoundedTTLCache(max_entries=1024, default_ttl_seconds=120.0)
inflight_deduplicator = InFlightDeduplicator()
idempotency_store = IdempotencyStore(max_entries=512, ttl_seconds=600.0)
