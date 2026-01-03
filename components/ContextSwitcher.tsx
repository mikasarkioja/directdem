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
          <div className="w-4 h-4 bg-[#005eb8] rounded-sm flex items-center justify-center text-white">
            <svg viewBox="0 0 100 120" className="w-3 h-3 fill-[#ffd700]">
              <path d="M50,10 L30,20 L30,30 L70,30 L70,20 Z" />
              <path d="M50,5 L40,15 L60,15 Z" />
              <path d="M25,50 C25,30 75,30 75,50 C75,75 55,95 50,100 C45,95 25,75 25,50" fill="none" stroke="#ffd700" strokeWidth="8" />
            </svg>
          </div>
        )}
        {municipality.toLowerCase() === "helsinki" && (
          <div className="w-4 h-4 bg-[#0000bf] rounded-sm flex items-center justify-center text-white">
            <svg viewBox="0 0 100 120" className="w-3 h-3">
              <path d="M50,10 L35,25 L65,25 Z" fill="#ffd700" />
              <path d="M20,70 L80,70 L75,90 L25,90 Z" fill="#ffd700" />
              <path d="M10,95 C30,85 70,85 90,95" fill="none" stroke="white" strokeWidth="4" />
            </svg>
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

