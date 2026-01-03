"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw, AlertCircle, CheckCircle, Database, Radio } from "lucide-react";
import type { Bill, VoteStats } from "@/lib/types";
import { regenerateBillSummary } from "@/app/actions/process-bill";
import StreamingSummary from "./StreamingSummary";
import ComparisonMirror from "./ComparisonMirror";
import VoteButton from "./VoteButton";
import { getVoteStats } from "@/app/actions/votes";
import { trackEngagement } from "@/app/actions/dna";

interface BillDetailProps {
  bill: Bill;
  onClose: () => void;
}

export default function BillDetail({ bill, onClose }: BillDetailProps) {
  const [savedSummary, setSavedSummary] = useState<string | null>(bill.summary || null);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    getVoteStats(bill.id).then(setVoteStats);
    
    // Track engagement
    const startTime = Date.now();
    return () => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      trackEngagement(bill.id, durationSeconds);
    };
  }, [bill.id]);

  const handleRegenerate = async () => {
    setProcessing(true);
    try {
      const result = await regenerateBillSummary(bill.id);
      if (result.success && result.summary) setSavedSummary(result.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const totalSeats = bill.politicalReality.reduce((sum, p) => sum + p.seats, 0);
  const forSeats = bill.politicalReality.filter((p) => p.position === "for").reduce((sum, p) => sum + p.seats, 0);
  const politicalForPercent = Math.round((forSeats / totalSeats) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-command-bg/90 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-command-card border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar"
      >
        <div className="sticky top-0 bg-command-card/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-command-neon/10 rounded-xl flex items-center justify-center text-command-neon">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">{bill.title}</h2>
              <p className="text-command-gray text-[10px] font-bold uppercase tracking-widest">{bill.parliamentId || "Eduskunta"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-command-gray">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-12">
          {/* AI Sector */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-command-neon neon-text">
              <Sparkles size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">AI Analyst Intelligence</h3>
            </div>
            <StreamingSummary
              billId={bill.id}
              existingSummary={savedSummary}
              billParliamentId={bill.parliamentId}
              billTitle={bill.title}
              publishedDate={bill.publishedDate}
              onSummaryComplete={setSavedSummary}
            />
            <button 
              onClick={handleRegenerate}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 text-command-gray"
            >
              {processing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Uudelleengeneroi analyysi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mirror Sector */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-command-rose neon-text">
                <RefreshCw size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Democracy Mirror</h3>
              </div>
              <ComparisonMirror
                parliamentVote={politicalForPercent}
                citizenVote={voteStats ? voteStats.for_percent : bill.citizenPulse.for}
                billName={bill.title}
              />
            </div>

            {/* Arena Sector */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-command-emerald neon-text">
                <Radio size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">The Arena</h3>
              </div>
              <div className="bg-command-bg border border-white/5 p-8 rounded-3xl shadow-inner">
                <VoteButton billId={bill.id} onVoteChange={() => getVoteStats(bill.id).then(setVoteStats)} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
