"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Quote, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Award,
  Loader2,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { getUserImpactCitations, checkUserImpact } from "@/lib/actions/track-impact";

interface EffectivenessFeedProps {
  userId: string;
}

export default function EffectivenessFeed({ userId }: EffectivenessFeedProps) {
  const [citations, setCitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadData = async () => {
    try {
      const data = await getUserImpactCitations(userId);
      setCitations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckImpact = async () => {
    setChecking(true);
    try {
      await checkUserImpact(userId);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 text-purple-400">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Zap size={20} className="animate-pulse" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Vaikuttavuus-feedi</h3>
        </div>
        <button 
          onClick={handleCheckImpact}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5 transition-all"
        >
          {checking ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Päivitä vaikuttavuus
        </button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {citations.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 bg-slate-900/50 border border-white/5 rounded-3xl text-center space-y-3"
            >
              <MessageSquare className="mx-auto text-slate-700" size={32} />
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Ei vielä vaikuttavuus-osumia.</p>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                Jatka lausuntojen antamista Työhuoneessa. Tekoäly seuraa eduskunnan puheenvuoroja ja ilmoittaa, kun argumenttisi heijastuvat salissa.
              </p>
            </motion.div>
          ) : (
            citations.map((citation, index) => (
              <motion.div
                key={citation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] space-y-6 hover:border-purple-500/30 transition-all group relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black rounded-lg border border-emerald-500/20">
                    <Award size={10} />
                    <span>+{citation.impact_score} VP</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                      Argumenttisi tunnistettu puheenvuorossa
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">
                      Kansanedustaja {citation.mp_name}
                    </p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-xs text-slate-300 leading-relaxed relative">
                      <Quote className="absolute -top-2 -left-2 text-white/5" size={32} />
                      "{citation.speech_snippet}"
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <p className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Vaikutus-analyysi</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {citation.impact_explanation}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
                      <Calendar size={10} />
                      {new Date(citation.speech_date).toLocaleDateString('fi-FI')}
                    </div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      Aihe: {citation.submission?.bills?.title?.substring(0, 30)}...
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

