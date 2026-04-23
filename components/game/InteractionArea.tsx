"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Users, User as UserIcon } from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { AnswerInput } from "@/components/game/AnswerInput";
import { GuessInput } from "@/components/game/GuessInput";
import { MultipleChoiceInput } from "@/components/game/MultipleChoiceInput";
import { FlashbackCard } from "@/components/game/FlashbackCard";
import { cn } from "@/lib/utils";

interface Props {
  myUserId: string | null;
  pastAnswers: any[];
  timeLeft: number;
  isAnswerer: boolean;
  isHostPlayer: boolean;
  spotlightPlayer: { username?: string; avatarUrl?: string | null } | undefined;
  onSubmitAnswer: (content: string) => Promise<void>;
  onSubmitGuess: (content: string, reason?: string) => Promise<void>;
  onTriggerScore: () => Promise<void>;
  onSkipRound: () => Promise<void>;
}

export function InteractionArea({
  myUserId, pastAnswers, timeLeft, isAnswerer, isHostPlayer, spotlightPlayer,
  onSubmitAnswer, onSubmitGuess, onTriggerScore, onSkipRound,
}: Props) {
  const {
    state, myRole, gameMode, question, gameId, activeRoundId,
    answererId, guessCount, totalGuessers, bluffOptions, players,
  } = useGameStore();

  const isQuiz   = gameMode === "QUIZ";
  const isExpose = gameMode === "EXPOSE";
  const isBluff  = gameMode === "BLUFF";
  const isSpy    = gameMode === "SPY";

  const myUsername = players.find(p => p.id === myUserId)?.username;

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {myRole === "spectator" ? (
          <motion.div
            key="spectator-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center border-accent/20"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Users size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">İzleyici Modu</h4>
              <p className="text-[12px] font-medium text-slate-400">
                Oyun şu an dolu, ama her anı canlı izleyebilir ve emoji gönderebilirsin!
              </p>
            </div>
          </motion.div>
        ) : isBluff ? (
          <motion.div key={`bluff-area-${activeRoundId}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {state === "ANSWERING" ? (
              <div className="flex flex-col gap-3">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Sahte Cevap Yaz!</p>
                  <p className="text-[10px] text-slate-400 mt-1">Başkalarını kandır — gerçekmiş gibi görünen bir cevap yaz</p>
                </div>
                <AnswerInput onSubmit={onSubmitAnswer} gameId={gameId} username={myUsername} />
                <p className="text-center text-[10px] text-slate-600 font-bold">{guessCount} / {totalGuessers} cevap gönderildi</p>
              </div>
            ) : state === "GUESSING" && bluffOptions.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Hangisi Gerçek?</p>
                  <p className="text-[10px] text-slate-400 mt-1">Doğru cevabı bul — sahte yazanlara oy gelirse onlar da kazanır!</p>
                </div>
                <MultipleChoiceInput options={bluffOptions} onSubmit={onSubmitGuess} allowFreeText={false} gameId={gameId} username={myUsername} />
              </div>
            ) : (
              <div className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-dashed border-violet-500/40" />
                <p className="text-[13px] font-bold text-slate-400">Cevaplar toplanıyor…</p>
              </div>
            )}
          </motion.div>
        ) : isSpy ? (
          <motion.div key={`spy-area-${activeRoundId}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {state === "ANSWERING" ? (
              <div className="flex flex-col gap-3">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[11px] font-black text-orange-400 uppercase tracking-widest">İpucu Zamanı!</p>
                  <p className="text-[10px] text-slate-400 mt-1">Konun hakkında kapalı bir ipucu yaz. Casus olduğunu belli etme!</p>
                </div>
                <AnswerInput onSubmit={onSubmitAnswer} gameId={gameId} username={myUsername} />
              </div>
            ) : state === "GUESSING" ? (
              <div className="flex flex-col gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">Casus Kim?</p>
                  <p className="text-[10px] text-slate-400 mt-1">İpuçlarını dinledin. Sence gruptaki casus kim?</p>
                </div>
                <MultipleChoiceInput
                  options={players.filter(p => p.role !== "SPECTATOR").map(p => p.username || "Anonim")}
                  onSubmit={onSubmitGuess}
                  allowFreeText={false}
                  gameId={gameId}
                  username={myUsername}
                />
              </div>
            ) : null}
          </motion.div>
        ) : (isQuiz || isExpose || (state === "ANSWERING" && !answererId)) ? (
          <motion.div key={`simultaneous-area-${activeRoundId}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {isExpose || (state === "ANSWERING" && !answererId && !isQuiz) ? (
              <MultipleChoiceInput
                options={players.filter(p => p.role !== "SPECTATOR").map(p => p.username || "Anonim")}
                onSubmit={onSubmitGuess}
                allowFreeText={false}
                showReason={true}
                gameId={gameId}
                username={myUsername}
                guessCount={guessCount}
                totalGuessers={totalGuessers}
              />
            ) : (
              (question?.options && question.options.length > 0)
                ? <MultipleChoiceInput options={question.options} onSubmit={onSubmitAnswer} gameId={gameId} username={myUsername} />
                : <AnswerInput onSubmit={onSubmitAnswer} gameId={gameId} username={myUsername} />
            )}
          </motion.div>
        ) : state === "ANSWERING" && answererId !== null ? (
          <motion.div key={`answering-area-${activeRoundId}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {isAnswerer ? (
              (question?.options && question.options.length > 0)
                ? <MultipleChoiceInput options={question.options} onSubmit={onSubmitAnswer} allowFreeText gameId={gameId} username={myUsername} />
                : <AnswerInput onSubmit={onSubmitAnswer} gameId={gameId} username={myUsername} />
            ) : (
              <div className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-dashed border-accent/30" />
                  <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" size={20} />
                </div>
                <p className="text-[13px] font-medium text-slate-300 leading-relaxed">
                  <span className="text-white font-black">{spotlightPlayer?.username ?? "Arkadaşın"}</span> şu an cevap veriyor...
                </p>
                <span className={cn(
                  "text-[11px] font-black tabular-nums px-3 py-1 rounded-full border",
                  timeLeft <= 10
                    ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse"
                    : "text-slate-500 border-white/10"
                )}>
                  {timeLeft}s kaldı
                </span>
              </div>
            )}
          </motion.div>
        ) : state === "GUESSING" ? (
          <motion.div key={`guessing-area-${activeRoundId}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {isAnswerer ? (
              <div className="glass-card-elevated p-8 flex flex-col items-center gap-6">
                <p className="text-[15px] font-bold text-white tracking-tight">
                  {guessCount} / {totalGuessers} arkadaşın tahmin etti
                </p>
              </div>
            ) : (
              (question?.options && question.options.length > 0)
                ? <MultipleChoiceInput options={question.options} onSubmit={onSubmitGuess} allowFreeText showReason gameId={gameId} username={myUsername} />
                : <GuessInput opponentName={spotlightPlayer?.username ?? "Arkadaşın"} onSubmit={onSubmitGuess} gameId={gameId} username={myUsername} />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Flashback/Hafıza Kartı */}
      <AnimatePresence>
        {pastAnswers.length > 0 && (
          <FlashbackCard
            username={spotlightPlayer?.username ?? "Arkadaşın"}
            pastAnswers={pastAnswers}
          />
        )}
      </AnimatePresence>

      {/* Host Skip/Force Score Button */}
      {isHostPlayer && (state === "ANSWERING" || state === "GUESSING") && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            if (state === "GUESSING") onTriggerScore().catch(() => onSkipRound().catch(() => {}));
            else onSkipRound();
          }}
          className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 group"
        >
          Süreyi Bitir ve İlerle
        </motion.button>
      )}
    </div>
  );
}
