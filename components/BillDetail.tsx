"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw, AlertCircle, CheckCircle, Database, Radio, ShieldCheck, Zap, ThumbsUp, CloudSun, Flame } from "lucide-react";
import type { Bill, VoteStats, IntegrityAlert } from "@/lib/types";
import { regenerateBillSummary } from "@/app/actions/process-bill";
import { getIntegrityAlertsForEvent } from "@/lib/actions/promise-actions";
import StreamingSummary from "./StreamingSummary";
import ComparisonMirror from "./ComparisonMirror";
import VoteButton from "./VoteButton";
import BillHeatmap from "./BillHeatmap";
import { getVoteStats } from "@/app/actions/votes";
import { trackEngagement, confirmAlert } from "@/app/actions/dna";
import Link from "next/link";

interface BillDetailProps {
  bill: Bill;
  onClose: () => void;
}

export default function BillDetail({ bill, onClose }: BillDetailProps) {
  const [savedSummary, setSavedSummary] = useState<string | null>(bill.summary || null);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<IntegrityAlert[]>([]);
  const [processing, setProcessing] = useState(false);
  const [confirmedAlerts, setConfirmedAlerts] = useState<Set<string>>(new Set());

  const handleConfirmAlert = async (alertId: string) => {
    if (confirmedAlerts.has(alertId)) return;
    const result = await confirmAlert(alertId);
    if (result.success) {
      setConfirmedAlerts(prev => new Set([...Array.from(prev), alertId]));
      alert(result.message);
    }
  };

  useEffect(() => {
    getVoteStats(bill.id).then(setVoteStats);
    
    if (bill.parliamentId) {
      getIntegrityAlertsForEvent(bill.parliamentId).then(setAlerts);
    }
    
    // Track engagement
    const startTime = Date.now();
    return () => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      trackEngagement(bill.id, durationSeconds);
    };
  }, [bill.id, bill.parliamentId]);

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
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] relative custom-scrollbar"
      >
        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">{bill.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">{bill.parliamentId || "Eduskunta"}</p>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">Suora datavirta</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/ennusteet/${bill.id}`}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-xl shadow-purple-600/20 active:scale-95"
            >
              <CloudSun size={14} />
              <span>Sääennuste</span>
            </Link>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-500">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-12 space-y-16">
          {/* AI Sector */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">AI-analyytikko</h3>
            </div>
            <div className="bg-slate-800/30 border border-white/5 p-8 rounded-[2rem] shadow-inner">
              <StreamingSummary
                billId={bill.id}
                existingSummary={savedSummary}
                billParliamentId={bill.parliamentId}
                billTitle={bill.title}
                publishedDate={bill.publishedDate}
                onSummaryComplete={setSavedSummary}
              />
              <div className="mt-8 pt-8 border-t border-white/5">
                <button 
                  onClick={handleRegenerate}
                  disabled={processing}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 text-slate-400 group"
                >
                  <RefreshCw size={14} className={`${processing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Päivitä AI-analyysi
                </button>
              </div>
            </div>
          </div>

          {/* Hotspots Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-orange-400">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Flame size={20} className="animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Poliittiset Hotspotit</h3>
            </div>
            <BillHeatmap billId={bill.id} billTitle={bill.title} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mirror Sector */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <RefreshCw size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Demokratiamittari</h3>
              </div>
              <div className="bg-slate-800/30 border border-white/5 p-8 rounded-[2rem] h-full flex items-center">
                <ComparisonMirror
                  parliamentVote={politicalForPercent}
                  citizenVote={voteStats ? voteStats.for_percent : bill.citizenPulse.for}
                  billName={bill.title}
                />
              </div>
            </div>

            {/* Arena Sector */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Vaikutusareena</h3>
              </div>
              <div className="bg-slate-900 border border-purple-500/20 p-10 rounded-[2rem] shadow-[0_0_30px_rgba(168,85,247,0.1)] h-full flex flex-col justify-center">
                <div className="text-center mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Sinun vaikutuksesi</p>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">VAIKUTA NYT</h4>
                </div>
                <VoteButton billId={bill.id} onVoteChange={() => getVoteStats(bill.id).then(setVoteStats)} />
              </div>
            </div>
          </div>

          {/* Promise Watch Sector */}
          {alerts.length > 0 && (
            <div className="space-y-8 pt-16 border-t border-white/5">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Vaalilupaus-vahti</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="bg-slate-800/50 border border-white/5 p-6 rounded-[1.5rem] space-y-6 hover:border-amber-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${alert.severity === 'high' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {alert.severity === 'high' ? 'Takinkääntö' : 'Poikkeama'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">{alert.category}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Lupaus (Vaalikone)</span>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${alert.promise_value > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '100%' }} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Toteutus (Äänestys)</span>
                        <div className={`px-3 py-2 rounded-xl text-center font-black uppercase text-xs border ${alert.vote_type === 'jaa' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          {alert.vote_type === 'jaa' ? 'Äänesti: JAA' : 'Äänesti: EI'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <button
                        onClick={() => handleConfirmAlert(alert.id)}
                        disabled={confirmedAlerts.has(alert.id)}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg ${
                          confirmedAlerts.has(alert.id)
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10"
                            : "bg-amber-500 hover:bg-amber-400 border-amber-600 text-slate-950 shadow-amber-500/20 active:scale-95"
                        }`}
                      >
                        {confirmedAlerts.has(alert.id) ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Vahvistettu</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp size={14} className="fill-current" />
                            <span>Vahvista (+5 XP)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
