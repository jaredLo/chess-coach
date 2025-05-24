import React, { useEffect, useState } from "react";
import ChessBoardViewer from "../components/ChessBoardViewer";
import PGNInput from "../components/PGNInput";
import Controls from "../components/Controls";
import { Chess } from "chess.js";
import { Card, Typography } from "antd";
import { useChessReplay } from "../hooks/useChessReplay";
import CoachComment from "../components/CoachComment";
import { useCoachAnalysis } from "../hooks/useCoachAnalysis";
import EvalBar from "../components/EvalBar";

const { Title } = Typography;

const Home: React.FC = () => {
  const [pgn, setPgn] = useState("");
  const [hasPGN, setHasPGN] = useState(false);
  const replay = useChessReplay(pgn);
  const coach = useCoachAnalysis();
  const boardHeight = 400;

  const handlePGNSubmit = (newPgn: string) => {
    setPgn(newPgn);
    setHasPGN(true);
    coach.analyze(newPgn, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
  };

  // keyboard navigation
  useEffect(() => {
    if (!hasPGN) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") replay.prev();
      if (e.key === "ArrowRight") replay.next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [replay, hasPGN]);

  // extract player names and user color from PGN
  let whitePlayer = "";
  let blackPlayer = "";
  let userColor: 'w' | 'b' | undefined = undefined;

  // call coach.analyze on every FEN change
  useEffect(() => {
    if (
      replay.fen &&
      hasPGN &&
      replay.currentMove > 0 &&
      replay.moveList[replay.currentMove - 1]
    ) {
      const move = replay.moveList[replay.currentMove - 1].san;
      const color = replay.moveList[replay.currentMove - 1].color;
      coach.analyze(
        pgn,
        replay.fen,
        replay.currentMove,
        replay.totalMoves,
        move,
        color,
        userColor,
        move,
        undefined
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    replay.fen,
    replay.currentMove,
    replay.totalMoves,
    replay.moveList,
    hasPGN,
    userColor
  ]);

  if (pgn) {
    const whiteMatch = pgn.match(/\[White "([^"]+)"\]/);
    const blackMatch = pgn.match(/\[Black "([^"]+)"\]/);
    whitePlayer = whiteMatch ? whiteMatch[1] : "White";
    blackPlayer = blackMatch ? blackMatch[1] : "Black";
    
    const usernames = (import.meta.env.VITE_ANALYZE_USERNAMES || '').split(',').map((name: string) => name.trim());
    if (usernames.includes(whitePlayer)) {
      userColor = 'w';
    } else if (usernames.includes(blackPlayer)) {
      userColor = 'b';
    }
  }

  let comment = "Paste a PGN and step through the moves.";
  if (coach.loading) comment = "Analyzing game...";
  else if (coach.error) comment = `Error: ${coach.error}`;
  else if (coach.result && coach.result.advice) comment = coach.result.advice;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <Card>
        <Title level={3}>Chess Coach</Title>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", position: "relative" }}>
          <EvalBar eval={coach.result?.stockfish?.eval} height={boardHeight} />
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: boardHeight, height: boardHeight }}>
              <ChessBoardViewer 
                fen={replay.fen} 
                whitePlayer={whitePlayer} 
                blackPlayer={blackPlayer} 
                orientation={userColor === 'b' ? 'black' : 'white'}
              />
            </div>
          </div>
          <CoachComment comment={comment} loading={coach.loading} moveIndex={replay.currentMove} totalMoves={replay.totalMoves} />
        </div>
        <div style={{ margin: "16px 0" }}>
          <Controls
            onFirst={replay.first}
            onPrev={replay.prev}
            onNext={replay.next}
            onLast={replay.last}
            canPrev={replay.currentMove > 0}
            canNext={replay.currentMove < replay.totalMoves}
          />
        </div>
        <PGNInput onPGNSubmit={handlePGNSubmit} />
      </Card>
    </div>
  );
};

export default Home; 