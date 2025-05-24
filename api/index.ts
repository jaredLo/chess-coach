import express from "express";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { Chess } from "chess.js";
import { spawn } from "child_process";
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: { 'X-Title': 'Chess-Coach' },
});

const app = express();
const logger = pino();
const PORT = process.env.PORT || 8060;

app.use(cors());
app.use(express.json());

// Utility: get FEN at a specific ply index (0 = start position)
function getFenAtMove(pgn: string, ply: number): string {
  const temp = new Chess();
  temp.loadPgn(pgn);
  const moves = temp.history();
  temp.reset();
  const limit = Math.max(0, Math.min(ply, moves.length));
  for (let i = 0; i < limit; i++) temp.move(moves[i]);
  return temp.fen();
}

// Convert UCI move to SAN for display
function uciToSan(fen: string, uci: string | null): string | null {
  if (!uci) return null;
  const chess = new Chess(fen);
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length === 5 ? uci[4] : undefined;
  const move = chess.move({ from, to, promotion } as any);
  return move?.san ?? null;
}

// Run Stockfish with full UCI handshake for deep analysis
// Run Stockfish with a clean UCI handshake and fixed time search
// Replace your entire runStockfish with this:

async function runStockfish(fen: string): Promise<{ bestMove: string | null; eval: number | string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("./stockfish/stockfish-macos-m1-apple-silicon", [], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";

    proc.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", () => {
      // parse final, deepest info line + bestmove
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

    // Kick off a *single* UCI session that quits after searching 2s
    proc.stdin.write("uci\n");
    proc.stdin.write(`position fen ${fen}\n`);
    proc.stdin.write("go movetime 2000\n");
    //wait 6 seconds
    setTimeout(() => {
      proc.stdin.write("quit\n");
    }, 2100);
  });
}

app.post('/analyze', async (req: any, res: any) => {
  const { pgn, moveIndex, userColor, actualMove } = req.body;
  if (!pgn || moveIndex == null) return res.status(400).json({ error: 'pgn and moveIndex required' });

  const prevFEN = getFenAtMove(pgn, moveIndex - 1);
  const currFEN = getFenAtMove(pgn, moveIndex);
  const { bestMove: prevUci } = await runStockfish(prevFEN);
  const prevBest = uciToSan(prevFEN, prevUci) || prevUci;
  const { eval: evaluation } = await runStockfish(currFEN);

  const isUserMove = userColor === (moveIndex % 2 === 1 ? 'w' : 'b');
  const prompt = isUserMove
    ? `I played ${actualMove}. Engine best move was: ${prevBest}. Eval now: ${evaluation}. Give concise advice.`
    : `My opponent played ${actualMove}. Engine best move was: ${prevBest}. Eval now: ${evaluation}. Give concise analysis what the opponent is doing.`;

  console.log('prompt', prompt);
  const chat = await openai.chat.completions.create({
    model: 'openai/gpt-4.1-nano',
    messages: [
      { role: 'system', content: 'You are my chess coach speaking in first person. Be concise and actionable.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 120,
  });

  res.json({ input: { pgn, fen: currFEN }, stockfish: { bestMove: prevBest, eval: evaluation }, advice: chat.choices[0].message?.content });
});

app.listen(PORT, () => logger.info(`Listening on ${PORT}`));