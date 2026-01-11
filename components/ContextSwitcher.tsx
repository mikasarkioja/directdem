"use client";

import { Building2, Landmark } from "lucide-react";

export type ViewContext = "parliament" | "municipal";

interface ContextSwitcherProps {
  currentContext: ViewContext;
  onContextChange: (context: ViewContext) => void;
  municipality?: string;
}

export default function ContextSwitcher({ currentContext, onContextChange, municipality = "Espoo" }: ContextSwitcherProps) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
      <button
        onClick={() => onContextChange("parliament")}
        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
          currentContext === "parliament"
            ? "bg-white text-command-neon shadow-md border border-slate-100"
            : "text-slate-500 hover:text-command-dark"
        }`}
      >
        <Landmark size={14} />
        Eduskunta
      </button>
      <button
        onClick={() => onContextChange("municipal")}
        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
          currentContext === "municipal"
            ? "bg-white text-command-neon shadow-md border border-slate-100"
            : "text-slate-500 hover:text-command-dark"
        }`}
      >
        <Building2 size={14} />
        Kunnat
      </button>
    </div>
  );
}
