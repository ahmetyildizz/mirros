"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, History, Sparkles, CheckCircle2 } from "lucide-react";
import { VERSION_HISTORY, CURRENT_VERSION } from "@/lib/version-config";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistoryModal({ isOpen, onClose }: VersionHistoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[480px] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                  <History size={20} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-white tracking-tight">Güncelleme Geçmişi</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Versiyon Takibi</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {VERSION_HISTORY.map((entry, idx) => (
                <div key={entry.version} className="relative pl-8">
                  {/* Timeline line */}
                  {idx !== VERSION_HISTORY.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-32px] w-px bg-slate-800" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-4 border-slate-900 z-10 flex items-center justify-center ${
                    entry.version === CURRENT_VERSION ? "bg-accent" : "bg-slate-700"
                  }`}>
                    {entry.version === CURRENT_VERSION && <Sparkles size={10} className="text-white" />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-black tracking-widest uppercase ${
                        entry.version === CURRENT_VERSION ? "text-accent" : "text-slate-400"
                      }`}>
                        {entry.version}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 tracking-tighter">{entry.date}</span>
                    </div>
                    
                    <h4 className="text-md font-black text-white tracking-tight">{entry.title}</h4>
                    
                    <ul className="space-y-2 mt-2">
                      {entry.changes.map((change, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 size={14} className="text-accent/40 mt-0.5 shrink-0" />
                          <span className="text-[13px] font-bold text-slate-400 leading-relaxed italic">
                            {change}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/40 text-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                mirros · {CURRENT_VERSION}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
