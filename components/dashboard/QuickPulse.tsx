"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function QuickPulse() {
  const [answered, setAnswered] = useState(false);
  
  // Mock question for now
  const question = "Pitäisikö sähköpotkulaudat kieltää Helsingin keskustassa viikonloppuöisin?";

  const handleVote = (vote: boolean) => {
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
  };

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
            <h3 className="text-xl font-black text-command-dark dark:text-white leading-tight">
              {question}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVote(true)}
                className="group/btn relative px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 overflow-hidden"
              >
                <Check size={14} className="group-hover/btn:scale-125 transition-transform" />
                Kyllä
              </button>
              <button
                onClick={() => handleVote(false)}
                className="group/btn relative px-6 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="w-3.5 h-[2px] bg-current group-hover/btn:scale-125 transition-transform" />
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

