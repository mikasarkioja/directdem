"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

interface TimelinePoint {
  date: string;
  type: 'statement' | 'meeting' | 'amendment';
  org: string;
  topic: string;
  impact?: number;
}

interface MeetingTimelineProps {
  points: TimelinePoint[];
}

export const MeetingTimeline: React.FC<MeetingTimelineProps> = ({ points }) => {
  // Sort points by date
  const sortedPoints = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-8 space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
          <Users className="text-emerald-500" />
          The Meeting Timeline
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Lausunto
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-500">
            <div className="w-2 h-2 rounded-full bg-rose-500" /> Tapaaminen
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Muutoslaki
          </div>
        </div>
      </div>

      <div className="relative pt-10 pb-20">
        {/* Horizontal Line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />

        <div className="flex justify-between items-center relative px-4">
          {sortedPoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              {/* Vertical Connector */}
              <div className={`absolute left-1/2 -translate-x-1/2 w-px h-12 bg-white/10 ${i % 2 === 0 ? 'bottom-full mb-2' : 'top-full mt-2'}`} />

              {/* Point Node */}
              <div className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-xl z-10 transition-transform group-hover:scale-125 ${
                p.type === 'statement' ? 'bg-blue-500' : p.type === 'meeting' ? 'bg-rose-500' : 'bg-emerald-500'
              }`} />

              {/* Tooltip-like Card */}
              <div className={`absolute left-1/2 -translate-x-1/2 w-48 p-4 bg-slate-800 border border-white/5 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 ${
                i % 2 === 0 ? 'bottom-full mb-16' : 'top-full mt-16'
              }`}>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-500 uppercase">{new Date(p.date).toLocaleDateString('fi-FI')}</p>
                  <p className="text-[10px] font-bold text-white leading-tight">{p.org}</p>
                  <p className="text-[9px] text-slate-400 italic">"{p.topic}"</p>
                  {p.impact && (
                    <div className="pt-2 flex items-center gap-1.5 text-emerald-400">
                      <Zap size={10} />
                      <span className="text-[8px] font-black uppercase">Vaikutus: {p.impact}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Label on Axis */}
              <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 uppercase whitespace-nowrap">
                {new Date(p.date).toLocaleDateString('fi-FI', { month: 'short', day: 'numeric' })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" size={16} />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Suoran kontaktin vaikutus</h4>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed italic">
          "Analyysi osoittaa, että järjestöjen tapaamiset valiokunnan jäsenten kanssa ennen mietinnön valmistumista korreloivat 
          **1.5x vahvemmin** lopulliseen lakitekstiin tehtyjen muutosten kanssa kuin pelkät kirjalliset asiantuntijalausunnot."
        </p>
      </div>
    </div>
  );
};
