"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Globe, Lock, Trash2, PackageOpen, Loader2, ChevronLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Pack {
  id:          string;
  slug:        string;
  name:        string;
  description: string | null;
  isPublic:    boolean;
  gameMode:    string;
  category:    string;
  playCount:   number;
  creator:     { username: string | null; avatarUrl: string | null };
  _count:      { questions: number };
}

interface NewQuestion {
  text:    string;
  correct: string;
}

export default function PacksPage() {
  const router = useRouter();
  const [packs,      setPacks]      = useState<Pack[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"public" | "mine">("public");
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("Genel");
  const [gameMode,    setGameMode]    = useState<"SOCIAL"|"QUIZ">("SOCIAL");
  const [isPublic,    setIsPublic]    = useState(true);
  const [questions,   setQuestions]   = useState<NewQuestion[]>([{ text: "", correct: "" }, { text: "", correct: "" }, { text: "", correct: "" }]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const fetchPacks = async (mine: boolean) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/packs${mine ? "?mine=true" : ""}`);
      const data = await res.json();
      setPacks(Array.isArray(data) ? data : []);
    } catch {
      setPacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPacks(tab === "mine"); }, [tab]);

  const addQuestion = () => setQuestions(q => [...q, { text: "", correct: "" }]);

  const updateQuestion = (i: number, field: keyof NewQuestion, value: string) => {
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 3) return;
    setQuestions(q => q.filter((_, idx) => idx !== i));
  };

  const handleCreate = async () => {
    setError(null);
    const validQuestions = questions.filter(q => q.text.trim());
    if (!name.trim() || validQuestions.length < 3) {
      setError("En az 3 soru ve paket adı gerekli.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic, gameMode, category, questions: validQuestions }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.fieldErrors ? "Formu kontrol et." : (d.error ?? "Hata oluştu."));
        return;
      }
      setShowCreate(false);
      setName(""); setDescription(""); setQuestions([{ text: "", correct: "" }, { text: "", correct: "" }, { text: "", correct: "" }]);
      setTab("mine");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Bu paketi silmek istediğine emin misin?")) return;
    await fetch(`/api/packs/${slug}`, { method: "DELETE" });
    setPacks(p => p.filter(x => x.slug !== slug));
  };

  return (
    <main className="min-h-dvh bg-black text-white pb-16 overflow-x-hidden">
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-20" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.push("/")} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">Soru Paketleri</h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Topluluğun paketlerini kullan veya kendi paketini oluştur</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl">
          {(["public", "mine"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                tab === t ? "bg-accent text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >
              {t === "public" ? "🌍 Topluluk" : "📦 Benim Paketlerim"}
            </button>
          ))}
        </div>

        {/* Create Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className="w-full btn-gradient py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Yeni Paket Oluştur
        </motion.button>

        {/* Pack List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : packs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <PackageOpen size={48} className="text-white/10" />
            <p className="text-slate-500 font-bold text-sm">
              {tab === "mine" ? "Henüz bir paket oluşturmadın." : "Henüz public paket yok."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packs.map((pack, i) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-accent/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {pack.isPublic ? <Globe size={12} className="text-accent shrink-0" /> : <Lock size={12} className="text-slate-500 shrink-0" />}
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pack.gameMode} · {pack.category}</span>
                    </div>
                    <h3 className="font-black text-white text-base leading-tight">{pack.name}</h3>
                    {pack.description && <p className="text-xs text-slate-400 mt-1 leading-snug">{pack.description}</p>}
                  </div>
                  {tab === "mine" && (
                    <button type="button" onClick={() => handleDelete(pack.slug)} className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                    <span>{pack._count.questions} soru</span>
                    <span>·</span>
                    <span>{pack.playCount} oynanma</span>
                    {pack.creator.username && <><span>·</span><span>@{pack.creator.username}</span></>}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/?pack=${pack.slug}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider hover:bg-accent/20 transition-all"
                  >
                    <Sparkles size={10} /> Kullan
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full sm:max-w-lg bg-[#0d0d12] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto"
            >
              <h2 className="text-xl font-black text-white">Yeni Soru Paketi</h2>

              {/* Paket adı */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paket Adı *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: Arkadaş Gecesi Soruları"
                  className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-accent/40"
                />
              </div>

              {/* Kategori + Mod */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kategori</label>
                  <input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Genel"
                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-accent/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mod</label>
                  <select
                    value={gameMode}
                    onChange={e => setGameMode(e.target.value as any)}
                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-accent/40"
                  >
                    <option value="SOCIAL">Sosyal</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                </div>
              </div>

              {/* Açıklama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Açıklama (opsiyonel)</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Paket hakkında kısa bir açıklama"
                  className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-accent/40"
                />
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <div>
                  <p className="text-sm font-black text-white">Herkese Açık</p>
                  <p className="text-[10px] text-slate-500">Topluluğun bu paketi kullanabilir</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(p => !p)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    isPublic ? "bg-accent" : "bg-white/10"
                  )}
                >
                  <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", isPublic ? "left-7" : "left-1")} />
                </button>
              </div>

              {/* Sorular */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sorular (min. 3)</label>
                  <button type="button" onClick={addQuestion} className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1">
                    <Plus size={12} /> Soru Ekle
                  </button>
                </div>
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        value={q.text}
                        onChange={e => updateQuestion(i, "text", e.target.value)}
                        placeholder={`Soru ${i + 1}`}
                        className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-accent/40"
                      />
                      {gameMode === "QUIZ" && (
                        <input
                          value={q.correct}
                          onChange={e => updateQuestion(i, "correct", e.target.value)}
                          placeholder="Doğru cevap"
                          className="bg-white/[0.04] border border-green-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-green-500/40"
                        />
                      )}
                    </div>
                    <button type="button" onClick={() => removeQuestion(i)} className="w-8 h-8 mt-1 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {error && <p className="text-red-400 text-[11px] font-bold">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-black text-[11px] uppercase tracking-widest">
                  İptal
                </button>
                <button type="button" onClick={handleCreate} disabled={saving} className="flex-1 btn-gradient py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {saving ? "Kaydediliyor..." : "Paketi Oluştur"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
