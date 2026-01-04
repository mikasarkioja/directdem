"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { getIntegrityAlertsForEvent } from "@/lib/actions/promise-actions";
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
      
      // Fetch alerts for all bills
      const alertMap: Record<string, IntegrityAlert[]> = {};
      for (const bill of data) {
        if (bill.parliamentId) {
          const billAlerts = await getIntegrityAlertsForEvent(bill.parliamentId);
          if (billAlerts.length > 0) {
            alertMap[bill.parliamentId] = billAlerts;
          }
        }
      }
      setAlerts(alertMap);
    } catch (err: any) {
      console.error("Failed to load bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-command-neon" size={24} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-command-emerald" />
          <span className="text-[10px] font-black uppercase tracking-widest text-command-emerald">System Operational</span>
        </div>
        <div className="flex gap-1">
          <button onClick={loadBills} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400" title="Refresh Data"><Database size={14} /></button>
        </div>
      </div>

      <div className="grid gap-4">
        {bills.slice(0, 30).map((bill, index) => {
          const isAI = bill.summary && (bill.summary.length > 800 || bill.summary.includes("###"));
          const billAlerts = bill.parliamentId ? alerts[bill.parliamentId] : [];
          const highSeverityCount = billAlerts?.filter(a => a.severity === 'high').length || 0;
          const mediumSeverityCount = billAlerts?.filter(a => a.severity === 'medium').length || 0;
          
          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedBill(bill)}
              className="bg-white border border-slate-100 p-6 rounded-2xl cursor-pointer hover:border-command-neon/30 hover:shadow-md transition-all group relative"
            >
              {isAI && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-command-neon text-[8px] font-black rounded-bl-lg uppercase tracking-tight border-l border-b border-blue-100">
                    <Sparkles size={8} />
                    <span>AI Enhanced</span>
                  </div>
                </div>
              )}

              {billAlerts && billAlerts.length > 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${
                    highSeverityCount > 0 
                      ? "bg-rose-500 text-white border-rose-600" 
                      : mediumSeverityCount > 0
                        ? "bg-amber-500 text-white border-amber-600"
                        : "bg-emerald-500 text-white border-emerald-600"
                  }`}>
                    {highSeverityCount > 0 ? <Zap size={10} /> : mediumSeverityCount > 0 ? <AlertCircle size={10} /> : <ShieldCheck size={10} />}
                    <span>
                      {highSeverityCount > 0 ? 'Takinkääntö havaittu' : mediumSeverityCount > 0 ? 'Poikkeama havaittu' : 'Lupauksen mukainen'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      bill.status === 'voting' ? 'bg-command-neon text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {bill.status}
                    </span>
                    {bill.publishedDate && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(bill.publishedDate).toLocaleDateString('fi-FI')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-command-dark group-hover:text-command-neon transition-colors leading-tight mb-2">
                    {bill.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {bill.summary?.substring(0, 120)}...
                  </p>
                </div>
                <div className="self-center">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-command-neon group-hover:translate-x-0.5 transition-all" />
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
