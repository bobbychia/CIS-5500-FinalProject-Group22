import { useEffect, useRef, useState } from "react";

const API_BASE = "";

/**
 * Fetches GET /api/zip-areas?…
 * - Aborts the previous request when `queryString` changes; those AbortErrors are ignored (not shown as "timeout").
 * - Only the in-flight request for the latest `queryString` may set loading/error/data.
 */
export function useZipAreasSearch(queryString) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (queryString == null || queryString === "") {
      requestIdRef.current += 1;
      setData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 120_000);

    fetch(`${API_BASE}/api/zip-areas?${queryString}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.text();
          throw new Error(msg || r.statusText || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        if (id !== requestIdRef.current) return;
        setData(d);
      })
      .catch((e) => {
        if (id !== requestIdRef.current) return;
        if (e.name === "AbortError") {
          setError("Search timed out (2 min). Try narrowing filters or check the API.");
          setData(null);
          return;
        }
        setError(String(e.message || e));
        setData(null);
      })
      .finally(() => {
        clearTimeout(t);
        if (id === requestIdRef.current) setLoading(false);
      });

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [queryString]);

  return { data, loading, error };
}
