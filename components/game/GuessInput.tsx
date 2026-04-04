"use client";

import { AnswerInput } from "./AnswerInput";

interface Props {
  opponentName: string;
  onSubmit: (value: string) => void;
  loading?: boolean;
}

export function GuessInput({ opponentName, onSubmit, loading }: Props) {
  return (
    <div>
      <p style={{ color: "var(--fg-secondary)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
        {opponentName} ne demiş olabilir?
      </p>
      <AnswerInput
        placeholder="Tahminini yaz..."
        onSubmit={onSubmit}
        loading={loading}
      />
    </div>
  );
}
