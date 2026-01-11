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

  useEffect(() => {
    async function load() {
      const res = await calculateShadowImpact(billId, realFor, realAgainst, context);
      setImpact(res);
      setLoading(false);
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
      
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap size={20} fill="currentColor" className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Shadow Power</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vaikutus-simulaatio v1.0</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
            {context === "parliament" ? "Eduskunta" : "Kunta"} Digitaalinen Kaksonen
          </div>
        </div>

        {/* Decisiveness Meter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-[2rem] border transition-all ${impact.isDecisive ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/50 border-white/5 opacity-60"}`}>
            <div className="flex items-center gap-3 mb-4">
              <Target size={18} className={impact.isDecisive ? "text-emerald-400" : "text-slate-500"} />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yksilön Vaikutus</h4>
            </div>
            <p className={`text-lg font-black uppercase tracking-tighter leading-tight ${impact.isDecisive ? "text-emerald-400" : "text-white"}`}>
              {impact.isDecisive ? "RATKAISEVA ÄÄNI" : "TUKI-ÄÄNI"}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed uppercase tracking-widest">
              {impact.isDecisive 
                ? "Äänesi olisi ollut ratkaiseva tässä äänestyksessä." 
                : `Realistinen vaikutusmarginaali: ${impact.margin} ääntä.`}
            </p>
          </div>

          <div className="p-6 bg-purple-600/10 border border-purple-500/30 rounded-[2rem] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Users size={18} className="text-purple-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yhteisön Voima</h4>
            </div>
            <p className="text-2xl font-black text-white leading-none">
              {impact.communityInfluence}%
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed uppercase tracking-widest">
              DirectDem-yhteisön painoarvo suhteessa virallisiin päättäjiin.
            </p>
          </div>
        </div>

        {/* Outcome Flip Alert */}
        <AnimatePresence>
          {impact.shadowOutcome !== "no_change" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-[2rem] flex items-center gap-6"
            >
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-orange-500/20">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1 leading-none">Vaikutus havaittu</h4>
                <p className="text-sm font-bold text-white uppercase tracking-tight leading-snug">
                  Yhteisön äänet olisivat <span className="text-orange-400 underline decoration-2 underline-offset-4">KÄÄNTÄNEET</span> päätöksen:
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-black uppercase text-slate-500 line-through">{impact.realOutcome === "passed" ? "Hyväksytty" : "Hylätty"}</span>
                  <ArrowRight size={10} className="text-slate-600" />
                  <span className="text-[9px] font-black uppercase text-emerald-400">{impact.shadowOutcome === "passed" ? "Hyväksytty" : "Hylätty"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Community Alignment Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Demokraattinen konsensus</span>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Shadow Result</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(realFor / (realFor + realAgainst)) * 100}%` }}
              className="h-full bg-slate-700 rounded-full relative"
            >
              <div className="absolute top-0 right-0 w-1 h-full bg-white/20" />
            </motion.div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] text-center">
            Harmaa: Virallinen tulos | Violetti: DirectDem vaikutus
          </p>
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

