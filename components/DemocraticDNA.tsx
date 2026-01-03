"use client";

import { useState, useEffect } from "react";
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from "recharts";
import { getDNAPoints } from "@/app/actions/dna";
import { getUser } from "@/app/actions/auth";
import type { ArchetypePoints, UserProfile } from "@/lib/types";
import { Loader2, Info, Award, Shield, Zap, Search, HelpCircle, User, BrainCircuit, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function DemocraticDNA() {
  const [points, setPoints] = useState<ArchetypePoints | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDNA() {
      const [dnaData, profile] = await Promise.all([
        getDNAPoints(),
        getUser()
      ]);
      setPoints(dnaData);
      setUserProfile(profile);
      setLoading(false);
    }
    loadDNA();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="animate-spin text-command-neon mb-4" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sequencing Democratic DNA...</p>
      </div>
    );
  }

  if (!points) return null;

  // Transform data for Recharts
  const data = [
    { subject: 'Aktiivisuus', A: points.active, fullMark: Math.max(points.active, 20) },
    { subject: 'Faktantarkistus', A: points.fact_checker, fullMark: Math.max(points.fact_checker, 20) },
    { subject: 'Sovittelu', A: points.mediator, fullMark: Math.max(points.mediator, 20) },
    { subject: 'Uudistaja', A: points.reformer, fullMark: Math.max(points.reformer, 20) },
    { subject: 'Paikallissankari', A: points.local_hero, fullMark: Math.max(points.local_hero, 20) },
  ];

  // Determine dominant role
  const roles = [
    { key: 'active', label: 'Aktiivinen Kansalainen', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', text: 'Olet demokratian moottori. Toimintasi varmistaa, että kansalaisten ääni kuuluu jokaisessa äänestyksessä.' },
    { key: 'fact_checker', label: 'Faktantarkistaja', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'Toimintasi perusteella arvostat päätöksenteossa perusteellista tietoa ja harkintaa. Et tee hätiköityjä päätöksiä.' },
    { key: 'mediator', label: 'Rakentava Sovittelija', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'Etsit yhteistä säveltä. Äänestyshistoriasi osoittaa pyrkimystä yhteiskunnalliseen vakauteen ja kompromisseihin.' },
    { key: 'reformer', label: 'Radikaali Uudistaja', icon: Search, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', text: 'Uskallat haastaa vallitsevan tilanteen. Äänestyksesi heijastavat vahvaa tahtoa muuttaa yhteiskuntaa parempaan suuntaan.' },
    { key: 'local_hero', label: 'Paikallissankari', icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'Sydämesi sykkii kotikaupungillesi. Painotat päätöksenteossa paikallisia vaikutuksia ja lähidemokratiaa.' },
  ];

  // Find max points
  const entries = Object.entries(points) as [string, number][];
  const maxKey = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const dominantRole = roles.find(r => r.key === maxKey) || roles[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 rounded-2xl ${dominantRole.bg} flex items-center justify-center ${dominantRole.color} border ${dominantRole.border} shadow-sm`}>
          <dominantRole.icon size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-command-dark">Demokraattinen DNA</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Perustuu toimintaasi alustalla</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Radar Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
              />
              <Radar
                name="DNA"
                dataKey="A"
                stroke="#005EB8"
                fill="#005EB8"
                fillOpacity={0.15}
                strokeWidth={3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Info Area */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 rounded-2xl ${dominantRole.bg} border ${dominantRole.border} relative overflow-hidden`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <dominantRole.icon size={120} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hallitseva Roolisi</p>
            <h4 className={`text-xl font-black uppercase tracking-tighter ${dominantRole.color} mb-3`}>
              {dominantRole.label}
            </h4>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {dominantRole.text}
            </p>
          </motion.div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Behavioral DNA</h5>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(points) as [string, number][]).map(([key, val]) => (
                <div key={key} className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-500">{key.replace('_', ' ')}</span>
                  <span className="text-xs font-black text-command-dark">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {userProfile && (userProfile.economic_score !== 0 || userProfile.liberal_conservative_score !== 0 || userProfile.environmental_score !== 0) && (
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <BrainCircuit size={14} className="text-purple-600" />
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Political DNA</h5>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Talous', val: userProfile.economic_score, left: 'Vasen', right: 'Oikeisto' },
                  { label: 'Arvot', val: userProfile.liberal_conservative_score, left: 'Konservatiivi', right: 'Liberaali' },
                  { label: 'Ympäristö', val: userProfile.environmental_score, left: 'Hyödyntäminen', right: 'Suojelu' },
                ].map((score) => (
                  <div key={score.label} className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span>{score.left}</span>
                      <span className="text-slate-600">{score.label}</span>
                      <span>{score.right}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full relative overflow-hidden border border-slate-200/50">
                      <div className="absolute top-0 left-1/2 bottom-0 w-0.5 bg-slate-300 z-10" />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.abs(score.val || 0) * 50}%`,
                          left: (score.val || 0) >= 0 ? '50%' : `${50 - Math.abs(score.val || 0) * 50}%`
                        }}
                        className={`absolute top-0 bottom-0 ${ (score.val || 0) >= 0 ? 'bg-purple-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {userProfile.initialized_from_mp && (
                <p className="text-[8px] text-slate-400 italic font-medium">
                  * {userProfile.initialized_from_mp}
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-command-neon shrink-0">
              <Info size={16} />
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
              Tämä DNA auttaa sinua löytämään muita samanhenkisiä kansalaisia ja muodostamaan tehokkaita virtuaalipuolueita tulevaisuudessa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

