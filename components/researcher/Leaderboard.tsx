"use client";

import { motion } from "framer-motion";
import { Trophy, ArrowUpRight, Target, FileText, Users } from "lucide-react";
import { LobbyistStats } from "@/lib/types";

interface LeaderboardProps {
  stats: LobbyistStats[];
}

export default function Leaderboard({ stats }: LeaderboardProps) {
  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="text-yellow-500" size={24} />
        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Top 5 Lobbarit</h3>
      </div>

      <div className="space-y-4">
        {stats.slice(0, 5).map((org, i) => (
          <motion.div
            key={org.organization_name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-white/10">
                #{i + 1}
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm group-hover:text-cyan-400 transition-colors">
                  {org.organization_name}
                </h4>
                <div className="flex gap-3 mt-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                    <FileText size={10} /> {org.bills_count} Lakia
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-rose-400/70 uppercase">
                    <Users size={10} /> {org.direct_contacts} Tapaamista
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-500/70 uppercase">
                    <Target size={10} /> {org.main_committee}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-white flex items-center gap-1">
                {org.influence_index}
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Vaikutusindeksi
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

