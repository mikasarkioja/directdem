"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Users, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { PARTY_INFO, type PartyStanceData } from "@/lib/party-stances";

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
  isMunicipal?: boolean; // New prop to handle municipal context
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

  // Load party stances if not municipal and billId/parliamentId are provided
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

  // Calculate against percentages
  const parliamentAgainst = 100 - parliamentVote;
  const citizenAgainst = 100 - citizenVote;

  return (
    <div className="p-6 bg-nordic-light rounded-2xl md:rounded-3xl border-2 border-nordic-gray shadow-sm">
      <h3 className="text-lg md:text-xl font-bold mb-6 text-nordic-darker tracking-tight">
        {isMunicipal ? "Päätös-peili" : "Demokratia-peili"}: {billName}
      </h3>

      <div className="space-y-8">
        {/* Formal Side (Parliament or Council) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-medium text-nordic-dark">
            <span className="flex items-center gap-2">
              <Building2 size={16} className="text-nordic-deep" />
              {isMunicipal ? "Valtuuston kanta" : "Eduskunnan kanta"}
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

      {/* Party Spectrum Bar - Horizontal visualization */}
      {analyzedStances && analyzedStances.length > 0 && (
        <div className="mt-6 border-t border-nordic-gray pt-4">
          <h4 className="text-sm font-semibold text-nordic-darker mb-3">
            Puolueiden kannat (mietinnön perusteella)
          </h4>
          <div className="relative h-16 bg-gradient-to-r from-red-50 via-gray-50 to-green-50 rounded-lg p-2 border border-nordic-gray">
            {/* Citizen Pulse indicator line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-nordic-blue z-10 shadow-sm"
              style={{ left: `${citizenVote}%` }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-nordic-blue" />
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-nordic-blue" />
              </div>
            </div>
            
            {/* Party positions */}
            <div className="relative h-full flex items-center">
              {analyzedStances.map((stance, index) => {
                const partyInfo = PARTY_INFO[stance.party];
                if (!partyInfo) return null;
                
                // Calculate position based on stance
                // PRO parties on right (75-95%), AGAINST on left (5-25%), ABSTAIN in middle (40-60%)
                let position = 50; // Default middle
                if (stance.stance === "PRO") {
                  position = 80 + (index % 4) * 3; // Right side
                } else if (stance.stance === "AGAINST") {
                  position = 15 - (index % 4) * 3; // Left side
                } else {
                  position = 45 + (index % 3) * 5; // Middle
                }
                
                // Clamp position
                position = Math.max(5, Math.min(95, position));
                
                return (
                  <div
                    key={stance.party}
                    className="absolute flex flex-col items-center gap-1"
                    style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                    title={`${partyInfo.name}: ${stance.stance === "PRO" ? "Puolesta" : stance.stance === "AGAINST" ? "Vastaan" : "Tyhjää"} (luottamus: ${Math.round(stance.confidence * 100)}%)`}
                  >
                    {/* Party dot/logo */}
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-transform cursor-help"
                      style={{ backgroundColor: partyInfo.color }}
                    >
                      {partyInfo.shortName}
                    </div>
                    {/* Stance indicator */}
                    <div
                      className={`w-1.5 h-4 rounded-full ${
                        stance.stance === "PRO"
                          ? "bg-green-500"
                          : stance.stance === "AGAINST"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-nordic-dark">
            <span>Vastaan</span>
            <span className="text-nordic-blue font-medium">
              Kansan tahto: {citizenVote}%
            </span>
            <span>Puolesta</span>
          </div>
        </div>
      )}
      
      {/* Loading state for party stances */}
      {loadingStances && (
        <div className="mt-6 border-t border-nordic-gray pt-4">
          <p className="text-xs text-nordic-dark text-center">
            Ladataan puolueiden kantaa mietinnöstä...
          </p>
        </div>
      )}

      {/* Party Breakdown - Collapsible (fallback to old format if no analyzed stances) */}
      {!analyzedStances && partyData && partyData.length > 0 && (
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

