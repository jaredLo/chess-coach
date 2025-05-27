import {Chess} from "chess.js";
import {spawn} from "child_process";
import type {Logger} from "pino";

interface PreloadedMoveData {
    ply: number;
    fen: string;
    bestMove: string;
    evaluation: number | string;
    actualMove: string;
}

export async function preloadBestMoves(pgn: string, logger: Logger<never, boolean>) {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const moves = chess.history();
    const preloadedMoveData = [] as PreloadedMoveData[];

    logger.info(`Analyzing ${moves.length} plies…`);
    for (let ply = 0; ply <= moves.length; ply++) {
        const fen = getFenAtMove(pgn, ply);
        const { bestMove: uci, eval: evaluation } = await runStockfish(fen);
        const san = uciToSan(fen, uci) || uci || "—";
        const actualMove = moves[ply - 1] || "—"; // previous move, if any
        const moveData = {
            ply,
            fen,
            bestMove: san,
            evaluation,
            actualMove
        }

        preloadedMoveData.push(moveData);
    }

    logger.info("Done preloading engine moves.", preloadedMoveData);
    return preloadedMoveData;

}

export function getFenAtMove(pgn: string, ply: number): string {
    const temp = new Chess();
    temp.loadPgn(pgn);
    const moves = temp.history();
    temp.reset();
    const limit = Math.max(0, Math.min(ply, moves.length));
    for (let i = 0; i < limit; i++) temp.move(moves[i]);
    return temp.fen();
}



// convert UCI move format to SAN for display
export function uciToSan(fen: string, uci: string | null): string | null {
    if (!uci) return null;
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion } as any);
    return move?.san ?? null;
}

// run stockfish with UCI protocol for analysis
export async function runStockfish(fen: string): Promise<{ bestMove: string | null; eval: number | string }> {
    return new Promise((resolve, reject) => {
        const proc = spawn(
            './stockfish/stockfish-macos-m1-apple-silicon',
            ['Threads', '4'],   // or '8' to max out your M1 Pro cores
            { stdio: ['pipe','pipe','pipe'] }
        );
        let output = "";

        proc.stdout.on("data", (chunk) => {
            output += chunk.toString();
        });
        proc.on("error", reject);
        proc.on("close", () => {
            // parse the final analysis line and best move
            const lines = output.split("\n");
            let bestMove: string | null = null;
            let evaluation: number | string = 0;
            let maxDepth = -1;
            for (const line of lines) {
                const bm = line.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
                if (bm) bestMove = bm[1];
                const info = line.match(/info depth (\d+).*score (cp|mate) (-?\d+)/);
                if (info) {
                    const depth = +info[1], type = info[2], val = +info[3];
                    if (depth > maxDepth) {
                        maxDepth = depth;
                        if (type === "mate" && val !== 0) evaluation = `#${val}`;
                        else if (type === "cp") evaluation = val / 100;
                    }
                }
            }
            resolve({ bestMove, eval: evaluation });
        });

        // start a single UCI session with 2s search time
        proc.stdin.write("uci\n");
        proc.stdin.write(`position fen ${fen}\n`);
        proc.stdin.write('setoption name Hash value 512\n'); // in MB
        proc.stdin.write("go movetime 2000\n");
        // give it a bit more time to finish
        setTimeout(() => {
            proc.stdin.write("quit\n");
        }, 2100);
    });
}




