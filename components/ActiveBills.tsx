"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { getBatchIntegrityAlerts } from "@/lib/actions/promise-actions";
import type { Bill, UserProfile, IntegrityAlert } from "@/lib/types";
import BillDetail from "./BillDetail";
import { Loader2, RefreshCw, Database, Sparkles, Calendar, ChevronRight, AlertCircle, ShieldCheck, Zap } from "lucide-react";

interface ActiveBillsProps {
  user: UserProfile | null;
}

export default function ActiveBills({ user }: ActiveBillsProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [alerts, setAlerts] = useState<Record<string, IntegrityAlert[]>>({});
  const [loading, setLoading] = useState(true);

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await fetchBillsFromSupabase();
      setBills(data);
      
      // Batch fetch alerts for all bills in one query (MASSIVE performance boost)
      const parliamentIds = data
        .map(b => b.parliamentId)
        .filter((id): id is string => !!id);
      
      if (parliamentIds.length > 0) {
        const alertsMap = await getBatchIntegrityAlerts(parliamentIds);
        setAlerts(alertsMap);
      }
    } catch (err: any) {
      console.error("Failed to load bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] animate-pulse">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-white/5 rounded" />
                  <div className="h-4 w-24 bg-white/5 rounded" />
                </div>
                <div className="h-6 w-3/4 bg-white/5 rounded" />
                <div className="h-4 w-full bg-white/5 rounded" />
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Areena</span>
        </div>
        <div className="flex gap-1">
          <button onClick={loadBills} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500" title="Päivitä tiedot"><Database size={14} /></button>
        </div>
      </div>

      <div className="grid gap-4">
        {bills.map((bill, index) => {
          const isAI = bill.summary && (bill.summary.length > 800 || bill.summary.includes("###"));
          const billAlerts = bill.parliamentId ? alerts[bill.parliamentId] : [];
          const highSeverityCount = billAlerts?.filter(a => a.severity === 'high').length || 0;
          const mediumSeverityCount = billAlerts?.filter(a => a.severity === 'medium').length || 0;
          
          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => setSelectedBill(bill)}
              className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] cursor-pointer hover:border-purple-500/30 hover:bg-slate-800/80 transition-all group relative overflow-hidden"
            >
              {isAI && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[8px] font-black rounded-bl-lg uppercase tracking-tight border-l border-b border-purple-500/20">
                    <Sparkles size={8} />
                    <span>AI-rikastettu</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      bill.status === 'voting' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500'
                    }`}>
                      {bill.status}
                    </span>
                    {bill.publishedDate && (
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(bill.publishedDate).toLocaleDateString('fi-FI')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-purple-400 transition-colors tracking-tight leading-tight mb-2">
                    {bill.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">
                    {bill.summary?.substring(0, 120)}...
                  </p>
                  
                  {billAlerts && billAlerts.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        highSeverityCount > 0 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                          : mediumSeverityCount > 0
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {highSeverityCount > 0 ? <Zap size={10} /> : mediumSeverityCount > 0 ? <AlertCircle size={10} /> : <ShieldCheck size={10} />}
                        <span>
                          {highSeverityCount > 0 ? 'Takinkääntö' : mediumSeverityCount > 0 ? 'Poikkeama' : 'Lupauksen mukainen'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="self-center">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                    <ChevronRight size={18} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedBill && (
          <BillDetail bill={selectedBill} onClose={() => setSelectedBill(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
