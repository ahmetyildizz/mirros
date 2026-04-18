"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Trophy, 
  Medal, 
  Star, 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  MessageCircle,
  History,
  Sparkles,
  Lock,
  PlayCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareButton } from "./ShareButton";
import { AIInsightCard } from "./AIInsightCard";
import { AdBanner } from "@/components/shared/AdBanner";
import { getThemeFromRoom } from "@/lib/logic/theme-mapper";
import { useGameStore } from "@/store/game.store";

interface PlayerResult {
  userId: string;
  username: string;
  points: number;
  isMe: boolean;
  title?: string;
}

interface RoundData {
  id: string;
  number: number;
  question: { text: string };
  answererName: string;
  answerContent: string | null;
  pastAnswer?: { content: string; at: Date } | null;
  myAnswerContent?: string | null;
  scores: {
    id: string;
    guesserName: string;
    guessContent: string | null;
    matchLevel: string;
    points: number;
  }[];
}

interface Props {
  gameId: string;
  leaderboard: PlayerResult[];
  familiarity: number;
  familiarityText: string;
  familiarityEmoji: string;
  rounds: RoundData[];
  funniestRound?: { question: string; answer: string; reason?: string | null; username?: string | null } | null;
  compatMap: Record<string, { username: string; pct: number; bestGuesser?: { name: string; points: number }; title?: string }>;
  aiReport: { intro: string; tag: string; story: string; playerBadges?: { userId: string; badgeName: string; badgeEmoji: string; badgeSlug: string }[] };
  roomCategory: string | null;
  gameMode: "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF";
}

export function ResultsClient({ 
  gameId, 
  leaderboard, 
  familiarity, 
  familiarityText, 
  familiarityEmoji,
  rounds,
  funniestRound,
  compatMap,
  aiReport,
  roomCategory,
  gameMode
}: Props) {
  const { setTheme } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [isAIUnlocked, setIsAIUnlocked] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Sync theme
    setTheme(getThemeFromRoom(roomCategory, gameMode));
    
    // Big celebration
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleUnlockAI = () => {
    setIsAdLoading(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      setAdProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setIsAIUnlocked(true);
        setIsAdLoading(false);
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ["#A855F7", "#D946EF"]
        });
      }
    }, 150); // Total ~3 seconds
  };

  const top3 = leaderboard.slice(0, 3).map(p => ({
    ...p,
    title: compatMap[p.userId]?.title || p.title
  }));
  const rest = leaderboard.slice(3).map(p => ({
    ...p,
    title: compatMap[p.userId]?.title || p.title
  }));

  // Podium order: [Silver, Gold, Bronze]
  const podiumOrder = [
    top3[1] || null,
    top3[0] || null,
    top3[2] || null
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <span className="text-2xl font-black gradient-text tracking-tighter antialiased">mirros</span>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Oyun Tamamlandı</p>
      </motion.div>

      {/* Podium Section */}
      <div className="relative pt-12 pb-4">
        <div className="flex items-end justify-center gap-2 h-[260px] max-w-[400px] mx-auto px-4">
          {podiumOrder.map((player, idx) => {
            if (!player) return <div key={idx} className="flex-1" />;
            
            const isGold = player.userId === top3[0]?.userId;
            const isSilver = top3[1] && player.userId === top3[1]?.userId;
            const isBronze = top3[2] && player.userId === top3[2]?.userId;

            const height = isGold ? "h-full" : isSilver ? "h-[75%]" : "h-[60%]";
            const color = isGold ? "from-yellow-400 to-yellow-600" : isSilver ? "from-slate-300 to-slate-500" : "from-orange-400 to-orange-600";
            const shadow = isGold ? "shadow-[0_0_30px_rgba(234,179,8,0.3)]" : isSilver ? "shadow-[0_0_20px_rgba(203,213,225,0.2)]" : "shadow-[0_0_20px_rgba(251,146,60,0.2)]";

            return (
              <motion.div 
                key={player.userId}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 100 }}
                className={cn("flex-1 flex flex-col items-center", height)}
              >
                <div className="relative mb-3 flex flex-col items-center">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg relative overflow-hidden",
                    player.isMe ? "ring-2 ring-accent ring-offset-2 ring-offset-black" : ""
                  )}>
                    <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", color)} />
                    <span className="text-lg font-black text-white relative z-10">{player.username[0].toUpperCase()}</span>
                  </div>
                  
                  {isGold && <Trophy className="text-yellow-400 absolute -top-8 animate-bounce" size={24} />}
                  {(isSilver || isBronze) && (
                    <Medal 
                      size={18} 
                      className={cn(
                        "absolute -top-6",
                        isSilver ? "text-slate-300" : "text-orange-400"
                      )} 
                    />
                  )}
                </div>

                <div className={cn(
                  "w-full flex-1 rounded-t-2xl flex flex-col items-center justify-start p-3 gap-1 relative overflow-hidden bg-gradient-to-b border border-white/10",
                  color, shadow
                )}>
                   <span className="text-[10px] font-black text-black/60 uppercase tracking-tighter truncate w-full text-center">
                    {player.username}
                   </span>
                   <span className="text-xl font-black text-black drop-shadow-sm">{player.points}</span>
                   {player.title && (
                     <div className="bg-white/20 px-3 py-1 rounded-full mt-2 shadow-[0_0_10px_rgba(255,255,255,0.2)] border border-white/30 backdrop-blur-md z-20 transition-all hover:scale-105">
                        <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">✨ {player.title}</span>
                     </div>
                   )}
                   <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-auto mb-2">
                    {isGold ? "1ST" : isSilver ? "2ND" : "3RD"}
                   </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Social Badges Section */}
      {aiReport.playerBadges && aiReport.playerBadges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 px-1 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center justify-center">
            <span className="h-px flex-1 bg-white/5" />
            🌟 AI Sosyal Rozetler
            <span className="h-px flex-1 bg-white/5" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {aiReport.playerBadges.map((pb, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1, type: "spring" }}
                className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-1 min-w-[100px] shadow-sm hover:border-accent/40 transition-colors"
                title={`${pb.badgeName} — Bu turdaki performansınla kazandın!`}
              >
                <span className="text-3xl mb-1">{pb.badgeEmoji}</span>
                <span className="text-[10px] font-black text-white uppercase text-center">{pb.badgeName}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                  {leaderboard.find(l => l.userId === pb.userId)?.username || "Oyuncu"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Social Similarity Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="glass-card-elevated p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Sparkles size={80} className="text-accent" />
        </div>

        <div className="flex flex-col items-center text-center gap-4 relative z-10">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-5xl"
          >
            {familiarityEmoji}
          </motion.div>
          
          <div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-black text-white tracking-tighter">{familiarity}%</span>
              <span className="text-accent font-black text-xl">UYUM</span>
            </div>
            <p className="text-[13px] font-medium text-slate-300 max-w-[280px] mt-2 leading-relaxed">
              {familiarityText}
            </p>
          </div>

          <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden mt-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${familiarity}%` }}
              transition={{ delay: 1.5, duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-accent to-fuchsia-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
      
      {/* Results Banner Ad */}
      <AdBanner type="results" className="px-2" />
      
      {/* AI Insight Section (Locked/Unlocked) */}
      <div className="relative">
        <div className={cn(
          "transition-all duration-700",
          !isAIUnlocked ? "blur-xl grayscale opacity-40 pointer-events-none select-none h-[220px] overflow-hidden" : "blur-0"
        )}>
          <AIInsightCard 
            intro={aiReport.intro}
            tag={aiReport.tag}
            story={aiReport.story}
          />
        </div>

        {!isAIUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 gap-6"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-[2rem]" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-[1.5rem] bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-lg shadow-accent/20">
                {isAdLoading ? <Loader2 className="animate-spin" size={32} /> : <Lock size={32} />}
              </div>
              <div className="flex flex-col gap-1">
                <h5 className="text-[15px] font-black text-white uppercase tracking-widest">Kişilik Analizi Kilitli</h5>
                <p className="text-[11px] font-bold text-slate-400 max-w-[200px]">Kısa bir reklam izleyerek yapay zekanın senin hakkındaki analizini aç!</p>
              </div>

              {isAdLoading ? (
                <div className="w-full max-w-[200px] flex flex-col gap-2">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${adProgress}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">Sponsor İçerik Yükleniyor...</span>
                </div>
              ) : (
                <button
                  onClick={handleUnlockAI}
                  className="px-8 py-4 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                >
                  <PlayCircle size={18} />
                  ANALİZİ AÇ
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Funniest Moment Section */}
      {funniestRound && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-elevated p-8 relative border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 p-4 opacity-5">
            <MessageCircle size={80} className="text-yellow-400 rotate-12" />
          </div>
          
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400/20 text-yellow-400 p-2 rounded-xl">
                <Star size={20} fill="currentColor" />
              </div>
              <span className="text-[11px] font-black text-yellow-400 uppercase tracking-[0.3em]">Oyunun En Komik Anı</span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[15px] font-black text-white leading-tight italic">
                &quot;{funniestRound.question}&quot;
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cevap: {funniestRound.answer}</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>

            {funniestRound.reason && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative group">
                <p className="text-[13px] font-medium text-slate-200 mb-1 leading-relaxed">
                  &quot;{funniestRound.reason}&quot;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-black text-accent">
                    {funniestRound.username?.[0].toUpperCase()}
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    — {funniestRound.username}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Rankings List (if more than 3) */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <TrendingUp size={12} /> Diğer Sıralamalar
          </p>
          <div className="flex flex-col gap-2">
            {rest.map((player, i) => (
              <motion.div 
                key={player.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.05 }}
                className={cn(
                  "item-glass p-4 flex items-center justify-between",
                  player.isMe ? "border-accent/40 bg-accent/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : ""
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-black text-slate-500 w-4">{i + 4}.</span>
                  <span className={cn("text-[14px] font-bold", player.isMe ? "text-white" : "text-slate-200")}>
                    {player.username} {player.isMe && "(Sen)"}
                  </span>
                </div>
                <span className="text-[15px] font-black text-white">{player.points} PT</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Stats */}
      {Object.keys(compatMap).length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Users size={12} /> Bilgi Karnesi
          </p>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(compatMap).map(([uid, data], i) => (
              <motion.div 
                key={uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + i * 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[14px] font-black text-white tracking-tight">{data.username}</span>
                  <span className="text-[12px] font-black text-accent">{data.pct}% doğru tahmin edildi</span>
                </div>
                
                <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${data.pct}%` }} />
                </div>

                {data.bestGuesser && (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <Star size={12} className="text-yellow-500" /> 
                    Onu en iyi <span className="text-white">{data.bestGuesser.name}</span> tanıyor! 
                    <span className="text-slate-500 ml-auto">({data.bestGuesser.points} pt)</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Roundup Section */}
      <div className="flex flex-col gap-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
           <MessageCircle size={12} /> Round Hikayeniz
        </p>
        <div className="flex flex-col gap-3">
          {rounds.map((round, i) => (
            <motion.div 
              key={round.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="glass-card p-5 border-white/[0.03]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">#{round.number} ROUND · {round.answererName}</span>
              </div>
              
              <h3 className="text-[15px] font-bold text-white mb-4 leading-snug">{round.question.text}</h3>
              
              {round.answerContent && (
                <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/5 mb-4">
                  <div className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">Cevap</div>
                  <span className="text-[14px] font-bold text-green-400">{round.answerContent}</span>
                </div>
              )}

              {round.pastAnswer && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 mb-4 overflow-hidden relative group">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-400/60 uppercase tracking-widest">
                    <History size={10} /> 🕰️ Senin Hafızan
                  </div>
                  <p className="text-[12px] font-medium text-blue-200 italic">&quot;{round.pastAnswer.content}&quot;</p>
                  <p className="text-[9px] text-blue-500/50 uppercase font-black">
                    {Math.max(1, Math.round((Date.now() - new Date(round.pastAnswer.at).getTime()) / (1000 * 60 * 60 * 24 * 30)))} AY ÖNCEKİ CEVABIN
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {round.scores.map((sc) => (
                  <div key={sc.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/[0.02]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{sc.guesserName}</span>
                      <span className="text-[12px] font-medium text-slate-300">{sc.guessContent || "—"}</span>
                    </div>
                    <div className={cn(
                      "text-[12px] font-black",
                      sc.matchLevel === "EXACT" ? "text-green-500" : sc.matchLevel === "CLOSE" ? "text-yellow-500" : "text-slate-600"
                    )}>
                      +{sc.points}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final Actions */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2 }}
        className="flex flex-col gap-3 mt-4"
      >
        <ShareButton
          familiarity={familiarity}
          gameId={gameId}
          funniestQuestion={funniestRound?.question}
          funniestAnswer={funniestRound?.answer}
          aiTag={aiReport.tag}
          winner={top3[0]?.username}
        />
        
        <a 
          href="/" 
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-white/[0.03] border border-white/10 text-white text-[13px] font-black tracking-[0.2em] uppercase hover:bg-white/[0.06] transition-all"
        >
          <ArrowLeft size={16} /> Lobiye Dön
        </a>
      </motion.div>
    </div>
  );
}
