"use client";

import React, { useState, useEffect } from "react";
import { fetchMunicipalWatchFeed, MunicipalWatchItem } from "@/app/actions/municipal-watch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Calendar, 
  ExternalLink, 
  AlertTriangle, 
  User, 
  MapPin, 
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  ChevronLeft,
  Flame,
  Zap
} from "lucide-react";
import MunicipalDetail from "./MunicipalDetail";

export default function MunicipalWatchFeed() {
  const [items, setItems] = useState<MunicipalWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Kaikki");
  const [selectedItem, setSelectedItem] = useState<MunicipalWatchItem | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchMunicipalWatchFeed();
      setItems(data);
      setLoading(false);
    }
    load();
  }, []);

  const filteredItems = filter === "Kaikki" 
    ? items 
    : items.filter(i => i.municipality === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ladataan Kuntavahti-syötettä...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {selectedItem && (
            <button 
              onClick={() => setSelectedItem(null)}
              className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
              {selectedItem ? "AI Analyysi" : "Kuntavahti 2025"}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {selectedItem ? selectedItem.municipality : "Seurannassa Espoo, Helsinki ja Vantaa"}
            </p>
          </div>
        </div>
        
        {!selectedItem && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {["Kaikki", "Espoo", "Helsinki", "Vantaa"].map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === m 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feed Items or Selected Detail Modal */}
      <div className="space-y-8">
        <AnimatePresence>
          {selectedItem && (
            <MunicipalDetail 
              item={selectedItem} 
              onClose={() => setSelectedItem(null)} 
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-6">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className={`group relative bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 hover:border-purple-500/30 transition-all overflow-hidden cursor-pointer`}
            >
              {/* Background gradient for items with flips */}
              {item.flips && item.flips.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
              )}

              <div className="relative z-10 space-y-6">
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <MapPin size={12} />
                    {item.municipality}
                  </div>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={12} />
                    {new Date(item.meeting_date).toLocaleDateString("fi-FI")}
                  </div>
                  {item.flips && item.flips.length > 0 && (
                    <>
                      <div className="w-1 h-1 bg-white/10 rounded-full" />
                      <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
                        <AlertTriangle size={12} />
                        Takinkääntö havaittu
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-purple-400 transition-colors flex-1">
                      {item.meeting_title}
                    </h3>
                    {item.ai_summary?.friction_index !== undefined && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <Flame size={12} className={item.ai_summary.friction_index > 60 ? "text-orange-500" : "text-slate-600"} />
                          Kitka
                        </div>
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.ai_summary.friction_index}%` }}
                            className={`h-full ${
                              item.ai_summary.friction_index > 70 ? "bg-rose-500" : 
                              item.ai_summary.friction_index > 40 ? "bg-orange-500" : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium line-clamp-3">
                    {item.ai_summary?.summary || "Klikkaa avataksesi esitys ja generoi tekoäly-analyysi."}
                  </p>
                </div>

                {/* Flip details */}
                {item.flips && item.flips.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400">
                      <AlertTriangle size={14} />
                      Ristiriita vaalilupausten kanssa
                    </div>
                    {item.flips.map((flip, fIdx) => (
                      <div key={fIdx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{flip.councilor_name} ({flip.councilor_party})</span>
                          <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase">
                            {flip.axis}
                          </div>
                        </div>
                        <p className="text-xs text-rose-300/80 font-medium italic">"{flip.description}"</p>
                        <div className="flex items-center gap-4 pt-1">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-slate-500 leading-none">Lupaus (DNA)</p>
                            <p className="text-xs font-black text-emerald-400">{(flip.promise_score > 0 ? "+" : "") + flip.promise_score.toFixed(1)}</p>
                          </div>
                          <ArrowRight size={12} className="text-slate-700" />
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-slate-500 leading-none">Teon vaikutus</p>
                            <p className="text-xs font-black text-rose-400">{(flip.action_impact > 0 ? "+" : "") + flip.action_impact.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    {item.ai_summary.mentioned_councilors?.slice(0, 3).map((name, i) => (
                      <div key={i} className="w-8 h-8 bg-slate-800 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase" title={name}>
                        {name.charAt(0)}
                      </div>
                    ))}
                    {(item.ai_summary.mentioned_councilors?.length || 0) > 3 && (
                      <div className="w-8 h-8 bg-slate-800 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                        +{(item.ai_summary.mentioned_councilors?.length || 0) - 3}
                      </div>
                    )}
                  </div>

                  <a 
                    href={item.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                  >
                    Lue koko pöytäkirja
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-slate-900/30 border border-dashed border-white/5 rounded-[3rem]">
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Ei uusia päätöksiä tällä suodatuksella.</p>
          </div>
        )}
      </div>
    </div>
  );
}

