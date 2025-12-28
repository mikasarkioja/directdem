"use client";

import { useState, useEffect } from "react";
import { useCompletion } from "ai/react";
import { Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { parseSummary } from "@/lib/summary-parser";
import BulletinBoard from "./BulletinBoard";

interface StreamingSummaryProps {
  billId: string;
  existingSummary?: string | null;
  billParliamentId?: string;
  billTitle?: string;
  onSummaryComplete?: (summary: string) => void;
}

export default function StreamingSummary({
  billId,
  existingSummary,
  billParliamentId,
  billTitle,
  onSummaryComplete,
}: StreamingSummaryProps) {
  const [finalSummary, setFinalSummary] = useState<string | null>(
    existingSummary || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);

  // Update finalSummary when existingSummary prop changes (e.g., after processing)
  // Only update if it's a reasonable length (not the full raw text which can be 100k+ chars)
  useEffect(() => {
    if (existingSummary) {
      // If it's very long (> 50000 chars), it's probably raw text, not a summary
      // Summaries should be much shorter (typically < 5000 chars)
      if (existingSummary.length > 50 && existingSummary.length < 50000) {
        console.log(`[StreamingSummary] Updating summary from prop: ${existingSummary.length} chars`);
        setFinalSummary(existingSummary);
      } else if (existingSummary.length >= 50000) {
        console.log(`[StreamingSummary] Ignoring existingSummary - too long (${existingSummary.length} chars), likely raw text`);
      }
    }
  }, [existingSummary]);

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/summarize",
    body: {
      billId: billId,
    },
    onFinish: async (prompt, completion) => {
      // Save to database when stream completes
      setProgressStep("✅ Tiivistelmä generoitu! Tallennetaan tietokantaan...");
      
      try {
        const response = await fetch("/api/save-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billId,
            summary: completion,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save summary to database");
          setProgressStep("⚠️ Tiivistelmä generoitu, mutta tallennus epäonnistui");
        } else {
          setProgressStep("✅ Valmis! Tiivistelmä tallennettu onnistuneesti.");
        }

        setFinalSummary(completion);
        if (onSummaryComplete) {
          onSummaryComplete(completion);
        }
        
        // Clear progress message after 2 seconds
        setTimeout(() => {
          setProgressStep(null);
        }, 2000);
      } catch (err) {
        console.error("Error saving summary:", err);
        setProgressStep("⚠️ Virhe tallennuksessa");
      } finally {
        setIsGenerating(false);
      }
    },
    onError: (error) => {
      console.error("Streaming error:", error);
      setProgressStep("⚠️ Virhe generoinnissa. Yritä uudelleen.");
      setIsGenerating(false);
      setTimeout(() => {
        setProgressStep(null);
      }, 3000);
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgressStep("Haetaan lakia tekstiä tietokannasta...");
    
    // Get the bill text from the database
    try {
      const response = await fetch(`/api/get-bill-text?billId=${billId}`);
      const data = await response.json();

      if (!data.text) {
        setProgressStep(null);
        alert("Ei saatavilla lakia tekstiä. Yritä 'Päivitä täydellä tekstillä' -nappia ensin.");
        setIsGenerating(false);
        return;
      }

      setProgressStep("✅ Haettu onnistuneesti! Aloitetaan tiivistelmän generointi...");
      
      // Small delay to show the success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressStep("Teen selkokielistä tiivistelmää AI:lla...");
      
      // Start the completion stream
      // useCompletion will send { prompt: data.text, billId: billId } to the API
      await complete(data.text);
      
      // The onFinish callback will handle setting the final summary
    } catch (err: any) {
      console.error("Failed to start generation:", err);
      setProgressStep(null);
      alert(`Virhe: ${err.message || "Tuntematon virhe"}`);
      setIsGenerating(false);
    }
  };

  const parsedSummary = finalSummary || completion ? parseSummary(finalSummary || completion) : null;

  return (
    <div className="space-y-4">
      {/* Existing Summary or Streaming Summary */}
      {(finalSummary || completion) && (
        <>
          {/* Bulletin Board */}
          {parsedSummary && (
            <div className="flex justify-center">
              <BulletinBoard
                summary={parsedSummary}
                billId={billParliamentId || billId}
                billTitle={billTitle}
              />
            </div>
          )}

          {/* Summary Text */}
          <div className="bg-nordic-light rounded-2xl p-6 border-2 border-nordic-blue">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-nordic-blue" />
              <h3 className="text-lg font-semibold text-nordic-darker tracking-tight">
                Selkokielinen tiivistelmä
              </h3>
              {isLoading && (
                <Loader2 size={16} className="animate-spin text-nordic-blue" />
              )}
              {!isLoading && finalSummary && (
                <CheckCircle size={16} className="text-green-600" />
              )}
            </div>
            
            {/* Progress Step Indicator */}
            {progressStep && (
              <div className="mb-4 p-3 bg-nordic-blue/10 border border-nordic-blue/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-nordic-darker">
                  {progressStep.startsWith("✅") ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : progressStep.startsWith("⚠️") ? (
                    <AlertCircle size={16} className="text-amber-600" />
                  ) : (
                    <Loader2 size={16} className="animate-spin text-nordic-blue" />
                  )}
                  <span>{progressStep}</span>
                </div>
              </div>
            )}
            
            <div className="text-base text-nordic-darker whitespace-pre-line leading-relaxed">
              {finalSummary || completion}
              {isLoading && (
                <span className="inline-block w-2 h-4 bg-nordic-blue ml-1 animate-pulse" />
              )}
            </div>
          </div>
        </>
      )}

      {/* Generate Button (if no summary exists, or if existingSummary is too long = raw text) */}
      {(!finalSummary && !completion) && (!existingSummary || (existingSummary && existingSummary.length > 50000)) && (
        <div className="bg-nordic-light rounded-2xl p-6 border-2 border-nordic-blue text-center">
          <p className="text-base text-nordic-dark mb-4">
            {existingSummary && existingSummary.length > 50000 
              ? "Lakiteksti on saatavilla, mutta selkokielinen tiivistelmä puuttuu. Generoi se AI:lla."
              : "Tämä laki ei vielä ole selkokielinen tiivistelmä. Generoi se AI:lla."}
          </p>
          
          {/* Progress Step Indicator (shown during generation) */}
          {progressStep && (
            <div className="mb-4 p-3 bg-nordic-blue/10 border border-nordic-blue/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-nordic-darker">
                {progressStep.startsWith("✅") ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : progressStep.startsWith("⚠️") ? (
                  <AlertCircle size={16} className="text-amber-600" />
                ) : (
                  <Loader2 size={16} className="animate-spin text-nordic-blue" />
                )}
                <span>{progressStep}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleGenerate}
            disabled={isLoading || isGenerating}
            className="px-6 py-3 bg-nordic-blue text-white rounded-xl hover:bg-nordic-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto min-h-[48px]"
          >
            {isLoading || isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generoidaan...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generoi AI-tiivistelmä</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Virhe:</strong> {error.message || "Tuntematon virhe generoinnissa"}
          </p>
          <p className="text-xs text-red-600 mt-2">
            Varmista että OPENAI_API_KEY on asetettu .env.local tiedostossa.
          </p>
        </div>
      )}
    </div>
  );
}

