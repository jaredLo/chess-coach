import React from "react";
import { Card, Spin } from "antd";

interface CoachCommentProps {
  comment: string;
  loading?: boolean;
  moveIndex?: number;
  totalMoves?: number;
}

function highlightMoves(text: string) {
  const moveRegex = /(\d+\.(?:\.\.)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|O-O(?:-O)?)/g;
  return text.replace(moveRegex, match => `<b>${match}</b>`);
}

const CoachComment: React.FC<CoachCommentProps> = ({ comment, loading, moveIndex, totalMoves }) => {
  const moveLabel = typeof moveIndex === "number" && typeof totalMoves === "number"
    ? ` (Move ${moveIndex} of ${totalMoves})`
    : "";
  return (
    <div style={{ position: "absolute", top: 0, right: -300, width: 240, zIndex: 2 }}>
      <Card size="small" title={`Coach says${moveLabel}`} bordered style={{ background: "#fff", borderColor: "#e0e0e0" }}>
        {loading ? <Spin /> : <span dangerouslySetInnerHTML={{ __html: highlightMoves(comment) }} />}
      </Card>
    </div>
  );
};

export default CoachComment; 