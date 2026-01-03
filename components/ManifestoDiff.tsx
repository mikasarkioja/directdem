"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";

interface ManifestoDiffProps {
  oldManifesto: string;
  newManifesto: string;
  reasoning: string;
  onApprove: () => void;
  onReject: () => void;
  isVoting: boolean;
}

export default function ManifestoDiff({ 
  oldManifesto, 
  newManifesto, 
  reasoning, 
  onApprove, 
  onReject,
  isVoting 
}: ManifestoDiffProps) {
  return (
    <div className="space-y-10">
      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-command-neon shadow-sm shrink-0">
          <Sparkles size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-black uppercase tracking-widest text-blue-600">AI Oppimisraportti</h4>
          <p className="text-sm text-blue-800 font-medium leading-relaxed italic">
            "{reasoning}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Old Manifesto */}
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] relative opacity-60">
          <div className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Nykyinen linja</div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-500 mb-6">Vanha Manifesti</h3>
          <div className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed decoration-rose-500/30 decoration-4 line-through">
            {oldManifesto}
          </div>
        </div>

        {/* New Manifesto */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white border-2 border-emerald-500 p-8 rounded-[2.5rem] relative shadow-xl shadow-emerald-100"
        >
          <div className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
            <Check size={12} />
            Ehdotettu päivitys
          </div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-command-dark mb-6">Uusi Manifesti</h3>
          <div className="text-sm text-slate-700 font-bold whitespace-pre-wrap leading-relaxed bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            {newManifesto}
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-6 pt-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tighter">Hyväksytäänkö uusi linja?</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Äänestys vaatii jäsenten enemmistön</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onReject}
            disabled={isVoting}
            className="flex items-center gap-2 px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50"
          >
            <X size={20} />
            Hylkää
          </button>
          <button
            onClick={onApprove}
            disabled={isVoting}
            className="flex items-center gap-3 px-12 py-4 bg-command-neon text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-blue-500/20"
          >
            <Check size={20} />
            Vahvista uusi linja
          </button>
        </div>
      </div>
    </div>
  );
}

