"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, ChevronUp, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

export type LogLevel = "log" | "warn" | "error" | "info";

interface LogEntry {
  id: number;
  level: LogLevel;
  ts: string;
  msg: string;
}

let _addLog: ((level: LogLevel, msg: string) => void) | null = null;

export function debugLog(level: LogLevel, ...args: unknown[]) {
  const msg = args.map(a =>
    typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
  ).join(" ");
  _addLog?.(level, msg);
}

const LEVEL_COLOR: Record<LogLevel, string> = {
  log:   "text-slate-300",
  info:  "text-blue-300",
  warn:  "text-yellow-300",
  error: "text-red-400",
};

export function DebugLogOverlay() {
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [minimized, setMin]   = useState(false);
  const [visible, setVisible] = useState(true);
  const counterRef            = useRef(0);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    _addLog = (level, msg) => {
      const entry: LogEntry = {
        id:    ++counterRef.current,
        level,
        ts:    new Date().toLocaleTimeString("tr-TR", { hour12: false }),
        msg,
      };
      setLogs(prev => [...prev.slice(-199), entry]);
    };

    // Console intercept
    const orig = {
      log:   console.log.bind(console),
      warn:  console.warn.bind(console),
      error: console.error.bind(console),
      info:  console.info.bind(console),
    };

    (["log", "warn", "error", "info"] as LogLevel[]).forEach(level => {
      (console as any)[level] = (...args: unknown[]) => {
        orig[level](...args);
        debugLog(level, ...args);
      };
    });

    return () => {
      _addLog = null;
      Object.assign(console, orig);
    };
  }, []);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, minimized]);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, background: "#000", borderBottom: "2px solid #eab308", fontFamily: "monospace", fontSize: 10 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bug size={12} className="text-accent" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Debug Log · {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLogs([])}
            className="text-slate-600 hover:text-slate-300 text-[9px] uppercase tracking-widest transition-colors"
          >
            Temizle
          </button>
          <button type="button" title={minimized ? "Genişlet" : "Küçült"} onClick={() => setMin(v => !v)} className="text-slate-500 hover:text-white transition-colors">
            {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" title="Kapat" onClick={() => setVisible(false)} className="text-slate-500 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Log list */}
      {!minimized && (
        <div className="overflow-y-auto max-h-[220px] p-2 flex flex-col gap-0.5">
          {logs.length === 0 && (
            <p className="text-slate-600 text-center py-4">Log yok</p>
          )}
          {logs.map(entry => (
            <div key={entry.id} className="flex gap-2 leading-relaxed">
              <span className="text-slate-600 shrink-0">{entry.ts}</span>
              <span className={cn("shrink-0 uppercase font-black text-[9px]", LEVEL_COLOR[entry.level])}>
                {entry.level.toUpperCase().slice(0, 3)}
              </span>
              <span className={cn("break-all whitespace-pre-wrap", LEVEL_COLOR[entry.level])}>
                {entry.msg}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
