"use client";

import { Sparkles, Calendar, MapPin, Wallet, Info, Building2, ChevronRight } from "lucide-react";
import type { MunicipalCase } from "@/lib/types";

interface MunicipalDecisionCardProps {
  item: MunicipalCase;
  onClick: () => void;
}

const MunicipalityLogo = ({ municipality }: { municipality: string }) => {
  if (municipality.toLowerCase() === "espoo") {
    return (
      <div className="w-10 h-10 flex-shrink-0 bg-[#005eb8] rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden" title="Espoo">
        <svg viewBox="0 0 100 120" className="w-6 h-6 fill-[#ffd700]">
          <path d="M50,10 L30,20 L30,30 L70,30 L70,20 Z" />
          <path d="M50,5 L40,15 L60,15 Z" />
          <path d="M25,50 C25,30 75,30 75,50 C75,75 55,95 50,100 C45,95 25,75 25,50" fill="none" stroke="#ffd700" strokeWidth="8" />
          <circle cx="35" cy="55" r="3" />
          <circle cx="65" cy="55" r="3" />
          <circle cx="40" cy="75" r="3" />
          <circle cx="60" cy="75" r="3" />
        </svg>
      </div>
    );
  }
  if (municipality.toLowerCase() === "helsinki") {
    return (
      <div className="w-10 h-10 flex-shrink-0 bg-[#0000bf] rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden" title="Helsinki">
        <svg viewBox="0 0 100 120" className="w-6 h-6">
          <path d="M50,10 L35,25 L65,25 Z" fill="#ffd700" />
          <path d="M20,70 L80,70 L75,90 L25,90 Z" fill="#ffd700" />
          <path d="M10,95 C30,85 70,85 90,95" fill="none" stroke="white" strokeWidth="4" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm overflow-hidden">
      <Building2 size={20} />
    </div>
  );
};

export default function MunicipalDecisionCard({ item, onClick }: MunicipalDecisionCardProps) {
  const isAI = item.summary && (item.summary.length > 500 || item.summary.includes("###"));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Ei pvm";
    return new Date(dateStr).toLocaleDateString("fi-FI");
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "agenda": return "Esityslistalla";
      case "decided": return "Päätetty";
      default: return status;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl p-8 border border-slate-100 cursor-pointer hover:border-command-neon/30 hover:shadow-lg transition-all relative group"
    >
      {isAI && (
        <div className="absolute top-0 right-0 p-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-command-neon text-[8px] font-black rounded-bl-xl uppercase tracking-widest border-l border-b border-blue-100">
            <Sparkles size={10} />
            <span>AI ANALYSIS</span>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <MunicipalityLogo municipality={item.municipality} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-command-dark uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                {item.municipality}
                {item.id.startsWith('aloite-') && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-md text-[8px] animate-pulse">LIVE</span>
                )}
              </span>
              <span className={`inline-block w-fit px-2 py-0.5 rounded-md text-[9px] font-bold uppercase leading-none ${
                item.status === 'agenda' ? 'bg-blue-50 text-command-neon' : 'bg-emerald-50 text-command-emerald'
              }`}>
                {getStatusLabel(item.status)}
              </span>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-command-dark mb-4 group-hover:text-command-neon transition-colors leading-tight">
          {item.title}
        </h3>

        <div className="flex flex-wrap gap-5 mb-6 text-[10px] font-bold uppercase tracking-tight text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-300" />
            <span>{formatDate(item.meetingDate)}</span>
          </div>
          {item.neighborhood && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-rose-400" />
              <span>{item.neighborhood}</span>
            </div>
          )}
          {item.costEstimate && (
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-emerald-500" />
              <span>{item.costEstimate.toLocaleString()} €</span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 font-medium line-clamp-3 mb-6 leading-relaxed">
          {item.summary && item.summary.includes("###") 
            ? item.summary.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("---")).join(" ").substring(0, 150) + "..."
            : item.summary}
        </p>

        <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-command-neon" />
              <span className="text-[10px] font-black uppercase text-command-dark">{item.citizenPulse.for}% Support</span>
            </div>
          </div>
          <button className="text-[10px] font-black text-command-neon uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-2">
            Details <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
