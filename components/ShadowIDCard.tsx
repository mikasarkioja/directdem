"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, User, Briefcase, Award, Zap, Radio } from "lucide-react";
import type { UserProfile } from "@/lib/types";

interface ShadowIDCardProps {
  user: UserProfile;
}

export default function ShadowIDCard({ user }: ShadowIDCardProps) {
  // Determine committee based on highest DNA score (placeholder logic)
  const getCommittee = (user: UserProfile) => {
    if (user.committee_assignment) return user.committee_assignment;
    
    const scores = [
      { name: "Talousvaliokunta", val: Math.abs(user.economic_score || 0) },
      { name: "Sivistysvaliokunta", val: Math.abs(user.liberal_conservative_score || 0) },
      { name: "Ympäristövaliokunta", val: Math.abs(user.environmental_score || 0) },
      { name: "Hallintovaliokunta", val: Math.abs(user.urban_rural_score || 0) },
      { name: "Ulkoasiainvaliokunta", val: Math.abs(user.international_national_score || 0) },
      { name: "Puolustusvaliokunta", val: Math.abs(user.security_score || 0) },
    ].sort((a, b) => b.val - a.val);

    return scores[0].name;
  };

  const committee = getCommittee(user);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-sm aspect-[1.6/1] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden group shadow-2xl"
    >
      {/* Animated background highlights */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700" />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Shield size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Varjokansanedustaja</p>
              <p className="text-xs font-bold text-white/80 tracking-widest">DIGITAALINEN KAKSONEN</p>
            </div>
          </div>
          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black uppercase text-emerald-400 animate-pulse">
            Active session
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden relative">
            <User size={40} className="text-white/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-none">
              {user.full_name?.split(' ')[0]} <br/>
              <span className="text-purple-500">{user.full_name?.split(' ')[1]}</span>
            </h3>
            <div className="flex items-center gap-2">
              <Briefcase size={12} className="text-slate-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{committee}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-4 border-t border-white/5 pt-4">
          <div className="flex gap-4">
            <div className="space-y-0.5 text-center">
              <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Rank</p>
              <p className="text-sm font-black text-white">LVL {user.rank_level || 1}</p>
            </div>
            <div className="space-y-0.5 text-center">
              <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Impact</p>
              <p className="text-sm font-black text-white">{user.impact_points || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
            <Radio size={10} className="text-rose-500 animate-ping" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">ID: {user.shadow_id_number || user.id.substring(0, 8)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

