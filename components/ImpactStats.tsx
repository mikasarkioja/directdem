"use client";

import { motion } from "framer-motion";
import { Zap, Target, TrendingUp } from "lucide-react";

interface ImpactStatsProps {
  impactPoints: number;
  democracyGapReduced: number; // Percentage 0-100
  level: number;
  xp: number;
  nextLevelXp: number;
}

export default function ImpactStats({
  impactPoints,
  democracyGapReduced,
  level,
  xp,
  nextLevelXp,
}: ImpactStatsProps) {
  const xpPercentage = (xp / nextLevelXp) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Impact Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-command-card p-6 rounded-2xl border border-command-neon/20 shadow-lg relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap size={64} className="text-command-neon" />
        </div>
        <div className="relative z-10">
          <p className="text-command-gray text-xs font-black uppercase tracking-widest mb-1">Impact Points (IP)</p>
          <h3 className="text-4xl font-black text-command-neon neon-text">{impactPoints.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-command-emerald text-xs font-bold">
            <TrendingUp size={14} />
            <span>+12% vs viime viikko</span>
          </div>
        </div>
      </motion.div>

      {/* Democracy Gap Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-command-card p-6 rounded-2xl border border-command-rose/20 shadow-lg relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Target size={64} className="text-command-rose" />
        </div>
        <div className="relative z-10">
          <p className="text-command-gray text-xs font-black uppercase tracking-widest mb-1">Demokratia-vajeen kaventaminen</p>
          <h3 className="text-4xl font-black text-command-rose neon-text">{democracyGapReduced}%</h3>
          <div className="mt-4 h-2 bg-command-bg rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${democracyGapReduced}%` }}
              className="h-full bg-command-rose"
            />
          </div>
        </div>
      </motion.div>

      {/* Level / XP Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-command-card p-6 rounded-2xl border border-command-emerald/20 shadow-lg relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-1">
            <p className="text-command-gray text-xs font-black uppercase tracking-widest">Taso {level}</p>
            <p className="text-command-emerald text-[10px] font-bold">{xp} / {nextLevelXp} XP</p>
          </div>
          <h3 className="text-4xl font-black text-command-emerald neon-text">Kansalaisaktiivi</h3>
          <div className="mt-4 h-2 bg-command-bg rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              className="h-full bg-command-emerald"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

