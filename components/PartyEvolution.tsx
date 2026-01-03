"use client";

import React from "react";
import { motion } from "framer-motion";
import { History, ArrowDown } from "lucide-react";

interface Version {
  version_number: number;
  manifesto_text: string;
  reasoning: string;
  created_at: string;
}

interface PartyEvolutionProps {
  history: Version[];
}

export default function PartyEvolution({ history }: PartyEvolutionProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-12 py-10">
      <div className="flex items-center gap-3 mb-10 border-b border-slate-100 pb-6">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
          <History size={20} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Puolueen Evoluutio</h3>
      </div>

      <div className="space-y-16 relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100" />
        
        {history.map((v, i) => (
          <motion.div 
            key={v.version_number}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative pl-12"
          >
            <div className="absolute left-0 top-0 w-10 h-10 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10 font-black text-[10px]">
              v{v.version_number}
            </div>
            
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {new Date(v.created_at).toLocaleDateString('fi-FI')}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-medium italic">"{v.reasoning}"</p>
              <div className="text-sm text-slate-700 leading-relaxed font-medium">
                {v.manifesto_text.substring(0, 150)}...
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

