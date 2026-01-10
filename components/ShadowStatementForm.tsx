"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  Send, 
  Loader2, 
  CheckCircle,
  MessageSquare,
  Target
} from "lucide-react";
import { submitShadowStatement } from "@/lib/actions/generate-statement";

interface ShadowStatementFormProps {
  billId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function ShadowStatementForm({ billId, userId, onSuccess }: ShadowStatementFormProps) {
  const [voteType, setVoteType] = useState<'jaa' | 'ei' | 'tyhjaa'>('tyhjaa');
  const [justification, setJustification] = useState("");
  const [focusArea, setFocusArea] = useState("talous");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;

    setIsSubmitting(true);
    try {
      await submitShadowStatement({
        billId,
        userId,
        voteType,
        justification,
        focusArea
      });
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (e) {
      alert("Tallennus epäonnistui. Yritä uudelleen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-4"
      >
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle className="text-white" size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black uppercase text-emerald-400">Kiitos lausunnostasi!</h3>
          <p className="text-xs text-slate-400 font-medium">Mielipiteesi on nyt osa virallista varjoeduskunnan lausuntoa.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
      <div className="flex items-center gap-3 text-purple-400">
        <MessageSquare size={20} />
        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Anna oma lausuntosi</h3>
      </div>

      <div className="space-y-6">
        {/* Vote Selection */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kantasi esitykseen</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setVoteType('jaa')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                voteType === 'jaa' ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <ThumbsUp size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Jaa</span>
            </button>
            <button
              type="button"
              onClick={() => setVoteType('ei')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                voteType === 'ei' ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <ThumbsDown size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Ei</span>
            </button>
            <button
              type="button"
              onClick={() => setVoteType('tyhjaa')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                voteType === 'tyhjaa' ? "bg-slate-700 border-slate-600 text-white shadow-lg shadow-slate-700/20" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Minus size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Tyhjä</span>
            </button>
          </div>
        </div>

        {/* Focus Area */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Painopistealue</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Talous', 'Arvot', 'Ympäristö', 'Alueet', 'Kansainvälisyys', 'Turvallisuus'].map(area => (
              <button
                key={area}
                type="button"
                onClick={() => setFocusArea(area.toLowerCase())}
                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  focusArea === area.toLowerCase() ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Justification */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perustelut (Varjokansanedustajan huomiot)</p>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            required
            placeholder="Kirjoita tähän asiantunteva huomiosi lakiesityksestä..."
            className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-500 outline-none min-h-[120px] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !justification.trim()}
          className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-purple-500 hover:scale-[1.02] transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50 group"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Send size={16} className="group-hover:translate-x-1 transition-transform" />
              <span>Tallenna lausunto</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}


