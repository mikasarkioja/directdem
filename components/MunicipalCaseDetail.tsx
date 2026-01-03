"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, RefreshCw, AlertCircle, CheckCircle, MapPin, Wallet } from "lucide-react";
import type { MunicipalCase } from "@/lib/types";
import StreamingSummary from "./StreamingSummary";
import ComparisonMirror from "./ComparisonMirror";
import VoteButton from "./VoteButton";
import { processMunicipalCaseToSelkokieli } from "@/app/actions/process-municipal";

interface MunicipalCaseDetailProps {
  item: MunicipalCase;
  onClose: () => void;
}

export default function MunicipalCaseDetail({ item, onClose }: MunicipalCaseDetailProps) {
  const [processing, setProcessing] = useState(false);
  const [savedSummary, setSavedSummary] = useState<string | null>(item.summary || null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  useEffect(() => {
    setSavedSummary(item.summary || null);
  }, [item]);

  const handleProcess = async () => {
    setProcessing(true);
    setProgressMessage("Analysoidaan paikallisia vaikutuksia...");
    
    try {
      const result = await processMunicipalCaseToSelkokieli(item.id);
      
      if (result.success && result.summary) {
        setSavedSummary(result.summary);
        setProgressMessage("✅ Analyysi valmis!");
        setTimeout(() => setProgressMessage(null), 3000);
      } else {
        setProgressMessage(`⚠️ Virhe: ${result.error}`);
        setTimeout(() => setProgressMessage(null), 3000);
      }
    } catch (error: any) {
      setProgressMessage("⚠️ Odottamaton virhe.");
      setTimeout(() => setProgressMessage(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] md:max-h-[95vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-nordic-gray p-6 rounded-t-3xl flex justify-between items-start z-10">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
              <span className="px-2 py-1 bg-nordic-blue text-white text-[10px] font-bold rounded uppercase self-start">
                {item.municipality}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-nordic-darker tracking-tight">{item.title}</h2>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-nordic-dark">
              {item.orgName && <span className="font-bold">{item.orgName}</span>}
              {item.neighborhood && <span className="flex items-center gap-1"><MapPin size={12} /> {item.neighborhood}</span>}
              {item.costEstimate && <span className="flex items-center gap-1"><Wallet size={12} /> {item.costEstimate.toLocaleString()} €</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-nordic-dark hover:text-nordic-darker ml-4">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 pb-24 md:pb-8">
          {/* AI Summary */}
          <StreamingSummary
            billId={item.id}
            existingSummary={savedSummary}
            billParliamentId={item.externalId}
            billTitle={item.title}
            publishedDate={item.meetingDate}
            context="municipal"
            onSummaryComplete={setSavedSummary}
          />

          {/* Voting Section */}
          <div className="bg-white rounded-2xl p-6 border-2 border-nordic-blue">
            <h3 className="text-lg font-semibold text-nordic-darker mb-4">Mitä mieltä olet?</h3>
            <VoteButton
              billId={item.id}
              // Note: Reuse VoteButton, might need to adapt for municipal_votes table later
              onVoteChange={() => {}} 
            />
          </div>

          {/* Actions */}
          <div className="bg-nordic-light rounded-2xl p-4 border border-nordic-gray">
            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full px-4 py-3 bg-nordic-blue text-white rounded-xl hover:bg-nordic-deep transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span>{progressMessage || "Päivitä AI-Analyysi (Paikalliset vaikutukset)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

