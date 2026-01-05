"use client";

import React from "react";

interface ClauseDiffViewProps {
  original: string;
  modified: string | null;
}

export default function ClauseDiffView({ original, modified }: ClauseDiffViewProps) {
  if (!modified) {
    return <div className="text-xs text-slate-400 leading-relaxed font-serif p-4 bg-black/10 rounded-xl">{original}</div>;
  }

  // Simple diff logic (word-based)
  const originalWords = original.split(/\s+/);
  const modifiedWords = modified.split(/\s+/);

  return (
    <div className="text-xs leading-relaxed font-serif p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-4">
      <div className="space-y-1">
        <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Alkuperäinen teksti</p>
        <p className="text-slate-500 line-through decoration-rose-500/50">{original}</p>
      </div>
      <div className="space-y-1 pt-4 border-t border-white/5">
        <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Varjo-muutos (Hyväksytty)</p>
        <p className="text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">{modified}</p>
      </div>
    </div>
  );
}

