"use client";

import { Sparkles, Calendar, MapPin, Wallet, Info } from "lucide-react";
import type { MunicipalCase } from "@/lib/types";

interface MunicipalDecisionCardProps {
  item: MunicipalCase;
  onClick: () => void;
}

const MunicipalityLogo = ({ municipality }: { municipality: string }) => {
  if (municipality.toLowerCase() === "espoo") {
    return (
      <div className="w-8 h-8 flex-shrink-0 bg-[#005eb8] rounded-md flex items-center justify-center text-white font-black text-xl shadow-sm overflow-hidden" title="Espoo">
        <span className="leading-none transform translate-y-[1px]">E</span>
      </div>
    );
  }
  if (municipality.toLowerCase() === "helsinki") {
    return (
      <div className="w-8 h-8 flex-shrink-0 bg-[#0000bf] rounded-md flex items-center justify-center text-white shadow-sm overflow-hidden" title="Helsinki">
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
        </svg>
      </div>
    );
  }
  // Generic logo for others or Aloitteet
  return (
    <div className="w-8 h-8 flex-shrink-0 bg-nordic-blue rounded-md flex items-center justify-center text-white shadow-sm overflow-hidden">
      <Building2 size={18} />
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
      className="bg-white rounded-2xl p-6 shadow-sm border border-nordic-gray cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      {isAI && (
        <div className="absolute top-0 right-0 p-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">
            <Sparkles size={10} />
            <span>AI-Analyysi</span>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <MunicipalityLogo municipality={item.municipality} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-nordic-darker uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                {item.municipality}
                {item.id.startsWith('aloite-') && (
                  <span className="ml-1 px-1 bg-red-500 text-white rounded-[2px] text-[8px] animate-pulse">LIVE</span>
                )}
              </span>
              <span className={`inline-block w-fit px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none ${
                item.status === 'agenda' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {getStatusLabel(item.status)}
              </span>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-nordic-darker mb-2 group-hover:text-nordic-blue transition-colors leading-tight">
          {item.title}
        </h3>

        <div className="flex flex-wrap gap-4 mb-4 text-xs text-nordic-dark">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-nordic-blue" />
            <span>{formatDate(item.meetingDate)}</span>
          </div>
          {item.neighborhood && (
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-red-500" />
              <span>{item.neighborhood}</span>
            </div>
          )}
          {item.costEstimate && (
            <div className="flex items-center gap-1">
              <Wallet size={14} className="text-green-600" />
              <span>{item.costEstimate.toLocaleString()} €</span>
            </div>
          )}
        </div>

        <p className="text-sm text-nordic-dark line-clamp-3 mb-4">
          {item.summary && item.summary.includes("###") 
            ? item.summary.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("---")).join(" ").substring(0, 150) + "..."
            : item.summary}
        </p>

        <div className="mt-auto pt-4 border-t border-nordic-gray/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-nordic-blue" />
              <span className="text-[10px] font-bold text-nordic-darker">{item.citizenPulse.for}% Puolesta</span>
            </div>
          </div>
          <button className="text-xs font-black text-nordic-blue uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Lue lisää →
          </button>
        </div>
      </div>
    </div>
  );
}

