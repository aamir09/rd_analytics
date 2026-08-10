import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook to fetch static JSON from /data/*.json
 * Uses Stale-While-Revalidate with cache-busting so GitHub Actions updates are consumed instantly.
 */
const cache: Record<string, unknown> = {};
const cacheTimestamps: Record<string, number> = {};

// Revalidate throttle: avoid re-fetching the exact same file more than once every 10 seconds
const REVALIDATE_THROTTLE_MS = 10000;
// Periodic background refresh interval: 2 minutes
const AUTO_REFRESH_INTERVAL_MS = 120000;

export function useData<T>(filename: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>((cache[filename] as T | null) ?? null);
  const [loading, setLoading] = useState<boolean>(!cache[filename]);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const fetchData = useCallback(async (isManual = false) => {
    const now = Date.now();
    const lastFetch = cacheTimestamps[filename] || 0;

    // Skip if recently fetched (unless manual)
    if (!isManual && now - lastFetch < REVALIDATE_THROTTLE_MS) {
      return;
    }

    cacheTimestamps[filename] = now;

    if (!cache[filename]) {
      setLoading(true);
    }
    setError(null);

    try {
      const base = import.meta.env.BASE_URL;
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      // Append cache-busting timestamp parameter to bypass browser/CDN caching
      const url = `${cleanBase}data/${filename}?_t=${now}`;

      const res = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load ${filename} (${res.status})`);
      }

      const json = await res.json() as T;

      if (!mountedRef.current) return;

      const currentCachedStr = cache[filename] ? JSON.stringify(cache[filename]) : null;
      const newJsonStr = JSON.stringify(json);

      // Only update state/cache if data has changed or wasn't cached yet
      if (currentCachedStr !== newJsonStr) {
        cache[filename] = json;
        setData(json);
      }
      setLoading(false);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`useData error for ${filename}:`, err);
      // Only set error if we don't already have cached data to display
      if (!cache[filename]) {
        setError(errMsg);
      }
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    mountedRef.current = true;

    // Immediate fetch/revalidation on mount
    fetchData();

    // Auto-refresh when tab gains focus
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Periodic background auto-refresh
    const intervalId = setInterval(() => {
      fetchData();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(intervalId);
    };
  }, [filename, fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
