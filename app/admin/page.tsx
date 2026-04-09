"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Search, 
  Users, 
  Gamepad2, 
  Calendar, 
  MessageCircle,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminData {
  games: any[];
  stats: {
    totalGames: number;
    totalUsers: number;
    totalRounds: number;
  };
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/history")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredGames = data?.games.filter(g => 
    g.room.code.toLowerCase().includes(search.toLowerCase()) ||
    g.room.participants.some((p: any) => p.user.username?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Admin Paneli Yükleniyor...</p>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-[#030303] text-slate-200 p-4 md:p-8 selection:bg-accent selection:text-white">
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="text-accent" size={18} />
                <h1 className="text-2xl font-black uppercase tracking-widest text-white">Mirros Admin</h1>
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Global Oyun Takip ve Analiz Paneli</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <StatCard icon={Gamepad2} label="Toplam Oyun" value={data?.stats.totalGames ?? 0} />
            <StatCard icon={Users} label="Kullanıcı" value={data?.stats.totalUsers ?? 0} />
            <StatCard icon={TrendingUp} label="Raunt" value={data?.stats.totalRounds ?? 0} />
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Game List */}
          <section className="lg:col-span-5 space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Oda kodu veya oyuncu ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold placeholder:text-slate-600 focus:border-accent/40 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-4 max-h-[70dvh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredGames.map((game) => (
                <motion.button
                  key={game.id}
                  layoutId={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={cn(
                    "w-full text-left p-5 rounded-3xl border transition-all flex flex-col gap-4",
                    selectedGame === game.id 
                      ? "bg-accent/10 border-accent/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                  )}
                >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-slate-400">
                          {game.room.code}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{game.room.category || "Genel Oyun"}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Clock size={10} /> {new Date(game.startedAt).toLocaleDateString("tr-TR")} {new Date(game.startedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                     </div>
                     <ChevronRight className={cn("transition-transform", selectedGame === game.id ? "rotate-90 text-accent" : "text-slate-600")} size={18} />
                   </div>

                   <div className="flex flex-wrap gap-1.5">
                     {game.room.participants.map((p: any) => (
                        <span key={p.id} className="text-[9px] font-black px-2 py-1 rounded-full bg-white/5 border border-white/5 text-slate-400">
                          {p.user.avatarUrl} {p.user.username}
                        </span>
                     ))}
                   </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Right Column: Details */}
          <section className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selectedGame ? (
                <GameDetails game={data?.games.find(g => g.id === selectedGame)} key={selectedGame} />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-700 mb-4">
                    <Gamepad2 size={32} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Oyun Seçilmedi</h3>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tighter max-w-[240px]">
                    Detayları görmek için soldaki listeden bir oyun seçin.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-white leading-none">{value}</p>
      </div>
    </div>
  );
}

function GameDetails({ game }: { game: any }) {
  if (!game) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/[0.02] border border-white/5 rounded-[40px] p-6 md:p-10 space-y-10"
    >
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">{game.status}</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Oda {game.room.code}</h2>
          <p className="text-slate-400 font-medium">Bu oturumda toplam <span className="text-white">{game.rounds.length} raunt</span> oynandı.</p>
        </div>
        <div className="flex -space-x-4">
          {game.room.participants.map((p: any) => (
            <div key={p.id} className="w-12 h-12 rounded-2xl bg-zinc-900 border-2 border-black flex items-center justify-center text-2xl shadow-xl group relative cursor-help" title={p.user.username}>
              {p.user.avatarUrl}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {game.rounds.map((round: any, idx: number) => {
          const mainAnswer = round.answers.find((a: any) => a.userId === round.answererId);
          return (
            <div key={round.id} className="relative pl-10 border-l border-white/5">
              <div className="absolute -left-[14px] top-0 w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-400">
                {round.number}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-accent" size={12} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{round.question.category}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-tight">{round.question.text}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* The Answer */}
                  <div className="bg-accent/5 rounded-[24px] p-5 border border-accent/10">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[9px] font-black text-accent uppercase tracking-widest">Odak Oyuncu: {mainAnswer?.user.username || "???"}</span>
                       <span className="text-[8px] text-slate-600 font-bold">{new Date(mainAnswer?.submittedAt).toLocaleTimeString("tr-TR")}</span>
                    </div>
                    <p className="text-xl font-black text-white italic tracking-tight italic">&quot;{mainAnswer?.content || "(Cevaplanmadı)"}&quot;</p>
                  </div>

                  {/* The Guesses */}
                  <div className="bg-white/[0.02] rounded-[24px] p-5 border border-white/5 space-y-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tahminler</span>
                    <div className="space-y-2">
                      {round.guesses.map((guess: any) => (
                         <div key={guess.id} className="flex flex-col gap-1 p-3 rounded-xl bg-black/40 border border-white/5">
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-slate-400 uppercase">{guess.user.username}</span>
                             <span className="text-[8px] text-slate-600">{new Date(guess.submittedAt).toLocaleTimeString("tr-TR")}</span>
                           </div>
                           <p className="text-[13px] font-bold text-slate-200">{guess.content}</p>
                           {guess.reason && <p className="text-[9px] italic text-slate-500 leading-none">Neden: {guess.reason}</p>}
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
