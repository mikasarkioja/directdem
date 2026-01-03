"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHarkimoMatches } from "@/lib/actions/harkimo-match";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ComparisonRadarChart from "@/components/ComparisonRadarChart";
import { 
  Users, Zap, Info, TrendingUp, TrendingDown, 
  ChevronRight, BrainCircuit, BarChart3, Loader2 
} from "lucide-react";

export default function HarkimoDemo() {
  const [data, setData] = useState<any>(null);
  const [selectedMp, setSelectedMp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getHarkimoMatches();
        setData(result);
        if (result.topMatches.length > 0) {
          setSelectedMp(result.topMatches[0]);
        }
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
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Ladataan Hjalliksen dataa...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div>Virhe datan latauksessa.</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full w-fit">
                <BrainCircuit size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Poliittinen DNA - Vertailu</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
                Hjalliksen <span className="text-purple-600">Poliittiset Kaimat</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                <Info size={14} />
                Tämä demo käyttää todellista äänestysdataa vaalikaudelta 2023-2027
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl font-black italic">
                HH
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Keskiössä</p>
                <p className="text-xl font-black uppercase tracking-tight">{data.harkimo.full_name}</p>
                <p className="text-xs font-bold text-purple-600 uppercase">{data.harkimo.party}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Top & Bottom Matches */}
            <div className="space-y-8">
              {/* Top Matches */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Lähimmät Liittolaiset
                </h3>
                <div className="space-y-3">
                  {data.topMatches.map((mp: any) => (
                    <button
                      key={mp.id}
                      onClick={() => setSelectedMp(mp)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all group ${
                        selectedMp?.id === mp.id 
                          ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100 shadow-md" 
                          : "bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">{mp.party}</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {mp.compatibility}% MATCH
                        </span>
                      </div>
                      <p className={`font-black uppercase tracking-tight transition-colors ${
                        selectedMp?.id === mp.id ? "text-purple-700" : "text-slate-700 group-hover:text-purple-600"
                      }`}>
                        {mp.full_name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Matches */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <TrendingDown size={14} className="text-rose-500" />
                  Poliittiset Vastakohdat
                </h3>
                <div className="space-y-3">
                  {data.bottomMatches.map((mp: any) => (
                    <button
                      key={mp.id}
                      onClick={() => setSelectedMp(mp)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all group ${
                        selectedMp?.id === mp.id 
                          ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100 shadow-md" 
                          : "bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">{mp.party}</span>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          {mp.compatibility}% MATCH
                        </span>
                      </div>
                      <p className={`font-black uppercase tracking-tight transition-colors ${
                        selectedMp?.id === mp.id ? "text-purple-700" : "text-slate-700 group-hover:text-purple-600"
                      }`}>
                        {mp.full_name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column: DNA Comparison */}
            <div className="lg:col-span-2 space-y-8">
              <AnimatePresence mode="wait">
                {selectedMp && (
                  <motion.div
                    key={selectedMp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">DNA Vertailu</p>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">
                          Hjallis vs <span className="text-purple-600">{selectedMp.full_name}</span>
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-1">{selectedMp.party}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Yhteensopivuus</p>
                          <p className="text-3xl font-black text-purple-600">{selectedMp.compatibility}%</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                          selectedMp.compatibility > 75 ? "bg-emerald-500" : 
                          selectedMp.compatibility > 50 ? "bg-amber-500" : "bg-rose-500"
                        }`}>
                          <Zap size={24} fill="currentColor" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analyysi</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {selectedMp.compatibility > 85 ? (
                              `Nämä kaksi edustajaa ovat lähes poliittisia kaksosia. He jakavat saman näkemyksen ${
                                selectedMp.scores.economic > 0.5 ? "markkinavetoisesta taloudesta" : "valtion roolista taloudessa"
                              } ja äänestävät lähes poikkeuksetta samalla tavalla.`
                            ) : selectedMp.compatibility > 65 ? (
                              "Edustajilla on vahva yhteinen peruslinja, vaikka yksittäisissä kysymyksissä löytyykin painotuseroja."
                            ) : (
                              "Edustajien välillä on merkittäviä linjaeroja. Heidän äänestyskäyttäytymisensä heijastaa erilaisia arvomaailmoja ja prioriteetteja."
                            )}
                          </p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                          <div className="flex items-center gap-3">
                            <BarChart3 size={18} className="text-purple-600" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Puolueiden Läheisyys</h4>
                          </div>
                          <div className="space-y-3">
                            {data.partyAnalysis.map((p: any, i: number) => (
                              <div key={p.name} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                  <span>{p.name}</span>
                                  <span>{p.avgCompatibility}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${p.avgCompatibility}%` }}
                                    className={`h-full ${i === 0 ? "bg-purple-600" : "bg-slate-400 opacity-50"}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative bg-slate-50/50 rounded-full p-4">
                        <ComparisonRadarChart 
                          harkimo={data.harkimo.scores} 
                          target={{ 
                            name: selectedMp.full_name, 
                            ...selectedMp.scores 
                          }} 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom CTA or Info */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-purple-600/10 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Mitä tämä paljastaa?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto pt-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-purple-400">
                    <Users size={20} />
                  </div>
                  <h4 className="font-black uppercase text-xs tracking-widest">Riippumattomuus</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Näet kuinka Harkimon linja poikkeaa esimerkiksi Kokoomuksesta tai SDP:stä.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-purple-400">
                    <Zap size={20} />
                  </div>
                  <h4 className="font-black uppercase text-xs tracking-widest">Yllättävät Liittolaiset</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pienpuolueiden ja yrittäjyyden kohdalla löytyy yllättäviä kaimoja yli puoluerajojen.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-purple-400">
                    <BrainCircuit size={20} />
                  </div>
                  <h4 className="font-black uppercase text-xs tracking-widest">Datan Voima</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tämä ei perustu mielikuviin, vaan siihen mitä nappia edustaja on oikeasti painanut.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}

