"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, ChevronRight, MessageSquareText, Radio, ShieldAlert, Loader2 } from "lucide-react";
import type { Bill } from "@/lib/types";
import { RadarAlert } from "@/components/arena/RadarAlert";

interface ExpertSummaryProps {
  bill: Bill;
  onGiveStatement: () => void;
}

export default function ExpertSummary({ bill, onGiveStatement }: ExpertSummaryProps) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  useEffect(() => {
    async function fetchRadar() {
      setLoadingRadar(true);
      try {
        // Fetch conflict alerts for this bill for a few key MPs
        // In real app, this would be more targeted
        const res = await fetch(`/api/arena/alerts?billId=${bill.id}`);
        const data = await res.json();
        
        // Let's also fetch specific conflict scores for committee members if we had them
        // For now, we'll use a representative set
        const radarRes = await fetch(`/api/arena/conflicts?billId=${bill.id}&mpId=1328`);
        const harkimoConflict = await radarRes.json();
        
        if (harkimoConflict && harkimoConflict.score >= 50) {
          setConflicts([{ ...harkimoConflict, name: "Harry Harkimo" }]);
        }
      } catch (e) {
        console.error("Failed to fetch radar data", e);
      } finally {
        setLoadingRadar(false);
      }
    }
    fetchRadar();
  }, [bill.id]);
  // Use AI summary arguments if available, otherwise fallback to mock
  const hasAiArguments = (bill as any).pro_arguments || (bill as any).con_arguments;
  
  const expertOpinions = hasAiArguments ? [
    ...((bill as any).pro_arguments || []).map((text: string) => ({
      type: "pro",
      expert: "AI-Analyysi",
      text,
      impact: "Korkea"
    })),
    ...((bill as any).con_arguments || []).map((text: string) => ({
      type: "con",
      expert: "AI-Kritiikki",
      text,
      impact: "Kohtalainen"
    }))
  ] : [
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
      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-8 shadow-inner overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-600 to-purple-600 opacity-50" />
        
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-3 border-b border-white/5 pb-6">
          <Info size={18} />
          Asiantuntijaselonteko & Vaikutusarviointi
        </h3>
        
        <div className="prose prose-invert max-w-none">
          <div className="text-slate-300 text-sm leading-[1.7] space-y-4 font-medium">
            {bill.summary ? bill.summary.split('\n').map((line, i) => {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('###')) {
                return (
                  <h4 key={i} className="text-white text-base font-black uppercase tracking-tight pt-6 pb-1 border-b border-white/10 flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    {trimmedLine.replace('###', '').trim()}
                  </h4>
                );
              }
              if (trimmedLine === '') return null; // Poistetaan tyhjät rivit kokonaan
              if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                return (
                  <div key={i} className="flex gap-3 pl-4 group py-0.5">
                    <span className="text-blue-500 font-bold group-hover:scale-125 transition-transform">•</span>
                    <p className="flex-1">{trimmedLine.substring(1).trim()}</p>
                  </div>
                );
              }
              return <p key={i} className="text-slate-300/90 leading-relaxed">{trimmedLine}</p>;
            }).filter(Boolean) : (
              <div className="flex items-center justify-center py-10 opacity-50">
                <p className="italic">Analysoidaan esitystä...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avoimuus-analyysi (Sidonnaisuus-tutka) */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
            <Radio size={14} className="animate-pulse" />
            Sidonnaisuus-tutka & Avoimuus-analyysi
          </h4>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Live AI-Seuranta</span>
        </div>

        {loadingRadar ? (
          <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
            <Loader2 size={12} className="animate-spin" />
            Analysoidaan kytköksiä...
          </div>
        ) : conflicts.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-400 italic leading-relaxed">
              Tutka havaitsi merkittäviä kytköksiä valiokunnan jäsenillä tähän lakiesitykseen. 
              Tämä voi vaikuttaa päätöksenteon puolueettomuuteen.
            </p>
            <div className="flex flex-wrap gap-4">
              {conflicts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-white uppercase">{c.name}</p>
                    <RadarAlert 
                      score={c.score} 
                      explanation={c.explanation} 
                      connections={c.detected_connections} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] text-emerald-500/70 font-bold">
            <ShieldAlert size={14} />
            Ei havaittuja merkittäviä eturistiriitoja tässä vaiheessa.
          </div>
        )}
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

