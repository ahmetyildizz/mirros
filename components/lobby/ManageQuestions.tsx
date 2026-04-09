"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  Tag as TagIcon, 
  X, 
  Loader2,
  AlertCircle,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id:       string;
  text:     string;
  category: string;
  options:  string[] | null;
}

interface Props {
  roomId: string;
  onClose: () => void;
}

export function ManageQuestions({ roomId, onClose }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const [newText,     setNewText]     = useState("");
  const [newCategory, setNewCategory] = useState("Özel");
  const [newOptions,  setNewOptions]  = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, [roomId]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch {
      setError("Sorular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/questions`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          text:     newText.trim(),
          category: newCategory.trim(),
          options:  newOptions.length > 0 ? newOptions : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions([data, ...questions]);
        setNewText("");
        setNewOptions([]);
      } else {
        const data = await res.json();
        setError(data.error ?? "Soru eklenirken bir hata oluştu.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    if (newOptions.length >= 6) return;
    setNewOptions([...newOptions, optionInput.trim()]);
    setOptionInput("");
  };

  const removeOption = (idx: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <div className="glass-card-elevated w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
              <PlusCircle className="text-accent" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Odaya Özel Sorular</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kendi sorularını ekle ve arkadaşlarını şaşırt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          {/* Form */}
          <form onSubmit={handleAddQuestion} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Soru Metni</label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Örn: Partnerinin en garip huyu nedir?"
                className="input-glass w-full p-4 min-h-[100px] text-sm resize-none focus:border-accent/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kategori</label>
                <div className="relative">
                  <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input-glass w-full pl-10 pr-4 py-3 text-sm"
                    placeholder="Özel"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Şıklar (Opsiyonel)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                  placeholder="Şık ekle..."
                  className="input-glass flex-1 p-3 text-sm"
                />
                <button 
                  type="button"
                  onClick={addOption}
                  disabled={newOptions.length >= 6}
                  className="btn-ghost p-3 aspect-square flex items-center justify-center border-white/10"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-1">
                <AnimatePresence>
                  {newOptions.map((opt, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-bold flex items-center gap-2 group"
                    >
                      {opt}
                      <button type="button" onClick={() => removeOption(i)} className="opacity-40 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !newText.trim()}
              className="btn-gradient w-full py-3 rounded-xl text-xs tracking-widest font-black mt-2 shadow-[0_4px_15px_rgba(168,85,247,0.3)]"
            >
              {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : "SORUYU KAYDET"}
            </button>
          </form>

          {/* List */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Dodaki Özel Sorular ({questions.length})</label>
            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="flex flex-col items-center py-10 opacity-30">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <span className="text-xs font-bold">Yükleniyor...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-2 opacity-30">
                  <MessageSquare size={32} />
                  <span className="text-xs font-bold font-black">Henüz soru eklenmemiş</span>
                </div>
              ) : (
                questions.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded w-fit">{q.category}</span>
                        <p className="text-[14px] font-bold text-white leading-tight">{q.text}</p>
                      </div>
                      <button className="text-slate-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {q.options && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {q.options.map((opt, i) => (
                          <span key={i} className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-md bg-white/5">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
