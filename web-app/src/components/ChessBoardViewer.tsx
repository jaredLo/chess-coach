import { Chessboard } from "react-chessboard";
import React from "react";

interface ChessBoardViewerProps {
  fen: string;
  whitePlayer?: string;
  blackPlayer?: string;
}

const ChessBoardViewer: React.FC<ChessBoardViewerProps> = ({ fen, whitePlayer, blackPlayer }) => {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {blackPlayer && (
        <div style={{ textAlign: "center", fontWeight: 500, marginBottom: 4 }}>{blackPlayer}</div>
      )}
      <Chessboard position={fen} />
      {whitePlayer && (
        <div style={{ textAlign: "center", fontWeight: 500, marginTop: 4 }}>{whitePlayer}</div>
      )}
    </div>
  );
};

export default ChessBoardViewer; 