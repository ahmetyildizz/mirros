"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  roomId?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    Sentry.withScope((scope) => {
      if (this.props.roomId) scope.setTag("roomId", this.props.roomId);
      scope.setTag("boundary", "GameErrorBoundary");
      Sentry.captureException(error);
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-dvh bg-black flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-white font-black text-base uppercase tracking-widest">Bir Sorun Oluştu</p>
          <p className="text-slate-500 text-[12px] font-medium">
            Oyun ekranı beklenmedik bir hatayla karşılaştı.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: "" })}
            className="w-full py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} />
            Tekrar Dene
          </button>
          <a
            href="/"
            className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[13px] uppercase tracking-widest text-center hover:bg-red-500/20 transition-colors"
          >
            Lobiye Dön
          </a>
        </div>
      </div>
    );
  }
}
