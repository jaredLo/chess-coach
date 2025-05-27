import {useState} from "react";

export interface PreloadedMoveData {
    ply: number;
    fen: string;
    bestMove: string | null;
    evaluation: number | string;
    actualMove: string;
}


export function usePreloadAnalysis() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);


    const fetchPreloadedMoves = async (pgn: string) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch("http://localhost:8060/preload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pgn })
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json() as { message: string, preloadedMoves: PreloadedMoveData[] };
            setResult(data);
        } catch (e: any) {
            setError(e.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }


    return { fetchPreloadedMoves, result, loading, error };
}