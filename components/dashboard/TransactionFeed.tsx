"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Trophy, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Vote, 
  Cpu, 
  LogIn, 
  History,
  ChevronDown
} from "lucide-react";
import { getUserTransactions, Transaction } from "@/app/actions/economy";

/**
 * Simple relative time formatter
 */
function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Juuri nyt";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min sitten`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h sitten`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} pv sitten`;
  
  return date.toLocaleDateString("fi-FI");
}

export default function TransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  const fetchTransactions = async () => {
    try {
      const data = await getUserTransactions(limit);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Refresh periodically or we could use Supabase Realtime here
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  const getIcon = (description: string, actionType: string) => {
    const desc = description.toLowerCase();
    if (desc.includes("äänestys") || desc.includes("vote")) return <Vote size={16} />;
    if (desc.includes("ai") || desc.includes("duel") || desc.includes("haaste")) return <Cpu size={16} />;
    if (desc.includes("kirjautuminen") || desc.includes("login")) return <LogIn size={16} />;
    return actionType === 'EARN' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nordic-blue"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <History className="text-nordic-blue" size={20} />
          <h3 className="font-bold text-nordic-white uppercase tracking-wider text-sm">Tapahtumavirta</h3>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-nordic-gray uppercase font-bold tracking-widest">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        <AnimatePresence initial={false}>
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.action_type === 'EARN' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {getIcon(tx.description, tx.action_type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-nordic-white group-hover:text-white transition-colors">
                      {tx.description}
                    </div>
                    <div className="text-[10px] text-nordic-gray font-bold uppercase tracking-tight">
                      {formatRelativeTime(tx.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className={`text-sm font-black flex items-center gap-1 ${
                    tx.action_type === 'EARN' ? 'text-emerald-400' : 'text-nordic-white'
                  }`}>
                    {tx.action_type === 'EARN' ? '+' : '-'}{tx.amount}
                    {tx.points_type === 'CREDIT' ? (
                      <Zap size={12} className="text-yellow-500" />
                    ) : (
                      <Trophy size={12} className="text-purple-500" />
                    )}
                  </div>
                  <div className="text-[9px] text-nordic-gray font-bold uppercase tracking-widest">
                    {tx.points_type === 'CREDIT' ? 'Krediitit' : 'Maineranking'}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <History size={48} className="text-nordic-gray mb-4" />
              <p className="text-sm text-nordic-gray font-medium">
                Ei vielä tapahtumia. <br />
                Aloita työskentely valiokunnassa ansaitaksesi krediittejä.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Load More */}
      {transactions.length >= limit && (
        <button
          onClick={() => setLimit(prev => prev + 10)}
          className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-nordic-gray hover:text-nordic-white bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border-t border-white/10"
        >
          <ChevronDown size={14} />
          Lataa lisää tapahtumia
        </button>
      )}
    </div>
  );
}

