"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw, Building2, MapPin, Wallet } from "lucide-react";
import type { MunicipalCase } from "@/lib/types";
import { processMunicipalCaseToSelkokieli } from "@/app/actions/process-municipal";
import StreamingSummary from "./StreamingSummary";
import ComparisonMirror from "./ComparisonMirror";
import VoteButton from "./VoteButton";
import { addDNAPoints, trackEngagement } from "@/app/actions/dna";

interface MunicipalCaseDetailProps {
  item: MunicipalCase;
  onClose: () => void;
}

export default function MunicipalCaseDetail({ item, onClose }: MunicipalCaseDetailProps) {
  const [savedSummary, setSavedSummary] = useState<string | null>(item.summary || null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Track engagement and add local_hero points
    const startTime = Date.now();
    addDNAPoints("local_hero", 1); // Opening a municipal case gives 1 point

    return () => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      if (durationSeconds > 30) {
        addDNAPoints("local_hero", 2);
      }
    };
  }, [item.id]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await processMunicipalCaseToSelkokieli(item.id);
      if (result.success && result.summary) setSavedSummary(result.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

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
            <div className="w-10 h-10 bg-command-emerald/10 rounded-xl flex items-center justify-center text-command-emerald">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">{item.title}</h2>
              <p className="text-command-gray text-[10px] font-bold uppercase tracking-widest">{item.municipality} Kuntavahti</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-command-gray">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-12">
          {/* Metadata Sector */}
          <div className="flex flex-wrap gap-6">
            {item.neighborhood && (
              <div className="flex items-center gap-2 px-4 py-2 bg-command-bg rounded-xl border border-white/5">
                <MapPin size={14} className="text-command-rose" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.neighborhood}</span>
              </div>
            )}
            {item.costEstimate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-command-bg rounded-xl border border-white/5">
                <Wallet size={14} className="text-command-emerald" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.costEstimate.toLocaleString()} €</span>
              </div>
            )}
          </div>

          {/* AI Sector */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-command-emerald neon-text">
              <Sparkles size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">Local AI Intelligence</h3>
            </div>
            <StreamingSummary
              billId={item.id}
              existingSummary={savedSummary}
              billTitle={item.title}
              publishedDate={item.meetingDate}
              context="municipal"
              onSummaryComplete={setSavedSummary}
            />
            <button 
              onClick={handleProcess}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 text-command-gray"
            >
              {processing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Päivitä paikallinen analyysi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-command-rose neon-text">
                <RefreshCw size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Decision Mirror</h3>
              </div>
              <ComparisonMirror
                parliamentVote={55} // Mock council vote
                citizenVote={item.citizenPulse.for}
                billName={item.title}
                isMunicipal={true}
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-command-neon neon-text">
                <Building2 size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">The Arena</h3>
              </div>
              <div className="bg-command-bg border border-white/5 p-8 rounded-3xl shadow-inner">
                <VoteButton billId={item.id} isMunicipal={true} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
