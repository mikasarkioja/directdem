"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Star } from 'lucide-react';
import { calculateLevel, xpForLevel } from '@/lib/influence/xp-engine';

interface InfluenceStatsProps {
  xp: number;
  level: number;
}

export default function InfluenceStats({ xp, level }: InfluenceStatsProps) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400">
            <Trophy size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Influence Power</h4>
            <p className="text-lg font-black text-white leading-none">Level {level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">{xp} XP</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Total Influence</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress to Level {level + 1}</span>
          <span className="text-[9px] font-black text-white uppercase tracking-widest">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Next Rank</span>
          </div>
          <p className="text-xs font-bold text-white uppercase tracking-tight">
            {level < 5 ? 'Novice' : level < 15 ? 'Advocate' : 'Statesman'}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Star size={12} className="text-purple-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Required</span>
          </div>
          <p className="text-xs font-bold text-white uppercase tracking-tight">
            {nextLevelXp - xp} XP to go
          </p>
        </div>
      </div>
    </div>
  );
}


