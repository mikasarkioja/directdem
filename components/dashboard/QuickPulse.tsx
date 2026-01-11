"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getDailyPulse, submitPulseVote } from "@/app/actions/pulse";
import { PulseQuestion } from "@/lib/types";

interface QuickPulseProps {
  lens?: string;
}

export default function QuickPulse({ lens = "national" }: QuickPulseProps) {
  const [answered, setAnswered] = useState(false);
  const [question, setQuestion] = useState<PulseQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getDailyPulse(lens);
      setQuestion(data);
      setLoading(false);
    }
    load();
  }, [lens]);

  const handleVote = async (stance: "YES" | "NO") => {
    if (!question || submitting) return;
    setSubmitting(true);
    
    try {
      const res = await submitPulseVote(question, stance);
      if (res.success) {
        setAnswered(true);
        toast.success("Ääni rekisteröity! DNA-profiilisi päivittyy.", {
          icon: '🧬',
          style: {
            borderRadius: '16px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }
        });
      } else {
        toast.error(res.error || "Virhe tallennuksessa.");
      }
    } catch (err) {
      toast.error("Järjestelmävirhe.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 shadow-sm relative overflow-hidden group">
      {/* Decorative background pulse */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-primary)] opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
            <Zap size={16} fill="currentColor" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Päivän Pulse</p>
        </div>

        {!answered ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-command-dark dark:text-white leading-tight">
                {question.question}
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase rounded tracking-widest border border-indigo-500/20">
                  {question.category}
                </span>
                {question.municipality && (
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">
                    Local: {question.municipality}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVote("YES")}
                disabled={submitting}
                className="group/btn relative px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 overflow-hidden disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="group-hover/btn:scale-125 transition-transform" />}
                Kyllä
              </button>
              <button
                onClick={() => handleVote("NO")}
                disabled={submitting}
                className="group/btn relative px-6 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 overflow-hidden disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-[2px] bg-current group-hover/btn:scale-125 transition-transform" />}
                Ei
              </button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-6 flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Check size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-command-dark dark:text-white uppercase tracking-tight">Kiitos osallistumisesta!</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Näkemyksesi on nyt osa kansallista DNA-dataa.</p>
            </div>
            <button className="text-[9px] font-black uppercase text-[var(--accent-primary)] flex items-center gap-1 hover:gap-2 transition-all">
              Katso tulokset <ArrowRight size={10} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

