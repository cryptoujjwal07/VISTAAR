export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const API_BASE_URL = API_BASE;

interface CacheEntry {
  expiresAt: number;
  data: any;
}

const GET_CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 128;
const getResponseCache = new Map<string, CacheEntry>();
const inflightGetRequests = new Map<string, Promise<any>>();

export function clearClientApiCache(): void {
  getResponseCache.clear();
}

export interface FetchApiOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  bypassCache?: boolean;
  idempotencyKey?: string;
}

export async function fetchApi<T = any>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const token = typeof window !== "undefined" ? localStorage.getItem("vistaar_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.idempotencyKey && !headers.has("Idempotency-Key")) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // Invalidate client GET cache whenever a mutation occurs
  if (method !== "GET") {
    getResponseCache.clear();
  }

  const cacheKey = `${method}:${url}:${token || "anon"}`;

  // 1. Short-lived bounded client cache for GET requests (Prompt 27)
  if (method === "GET" && !options.bypassCache) {
    const cached = getResponseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as T;
    }
    const existingInflight = inflightGetRequests.get(cacheKey);
    if (existingInflight) {
      return existingInflight as Promise<T>;
    }
  }

  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxRetries = options.maxRetries ?? (method === "GET" ? 2 : 0);

  const executeWithRetry = async (): Promise<T> => {
    let attempt = 0;
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          ...options,
          method,
          headers,
          signal: options.signal || controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          // Retry on transient 502/503/504 or 429 rate-limit backoff for idempotent GETs
          if (
            attempt < maxRetries &&
            (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429)
          ) {
            attempt += 1;
            await new Promise((r) => setTimeout(r, 150 * Math.pow(2, attempt - 1)));
            continue;
          }

          let errorMsg = `Request failed: ${res.statusText}`;
          try {
            const errJson = await res.json();
            errorMsg = errJson.detail || errJson.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }

        const data = await res.json();
        if (method === "GET" && !options.bypassCache) {
          if (getResponseCache.size >= MAX_CACHE_ENTRIES) {
            const oldestKey = getResponseCache.keys().next().value;
            if (oldestKey) getResponseCache.delete(oldestKey);
          }
          getResponseCache.set(cacheKey, {
            expiresAt: Date.now() + GET_CACHE_TTL_MS,
            data,
          });
        }
        return data as T;
      } catch (err: any) {
        clearTimeout(timer);
        const isAbort = err?.name === "AbortError";
        if (attempt < maxRetries && (isAbort || err instanceof TypeError)) {
          attempt += 1;
          await new Promise((r) => setTimeout(r, 150 * Math.pow(2, attempt - 1)));
          continue;
        }
        throw err;
      }
    }
  };

  if (method === "GET" && !options.bypassCache) {
    const promise = executeWithRetry().finally(() => {
      inflightGetRequests.delete(cacheKey);
    });
    inflightGetRequests.set(cacheKey, promise);
    return promise;
  }

  return executeWithRetry();
}
