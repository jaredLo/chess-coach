import express from "express";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { z } from "zod";
import { Chess } from "chess.js";
import { spawn } from "child_process";
import { Readable } from "stream";
import { TextDecoder } from "util";

// Load environment variables
dotenv.config();

const app = express();
const logger = pino();
const PORT = process.env.PORT || 8060

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Zod schemas for input validation
const analyzeSchema = z.object({
  pgn: z.string().optional(),
  fen: z.string().optional(),
});

// Helper: Run Stockfish analysis
async function runStockfish(fen: string): Promise<{ bestMove: string | null, eval: number | string | null,  }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("./stockfish/stockfish-macos-m1-apple-silicon", [], {
      stdio: ["pipe", "pipe", "inherit"]
    });

    let output = "";
    let gotUciOk = false;

    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;

      // Wait for UCI handshake
      if (!gotUciOk && text.includes("uciok")) {
        gotUciOk = true;
        // Now send position and go commands
        proc.stdin.write(`position fen ${fen}\n`);
        proc.stdin.write("go depth 12\n");
        proc.stdin.end();
      }
    });

    proc.on("error", (err) => reject(err));
    proc.on("close", () => {
      let bestMove: string | null = null;
      let evalCp: number | null = null;
      let evalMate: number | null = null;

      const lines = output.split('\n');
      for (const line of lines) {
        const bm = line.match(/bestmove\s([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (bm) bestMove = bm[1];
        const cp = line.match(/score cp (-?\d+)/);
        if (cp) evalCp = Number(cp[1]) / 100;
        const mate = line.match(/score mate (-?\d+)/);
        if (mate) evalMate = Number(mate[1]);
      }
      let evaluation: string | number | null = null;
      if (evalMate !== null) {
        evaluation = `#${evalMate}`;
      } else if (evalCp !== null) {
        evaluation = evalCp;
      }

      resolve({
        bestMove: bestMove || null,
        eval: evaluation,
      });
    });

    // Only send "uci\n" first. The rest goes AFTER you see "uciok"!
    proc.stdin.write('uci\n');
  });
}

// Helper: Get LLM advice from OpenAI
async function getLLMAdvice(stockfishResults: any, moveIndex?: number, totalMoves?: number, lastMoveSAN?: string | null, lastMoveColor?: string | null, userColor?: 'w' | 'b') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "No OpenAI API key configured.";
  const { bestMove, eval: evaluation } = stockfishResults;
  // Determine if this move was made by the user
  const isUserMove = userColor && lastMoveColor ? (userColor === lastMoveColor) : false;
const moveSubject = isUserMove ? "My move:" : "The opponent's move:";
const moveDesc = lastMoveSAN || "(start position)";
const prompt = `${moveSubject} ${moveDesc}. Move ${moveIndex ?? 0}/${totalMoves ?? 0}. Briefly evaluate and give concise advice. Engine's best move: ${bestMove} (eval:${evaluation})`;
  console.log(prompt);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: "You're a concise and insightful chess coach reviewing my moves against the oppoent's moves. Address the user directly, focus on clear mistakes or good decisions, and briefly suggest practical improvements. Keep responses short and actionable."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 120
    })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No advice generated.";
}

// Endpoint: Receive and validate PGN/FEN/game data
app.post("/analyze", async (req:any, res:any) => {
  const { pgn, fen, moveIndex, totalMoves, lastMoveSAN, lastMoveColor, userColor } = req.body;
  const parseResult = analyzeSchema.safeParse({ pgn, fen });
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid input", details: parseResult.error.errors });
  }
  const { pgn: parsedPgn, fen: parsedFen } = parseResult.data;

  let chess: Chess;
  try {
    if (parsedPgn) {
      chess = new Chess();
      chess.loadPgn(parsedPgn);
      if (chess.history().length === 0) throw new Error("Invalid PGN");
    } else if (parsedFen) {
      chess = new Chess(parsedFen);
      // If the FEN is invalid, chess.js will default to the start position, so check fen equality
      if (chess.fen() !== parsedFen) throw new Error("Invalid FEN");
    } else {
      throw new Error("PGN or FEN required");
    }
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }

  // Run Stockfish analysis
  let stockfishResults;
  try {
    stockfishResults = await runStockfish(chess.fen());
  } catch (e) {
    stockfishResults = { error: "Stockfish analysis failed", details: (e as Error).message };
  }

  // Integrate with OpenAI for LLM explanations
  let llmAdvice;
  try {
    llmAdvice = await getLLMAdvice(stockfishResults, moveIndex, totalMoves, lastMoveSAN, lastMoveColor, userColor);
  } catch (e) {
    llmAdvice = "LLM advice unavailable.";
  }

  // Return structured analysis and advice
  return res.json({
    input: { pgn: parsedPgn, fen: chess.fen() },
    stockfish: stockfishResults,
    advice: llmAdvice,
  });
});

app.listen(PORT, () => {
  logger.info(`Chess Coach API listening on port ${PORT}`);
});