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
    <div className="flex bg-nordic-light p-1 rounded-xl border border-nordic-gray/30 self-center">
      <button
        onClick={() => onContextChange("parliament")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest ${
          currentContext === "parliament"
            ? "bg-white text-nordic-blue shadow-sm border border-nordic-gray/20"
            : "text-nordic-dark hover:text-nordic-darker"
        }`}
      >
        <Landmark size={14} />
        Eduskunta
      </button>
      <button
        onClick={() => onContextChange("municipal")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest ${
          currentContext === "municipal"
            ? "bg-white text-nordic-blue shadow-sm border border-nordic-gray/20"
            : "text-nordic-dark hover:text-nordic-darker"
        }`}
      >
        {municipality.toLowerCase() === "espoo" && (
          <div className="w-4 h-4 bg-[#005eb8] rounded-sm flex items-center justify-center text-white text-[10px] font-bold">E</div>
        )}
        {municipality.toLowerCase() === "helsinki" && (
          <div className="w-4 h-4 bg-[#0000bf] rounded-sm flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" /></svg>
          </div>
        )}
        {municipality.toLowerCase() !== "espoo" && municipality.toLowerCase() !== "helsinki" && (
          <Building2 size={14} />
        )}
        {municipality}
      </button>
    </div>
  );
}

