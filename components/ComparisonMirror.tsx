"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Users, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { PARTY_INFO, type PartyStanceData } from "@/lib/party-stances";
import { motion } from "framer-motion";

interface ComparisonMirrorProps {
  parliamentVote: number; // e.g., 65 (65% in favor)
  citizenVote: number; // e.g., 30 (30% in favor)
  billName: string;
  billId?: string;
  parliamentId?: string;
  partyData?: {
    party: string;
    position: "for" | "against" | "abstain";
    seats: number;
  }[];
  partyStances?: PartyStanceData[];
  isMunicipal?: boolean;
}

export default function ComparisonMirror({
  parliamentVote,
  citizenVote,
  billName,
  billId,
  parliamentId,
  partyData,
  partyStances,
  isMunicipal = false,
}: ComparisonMirrorProps) {
  const [isPartyBreakdownOpen, setIsPartyBreakdownOpen] = useState(false);
  const [loadingStances, setLoadingStances] = useState(false);
  const [analyzedStances, setAnalyzedStances] = useState<PartyStanceData[] | null>(partyStances || null);

  useEffect(() => {
    if (!isMunicipal && billId && parliamentId && !analyzedStances && !loadingStances) {
      setLoadingStances(true);
      import("@/app/actions/party-stances")
        .then(({ getPartyStances }) => getPartyStances(billId, parliamentId))
        .then((result) => {
          if (result?.parties) {
            setAnalyzedStances(result.parties);
          }
          setLoadingStances(false);
        })
        .catch((error) => {
          console.error("Failed to load party stances:", error);
          setLoadingStances(false);
        });
    }
  }, [billId, parliamentId, analyzedStances, loadingStances, isMunicipal]);

  const gap = Math.abs(parliamentVote - citizenVote);
  const isHighDiscrepancy = gap > 20;

  const parliamentAgainst = 100 - parliamentVote;
  const citizenAgainst = 100 - citizenVote;

  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Building2 size={20} className="text-command-neon" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-command-dark">
            {isMunicipal ? "Decision Mirror" : "Democracy Mirror"}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{billName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Formal Side (Parliament or Council) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isMunicipal ? "Council" : "Parliament"}
            </span>
            <span className="text-xs font-black text-command-dark">
              {parliamentVote}% PRO
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${parliamentVote}%` }}
                className="h-full bg-slate-800 flex items-center justify-end pr-3"
              >
                {parliamentVote > 15 && <span className="text-[9px] font-black text-white">{parliamentVote}%</span>}
              </motion.div>
            </div>
            <div className="h-6 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${parliamentAgainst}%` }}
                className="h-full bg-rose-500 flex items-center justify-end pr-3"
              >
                {parliamentAgainst > 15 && <span className="text-[9px] font-black text-white">{parliamentAgainst}%</span>}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Citizen Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-command-neon">
              Citizens
            </span>
            <span className="text-xs font-black text-command-neon">
              {citizenVote}% PRO
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-full bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${citizenVote}%` }}
                className="h-full bg-command-neon flex items-center justify-end pr-3 shadow-lg shadow-blue-500/20"
              >
                {citizenVote > 15 && <span className="text-[9px] font-black text-white">{citizenVote}%</span>}
              </motion.div>
            </div>
            <div className="h-6 w-full bg-rose-50 rounded-lg overflow-hidden border border-rose-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${citizenAgainst}%` }}
                className="h-full bg-rose-400 flex items-center justify-end pr-3"
              >
                {citizenAgainst > 15 && <span className="text-[9px] font-black text-white">{citizenAgainst}%</span>}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy Highlight */}
      {isHighDiscrepancy && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-rose-700 mb-1">
              Critical Democracy Gap ({gap}%)
            </p>
            <p className="text-xs text-rose-600 font-medium leading-relaxed">
              Representatives and citizens are significantly misaligned on this issue.
            </p>
          </div>
        </motion.div>
      )}

      {/* Party Spectrum Bar */}
      {analyzedStances && analyzedStances.length > 0 && (
        <div className="mt-10 pt-8 border-t border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
            Party Alignment Spectrum
          </h4>
          <div className="relative h-20 bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {/* Citizen Pulse indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-command-neon z-10 shadow-[0_0_10px_rgba(0,94,184,0.3)]"
              style={{ left: `${citizenVote}%` }}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-command-neon text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                YOU
              </div>
            </div>
            
            {/* Party positions */}
            <div className="relative h-full flex items-center">
              {analyzedStances.map((stance, index) => {
                const partyInfo = PARTY_INFO[stance.party];
                if (!partyInfo) return null;
                
                let position = 50;
                if (stance.stance === "PRO") position = 80 + (index % 4) * 3;
                else if (stance.stance === "AGAINST") position = 15 - (index % 4) * 3;
                else position = 45 + (index % 3) * 5;
                
                position = Math.max(8, Math.min(92, position));
                
                return (
                  <div
                    key={stance.party}
                    className="absolute flex flex-col items-center group cursor-help"
                    style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white transition-all group-hover:scale-110 group-hover:z-20"
                      style={{ backgroundColor: partyInfo.color }}
                    >
                      {partyInfo.shortName}
                    </div>
                    <div className="mt-1 h-1 w-4 rounded-full bg-slate-200 group-hover:bg-slate-400 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">
            <span>Opposed</span>
            <span className="text-command-neon">Citizen Pulse: {citizenVote}%</span>
            <span>In Favor</span>
          </div>
        </div>
      )}
    </div>
  );
}
