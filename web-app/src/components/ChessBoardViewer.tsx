import { Chessboard } from "react-chessboard";
import React from "react";

interface ChessBoardViewerProps {
  fen: string;
  whitePlayer?: string;
  blackPlayer?: string;
  orientation?: 'white' | 'black';
}

const ChessBoardViewer: React.FC<ChessBoardViewerProps> = ({ fen, whitePlayer, blackPlayer, orientation = 'white' }) => {
  const topPlayer = orientation === 'white' ? blackPlayer : whitePlayer;
  const bottomPlayer = orientation === 'white' ? whitePlayer : blackPlayer;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {topPlayer && (
        <div style={{ textAlign: "center", fontWeight: 500, marginBottom: 4 }}>{topPlayer}</div>
      )}
      <Chessboard position={fen} boardOrientation={orientation} />
      {bottomPlayer && (
        <div style={{ textAlign: "center", fontWeight: 500, marginTop: 4 }}>{bottomPlayer}</div>
      )}
    </div>
  );
};

export default ChessBoardViewer; 