"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMunicipalDecisions } from "@/app/actions/municipal";
import type { UserProfile } from "@/lib/types";
import { Loader2, RefreshCw, Building2, ChevronRight, Calendar, MapPin } from "lucide-react";

interface MunicipalDashboardProps {
  user: UserProfile | null;
  initialMunicipality?: string;
}

export default function MunicipalDashboard({ user, initialMunicipality = "Helsinki" }: MunicipalDashboardProps) {
  const [municipality, setMunicipality] = useState(initialMunicipality);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCases = async (muni: string) => {
    try {
      setLoading(true);
      const data = await fetchMunicipalDecisions(muni);
      setCases(data);
    } catch (error) {
      console.error("Failed to load cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases(municipality);
  }, [municipality]);

  const cities = ["Helsinki", "Espoo", "Vantaa"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent-primary)]/10 rounded-full border border-[var(--accent-primary)]/20">
            <Building2 size={12} className="text-[var(--accent-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">Kuntavahti</span>
          </div>
          
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setMunicipality(city)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  municipality === city 
                    ? "bg-white dark:bg-white/10 text-command-dark dark:text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => loadCases(municipality)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-command-neon" size={32} /></div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ei esityksiä löytynyt kaupungille {municipality}</p>
          </div>
        ) : (
          cases.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 p-6 rounded-3xl cursor-pointer hover:border-[var(--accent-primary)]/30 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-widest">
                      {item.status || "OPEN"}
                    </span>
                    {item.decision_date && (
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(item.decision_date).toLocaleDateString('fi-FI')}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-[var(--accent-primary)] opacity-60 uppercase tracking-widest ml-auto">
                      {item.proposer}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-command-dark dark:text-white group-hover:text-[var(--accent-primary)] transition-colors leading-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.content_summary}
                  </p>
                </div>
                <div className="self-center">
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
