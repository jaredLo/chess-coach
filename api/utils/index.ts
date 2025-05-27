import { Chess } from 'chess.js';
import { spawn } from 'child_process';
import type { Logger } from 'pino';

export interface PreloadedMoveData {
    ply: number;
    fen: string;
    bestMove: string | null;
    evaluation: number | string;
    actualMove: string;
}

export async function preloadBestMoves(
    pgn: string,
    logger:Logger<never, boolean>
): Promise<PreloadedMoveData[]> {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const moves = chess.history();
    const data: PreloadedMoveData[] = [];

    logger.info(`Analyzing ${moves.length} plies…`);
    for (let ply = 0; ply <= moves.length; ply++) {
        const fen = getFenAtMove(pgn, ply);
        const result = await runStockfish(fen);
        const san = uciToSan(fen, result.bestMove) || result.bestMove || '—';
        const actualMove = moves[ply - 1] || '—';
        data.push({ ply, fen, bestMove: san, evaluation: result.eval, actualMove });
    }

    logger.info(`Preloaded ${data.length} `);
    return data;
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

export function uciToSan(fen: string, uci: string | null): string | null {
    if (!uci) return null;
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion } as any);
    return move?.san ?? null;
}

export async function runStockfish(
    fen: string
): Promise<{ bestMove: string | null; eval: number | string }> {
    return new Promise((resolve, reject) => {
        const proc = spawn(
            './stockfish/stockfish-macos-m1-apple-silicon',
            [],
            { stdio: ['pipe', 'pipe', 'pipe'] }
        );
        let output = '';
        let positionSent = false;

        proc.stdout.on('data', (chunk) => {
            const str = chunk.toString();
            output += str;

            // Once engine signals it's ready, send the position and start analysis
            if (!positionSent && str.includes('readyok')) {
                positionSent = true;
                proc.stdin.write(`position fen ${fen}\n`);
                proc.stdin.write('go movetime 2000\n');
            }

            // After bestmove arrives, quit the engine
            if (str.includes('bestmove')) {
                proc.stdin.write('quit\n');
            }
        });

        proc.on('error', reject);

        proc.on('close', () => {
            const lines = output.split('\n');
            let bestMove: string | null = null;
            let evaluation: number | string = 0;
            let maxDepth = -1;

            for (const line of lines) {
                const bm = line.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
                if (bm) bestMove = bm[1];
                const info = line.match(/info depth (\d+).*score (cp|mate) (-?\d+)/);
                if (info) {
                    const depth = +info[1];
                    const type = info[2];
                    const val = +info[3];
                    if (depth > maxDepth) {
                        maxDepth = depth;
                        evaluation = type === 'mate' && val !== 0 ? `#${val}` : val / 100;
                    }
                }
            }

            resolve({ bestMove, eval: evaluation });
        });

        // UCI handshake and engine options
        proc.stdin.write('uci\n');
        proc.stdin.write('setoption name Threads value 4\n');
        proc.stdin.write('setoption name Hash value 512\n');
        proc.stdin.write('isready\n');
    });
}