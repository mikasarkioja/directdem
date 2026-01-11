"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Target, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Info
} from "lucide-react";
import { calculateShadowImpact, ShadowImpactResult } from "@/app/actions/shadow-power";

interface ShadowPowerMeterProps {
  billId: string;
  realFor: number;
  realAgainst: number;
  context?: "parliament" | "municipal";
}

export default function ShadowPowerMeter({ 
  billId, 
  realFor, 
  realAgainst, 
  context = "parliament" 
}: ShadowPowerMeterProps) {
  const [impact, setImpact] = useState<ShadowImpactResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await calculateShadowImpact(billId, realFor, realAgainst, context);
      setImpact(res);
      setLoading(false);
      
      // Animate community power percentage
      let start = 0;
      const end = res.communityInfluence;
      if (start === end) return;
      
      const duration = 1500;
      const stepTime = Math.abs(Math.floor(duration / end));
      const timer = setInterval(() => {
        start += 0.1;
        setCounter(parseFloat(start.toFixed(1)));
        if (start >= end) {
          setCounter(end);
          clearInterval(timer);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
    load();
  }, [billId, realFor, realAgainst, context]);

  if (loading) return (
    <div className="h-40 bg-slate-900/50 border border-white/5 rounded-[2rem] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!impact) return null;

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
      
      {/* Holographic Border Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent group-hover:via-purple-500/30 transition-all duration-1000 opacity-50 pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap size={20} fill="currentColor" className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Shadow Power</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vaikutus-simulaatio v1.5</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
            {context === "parliament" ? "Eduskunta" : "Kunta"} Digitaalinen Kaksonen
          </div>
        </div>

        {/* Decisiveness Meter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-[2rem] border transition-all ${impact.isDecisive ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-slate-800/50 border-white/5 opacity-60"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target size={18} className={impact.isDecisive ? "text-emerald-400" : "text-slate-500"} />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yksilön Vaikutus</h4>
            </div>
            <p className={`text-lg font-black uppercase tracking-tighter leading-tight ${impact.isDecisive ? "text-emerald-400" : "text-white"}`}>
              {impact.isDecisive ? "RATKAISEVA ÄÄNI" : "TUKI-ÄÄNI"}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed uppercase tracking-widest">
              {impact.isDecisive 
                ? "Äänesi olisi kääntänyt tuloksen tässä simulaatiossa." 
                : `Vaikutusmarginaali: ${impact.margin} ääntä.`}
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-purple-600/10 border border-purple-500/30 rounded-[2rem] transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users size={18} className="text-purple-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yhteisön Voima</h4>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-white leading-none">
                {counter}%
              </p>
              <div className={`w-2 h-2 rounded-full ${impact.communityPower > 1 ? "bg-emerald-500 animate-ping" : "bg-slate-700"}`} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed uppercase tracking-widest">
              Yhteisön painoarvo suhteessa todellisiin päätöksentekijöihin.
            </p>
          </motion.div>
        </div>

        {/* Outcome Flip Alert */}
        <AnimatePresence>
          {impact.shadowOutcome !== "no_change" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-orange-500/20 border border-orange-500/50 p-8 rounded-[2.5rem] flex items-center gap-8 relative overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent animate-pulse" />
              
              <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-slate-950 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.5)] z-10">
                <ShieldAlert size={32} />
              </div>
              <div className="z-10 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-0.5 bg-orange-500 text-slate-950 text-[8px] font-black uppercase tracking-widest rounded-sm">Impact Detected</div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 leading-none">Power Shift</h4>
                </div>
                <p className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-3">
                  PÄÄTÖS OLISI <span className="text-orange-400">KÄÄNTYNYT</span>
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1">Virallinen</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 bg-white/5 px-2 py-1 rounded-md line-through border border-white/5">{impact.realOutcome === "passed" ? "Hyväksytty" : "Hylätty"}</span>
                  </div>
                  <ArrowRight size={14} className="text-orange-500 mt-4" />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-emerald-500 tracking-widest mb-1">Shadow Result</span>
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">{impact.shadowOutcome === "passed" ? "Hyväksytty" : "Hylätty"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Community Alignment Bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Vaikutusvirta</span>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Virallinen vs. Varjoeduskunta</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                {impact.shadowOutcome !== "no_change" ? "SHIFT DETECTED" : "ALIGNMENT"}
              </span>
            </div>
          </div>
          
          <div className="relative h-12 w-full bg-slate-950 rounded-2xl overflow-hidden border border-white/5 p-1">
            {/* Real Result Layer */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(realFor / (realFor + realAgainst)) * 100}%` }}
              className="absolute inset-y-1 left-1 bg-slate-800 rounded-xl z-10"
            />
            
            {/* Shadow Result Layer (Difference) */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: `${Math.abs(((realFor + (impact.shadowOutcome === "passed" ? 10 : -10)) / (realFor + realAgainst + 20)) * 100)}%`,
                opacity: 1 
              }}
              className={`absolute inset-y-1 left-1 rounded-xl z-0 blur-sm ${impact.shadowOutcome === "passed" ? "bg-emerald-500/40" : "bg-rose-500/40"}`}
            />

            {/* DirectDem Votes Visualization */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="flex gap-1">
                {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      opacity: [0.1, 0.3, 0.1],
                      height: [4, 8, 4]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.1 
                    }}
                    className="w-0.5 bg-purple-500/30 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-[7px] font-black uppercase tracking-[0.3em] text-slate-600 px-2">
            <span>0% KYLLÄ</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-sm" />
                <span>VIRALLINEN</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-sm shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                <span>SHADOW POWER</span>
              </div>
            </div>
            <span>100% KYLLÄ</span>
          </div>
        </div>

        {/* Shadow Power Info */}
        <div className="pt-2 flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-6">
          <Info size={12} className="text-purple-500" />
          Shadow Power kasvaa kun äänesi ja lausunnot vaikuttavat yhteisön konsensukseen.
        </div>
      </div>
    </div>
  );
}

