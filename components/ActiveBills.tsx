"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import type { Bill, UserProfile } from "@/lib/types";
import { syncBillsFromEduskunta } from "@/app/actions/sync-bills";
import BillDetail from "./BillDetail";
import { Loader2, RefreshCw, Database, Sparkles, Calendar, ChevronRight } from "lucide-react";

interface ActiveBillsProps {
  user: UserProfile | null;
}

export default function ActiveBills({ user }: ActiveBillsProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await fetchBillsFromSupabase();
      setBills(data);
    } catch (err: any) {
      console.error("Failed to load bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-command-neon" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-command-emerald/10 rounded-full border border-command-emerald/20">
          <div className="w-1.5 h-1.5 rounded-full bg-command-emerald animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-command-emerald">System Live</span>
        </div>
        <div className="flex gap-2">
          <button onClick={loadBills} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-command-gray"><Database size={16} /></button>
          <button onClick={() => {}} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-command-gray"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="grid gap-4">
        {bills.slice(0, 8).map((bill, index) => {
          const isAI = bill.summary && (bill.summary.length > 800 || bill.summary.includes("###"));
          
          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedBill(bill)}
              className="bg-command-bg border border-white/5 p-5 rounded-2xl cursor-pointer hover:border-command-neon/30 transition-all group relative overflow-hidden"
            >
              {isAI && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-command-neon/10 text-command-neon text-[8px] font-black rounded-bl-lg uppercase tracking-tighter">
                    <Sparkles size={8} />
                    <span>AI Enhanced</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      bill.status === 'voting' ? 'bg-command-neon text-command-bg' : 'bg-white/10 text-command-gray'
                    }`}>
                      {bill.status}
                    </span>
                    {bill.publishedDate && (
                      <span className="text-[9px] font-bold text-command-gray flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(bill.publishedDate).toLocaleDateString('fi-FI')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-command-neon transition-colors truncate">
                    {bill.title}
                  </h3>
                  <p className="text-xs text-command-gray line-clamp-2 mt-2 leading-relaxed opacity-80">
                    {bill.summary?.substring(0, 120)}...
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
        {selectedBill && (
          <BillDetail bill={selectedBill} onClose={() => setSelectedBill(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
