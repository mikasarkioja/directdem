"use client";

import React, { useState, useEffect } from "react";
import { getDailyMunicipalQuestion, voteOnMunicipalQuestion, MunicipalQuestion } from "@/app/actions/daily-municipal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  ThumbsUp, 
  ThumbsDown, 
  Info, 
  MapPin, 
  Sparkles,
  CheckCircle2,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function DailyMunicipalQuestion() {
  const [question, setQuestion] = useState<MunicipalQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getDailyMunicipalQuestion();
      setQuestion(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleVote = async (stance: "FOR" | "AGAINST" | "NEUTRAL") => {
    if (!question || voted) return;
    setSubmitting(true);
    
    const result = await voteOnMunicipalQuestion(question.id, stance);
    if (result.success) {
      setVoted(true);
      toast.success("Mielipiteesi on rekisteröity!");
    } else {
      toast.error(result.error || "Virhe äänestyksessä.");
    }
    setSubmitting(false);
  };

  if (loading) return null;
  if (!question) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden backdrop-blur-md shadow-2xl"
    >
      {/* Decorative pulse background */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Päivän Kuntakysymys</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <MapPin size={12} />
            {question.municipality}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
            {question.title}
          </h3>
          <p className="text-sm text-slate-300/80 font-medium leading-relaxed italic">
            "{question.summary}"
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!voted ? (
            <motion.div 
              key="voting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <button
                onClick={() => handleVote("FOR")}
                disabled={submitting}
                className="flex items-center justify-center gap-3 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                Kannatan
              </button>
              <button
                onClick={() => handleVote("AGAINST")}
                disabled={submitting}
                className="flex items-center justify-center gap-3 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-400 hover:scale-[1.02] transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                Vastustan
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="voted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center space-y-3"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-400" size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-white uppercase tracking-tight">Mielipiteesi on tallennettu!</p>
                <p className="text-xs text-slate-500 font-medium">Vaikutuksesi Shadow MP -pisteisiin päivittyy pian.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2 flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <Info size={12} className="text-indigo-500" />
          Tämä päätös on osa {question.municipality}n valtuuston tuoreimpia asioita.
        </div>
      </div>
    </motion.div>
  );
}

