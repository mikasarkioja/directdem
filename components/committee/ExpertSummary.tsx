"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, ChevronRight, MessageSquareText } from "lucide-react";
import type { Bill } from "@/lib/types";

interface ExpertSummaryProps {
  bill: Bill;
  onGiveStatement: () => void;
}

export default function ExpertSummary({ bill, onGiveStatement }: ExpertSummaryProps) {
  // Mock expert opinions for now
  const expertOpinions = [
    { 
      type: "pro", 
      expert: "Professori A. Virtanen", 
      text: "Esitys parantaa merkittävästi digitaalista saavutettavuutta ja tasa-arvoa.",
      impact: "Korkea"
    },
    { 
      type: "con", 
      expert: "Talousasiantuntija M. Korhonen", 
      text: "Toteutuskustannukset on arvioitu alakanttiin, mikä voi johtaa budjettiylityksiin.",
      impact: "Kohtalainen"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Info size={14} className="text-blue-500" />
          Tiivistelmä & Analyysi
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          {bill.summary || "Tämä lakiesitys keskittyy lainsäädännön modernisointiin digitaalisella aikakaudella. Tavoitteena on parantaa palveluiden tehokkuutta ja kansalaisten osallistumismahdollisuuksia."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Arguments */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Puoltavat lausunnot
          </h4>
          <div className="space-y-3">
            {expertOpinions.filter(o => o.type === "pro").map((opinion, i) => (
              <div key={i} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-emerald-400">{opinion.expert}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">"{opinion.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Con Arguments */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
            <XCircle size={14} />
            Kriittiset huomiot
          </h4>
          <div className="space-y-3">
            {expertOpinions.filter(o => o.type === "con").map((opinion, i) => (
              <div key={i} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-rose-400">{opinion.expert}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">"{opinion.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5">
        <button 
          onClick={onGiveStatement}
          className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 group"
        >
          <MessageSquareText size={16} />
          Anna Varjokansanedustajan lausunto
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

