"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, MessageSquare, AlertCircle, TrendingUp, Info, ChevronRight, X } from "lucide-react";
import MPDebateArena from "./MPDebateArena";

interface Hotspot {
  topic: string;
  argument_pro: string;
  argument_con: string;
  reasoning: string;
}

interface BillHeatmapProps {
  billId: string;
  billTitle: string;
  sourceText?: string;
  suggestedMpId?: string;
}

export default function BillHeatmap({ billId, billTitle, sourceText, suggestedMpId }: BillHeatmapProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [showArena, setShowArena] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/bills/${billId}/ai-profile`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (e) {
        console.error("Failed to fetch bill AI profile:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [billId]);

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-white/5 rounded w-3/4"></div>
      <div className="h-20 bg-white/5 rounded w-full"></div>
    </div>
  );

  if (!profile || !profile.hotspots) return null;

  return (
    <div className="space-y-8">
      {/* Audience Hook */}
      <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 shrink-0">
          <Info size={20} />
        </div>
        <p className="text-sm font-bold text-slate-200 leading-relaxed italic italic">
          "{profile.audience_hook}"
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profile.hotspots.map((h: Hotspot, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveHotspot(h)}
            className="group cursor-pointer bg-slate-900 border border-white/5 p-6 rounded-[2rem] hover:border-orange-500/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all">
              <Flame size={40} className="text-orange-500" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2 text-orange-400">
                <Flame size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hotspot {i+1}</span>
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight text-white">{h.topic}</h4>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{h.reasoning}</p>
              
              <div className="flex items-center gap-2 pt-2 text-[10px] font-black uppercase text-purple-400 group-hover:translate-x-1 transition-transform">
                Lue analyysi
                <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hotspot Detail Modal / Sidebar */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-orange-400">
                  <Flame size={24} />
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">{activeHotspot.topic}</h3>
                </div>
                <button 
                  onClick={() => setActiveHotspot(null)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={24} className="text-slate-500" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Miksi tämä on kiistanalainen?</p>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{activeHotspot.reasoning}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Oikeisto / Liberaalit</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeHotspot.argument_pro}</p>
                  </div>
                  <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-400">Vasemmisto / Konservatiivit</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeHotspot.argument_con}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setShowArena(true)}
                    className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3"
                  >
                    <MessageSquare size={18} fill="currentColor" />
                    Haasta edustaja tästä aiheesta
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arena Modal */}
      <AnimatePresence>
        {showArena && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
          >
            <div className="w-full max-w-4xl h-[800px] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-white font-black uppercase tracking-tighter text-2xl">Väittely: {activeHotspot?.topic}</h2>
                <button 
                  onClick={() => setShowArena(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-[10px] transition-all"
                >
                  Lopeta väittely
                </button>
              </div>
              <div className="flex-1">
                <MPDebateArena 
                  mpId={suggestedMpId || "any"} 
                  mpName={suggestedMpId ? "Kansanedustaja" : "Poliittinen AI"} 
                  party="DD"
                  billId={billId}
                  initialMessage={`Haluaisin keskustella tästä lakiesityksestä (${billTitle}), erityisesti kohdasta: ${activeHotspot?.topic}. Mitä mieltä olet tästä?`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

