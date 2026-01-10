// app/ennusteet/[id]/page.tsx
"use client";

import React, { useEffect, useState, use } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { getBillForecast, placePrediction, getUserPrediction } from "@/app/actions/weather";
import { motion } from "framer-motion";
import { 
  Sun, CloudRain, CloudLightning, Thermometer, 
  TrendingUp, Users, Info, Loader2, Target, 
  ShieldAlert, Sparkles, Coins
} from "lucide-react";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import type { Bill } from "@/lib/types";

export default function WeatherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [forecast, setForecast] = useState<any>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [userPred, setUserPred] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [betting, setBetting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [f, b, p] = await Promise.all([
          getBillForecast(id),
          fetchBillsFromSupabase().then(bills => bills.find(b => b.id === id)),
          getUserPrediction(id)
        ]);
        setForecast(f);
        if (b) setBill(b);
        setUserPred(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePredict = async (outcome: 'pass' | 'fail') => {
    setBetting(true);
    try {
      await placePrediction(id, outcome);
      setUserPred({ predicted_value: outcome });
      alert("Ennusteesi on tallennettu! Voit ansaita 'Poliittinen oraakkeli' -saavutuksen.");
    } catch (e) {
      console.error(e);
    } finally {
      setBetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <Thermometer className="animate-pulse text-purple-400 mx-auto" size={48} />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Lasketaan ilmanpainetta...</p>
        </div>
      </div>
    );
  }

  if (!forecast || !bill) return <div>Ennustetta ei löytynyt.</div>;

  const weatherIcons = {
    sunny: <Sun className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" size={64} />,
    cloudy: <CloudRain className="text-slate-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]" size={64} />,
    stormy: <CloudLightning className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" size={64} />
  };

  const weatherLabels = {
    sunny: "Korkeapaine – Hyväksytään",
    cloudy: "Epävakaata – Epävarma",
    stormy: "Myrskyvaroitus – Tiukka"
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
          
          {/* Weather Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-20">
              {weatherIcons[forecast.weather as keyof typeof weatherIcons]}
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full w-fit border border-purple-500/20">
                <Thermometer size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Poliittinen sääennuste</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                {bill.title}
              </h1>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ennuste</p>
                  <p className="text-xl font-black text-white">{weatherLabels[forecast.weather as keyof typeof weatherLabels]}</p>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Todennäköinen tulos</p>
                  <p className="text-xl font-black text-purple-400">{forecast.jaa} JAA – {forecast.ei} EI</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analysis Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-black uppercase text-sm tracking-widest">Analyytikon huomio</h3>
              </div>
              <p className="text-slate-400 leading-relaxed italic italic">
                "{forecast.summary}"
              </p>
              
              {/* Pressure Indicators */}
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Paine hallituksessa</span>
                    <span className="text-rose-400">Kasvava</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="h-full bg-gradient-to-r from-purple-500 to-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Market */}
            <div className="bg-purple-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Coins size={20} />
                </div>
                <h3 className="font-black uppercase text-sm tracking-widest text-white">Prediction Market</h3>
              </div>
              <p className="text-sm font-bold opacity-90 leading-tight">
                Lyö vetoa tuloksesta. Oikea ennuste nostaa 'Poliittinen oraakkeli' -tasoasi.
              </p>
              
              {!userPred ? (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => handlePredict('pass')}
                    disabled={betting}
                    className="bg-white text-purple-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
                  >
                    Menee läpi
                  </button>
                  <button 
                    onClick={() => handlePredict('fail')}
                    disabled={betting}
                    className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
                  >
                    Kaatuu
                  </button>
                </div>
              ) : (
                <div className="bg-white/10 border border-white/20 p-6 rounded-2xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Sinun veikkauksesi</p>
                  <p className="text-2xl font-black uppercase">
                    {userPred.predicted_value === 'pass' ? 'Menee läpi' : 'Kaatuu'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Potential Rebels */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <ShieldAlert size={14} className="text-rose-500" />
              Mahdolliset kapinoijat (High Pressure)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forecast.potentialRebels.map((r: any) => (
                <div key={r.mpId} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center group hover:border-rose-500/30 transition-all">
                  <div className="space-y-1">
                    <p className="font-black uppercase text-sm leading-none">{r.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{r.party}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-rose-400 uppercase mb-1">Kapina-riski</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">{r.probability}%</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theory Note */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 space-y-6 opacity-60">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-slate-500" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Tutkijan näkökulma</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Tämä malli simuloi parlamentaarista peliteoriaa. Se opettaa, että politiikka ei ole vain puolueiden välistä vääntöä, 
              vaan jatkuvaa tasapainoilua yksilön arvojen, vaalipiirin paineen ja puoluekurin välillä. 
              Ennuste päivittyy dynaamisesti sitä mukaa kun edustajien DNA-profiilit tarkentuvat äänestyshistorian myötä.
            </p>
          </div>

        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}


