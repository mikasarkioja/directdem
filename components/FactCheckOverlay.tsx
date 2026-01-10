"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { addDNAPoints } from "@/app/actions/dna";

interface FactCheckOverlayProps {
  factCheck: string | null;
  onClose: () => void;
}

export default function FactCheckOverlay({ factCheck, onClose }: FactCheckOverlayProps) {
  if (!factCheck) return null;

  const isCorrection = factCheck.startsWith("Korjaus:");
  
  const handleReact = async () => {
    // Reward XP for reacting to fact check
    await addDNAPoints("fact_checker", 1);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
      >
        <div className={`bg-white border-2 ${isCorrection ? 'border-rose-500 shadow-rose-200' : 'border-emerald-500 shadow-emerald-200'} rounded-3xl p-5 shadow-2xl flex items-center gap-4 relative overflow-hidden`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCorrection ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {isCorrection ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isCorrection ? 'text-rose-500' : 'text-emerald-500'}`}>
                🔍 The Agora Fact-Check
              </span>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-snug">
              {factCheck}
            </p>
          </div>

          <button 
            onClick={handleReact}
            className="bg-slate-900 text-white p-3 rounded-2xl hover:scale-105 transition-transform group flex items-center gap-2"
          >
            <Zap size={16} className="text-command-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">+1 XP</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


