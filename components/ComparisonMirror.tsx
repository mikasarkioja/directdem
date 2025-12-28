"use client";

import { useState } from "react";
import { AlertTriangle, Users, Building2, ChevronDown, ChevronUp } from "lucide-react";

interface ComparisonMirrorProps {
  parliamentVote: number; // e.g., 65 (65% in favor)
  citizenVote: number; // e.g., 30 (30% in favor)
  billName: string;
  partyData?: {
    party: string;
    position: "for" | "against" | "abstain";
    seats: number;
  }[];
}

export default function ComparisonMirror({
  parliamentVote,
  citizenVote,
  billName,
  partyData,
}: ComparisonMirrorProps) {
  const [isPartyBreakdownOpen, setIsPartyBreakdownOpen] = useState(false);

  const gap = Math.abs(parliamentVote - citizenVote);
  const isHighDiscrepancy = gap > 20;

  // Calculate against percentages
  const parliamentAgainst = 100 - parliamentVote;
  const citizenAgainst = 100 - citizenVote;

  return (
    <div className="p-6 bg-nordic-light rounded-2xl md:rounded-3xl border-2 border-nordic-gray shadow-sm">
      <h3 className="text-lg md:text-xl font-bold mb-6 text-nordic-darker tracking-tight">
        Demokratia-peili: {billName}
      </h3>

      <div className="space-y-8">
        {/* Parliament Side - Formal/Traditional Style */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-medium text-nordic-dark">
            <span className="flex items-center gap-2">
              <Building2 size={16} className="text-nordic-deep" />
              Eduskunnan kanta
            </span>
            <span className="font-semibold text-nordic-darker">
              {parliamentVote}% puolesta
            </span>
          </div>
          <div className="h-5 w-full bg-nordic-gray rounded-full overflow-hidden shadow-inner border border-nordic-dark/10">
            <div
              className="h-full bg-nordic-deep transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${parliamentVote}%` }}
            >
              {parliamentVote > 15 && (
                <span className="text-xs font-medium text-nordic-white">
                  {parliamentVote}%
                </span>
              )}
            </div>
          </div>
          <div className="h-5 w-full bg-nordic-gray rounded-full overflow-hidden shadow-inner border border-nordic-dark/10">
            <div
              className="h-full bg-red-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${parliamentAgainst}%` }}
            >
              {parliamentAgainst > 15 && (
                <span className="text-xs font-medium text-white">
                  {parliamentAgainst}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Citizen Side - Modern/Human Style */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-medium text-nordic-blue">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-nordic-blue" />
              Kansan tahto
            </span>
            <span className="font-semibold text-nordic-blue">
              {citizenVote}% puolesta
            </span>
          </div>
          <div className="h-5 w-full bg-blue-100 rounded-full overflow-hidden shadow-sm border border-blue-200">
            <div
              className="h-full bg-gradient-to-r from-nordic-blue to-blue-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${citizenVote}%` }}
            >
              {citizenVote > 15 && (
                <span className="text-xs font-medium text-white">
                  {citizenVote}%
                </span>
              )}
            </div>
          </div>
          <div className="h-5 w-full bg-red-100 rounded-full overflow-hidden shadow-sm border border-red-200">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${citizenAgainst}%` }}
            >
              {citizenAgainst > 15 && (
                <span className="text-xs font-medium text-white">
                  {citizenAgainst}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The Discrepancy Highlight */}
      {isHighDiscrepancy && (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-400 rounded-xl flex items-start gap-3 animate-pulse">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700 mb-1">
              Merkittävä mielipide-ero ({gap}%)
            </p>
            <p className="text-xs text-red-600 leading-relaxed">
              Edustajien ja kansalaisten näkemykset poikkeavat huomattavasti
              toisistaan tässä asiassa.
            </p>
          </div>
        </div>
      )}

      {/* Gap indicator for smaller discrepancies */}
      {!isHighDiscrepancy && gap > 0 && (
        <div className="mt-6 p-3 bg-nordic-white border border-nordic-gray rounded-lg">
          <p className="text-xs text-nordic-dark">
            <span className="font-semibold">Eroavaisuus:</span> {gap}%
            {gap > 15 && gap <= 20 && (
              <span className="ml-2 text-amber-600">
                (Lähellä merkittävää eroa)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Party Breakdown - Collapsible */}
      {partyData && partyData.length > 0 && (
        <div className="mt-6 border-t border-nordic-gray pt-4">
          <button
            onClick={() => setIsPartyBreakdownOpen(!isPartyBreakdownOpen)}
            className="w-full flex items-center justify-between text-sm font-medium text-nordic-darker hover:text-nordic-blue transition-colors"
          >
            <span>Puolueiden kannat</span>
            {isPartyBreakdownOpen ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>

          {isPartyBreakdownOpen && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              {partyData.map((party, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-nordic-white rounded-lg border border-nordic-gray"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-nordic-darker text-sm">
                      {party.party}
                    </span>
                    <span className="text-xs text-nordic-dark">
                      ({party.seats} paikkaa)
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      party.position === "for"
                        ? "bg-green-100 text-green-800"
                        : party.position === "against"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {party.position === "for"
                      ? "Puolesta"
                      : party.position === "against"
                      ? "Vastaan"
                      : "Tyhjää"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

