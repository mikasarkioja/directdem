"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ThumbsUp, ThumbsDown, Loader2, Sparkles, Scale } from "lucide-react";
import { getExpertOpinions } from "@/lib/actions/expert-opinions";

interface ExpertHearingProps {
  billTitle: string;
  billSummary: string;
}

export default function ExpertHearing({ billTitle, billSummary }: ExpertHearingProps) {
  const [opinions, setOpinions] = useState<{ pro: string; con: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpertOpinions(billTitle, billSummary).then(res => {
      setOpinions(res);
      setLoading(false);
    });
  }, [billTitle, billSummary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-purple-400">
        <Scale size={20} />
        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Asiantuntijakuuleminen (Expert Hearing)</h3>
      </div>

      {loading ? (
        <div className="bg-slate-900/50 border border-white/5 p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="animate-spin text-purple-500" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Analysoidaan asiantuntijalausuntoja...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Opinion */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ThumbsUp size={48} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Asiantuntija A: Puoltava</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium italic relative z-10">
              "{opinions?.pro}"
            </p>
          </motion.div>

          {/* Con Opinion */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-3xl space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ThumbsDown size={48} className="text-rose-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Asiantuntija B: Kriittinen</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium italic relative z-10">
              "{opinions?.con}"
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}


