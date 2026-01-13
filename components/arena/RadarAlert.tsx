"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, AlertTriangle, ShieldAlert, ExternalLink } from "lucide-react";

interface RadarAlertProps {
  score: number;
  explanation: string;
  connections: {
    type: string;
    org: string;
    details: string;
  }[];
}

export const RadarAlert: React.FC<RadarAlertProps> = ({ score, explanation, connections }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (score < 50) return null;

  const severityColor = score > 80 ? "text-rose-500" : "text-orange-500";
  const severityBg = score > 80 ? "bg-rose-500/10" : "bg-orange-500/10";
  const severityBorder = score > 80 ? "border-rose-500/20" : "border-orange-500/20";

  return (
    <div className="relative inline-block">
      <motion.div
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        className={`cursor-help flex items-center gap-1.5 px-2 py-1 rounded-full border ${severityBg} ${severityBorder} ${severityColor} transition-all hover:scale-105`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <div className="relative">
          <Radio size={14} className="animate-pulse" />
          <motion.div 
            className={`absolute inset-0 rounded-full border-2 ${severityBorder}`}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">Sidonnaisuus-tutka: {score}</span>
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className={severityColor} size={18} />
                <h4 className="text-xs font-black uppercase tracking-tight">Havaittu Eturistiriita</h4>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {explanation}
              </p>

              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest border-b border-white/5 pb-1">Kytkökset</p>
                {connections.map((conn, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white">{conn.org}</span>
                      <span className="text-[8px] font-black uppercase text-slate-500">{conn.type}</span>
                    </div>
                    <p className="text-[9px] text-slate-500">{conn.details}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-center">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-500/50 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  AI-analyysi (Kriittinen tarkastelu suositeltu)
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

