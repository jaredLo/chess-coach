import { Chessboard } from "react-chessboard";
import React from "react";
import type {PreloadedMoveData} from "../hooks/usePreloadAnalysis.ts";
import {Chess} from "chess.js";

interface ChessBoardViewerProps {
  moves: PreloadedMoveData[];
  fen: string;
  whitePlayer?: string;
  blackPlayer?: string;
  orientation?: 'white' | 'black';
}

const ChessBoardViewer: React.FC<ChessBoardViewerProps> = ({ moves, fen, whitePlayer, blackPlayer, orientation = 'white' }) => {
  const topPlayer = orientation === 'white' ? blackPlayer : whitePlayer;
  const bottomPlayer = orientation === 'white' ? whitePlayer : blackPlayer;


  const bestMovesArrow = () => {
    const move = moves.find(m => m.fen === fen);
    if (!move || !move.bestMove) return [];
    const chess = new Chess(fen);
    const mv = move.bestMove
        ? chess.move(move.bestMove, {  })
        : null;
    const arrows = mv ? [[mv.from, mv.to]] : [];

    return arrows
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {topPlayer && (
        <div style={{ textAlign: "center", fontWeight: 500, marginBottom: 4 }}>{topPlayer}</div>
      )}
      <Chessboard   customArrows={bestMovesArrow()}  position={fen} boardOrientation={orientation} />
      {bottomPlayer && (
        <div style={{ textAlign: "center", fontWeight: 500, marginTop: 4 }}>{bottomPlayer}</div>
      )}
    </div>
  );
};

export default ChessBoardViewer; 