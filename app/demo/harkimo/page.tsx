"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHarkimoMatches, type HarkimoMatchResult, type MPMatch } from "@/lib/actions/harkimo-match";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ComparisonRadarChart from "@/components/ComparisonRadarChart";
import { 
  Users, Zap, Info, TrendingUp, TrendingDown, 
  ChevronRight, BrainCircuit, BarChart3, Loader2,
  User, Sparkles, Quote, Share2
} from "lucide-react";
import { initializeProfileFromMP } from "@/lib/actions/user-profile-actions";
import { useRouter } from "next/navigation";
import { generateProfileSummary } from "@/lib/utils/profile-describer";
import Link from "next/link";

export default function HarkimoDemo() {
  const [data, setData] = useState<HarkimoMatchResult | null>(null);
  const [selectedMp, setSelectedMp] = useState<MPMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const router = useRouter();

  const handleCopyProfile = async () => {
    if (!data?.harkimo?.id) return;
    
    setInitializing(true);
    try {
      await initializeProfileFromMP(data.harkimo.id);
      alert('Profiilisi on nyt alustettu Hjalliksen äänestyshistorian perusteella! Voit nyt lähteä muokkaamaan sitä äänestämällä itse.');
      router.push('/'); // Redirect to bills area
    } catch (e: any) {
      alert(e.message);
    } finally {
      setInitializing(false);
    }
  };

  const getMatchBreakdown = (mp: MPMatch) => {
    if (!data?.harkimo) return null;
    const h = data.harkimo.scores;
    const m = mp.scores;
    
    return [
      { label: 'Talous', match: Math.abs(h.economic - m.economic) < 0.4 },
      { label: 'Arvot', match: Math.abs(h.liberal - m.liberal) < 0.4 },
      { label: 'Ympäristö', match: Math.abs(h.env - m.env) < 0.4 },
      { label: 'Alue', match: Math.abs(h.urban - m.urban) < 0.4 },
      { label: 'Kansainv.', match: Math.abs(h.global - m.global) < 0.4 },
      { label: 'Turvallis.', match: Math.abs(h.security - m.security) < 0.4 },
    ];
  };

  useEffect(() => {
    async function load() {
      try {
        const result = await getHarkimoMatches();
        setData(result);
        if (result && result.topMatches && result.topMatches.length > 0) {
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

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 p-8 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info size={32} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Hups! Jotain meni vikaan</h2>
        <p className="text-slate-500 font-medium">Datan lataus epäonnistui. Tämä johtuu yleensä siitä, että tietokanta on vielä tyhjä tai yhteysasetukset ovat väärin.</p>
        <div className="bg-slate-50 p-4 rounded-xl text-[10px] font-mono text-slate-400 break-all text-left">
          Varmista että olet ajanut datan latauksen ja analyysin tuotantoympäristöön.
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-600 transition-colors"
        >
          Yritä uudelleen
        </button>
      </div>
    </div>
  );

  if (data.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 p-8 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Tietokanta on tyhjä</h2>
          <p className="text-slate-500 font-medium">{data.error}</p>
          <div className="bg-slate-50 p-4 rounded-xl text-[10px] font-mono text-slate-400 break-all text-left">
            Aja 'npm run fetch-eduskunta-data' ja 'npm run analyze-mp-dna' tuotantotunnuksilla.
          </div>
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
              
              <div className="flex flex-col gap-4">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl font-black italic">
                    HH
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Keskiössä</p>
                    <p className="text-xl font-black uppercase tracking-tight">{data.harkimo.full_name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-purple-600 uppercase">{data.harkimo.party}</p>
                      <span className="text-[8px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full font-black border border-purple-100 uppercase">
                        {generateProfileSummary(data.harkimo.scores).title}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCopyProfile}
                  disabled={initializing}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-all shadow-lg disabled:opacity-50 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {initializing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <User size={16} className="group-hover:rotate-12 transition-transform" />
                      <span>Mitä jos sinä olisit Hjallis?</span>
                      <Sparkles size={14} className="text-purple-400 animate-pulse" />
                    </>
                  )}
                </button>

                <Link
                  href="/profiili"
                  className="w-full flex items-center justify-center gap-3 bg-purple-100 text-purple-700 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-200 transition-all border border-purple-200"
                >
                  <Share2 size={14} />
                  <span>Poliittinen Haaste: Jaa oma DNA!</span>
                </Link>
              </div>
            </div>

            {/* Party Comparison Section - Moved here and expanded */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <BarChart3 size={20} className="text-purple-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Hjallis vs. Kaikki Puolueet</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data.partyAnalysis.map((p: any, i: number) => (
                  <div key={p.name} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{p.name}</span>
                      <span className="text-sm font-black text-purple-600 leading-none">{p.avgCompatibility}%</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
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
                      className={`w-full p-5 rounded-3xl border text-left transition-all group relative overflow-hidden ${
                        selectedMp?.id === mp.id 
                          ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100 shadow-md" 
                          : "bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <p className={`text-sm font-black uppercase tracking-tight transition-colors ${
                            selectedMp?.id === mp.id ? "text-purple-700" : "text-slate-900"
                          }`}>
                            {mp.full_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mp.party}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50">
                          {mp.compatibility}%
                        </span>
                      </div>
                      
                      {/* DNA Match Highlights */}
                      <div className="flex gap-2">
                        {getMatchBreakdown(mp)?.map((item) => (
                          <div 
                            key={item.label}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                              item.match 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                : "bg-slate-50 border-slate-200 text-slate-400"
                            }`}
                          >
                            <div className={`w-1 h-1 rounded-full ${item.match ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                          </div>
                        ))}
                      </div>
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
                      className={`w-full p-5 rounded-3xl border text-left transition-all group relative overflow-hidden ${
                        selectedMp?.id === mp.id 
                          ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100 shadow-md" 
                          : "bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <p className={`text-sm font-black uppercase tracking-tight transition-colors ${
                            selectedMp?.id === mp.id ? "text-purple-700" : "text-slate-900"
                          }`}>
                            {mp.full_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mp.party}</p>
                        </div>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100/50">
                          {mp.compatibility}%
                        </span>
                      </div>

                      {/* DNA Match Highlights */}
                      <div className="flex gap-2">
                        {getMatchBreakdown(mp)?.map((item) => (
                          <div 
                            key={item.label}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                              item.match 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                : "bg-rose-50 border-rose-100 text-rose-400"
                            }`}
                          >
                            <div className={`w-1 h-1 rounded-full ${item.match ? "bg-emerald-500" : "bg-rose-300"}`} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
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
                    className="bg-white border border-slate-200 rounded-[3rem] p-8 md:p-10 shadow-sm space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-50 pb-12 relative">
                      {/* Comparison Badge in middle */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center z-20">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl ${
                          selectedMp.compatibility > 75 ? "bg-emerald-500" : 
                          selectedMp.compatibility > 50 ? "bg-amber-500" : "bg-rose-500"
                        }`}>
                          <p className="text-[8px] font-black uppercase leading-none opacity-70">Match</p>
                          <p className="text-xl font-black">{selectedMp.compatibility}%</p>
                        </div>
                      </div>

                      {/* MP 1 (Hjallis) */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-black italic shadow-lg shadow-purple-200">HH</div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Kansanedustaja</p>
                            <p className="text-sm font-black uppercase text-slate-900 leading-tight">Hjallis Harkimo</p>
                            <p className="text-xs font-bold text-purple-600 uppercase">{data.harkimo.party}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 bg-purple-50/50 p-5 rounded-[2rem] border border-purple-100/50 relative overflow-hidden group">
                          <Quote className="absolute -top-2 -right-2 text-purple-200 opacity-20 group-hover:opacity-40 transition-opacity" size={64} />
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={12} className="text-purple-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-700">
                              Arkkityyppi: {generateProfileSummary(data.harkimo.scores).title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium italic relative z-10">
                            "{generateProfileSummary(data.harkimo.scores).description}"
                          </p>
                        </div>
                      </div>

                      {/* MP 2 (Target) */}
                      <div className="space-y-6 md:pl-12 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-xl font-black italic uppercase shadow-lg shadow-blue-200">
                            {selectedMp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Haastaja</p>
                            <p className="text-sm font-black uppercase text-slate-900 leading-tight">{selectedMp.full_name}</p>
                            <p className="text-xs font-bold text-blue-600 uppercase">{selectedMp.party}</p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100/50 relative overflow-hidden group">
                          <Quote className="absolute -top-2 -right-2 text-blue-200 opacity-20 group-hover:opacity-40 transition-opacity" size={64} />
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={12} className="text-blue-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                              Arkkityyppi: {generateProfileSummary(selectedMp.scores).title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium italic relative z-10">
                            "{generateProfileSummary(selectedMp.scores).description}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center pt-4">
                      <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Zap size={16} className="text-purple-600" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-widest">DNA Match-erittely</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {getMatchBreakdown(selectedMp)?.map((item) => (
                            <div key={item.label} className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${item.match ? "text-emerald-600" : "text-rose-500"}`}>
                                  {item.match ? "Match" : "Eriävä"}
                                </span>
                                <div className={`w-2.5 h-2.5 rounded-full ${item.match ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative bg-white border border-slate-100 rounded-[3rem] p-6 shadow-sm">
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

