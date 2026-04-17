"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-black flex flex-col items-center justify-center p-6 gap-6">
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-20" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-4 text-center max-w-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-widest">Bir Şeyler Ters Gitti</h1>
        <p className="text-sm text-slate-400 font-medium">
          Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi dene.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-600">Hata kodu: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent text-sm font-black uppercase tracking-widest hover:bg-accent/30 transition-all"
        >
          <RefreshCw size={14} />
          Tekrar Dene
        </button>
      </motion.div>
    </main>
  );
}
