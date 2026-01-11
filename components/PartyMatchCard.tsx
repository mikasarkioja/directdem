"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Share2, CheckCircle, XCircle, Minus } from "lucide-react";
import { type AlignmentResult } from "@/lib/match-engine";
import { PARTY_INFO } from "@/lib/party-stances";
import { createClient } from "@/lib/supabase/client";

export default function PartyMatchCard() {
  const [results, setResults] = useState<AlignmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParty, setExpandedParty] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);
      
      try {
        // Call server action
        const { getPartyAlignment } = await import("@/app/actions/match-alignment");
        const alignmentResults = await getPartyAlignment(user.id);
        setResults(alignmentResults);
      } catch (error) {
        console.error("Failed to calculate alignment:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMatches();
  }, []);

  const handleShare = (result: AlignmentResult) => {
    const partyInfo = PARTY_INFO[result.party];
    const partyName = partyInfo?.name || result.party;
    
    const shareText = `Eduskuntavahtini kertoo: Arvoni kohtaavat ${result.score}% ${partyName} kanssa tällä viikolla. Katso oma tuloksesi!`;
    
    // Try Web Share API first
    if (navigator.share) {
      navigator.share({
        title: "Eduskuntavahti - Puoluekohdistus",
        text: shareText,
        url: window.location.href,
      }).catch((error) => {
        console.log("Share failed:", error);
        // Fallback to clipboard
        copyToClipboard(shareText);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Teksti kopioitu leikepöydälle!");
    }).catch((error) => {
      console.error("Failed to copy:", error);
      alert("Kopiointi epäonnistui. Kopioi teksti manuaalisesti:\n\n" + text);
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-nordic-light rounded-2xl border-2 border-nordic-gray">
        <p className="text-center text-nordic-dark">Ladataan puoluekohdistusta...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6 bg-nordic-light rounded-2xl border-2 border-nordic-gray">
        <p className="text-center text-nordic-dark">
          Kirjaudu sisään nähdäksesi puoluekohdistuksesi
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-6 bg-nordic-light rounded-2xl border-2 border-nordic-gray">
        <p className="text-center text-nordic-dark">
          Äänestä lakia nähdäksesi puoluekohdistuksesi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-6 bg-nordic-light rounded-2xl border-2 border-nordic-blue">
        <h2 className="text-xl font-bold text-nordic-darker mb-2">
          Puoluekohdistus
        </h2>
        <p className="text-sm text-nordic-dark mb-4">
          Vertaa äänesi puolueiden kannanottoihin mietinnöissä
        </p>
      </div>

      {results.map((result) => {
        const partyInfo = PARTY_INFO[result.party];
        const isExpanded = expandedParty === result.party;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const offset = circumference - (result.score / 100) * circumference;

        return (
          <div
            key={result.party}
            className="p-6 bg-white rounded-2xl border-2 border-nordic-gray shadow-sm"
          >
            <div className="flex items-start gap-4">
              {/* Progress Ring */}
              <div className="relative flex-shrink-0">
                <svg className="transform -rotate-90" width="120" height="120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke={partyInfo?.color || "#0066CC"}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-nordic-darker">
                    {result.score}%
                  </span>
                </div>
              </div>

              {/* Party Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: partyInfo?.color || "#0066CC" }}
                  >
                    {partyInfo?.shortName || result.party}
                  </div>
                  <h3 className="text-lg font-semibold text-nordic-darker">
                    {partyInfo?.name || result.party}
                  </h3>
                </div>

                <div className="flex gap-4 text-sm text-nordic-dark mb-3">
                  <span>
                    <CheckCircle size={14} className="inline text-green-600 mr-1" />
                    {result.agreements} yhteensopivaa
                  </span>
                  <span>
                    <XCircle size={14} className="inline text-red-600 mr-1" />
                    {result.disagreements} eriävää
                  </span>
                  <span>
                    <Minus size={14} className="inline text-gray-600 mr-1" />
                    {result.neutralMatches} neutraalia
                  </span>
                </div>

                <p className="text-xs text-nordic-dark">
                  Yhteensä {result.totalBills} lakiesitystä vertailtu
                </p>

                {/* Show Why Toggle */}
                <button
                  onClick={() => setExpandedParty(isExpanded ? null : result.party)}
                  className="mt-3 flex items-center gap-2 text-sm text-nordic-blue hover:text-nordic-deep transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} />
                      <span>Piilota yksityiskohdat</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      <span>Näytä miksi</span>
                    </>
                  )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Top Agreements */}
                    {result.topAgreements.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">
                          Yhteensopivat kannat ({result.topAgreements.length})
                        </h4>
                        <ul className="space-y-1">
                          {result.topAgreements.map((agreement, idx) => (
                            <li key={idx} className="text-xs text-green-700">
                              • {agreement.billTitle}: Sinä {agreement.userPosition}, {partyInfo?.shortName || result.party} {agreement.partyStance}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Top Clashes */}
                    {result.topClashes.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">
                          Eriävät kannat ({result.topClashes.length})
                        </h4>
                        <ul className="space-y-1">
                          {result.topClashes.map((clash, idx) => (
                            <li key={idx} className="text-xs text-red-700">
                              • {clash.billTitle}: Sinä {clash.userPosition}, {partyInfo?.shortName || result.party} {clash.partyStance}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={() => handleShare(result)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-nordic-blue text-white rounded-lg hover:bg-nordic-deep transition-colors text-sm"
                >
                  <Share2 size={16} />
                  <span>Jaa oma kohdistukseni</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

