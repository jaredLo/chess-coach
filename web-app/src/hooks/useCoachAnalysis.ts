import { useState, useCallback, useRef } from "react";

function debouncePromise(fn: (...args: any[]) => Promise<any>, delay: number) {
  let timeout: NodeJS.Timeout | null = null;
  let lastPromise: Promise<any> | null = null;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    return new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        lastPromise = fn(...args).then(resolve).catch(reject);
      }, delay);
    });
  };
}

export function useCoachAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<string, any>>(new Map());

  const fetchAdvice = useCallback(async (pgn: string, fen: string, moveIndex: number, totalMoves: number, lastMoveSAN?: string | null, lastMoveColor?: string | null, userColor?: 'w' | 'b', actualMove?: string | null, prevBestMove?: string | null) => {
    const cacheKey = `${fen}|${moveIndex}|${totalMoves}|${lastMoveSAN}|${lastMoveColor}|${userColor}|${actualMove}|${prevBestMove}`;
    if (cache.current.has(cacheKey)) {
      setResult(cache.current.get(cacheKey));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://localhost:8060/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgn, fen, moveIndex, totalMoves, lastMoveSAN, lastMoveColor, userColor, actualMove, prevBestMove })
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      cache.current.set(cacheKey, data);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const analyze = useCallback(debouncePromise(fetchAdvice, 300), [fetchAdvice]);

  return { analyze, result, loading, error };
} 