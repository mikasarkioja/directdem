"use client";

import { motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

export default function AuthErrorToast({ error }: { error: string }) {
  if (!error) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-rose-500/50 flex items-start gap-4 backdrop-blur-xl bg-slate-900/90"
      >
        <div className="bg-rose-500/20 p-3 rounded-2xl text-rose-500">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-black uppercase text-[10px] tracking-widest text-rose-500">Kirjautuminen epäonnistui</p>
          <p className="font-bold text-sm text-slate-200 leading-relaxed">{decodeURIComponent(error)}</p>
          <p className="text-[9px] text-slate-500 font-medium">Kokeile tilata uusi linkki tai käytä toista selainta.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="text-slate-500 hover:text-white transition-colors p-2"
        >
          <X size={18} />
        </button>
      </motion.div>
    </div>
  );
}

