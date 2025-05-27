import express from "express";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { Chess } from "chess.js";
import { spawn } from "child_process";
import OpenAI from 'openai';
import { execSync } from 'child_process';
import {getFenAtMove, runStockfish, preloadBestMoves, uciToSan} from './utils/index.ts';
const raw = execSync(
    `printf "uci\nquit\n" | ./stockfish/stockfish-macos-m1-apple-silicon`
).toString();

const match = raw.match(/^id name (.+)$/m);
const version = match ? match[1] : 'unknown';
dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: { 'X-Title': 'Chess-Coach' },
});

const app = express();
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,                   // colored levels
      translateTime: 'HH:MM:ss.l',      // e.g. 21:43:09.123
      ignore: 'pid,hostname',           // ditch those fields
      levelFirst: true,                 // [INFO] before the message
    }
  }
});
logger.info(`Stockfish version: ${version}`);

const PORT = process.env.PORT || 8060;

app.use(cors());
app.use(express.json());

app.post('/preload', async (req: any, res: any) => {
    const { pgn } = req.body;
    if (!pgn) return res.status(400).json({ error: 'pgn required' });
    try {
        const preloadedMoves = await preloadBestMoves(pgn, logger);
        res.json({ message: 'Preloading complete', preloadedMoves });
    } catch (error) {
        logger.error(error, 'Error during preloading');
        res.status(500).json({ error: 'Failed to preload moves' });
    }
});


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
      ? `I played ${actualMove}. Engine best move: ${prevBest} (eval ${evaluation}).`
      : `Opponent played ${actualMove}. Engine best move: ${prevBest} (eval ${evaluation}).`;
  logger.info(`prompt: ${prompt}`);
  const chat = await openai.chat.completions.create({
    model: 'openai/gpt-4.1-nano',
    messages: [
      { role: 'system',   content: [
          "You're my chess coach, like Chess.com's AI Coach.",
          "Each move alternates strictly between me and my opponent.",
          "Explicitly say 'You' when addressing my moves, and 'Your opponent' when addressing theirs.",
          "Give exactly two short lines per response:",
          "1) Describe clearly what was played (e.g., 'You played e4.', 'Your opponent played e5.').",
          "2) If the move matches engine suggestion, briefly praise it and explain why it's good (mention eval). If not, state the better move clearly and briefly explain why (mention eval).",
          "Highlight clear blunders if eval difference is large (±2.0 or more).",
          "Stay under 40 words total."
        ].join(" ") },
      { role: 'user', content: prompt }
    ],
    max_tokens: 120,
  });

  res.json({ input: { pgn, fen: currFEN }, stockfish: { bestMove: prevBest, eval: evaluation }, advice: chat.choices[0].message?.content });
});

app.listen(PORT, () => logger.info(`Listening on ${PORT}`));