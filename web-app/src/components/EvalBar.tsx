import React from "react";

interface EvalBarProps {
  eval: number | string | null | undefined;
  height?: number;
}

// Helper to normalize eval to a 0-1 scale (1 = White wins, 0 = Black wins, 0.5 = equal)
function evalToPercent(evalValue: number | string | null | undefined): number {
  if (evalValue === null || evalValue === undefined) return 0.5;
  if (typeof evalValue === "string" && evalValue.startsWith("#")) {
    // Mate: positive for White, negative for Black
    const mate = parseInt(evalValue.replace("#", ""), 10);
    if (mate < 0) return 0; // Black mates
    return 1; // White mates
  }
  if (typeof evalValue === "number") {
    // Clamp eval to [-10, 10] for display
    const clamped = Math.max(-10, Math.min(10, evalValue));
    return 0.5 + clamped / 20;
  }
  return 0.5;
}

const EvalBar: React.FC<EvalBarProps> = ({ eval: evalValue, height = 200 }) => {
  const percent = evalToPercent(evalValue);
  const barHeight = height;
  const whiteHeight = Math.round(barHeight * percent);
  const blackHeight = barHeight - whiteHeight;

  return (
    <div style={{ width: 32, height: barHeight, marginRight: 16, display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
      <div style={{ fontSize: 12, marginBottom: 4, color: "#888" }}>+{typeof evalValue === "number" ? evalValue.toFixed(2) : evalValue || "0.00"}</div>
      <div style={{ width: 16, height: barHeight, borderRadius: 8, overflow: "hidden", border: "1px solid #ccc", boxShadow: "0 1px 2px #eee" }}>
        <div style={{ height: whiteHeight, background: "#fff" }} />
        <div style={{ height: blackHeight, background: "#222" }} />
      </div>
      <div style={{ fontSize: 12, marginTop: 4, color: "#888" }}>-</div>
    </div>
  );
};

export default EvalBar; 