"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMunicipalCases } from "@/app/actions/municipal";
import type { MunicipalCase, UserProfile } from "@/lib/types";
import MunicipalDecisionCard from "./MunicipalDecisionCard";
import MunicipalCaseDetail from "./MunicipalCaseDetail";
import { Loader2, RefreshCw, Sparkles, MapPin, Building2, ChevronRight, Calendar } from "lucide-react";

interface MunicipalDashboardProps {
  user: UserProfile | null;
  initialMunicipality?: string;
}

export default function MunicipalDashboard({ user, initialMunicipality = "Espoo" }: MunicipalDashboardProps) {
  const [cases, setCases] = useState<MunicipalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<MunicipalCase | null>(null);

  const loadCases = async (muni: string) => {
    try {
      setLoading(true);
      const data = await fetchMunicipalCases(muni);
      setCases(data);
    } catch (error) {
      console.error("Failed to load cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases(initialMunicipality);
  }, [initialMunicipality]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-command-neon" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-command-neon/10 rounded-full border border-command-neon/20">
          <Building2 size={12} className="text-command-neon" />
          <span className="text-[10px] font-black uppercase tracking-widest text-command-neon">{initialMunicipality} Kuntavahti</span>
        </div>
        <button onClick={() => loadCases(initialMunicipality)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-command-gray">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid gap-4">
        {cases.map((item, index) => {
          const isAI = item.summary && (item.summary.length > 500 || item.summary.includes("###"));
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedCase(item)}
              className="bg-command-bg border border-white/5 p-5 rounded-2xl cursor-pointer hover:border-command-neon/30 transition-all group relative overflow-hidden"
            >
              {isAI && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-command-emerald/10 text-command-emerald text-[8px] font-black rounded-bl-lg uppercase tracking-tighter">
                    <Sparkles size={8} />
                    <span>Local AI Analyzed</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-command-gray text-[8px] font-black uppercase tracking-widest">
                      {item.status}
                    </span>
                    {item.meetingDate && (
                      <span className="text-[9px] font-bold text-command-gray flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(item.meetingDate).toLocaleDateString('fi-FI')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-command-neon transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-command-gray line-clamp-2 mt-2 leading-relaxed opacity-80">
                    {item.summary?.substring(0, 120)}...
                  </p>
                </div>
                <div className="self-center">
                  <ChevronRight size={20} className="text-command-gray group-hover:text-command-neon group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCase && (
          <MunicipalCaseDetail item={selectedCase} onClose={() => setSelectedCase(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
