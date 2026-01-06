"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { 
  getPoliticalRanking, 
  type RankingResult 
} from "@/lib/actions/ranking-actions";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { 
  Trophy, Shield, RefreshCw, Target, BrainCircuit, 
  TrendingUp, Activity, Info, Loader2, Search
} from "lucide-react";
import { motion } from "framer-motion";

export default function RankingPage() {
  const [data, setData] = useState<RankingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await getPoliticalRanking();
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
          <p className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Analysoidaan puolueiden voimasuhteita...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div>Virhe datan latauksessa.</div>;

  const filteredParties = data.parties.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full w-fit">
                <Target size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Political Power Rankings</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                Puolueiden <span className="text-purple-600">Voimasuhteet</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2 max-w-2xl">
                <Info size={14} className="flex-shrink-0" />
                Analyysi perustuu Rice-indeksiin, polarisaatiometriikkaan ja toteutuneeseen äänestyskäyttäytymiseen vaalikaudella 2023-2027.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Etsi puolue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm font-bold uppercase text-xs"
              />
            </div>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* Cohesion - Rice Index */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ryhmäkuri</h3>
                  <p className="text-sm font-black uppercase text-slate-900">Rice Index</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {data.leaderboards.disciplined.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">{i+1}</span>
                      <span className="font-black uppercase text-[11px] text-slate-700">{p.name}</span>
                    </div>
                    <span className="font-black text-[11px] text-emerald-600">{p.score}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pivot Score - Flip Flops */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linjan muutos</h3>
                  <p className="text-sm font-black uppercase text-slate-900">Pivot Score</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {data.leaderboards.flipFlops.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">{i+1}</span>
                      <span className="font-black uppercase text-[11px] text-slate-700">{p.name}</span>
                    </div>
                    <span className="font-black text-[11px] text-amber-600">+{p.score}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Leaderboard */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktiivisuus</h3>
                  <p className="text-sm font-black uppercase text-slate-900">Äänet per edustaja</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {data.leaderboards.activity.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">{i+1}</span>
                      <span className="font-black uppercase text-[11px] text-slate-700">{p.name}</span>
                    </div>
                    <span className="font-black text-[11px] text-blue-600">{p.score}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Topic Owners */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asiantuntijuus</h3>
                  <p className="text-sm font-black uppercase text-slate-900">Topic Ownership</p>
                </div>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
                {data.leaderboards.owners.map((o) => (
                  <div key={o.category} className="flex items-center justify-between group border-b border-slate-50 pb-2">
                    <div className="flex flex-col">
                      <span className="font-black uppercase text-[8px] text-slate-400 tracking-wider">{o.category}</span>
                      <span className="font-black uppercase text-xs text-slate-700">{o.party}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-purple-400 italic">int. {o.score}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Polarization Heatmap / Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">Puolueiden Polarisaatio</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mitä kauempana palkki on vasemmasta reunasta, sitä enemmän puolueen DNA poikkeaa eduskunnan keskipisteestä.</p>
                </div>
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredParties} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} fontWeight="900" width={80} />
                    <Tooltip 
                      cursor={{fill: '#F8FAFC'}}
                      contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                      itemStyle={{fontWeight: '900', textTransform: 'uppercase', fontSize: '10px'}}
                    />
                    <Bar dataKey="polarization" radius={[0, 4, 4, 0]}>
                      {filteredParties.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.polarization > 30 ? "#A855F7" : "#CBD5E1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-3xl -z-0" />
                <div className="flex items-center gap-2 text-purple-400 relative z-10">
                  <BrainCircuit size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tutkijan Analyysi</span>
                </div>
                <p className="text-xs text-slate-300 italic relative z-10 leading-relaxed">
                  "Suomalainen parlamentarismi osoittaa tällä hetkellä mielenkiintoista polarisaatiota. 
                  Osa puolueista hakeutuu kauas mediaanista, mikä viittaa vahvaan strategiseen profilointiin 
                  ja ideologiseen puhtauteen vaalikauden kynnyksellä."
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">Koheesio vs. Pivot Score</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Vaaka-akseli: Ryhmäkurin voimakkuus. Pystyakseli: Poikkeama vaalilupauksista. 
                    Tämä kaavio paljastaa "Strategiset takinkääntäjät" vs. "Yksilölliset kapinoijat".
                  </p>
                </div>
                <Activity className="text-emerald-500" size={24} />
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#F1F5F9" />
                    <XAxis type="number" dataKey="cohesion" name="Koheesio" unit="%" stroke="#94A3B8" fontSize={10} fontWeight="900" domain={[50, 100]} />
                    <YAxis type="number" dataKey="pivotScore" name="Pivot Score" unit="%" stroke="#94A3B8" fontSize={10} fontWeight="900" />
                    <ZAxis type="number" dataKey="mpCount" range={[100, 1000]} name="Edustajia" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Puolueet" data={filteredParties} fill="#A855F7">
                      {filteredParties.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'LIIK' ? '#A855F7' : '#94A3B8'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-1">Havainto</p>
                  <p className="text-[10px] font-bold text-slate-700 leading-tight">Yhtenäisimmät puolueet äänestävät usein vastoin vaalikonevastausten mediaania.</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[8px] font-black uppercase text-amber-600 tracking-widest mb-1">Varoitus</p>
                  <p className="text-[10px] font-bold text-slate-700 leading-tight">Suuri Pivot Score kertoo joko takinkäännöstä tai ryhmäkurin voimasta.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BrainCircuit size={80} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-purple-400">Metriikoiden Selitykset</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rice Index (Koheesio)</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mittari, joka analysoi puolueen sisäistä yhtenäisyyttä. Mitä korkeampi prosentti, sitä tiukempaa puoluekuria ryhmä noudattaa. 
                    100% tarkoittaa, että kaikki paikalla olleet edustajat äänestivät täsmälleen samalla tavalla jokaisessa äänestyksessä.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pivot Score (Poikkeama)</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Laskee eron kansanedustajien vaalikoneessa antamien vastausten ja heidän todellisen äänestyskäyttäytymisensä välillä. 
                    Korkea luku kertoo joko pragmaattisesta politiikasta (hallitusvastuu) tai tietoista suunnanmuutoksesta vaalien jälkeen.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Analyysin Tavoite</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tämä sivu tarjoaa akateemisen tason näkymän parlamentaariseen peliin. Se ei keskity siihen, mitä puolueet sanovat, 
                vaan siihen, miten ne toimivat strategisena ryhmänä.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Polarisaatio</p>
                  <p className="text-[10px] font-bold text-slate-700">Mittaa ideologista etäisyyttä eduskunnan "keskimääräisestä" linjasta.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Ownership</p>
                  <p className="text-[10px] font-bold text-slate-700">Tunnistaa puolueet, jotka keskittävät eniten energiaa tiettyihin teemoihin.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Party Grid */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity size={14} className="text-purple-600" />
              Kaikki Puolueet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParties.map((p) => (
                <div key={p.name} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-black uppercase text-lg leading-none">{p.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.mpCount} Edustajaa</p>
                    </div>
                    <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[8px] font-black uppercase border border-purple-100">
                      {p.topCategory}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400">Koheesio</span>
                        <span className="text-slate-900">{p.cohesion}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${p.cohesion}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400">Pivot Score</span>
                        <span className="text-amber-600">+{p.pivotScore}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${p.pivotScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}

