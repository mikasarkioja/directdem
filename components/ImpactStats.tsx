"use client";

import { motion } from "framer-motion";
import { Zap, Target, TrendingUp, Award } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Impact Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Zap size={16} className="text-command-neon" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-command-gray opacity-80">Impact Points (IP)</p>
          </div>
          <h3 className="text-4xl font-black text-command-dark tracking-tight">{impactPoints.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-command-emerald text-xs font-bold bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <TrendingUp size={14} />
            <span>+12% vs last week</span>
          </div>
        </div>
      </motion.div>

      {/* Democracy Gap Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Target size={16} className="text-command-rose" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-command-gray opacity-80">Democracy Gap Reduced</p>
          </div>
          <h3 className="text-4xl font-black text-command-rose tracking-tight">{democracyGapReduced}%</h3>
          <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Award size={16} className="text-command-emerald" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-command-gray opacity-80">Level {level} — Kansalaisaktiivi</p>
          </div>
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-2xl font-black text-command-dark tracking-tight">Level Up Soon</h3>
            <p className="text-command-gray text-[10px] font-bold uppercase">{xp} / {nextLevelXp} XP</p>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
