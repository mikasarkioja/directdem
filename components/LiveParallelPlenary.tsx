"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Users, Building2, Zap, AlertTriangle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LiveParallelPlenaryProps {
  embedded?: boolean;
}

export default function LiveParallelPlenary({ embedded = false }: LiveParallelPlenaryProps) {
  const [isLive, setIsLive] = useState(embedded);
  const [realVotes, setRealVotes] = useState({ jaa: 102, ei: 98 });
  const [shadowVotes, setShadowVotes] = useState({ jaa: 450, ei: 320 });
  const [sessionInfo, setSessionInfo] = useState({ title: "Täysistunto 124/2025", currentItem: "HE 123/2024" });

  // Simulate real-time updates
  useEffect(() => {
    const timer = !embedded ? setTimeout(() => setIsLive(true), 2000) : null;
    const interval = setInterval(() => {
      if (isLive || embedded) {
        setShadowVotes(prev => ({
          jaa: prev.jaa + Math.floor(Math.random() * 5),
          ei: prev.ei + Math.floor(Math.random() * 3)
        }));
      }
    }, 3000);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isLive, embedded]);

  const democracyGap = Math.abs(
    (realVotes.jaa / (realVotes.jaa + realVotes.ei) * 100) - 
    (shadowVotes.jaa / (shadowVotes.jaa + shadowVotes.ei) * 100)
  ).toFixed(1);

  if (!isLive && !embedded) return null;

  const content = (
    <div className={`${embedded ? 'bg-slate-900 border border-white/10 rounded-[2.5rem]' : 'bg-slate-900 border border-purple-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(168,85,247,0.2)]'} p-8 backdrop-blur-2xl`}>
      <div className={`flex flex-col ${embedded ? 'space-y-6' : 'md:flex-row items-center justify-between gap-8'}`}>
        
        {/* Status & Info */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl ${embedded ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'bg-rose-500/20 border border-rose-500/30'} flex items-center justify-center`}>
              <Radio size={32} className={embedded ? 'text-[#D4AF37]' : 'text-rose-500 animate-pulse'} />
            </div>
            <div className={`absolute -top-2 -right-2 px-2 py-0.5 ${embedded ? 'bg-[#D4AF37]' : 'bg-rose-500'} text-white text-[8px] font-black uppercase rounded-full animate-pulse`}>LIVE</div>
          </div>
          <div className="space-y-1">
            <p className={`text-[10px] font-black uppercase ${embedded ? 'text-[#D4AF37]' : 'text-rose-500'} tracking-widest`}>{sessionInfo.title}</p>
            <h4 className="text-xl font-black uppercase text-white tracking-tighter leading-tight">{sessionInfo.currentItem}</h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Varjoeduskunta äänestää parhaillaan</p>
          </div>
        </div>

        {/* Voting Bars Comparison */}
        <div className={`flex-1 w-full space-y-6 ${embedded ? 'pt-4 border-t border-white/5' : ''}`}>
          <div className={`grid ${embedded ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-10'}`}>
            {/* Real Parliament */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500">
                <div className="flex items-center gap-1"><Building2 size={10} /> Oikea Eduskunta</div>
                <span className="text-white">{realVotes.jaa} / {realVotes.ei}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-slate-400" style={{ width: `${(realVotes.jaa / (realVotes.jaa + realVotes.ei)) * 100}%` }} />
                <div className="h-full bg-slate-700" style={{ width: `${(realVotes.ei / (realVotes.jaa + realVotes.ei)) * 100}%` }} />
              </div>
            </div>

            {/* Shadow Parliament */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8px] font-black uppercase text-purple-400">
                <div className="flex items-center gap-1"><Users size={10} /> Varjoeduskunta</div>
                <span className="text-white">{shadowVotes.jaa} / {shadowVotes.ei}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${(shadowVotes.jaa / (shadowVotes.jaa + shadowVotes.ei)) * 100}%` }} />
                <div className="h-full bg-purple-900" style={{ width: `${(shadowVotes.ei / (shadowVotes.jaa + shadowVotes.ei)) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Demokratia-vaje:</span>
            </div>
            <span className="text-lg font-black text-white italic">{democracyGap}%</span>
          </div>
        </div>

        {/* Action Button */}
        <button className={`flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white ${embedded ? 'w-full py-4' : 'px-8 py-4'} rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-purple-600/20 active:scale-95 group`}>
          <Zap size={16} className="fill-current animate-pulse" />
          <span>Äänestä LIVE</span>
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50"
    >
      {content}
    </motion.div>
  );
}

