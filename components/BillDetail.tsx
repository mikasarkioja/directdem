"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { type Bill } from "@/app/actions/bills";
import { parseSummary } from "@/lib/summary-parser";
import { processBillToSelkokieli, regenerateBillSummary } from "@/app/actions/process-bill";
import StreamingSummary from "./StreamingSummary";
import ComparisonMirror from "./ComparisonMirror";
import VoteButton from "./VoteButton";
import StickyVotingBar from "./StickyVotingBar";
import { getVoteStats } from "@/app/actions/votes";

interface BillDetailProps {
  bill: Bill;
  onClose: () => void;
}

export default function BillDetail({ bill, onClose }: BillDetailProps) {
  const [processingFullText, setProcessingFullText] = useState(false);
  // Prioritize summary over rawText - we want to show the AI summary, not the full text
  const [savedSummary, setSavedSummary] = useState<string | null>(bill.summary || null);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  // Update saved summary when bill changes (prioritize summary over rawText)
  useEffect(() => {
    setSavedSummary(bill.summary || null);
  }, [bill]);

  const handleProcessFullText = async () => {
    setProcessingFullText(true);
    setProgressMessage("Aloitetaan...");
    
    try {
      console.log(`[BillDetail] Starting to process bill ${bill.id} (${bill.parliamentId})`);
      console.log(`[BillDetail] Button clicked, calling processBillToSelkokieli...`);
      
      // Step 1: Fetching
      setProgressMessage("Haetaan täydellistä tekstiä Eduskunta API:sta...");
      console.log(`[BillDetail] Progress message set to: Haetaan täydellistä tekstiä...`);
      
      // Update message after a delay to show PDF extraction is happening
      const progressTimer = setTimeout(() => {
        if (processingFullText) {
          setProgressMessage("✅ Haettu! Poimitaan tekstiä PDF:stä (tämä voi kestää 30-60 sekuntia suurille tiedostoille)...");
          console.log(`[BillDetail] Progress updated: PDF extraction in progress`);
        }
      }, 3000);
      
      console.log(`[BillDetail] About to call processBillToSelkokieli with billId: ${bill.id}`);
      const result = await processBillToSelkokieli(bill.id);
      console.log(`[BillDetail] processBillToSelkokieli returned`);
      
      // Clear the progress timer if it's still running
      clearTimeout(progressTimer);
      
      console.log(`[BillDetail] Process result:`, { 
        success: result.success, 
        hasSummary: !!result.summary, 
        error: result.error,
        fromCache: result.fromCache 
      });
      
      if (result.success && result.summary) {
        // Update the saved summary so StreamingSummary can use it
        console.log(`[BillDetail] Summary received: ${result.summary.length} characters`);
        setSavedSummary(result.summary);
        setProgressMessage("✅ Valmis! Tiivistelmä on nyt saatavilla.");
        setTimeout(() => setProgressMessage(null), 3000);
        
        // The StreamingSummary component will pick up the new summary from savedSummary state
        // No need to reload - the component should re-render with the new summary
      } else {
        const errorMsg = result.error || "Failed to process bill text";
        console.error(`[BillDetail] Processing failed:`, errorMsg);
        
        // Show error in progress message
        if (errorMsg.includes("Could not fetch") || errorMsg.includes("Fetched 0 characters")) {
          setProgressMessage("⚠️ Virhe: Asiakirjaa ei voitu hakea. Asiakirja saattaa olla liian uusi tai API-päätepiste on muuttunut.");
        } else if (errorMsg.includes("too short")) {
          setProgressMessage("⚠️ Virhe: Haettu teksti on liian lyhyt. Asiakirja saattaa olla tyhjä tai vaurioitunut.");
        } else {
          setProgressMessage(`⚠️ Virhe: ${errorMsg.substring(0, 100)}`);
        }
        
        setTimeout(() => {
          setProgressMessage(null);
          alert(`Virhe: ${errorMsg}\n\nTarkista palvelimen lokitiedostot saadaksesi lisätietoja.`);
        }, 2000);
      }
    } catch (error: any) {
      console.error("[BillDetail] Exception during processing:", error);
      const errorMsg = error.message || "Unknown error";
      console.error(`[BillDetail] Error details:`, {
        message: errorMsg,
        stack: error.stack,
        billId: bill.id,
        parliamentId: bill.parliamentId,
        errorType: error.constructor.name
      });
      
      setProgressMessage("⚠️ Odottamaton virhe tapahtui.");
      setTimeout(() => {
        setProgressMessage(null);
        alert(`Virhe: ${errorMsg}\n\nTarkista palvelimen lokitiedostot saadaksesi lisätietoja.`);
      }, 2000);
    } finally {
      console.log(`[BillDetail] Finally block - setting processingFullText to false`);
      setProcessingFullText(false);
    }
  };

  useEffect(() => {
    async function loadVoteStats() {
      setLoadingVotes(true);
      try {
        const stats = await getVoteStats(bill.id);
        setVoteStats(stats);
      } catch (error) {
        console.error("Failed to load vote stats:", error);
      } finally {
        setLoadingVotes(false);
      }
    }
    loadVoteStats();
  }, [bill.id]);
  // Calculate political reality percentages
  const totalSeats = bill.politicalReality.reduce((sum, p) => sum + p.seats, 0);
  const forSeats = bill.politicalReality
    .filter((p) => p.position === "for")
    .reduce((sum, p) => sum + p.seats, 0);
  const againstSeats = bill.politicalReality
    .filter((p) => p.position === "against")
    .reduce((sum, p) => sum + p.seats, 0);
  const abstainSeats = bill.politicalReality
    .filter((p) => p.position === "abstain")
    .reduce((sum, p) => sum + p.seats, 0);

  const politicalForPercent = Math.round((forSeats / totalSeats) * 100);
  const politicalAgainstPercent = Math.round((againstSeats / totalSeats) * 100);

  // Calculate discrepancy gap
  const citizenForPercent = bill.citizenPulse.for;
  const discrepancyGap = Math.abs(citizenForPercent - politicalForPercent);
  const hasDiscrepancy = discrepancyGap > 15;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] md:max-h-[95vh] overflow-y-auto flex flex-col md:flex-row md:gap-6">
        {/* Mobile: Single column, Desktop: Multi-column */}
        <div className="flex-1 flex flex-col">
          {/* Header - Sticky */}
          <div className="sticky top-0 bg-white border-b border-nordic-gray p-6 rounded-t-3xl flex justify-between items-start z-10">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                <h2 className="text-xl md:text-2xl font-bold text-nordic-darker tracking-tight">{bill.title}</h2>
                {bill.parliamentId && (
                  <span className="px-2 py-1 bg-nordic-blue text-white text-xs font-mono rounded self-start">
                    {bill.parliamentId}
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base text-nordic-dark">{bill.summary}</p>
            </div>
            <button
              onClick={onClose}
              className="text-nordic-dark hover:text-nordic-darker transition-colors ml-4 flex-shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content - Mobile: Single column, Desktop: Scrollable */}
          <div className="p-6 space-y-6 md:space-y-8 pb-24 md:pb-8">
            {/* Comparison Mirror - First on Mobile, Second on Desktop */}
                <div className="order-1 md:order-2">
                  <ComparisonMirror
                    parliamentVote={politicalForPercent}
                    citizenVote={voteStats ? voteStats.for_percent : bill.citizenPulse.for}
                    billName={bill.title}
                    billId={bill.id}
                    parliamentId={bill.parliamentId}
                    partyData={bill.politicalReality}
                  />
                </div>
            {/* Streaming Summary Component - Second on Mobile, First on Desktop */}
            <div className="order-2 md:order-1">
                <StreamingSummary
                  billId={bill.id}
                  existingSummary={savedSummary || bill.summary || null}
                  billParliamentId={bill.parliamentId}
                  billTitle={bill.title}
                  onSummaryComplete={(summary) => {
                    setSavedSummary(summary);
                  }}
                />
            </div>

            {/* Fetch Full Text Button */}
            <div className="bg-nordic-light rounded-2xl p-4 border border-nordic-gray md:order-3">
              <div className="flex gap-2">
                <button
                  onClick={handleProcessFullText}
                  disabled={processingFullText}
                  className="flex-1 px-4 py-3 text-sm md:text-base bg-nordic-blue text-white rounded-xl hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title="Hae täydellinen teksti Eduskunta API:sta"
                >
                  {processingFullText ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>{progressMessage || "Käsitellään..."}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      <span>Hae täydellinen teksti</span>
                    </>
                  )}
                </button>
                {(savedSummary || bill.summary) && (
                  <button
                    onClick={async () => {
                      setProcessingFullText(true);
                      setProgressMessage("Uudelleengeneroidaan pidempi tiivistelmä...");
                      try {
                        const result = await regenerateBillSummary(bill.id); // Force regenerate
                        if (result.success && result.summary) {
                          setSavedSummary(result.summary);
                          setProgressMessage("✅ Uusi pidempi tiivistelmä valmis!");
                          setTimeout(() => setProgressMessage(null), 3000);
                        } else {
                          setProgressMessage(null);
                          alert(result.error || "Uudelleengenerointi epäonnistui");
                        }
                      } catch (error: any) {
                        setProgressMessage(null);
                        alert(`Virhe: ${error.message || "Tuntematon virhe"}`);
                      } finally {
                        setProcessingFullText(false);
                      }
                    }}
                    disabled={processingFullText}
                    className="px-4 py-3 text-sm md:text-base bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title="Uudelleengeneroi pidempi tiivistelmä"
                  >
                    <RefreshCw size={18} />
                    <span className="hidden md:inline">Uudelleengeneroi</span>
                    <span className="md:hidden">Uusi</span>
                  </button>
                )}
              </div>
              
              {/* Progress Message Display */}
              {processingFullText && progressMessage && (
                <div className="mt-3 p-3 bg-white dark:bg-nordic-deep rounded-lg border border-nordic-gray dark:border-nordic-darker">
                  <div className="flex items-start gap-2 text-sm">
                    {progressMessage.startsWith("✅") ? (
                      <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    ) : progressMessage.startsWith("⚠️") ? (
                      <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <RefreshCw size={16} className="text-nordic-blue animate-spin mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${
                      progressMessage.startsWith("✅") 
                        ? "text-green-700 dark:text-green-400" 
                        : progressMessage.startsWith("⚠️")
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-nordic-dark dark:text-nordic-gray"
                    }`}>
                      {progressMessage}
                    </span>
                  </div>
                </div>
              )}
              
              {!processingFullText && (
                <p className="text-xs text-nordic-dark dark:text-nordic-gray mt-2 text-center">
                  Tämä hakee koko lakitekstin, jotta AI voi generoida tarkemman tiivistelmän
                </p>
              )}
            </div>

            {/* Voting Section - Hidden on Mobile (using StickyVotingBar instead) */}
            <div className="hidden md:block bg-white rounded-2xl p-6 border-2 border-nordic-blue md:order-4">
              <h3 className="text-lg font-semibold text-nordic-darker mb-4 tracking-tight">
                Äänestä
              </h3>
              <VoteButton
                billId={bill.id}
                onVoteChange={() => {
                  // Reload vote stats when vote changes
                  getVoteStats(bill.id).then(setVoteStats);
                }}
              />
              {voteStats && voteStats.total_count > 0 && (
                <div className="mt-4 pt-4 border-t border-nordic-gray">
                  <p className="text-xs text-nordic-dark mb-2">
                    Yhteensä {voteStats.total_count} ääntä:
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      Puolesta: {voteStats.for_percent}% ({voteStats.for_count})
                    </span>
                    <span className="text-red-600">
                      Vastaan: {voteStats.against_percent}% ({voteStats.against_count})
                    </span>
                    <span className="text-gray-600">
                      Neutraali: {voteStats.neutral_percent}% ({voteStats.neutral_count})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Citizen Pulse Section */}
            <div className="md:order-5">
              <h3 className="text-lg font-semibold text-nordic-darker mb-4 tracking-tight">
                Citizen Pulse
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-nordic-dark mb-1">
                    <span>For</span>
                    <span className="font-semibold">{bill.citizenPulse.for}%</span>
                  </div>
                  <div className="h-6 bg-nordic-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-nordic-blue transition-all duration-500"
                      style={{ width: `${bill.citizenPulse.for}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-nordic-dark mb-1">
                    <span>Against</span>
                    <span className="font-semibold">{bill.citizenPulse.against}%</span>
                  </div>
                  <div className="h-6 bg-nordic-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 transition-all duration-500"
                      style={{ width: `${bill.citizenPulse.against}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Political Reality Section */}
            <div className="md:order-6">
              <h3 className="text-lg font-semibold text-nordic-darker mb-4 tracking-tight">
                Political Reality
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-nordic-dark mb-1">
                    <span>For</span>
                    <span className="font-semibold">{politicalForPercent}%</span>
                  </div>
                  <div className="h-6 bg-nordic-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-nordic-blue transition-all duration-500"
                      style={{ width: `${politicalForPercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-nordic-dark mb-1">
                    <span>Against</span>
                    <span className="font-semibold">{politicalAgainstPercent}%</span>
                  </div>
                  <div className="h-6 bg-nordic-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 transition-all duration-500"
                      style={{ width: `${politicalAgainstPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Discrepancy Gap */}
            <div
              className={`p-4 rounded-2xl border-2 md:order-7 ${
                hasDiscrepancy
                  ? "bg-red-50 border-red-400"
                  : "bg-nordic-light border-nordic-gray"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-nordic-darker">Discrepancy Gap</span>
                <span
                  className={`text-2xl font-bold ${
                    hasDiscrepancy ? "text-red-600" : "text-nordic-dark"
                  }`}
                >
                  {discrepancyGap}%
                </span>
              </div>
              <p className="text-sm text-nordic-dark mt-2">
                {hasDiscrepancy
                  ? "⚠️ Significant gap detected between citizen sentiment and political reality"
                  : "Citizen sentiment aligns with political reality"}
              </p>
            </div>

            {/* Party Breakdown */}
            <div className="md:order-8">
              <h3 className="text-lg font-semibold text-nordic-darker mb-4 tracking-tight">
                Party Positions
              </h3>
              <div className="space-y-2">
                {bill.politicalReality.map((party, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-nordic-light rounded-lg"
                  >
                    <span className="font-medium text-nordic-darker">{party.party}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-nordic-dark">{party.seats} seats</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          party.position === "for"
                            ? "bg-green-100 text-green-800"
                            : party.position === "against"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {party.position.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Voting Bar - Mobile Only */}
      <StickyVotingBar
        billId={bill.id}
        onVoteChange={() => {
          getVoteStats(bill.id).then(setVoteStats);
        }}
      />
    </div>
  );
}


