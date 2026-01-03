"use client";

import { Sparkles, Calendar, MapPin, Wallet, Info } from "lucide-react";
import type { MunicipalCase } from "@/lib/types";

interface MunicipalDecisionCardProps {
  item: MunicipalCase;
  onClick: () => void;
}

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
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-nordic-light text-nordic-dark text-[10px] font-bold rounded uppercase">
              {item.municipality}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              item.status === 'agenda' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {getStatusLabel(item.status)}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-nordic-darker mb-2 group-hover:text-nordic-blue transition-colors">
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

