import { useState, useEffect } from 'react';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook to fetch static JSON from /data/*.json
 * Data is cached in memory for the session — no repeat network calls.
 */
const cache: Record<string, unknown> = {};

export function useData<T>(filename: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>(cache[filename] as T | null ?? null);
  const [loading, setLoading] = useState<boolean>(!cache[filename]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache[filename]) {
      setData(cache[filename] as T);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL;
    const url = `${base}data/${filename}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${filename} (${res.status})`);
        return res.json();
      })
      .then((json: T) => {
        cache[filename] = json;
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('useData error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [filename]);

  return { data, loading, error };
}
