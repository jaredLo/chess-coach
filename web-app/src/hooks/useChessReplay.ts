import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Move } from "chess.js";

export function useChessReplay(pgn: string) {
  const [currentMove, setCurrentMove] = useState(0);
  const [moveList, setMoveList] = useState<Move[]>([]);
  const [fen, setFen] = useState("start");
  const chessRef = useRef<Chess | null>(null);
  const [lastMoveSAN, setLastMoveSAN] = useState<string | null>(null);
  const [lastMoveColor, setLastMoveColor] = useState<"w" | "b" | null>(null);

  // parse PGN and set up move list
  useEffect(() => {
    const chess = new Chess();
    chess.loadPgn(pgn);
    chessRef.current = chess;
    setMoveList(chess.history({ verbose: true }));
    setCurrentMove(0);
    setFen(chess.fen());
    setLastMoveSAN(null);
    setLastMoveColor(null);
  }, [pgn]);

  // update FEN and last move when currentMove changes
  useEffect(() => {
    if (!chessRef.current) return;
    const chess = new Chess();
    chess.loadPgn(pgn);
    chess.reset();
    let lastMove: Move | null = null;
    for (let i = 0; i < currentMove; i++) {
      lastMove = chess.move(moveList[i]);
    }
    setFen(chess.fen());
    setLastMoveSAN(lastMove ? lastMove.san : null);
    setLastMoveColor(lastMove ? lastMove.color : null);
  }, [currentMove, moveList, pgn]);

  const goTo = useCallback((move: number) => {
    setCurrentMove(Math.max(0, Math.min(move, moveList.length)));
  }, [moveList.length]);

  const next = useCallback(() => goTo(currentMove + 1), [currentMove, goTo]);
  const prev = useCallback(() => goTo(currentMove - 1), [currentMove, goTo]);
  const first = useCallback(() => goTo(0), [goTo]);
  const last = useCallback(() => goTo(moveList.length), [goTo, moveList.length]);

  return {
    fen,
    moveList,
    currentMove,
    goTo,
    next,
    prev,
    first,
    last,
    totalMoves: moveList.length,
    lastMoveSAN,
    lastMoveColor
  };
} 