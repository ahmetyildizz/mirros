"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, 
  Share2, 
  Users, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  PlusCircle,
  ChevronLeft
} from "lucide-react";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";
import type { Player } from "@/store/game.store";
import { cn } from "@/lib/utils";
import { ManageQuestions } from "@/components/lobby/ManageQuestions";
import { getThemeFromRoom } from "@/lib/logic/theme-mapper";
import QRCode from "react-qr-code";

interface GameStartedPayload {
  gameId:           string;
  gameMode:         "SOCIAL" | "QUIZ";
  roundId:          string;
  roundNumber:      number;
  totalRounds:      number;
  questionId:       string;
  questionText:     string;
  questionCategory: string;
  questionOptions:  string[] | null;
  answererId:       string | null;
  players:          Player[];
}

interface PlayerJoinedPayload {
  userId:   string;
  username: string;
  players:  Player[];
}

export default function WaitingRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId }      = use(params);
  const router          = useRouter();
  const roomCode        = useGameStore((s) => s.roomCode);
  const storedPlayers   = useGameStore((s) => s.players);
  const isHost          = useGameStore((s) => s.isHostPlayer);

  const [players,     setPlayers]     = useState<Player[]>(storedPlayers);
  const [hostName,    setHostName]    = useState<string | null>(null);
  const [maxPlayers,  setMaxPlayers]  = useState<number>(4);
  const [gameMode,    setGameMode]    = useState<"SOCIAL" | "QUIZ">("SOCIAL");
  const [starting,    setStarting]    = useState(false);
  const [startError,  setStartError]  = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const {
    setGameId, setGameState, setQuestion, setCurrentRound, setTotalRounds,
    setActiveRoundId, setMyRole, setAnswererId, setPlayers: storePlayers,
    setGameMode: storeGameMode, setRoomCode, setRoomId, setTheme,
  } = useGameStore();

  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.players)    { setPlayers(data.players); storePlayers(data.players); }
        if (data.hostName)   setHostName(data.hostName);
        if (data.maxPlayers) setMaxPlayers(data.maxPlayers);
        if (data.gameMode)   setGameMode(data.gameMode);
        if (data.code)       setRoomCode(data.code);
        if (data.id)         setRoomId(data.id);
        
        // Sync Theme
        setTheme(getThemeFromRoom(data.category, data.gameMode || "SOCIAL"));

        if (data.activeGameId) {
          setGameId(data.activeGameId);
          storeGameMode(data.gameMode);
          router.push(`/game/${roomId}`);
        }
      })
      .catch(() => {});
  }, [roomId, storePlayers, setRoomCode, setRoomId, setGameId, storeGameMode, router]);

  const handleCopy = useCallback(() => {
    if (!roomCode) return;
    const joinUrl = `${window.location.origin}/?code=${roomCode}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [roomCode]);

  const handleWhatsApp = useCallback(() => {
    if (!roomCode) return;
    const joinUrl  = `${window.location.origin}/?code=${roomCode}`;
    const label    = gameMode === "QUIZ" ? "Bilgi yarışması" : "Mirros";
    const text     = encodeURIComponent(`${label} oynayalım! Oda kodu: ${roomCode}\n${joinUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [roomCode, gameMode]);

  useEffect(() => {
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind("player-joined", (data: PlayerJoinedPayload) => {
      setPlayers(data.players);
      storePlayers(data.players);
    });

    channel.bind("game-started", (data: GameStartedPayload) => {
      setGameId(data.gameId);
      storeGameMode(data.gameMode);
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setQuestion({ id: data.questionId, text: data.questionText, category: data.questionCategory, options: data.questionOptions });
      setAnswererId(data.answererId ?? null);
      storePlayers(data.players);
      setMyRole(null);
      setGameState("ANSWERING");
      setStarting(false);
      router.push(`/game/${roomId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, router, setGameId, setGameState, setQuestion, setCurrentRound, setTotalRounds,
      setActiveRoundId, setMyRole, setAnswererId, storePlayers, storeGameMode]);

  const handleStartGame = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStartError(data.error ?? "Oyun başlatılamadı");
        setStarting(false);
      }
    } catch {
      setStartError("Bağlantı hatası");
      setStarting(false);
    }
  };

  const activePlayers = players.filter(p => p.role !== "SPECTATOR");
  const spectators    = players.filter(p => p.role === "SPECTATOR");
  const canStart      = activePlayers.length >= 2;
  const isFull        = activePlayers.length >= maxPlayers;
  const fillPct       = Math.min(100, Math.round((activePlayers.length / maxPlayers) * 100));

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start pt-safe pb-safe px-6 overflow-y-auto overflow-x-hidden">
      {/* Aurora Background 2.0 */}
      <div className="aurora-bg" aria-hidden>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="aurora-blob-1" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -8, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="aurora-blob-2" 
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col gap-5 pt-8 pb-12">
        {/* Back Button */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            if (window.history.length > 1) router.back();
            else window.location.href = "/";
          }}
          className="flex items-center gap-3 text-slate-100/60 hover:text-white transition-all duration-300 w-fit mb-2 group px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 shadow-lg active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent/20 group-hover:text-accent transition-all duration-500 shadow-inner">
            <ChevronLeft size={20} />
          </div>
          <div className="flex flex-col items-start leading-none gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Yanlış mı bastın?</span>
            <span className="text-[13px] font-black uppercase tracking-widest">Lobiye Dön</span>
          </div>
        </motion.button>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between items-end px-1"
        >
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter gradient-text leading-tight drop-shadow">
              mirros
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Oyun Lobisi</p>
          </div>
          <div className="glass-card px-3 py-1.5 flex items-center gap-2 border-white/10">
            {gameMode === "QUIZ" ? (
              <>
                <Brain className="text-cyan-400" size={14} />
                <span className="text-[11px] font-bold text-slate-200">Bilgi Yarışması</span>
              </>
            ) : (
              <>
                <Sparkles className="text-accent" size={14} />
                <span className="text-[11px] font-bold text-slate-200">Birbirini Tanı</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Room Code Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-elevated p-6 flex flex-col items-center gap-6"
        >
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Davet Kodu</p>
            <h2 className="text-6xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] select-all leading-tight">
              {roomCode ?? "——"}
            </h2>
          </div>

          {/* QR Code Presentation */}
          {roomCode && (
            <div className="p-3 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform">
              <QRCode 
                value={typeof window !== "undefined" ? `${window.location.origin}/?code=${roomCode}` : `https://mirros.vercel.app/?code=${roomCode}`}
                size={140}
                level="H"
                className="rounded-lg"
              />
            </div>
          )}

          <div className="flex w-full gap-3">
            <button
              onClick={handleCopy}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all border",
                copied 
                  ? "bg-green-500/10 border-green-500/40 text-green-400" 
                  : "bg-white/[0.03] border-white/[0.08] text-slate-100 hover:bg-white/[0.08]"
              )}
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? "KOPYALANDI" : "LİNKİ KOPYALA"}
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-14 flex items-center justify-center py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
            >
              <MessageCircle size={20} fill="currentColor" stroke="none" />
            </button>
          </div>
        </motion.div>

        {/* Player List Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col gap-6"
        >
          {/* Progress Indicator */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[12px] font-black text-slate-100 flex items-center gap-2">
                <Users size={14} className="text-slate-400" />
                {isFull ? "🎉 OYUNCU KADROSU TAMAM!" : `${activePlayers.length} / ${maxPlayers} OYUNCU`}
              </span>
              {!canStart && (
                <span className="text-[10px] font-bold text-slate-500 italic opacity-60">en az 2 oyuncu gerekli</span>
              )}
            </div>
            <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                className="h-full bg-gradient-to-r from-accent to-accent-2" 
              />
            </div>
          </div>

          {/* Players List */}
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {activePlayers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent-2/20 flex items-center justify-center border border-white/10 shadow-[0_0_10px_rgba(168,85,247,0.1)] relative overflow-hidden">
                    <span className="text-xl relative z-10 translate-y-[1px]">
                      {p.avatarUrl || (p.username ?? "?")[0].toUpperCase()}
                    </span>
                    <motion.div 
                      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-accent/5" 
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-white transition-colors">{p.username}</span>
                      {p.username === hostName && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[9px] font-black text-accent uppercase tracking-tighter">
                          <ShieldCheck size={10} /> Host
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Oyuncu</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Spectators List */}
            {spectators.length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap px-2">İzleyiciler ({spectators.length})</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {spectators.map((s) => (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                      <span className="text-xl">{s.avatarUrl || "👤"}</span>
                      <span className="text-[8px] font-bold text-slate-500 truncate w-full text-center tracking-tighter">{s.username}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting Slot */}
            {!isFull && Array.from({ length: Math.max(0, Math.min(1, maxPlayers - activePlayers.length)) }).map((_, i) => (
              <div key={`wait-${i}`} className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-white/10 opacity-30">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center italic text-xs">?</div>
                <div className="flex-1">
                  <span className="text-[12px] font-bold text-slate-500">Oyuncu bekleniyor...</span>
                </div>
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

          {/* Action Button Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            {isHost && (
              <button
                onClick={() => setManagerOpen(true)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 text-slate-300 text-[11px] font-black uppercase tracking-widest transition-all mb-1"
              >
                <PlusCircle size={14} className="text-accent" />
                Özel Soru Ekle
              </button>
            )}

            {isHost ? (
            <>
              <button
                onClick={handleStartGame}
                disabled={starting || !canStart}
                className={cn(
                  "btn-gradient w-full py-4 rounded-2xl text-[13px] tracking-widest font-black flex items-center justify-center gap-3 shadow-[0_4px_24px_rgba(168,85,247,0.4)]",
                  !canStart && "opacity-40 grayscale pointer-events-none"
                )}
              >
                {starting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> BAŞLATILIYOR...
                  </>
                ) : (
                  <>OYUNU BAŞLAT <ArrowRight size={18} /></>
                )}
              </button>
              {startError && <p className="text-red-400 text-[11px] text-center font-bold">{startError}</p>}
            </>
          ) : (
            <div className="relative glass-card p-4 flex items-center justify-center gap-3 overflow-hidden border-white/5">
              <motion.div 
                animate={{ opacity: [0.05, 0.15, 0.05] }} 
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-accent" 
              />
              <Loader2 className="animate-spin text-accent" size={16} />
              <p className="text-[12px] font-bold text-slate-400 relative z-10">
                <span className="text-white font-black">{hostName ?? "Host"}</span> oyunu başlatıyor...
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {managerOpen && (
          <ManageQuestions 
            roomId={roomId} 
            onClose={() => setManagerOpen(false)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}
