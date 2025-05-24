import React, { useState } from "react";
import { Button, Input } from "antd";

interface PGNInputProps {
  onPGNSubmit: (pgn: string) => void;
}

const PGNInput: React.FC<PGNInputProps> = ({ onPGNSubmit }) => {
  const [pgn, setPgn] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pgn.trim()) {
      onPGNSubmit(pgn);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <Input.TextArea
        rows={4}
        value={pgn}
        onChange={e => setPgn(e.target.value)}
        placeholder="Paste your PGN here"
        style={{ marginBottom: 8 }}
      />
      <Button type="primary" htmlType="submit">
        Load PGN
      </Button>
    </form>
  );
};

export default PGNInput; 