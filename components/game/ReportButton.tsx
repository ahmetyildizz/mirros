"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { Flag, Check } from "lucide-react";

interface Props {
  gameId?: string;
  roomId?: string;
  roundNumber?: number;
  gameMode?: string;
}

export function ReportButton({ gameId, roomId, roundNumber, gameMode }: Props) {
  const [sent, setSent] = useState(false);

  function report() {
    if (sent) return;
    Sentry.withScope((scope) => {
      scope.setContext("game", { gameId, roomId, roundNumber, gameMode });
      scope.setLevel("error");
      Sentry.captureMessage("Kullanıcı sorun bildirdi", "error");
    });
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <button
      onClick={report}
      type="button"
      title="Sorun bildir"
      className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-colors"
    >
      {sent
        ? <Check size={16} className="text-green-400" />
        : <Flag size={16} className="text-slate-500 hover:text-slate-300 transition-colors" />
      }
    </button>
  );
}
