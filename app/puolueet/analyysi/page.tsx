// app/puolueet/analyysi/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { getPartyAnalysis, type PartyAnalysisData } from "@/lib/actions/party-analysis";
import { 
  ShieldCheck, 
  RefreshCw, 
  Target, 
  BrainCircuit, 
  Info, 
  Loader2,
  TrendingUp,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PartyAnalysisPage() {
  const [data, setData] = useState<PartyAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getPartyAnalysis();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-purple-600 mx-auto" size={48} />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Analysoidaan puolueiden historiallista käyttäytymistä...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
          
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full w-fit">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Poliittinen Tutkimusdata</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900">
              Tutkimusdataa <span className="text-purple-600">Puolueista</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2 max-w-2xl">
              <Info size={14} className="flex-shrink-0" />
              Takinkääntö-indeksi mittaa eroa vaalilupausten (vaalikone) ja toteutuneiden eduskuntaäänestysten välillä. 
              Mitä pienempi luku, sitä uskollisemmin puolue on pysynyt linjassaan.
            </p>
          </div>

          {/* Party Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{p.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.mpCount} Kansanedustajaa</p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl flex flex-col items-center ${
                    p.pivotScore < 15 ? "bg-emerald-50 text-emerald-600" : 
                    p.pivotScore < 25 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    <span className="text-[8px] font-black uppercase">Pivot Score</span>
                    <span className="text-xl font-black">{p.pivotScore}%</span>
                  </div>
                </div>

                {/* Trust Meter (Simplified) */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Lupaukset</span>
                    <span>Toteutus</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - p.pivotScore}%` }}
                      className={`h-full ${
                        p.pivotScore < 15 ? "bg-emerald-500" : 
                        p.pivotScore < 25 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-black text-white mix-blend-difference uppercase">
                        {p.pivotScore < 15 ? "Uskollinen" : p.pivotScore < 25 ? "Pragmaattinen" : "Muuttuva"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={12} className="text-purple-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ryhmäkuri (Rice)</span>
                    </div>
                    <p className="text-lg font-black">{p.riceIndex}%</p>
                  </div>
                  <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={12} className="text-purple-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Teemaomistajuus</span>
                    </div>
                    <p className="text-[10px] font-black uppercase truncate">{p.topCategories[0] || "Yleinen"}</p>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="p-5 bg-slate-900 rounded-3xl space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit size={48} className="text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Tutkijan Huomio</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium italic leading-relaxed relative z-10">
                    "{p.aiInsight}"
                  </p>
                </div>

                {/* MP List Toggle */}
                <div className="pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setExpandedParty(expandedParty === p.name ? null : p.name)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Näytä kansanedustajat</span>
                    </div>
                    {expandedParty === p.name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <AnimatePresence>
                    {expandedParty === p.name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 mt-2">
                          {p.mps.map(mp => (
                            <div key={mp.id} className="text-[11px] font-medium text-slate-600 hover:text-purple-600 cursor-default transition-colors flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              {mp.name}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Theoretical Note */}
          <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-10 space-y-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" />
              <h4 className="text-lg font-black uppercase tracking-tight">Miksi tämä on tärkeää?</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <p className="text-slate-700 leading-relaxed">
                Suomalaisessa tutkimuksessa on huomattu, että hallitus-oppositio-akseli on suurin tekijä "takinkäännöissä". 
                Hallituspuolueiden edustajat joutuvat usein joustamaan vaalilupauksistaan hallitusohjelman ja kompromissien nimissä.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Tämä analyysi paljastaa mitkä puolueet toimivat <strong>ideologisina ankkureina</strong> (pysyvät lupauksissaan) 
                ja mitkä ovat <strong>pragmatisteja</strong> (joustavat saavuttaakseen poliittisia tuloksia).
              </p>
            </div>
          </div>

        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}

