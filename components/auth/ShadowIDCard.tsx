"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, User, Briefcase, Award, Zap, Radio, Lock } from "lucide-react";
import type { UserProfile } from "@/lib/types";

interface ShadowIDCardProps {
  user: UserProfile;
}

export default function ShadowIDCard({ user }: ShadowIDCardProps) {
  const hasDna = user.economic_score !== undefined && user.economic_score !== 0;
  const isLocked = !hasDna;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: isLocked ? 0 : -5, transition: { duration: 0.2 } }}
      className={`relative w-full max-w-[280px] aspect-[0.7/1] bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 overflow-hidden shadow-2xl group transition-all duration-500 ${isLocked ? 'grayscale opacity-70' : ''}`}
    >
      {/* Holographic Foil Overlay */}
      {!isLocked && (
        <motion.div 
          animate={{ 
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-overlay"
          style={{
            background: "linear-gradient(135deg, rgba(255,0,255,0.4) 0%, rgba(0,255,255,0.4) 25%, rgba(255,255,0,0.4) 50%, rgba(0,255,255,0.4) 75%, rgba(255,0,255,0.4) 100%)",
            backgroundSize: "400% 400%",
          }}
        />
      )}

      {/* Secondary Iridescent Layer */}
      {!isLocked && (
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -inset-1/2 z-0 pointer-events-none mix-blend-color-dodge"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(168,85,247,0.3), transparent, rgba(56,189,248,0.3), transparent)",
          }}
        />
      )}

      {/* Lock Overlay if no DNA */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-xl">
            <Lock className="text-slate-500 w-8 h-8" />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profiili Lukittu</p>
        </div>
      )}

      {/* Background Cyber Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute top-10 left-0 w-full h-[1px] bg-white/5" />
        <div className="absolute top-20 left-0 w-full h-[1px] bg-white/5" />
        <div className="absolute bottom-10 left-0 w-full h-[1px] bg-white/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_70%)]" />
      </div>

      {/* Card Content */}
      <div className="relative z-10 flex flex-col h-full items-center text-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-purple-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Official ID</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        </div>

        {/* User Photo Placeholder */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-3xl bg-slate-800 border-2 border-white/5 overflow-hidden flex items-center justify-center relative">
            <User size={60} className="text-slate-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            
            {/* Holographic Overlays */}
            <motion.div 
              animate={{ x: [-100, 200] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-purple-600 p-2 rounded-xl shadow-lg border border-white/20">
            <Zap size={14} className="text-white" />
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-1 mb-6">
          <h3 className="text-lg font-black uppercase tracking-tighter text-white leading-none">
            {user.full_name || "Nimetön"}
          </h3>
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
            {isLocked ? "Jonossa (Odottaa profiilia)" : (user.rank_title || "Varjokansanedustaja")}
          </p>
        </div>

        {/* Assignment & Stats */}
        <div className="w-full space-y-4 pt-4 border-t border-white/5">
          <div className="space-y-1 text-left">
            <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Valiokunta</p>
            <div className="flex items-center gap-2">
              <Briefcase size={12} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-300 uppercase truncate">
                {user.committee_assignment || "Suuri valiokunta"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest mb-1">Impact</p>
              <p className="text-sm font-black text-white">{user.impact_points || 0}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest mb-1">Rank</p>
              <p className="text-sm font-black text-white">LVL {user.level || 1}</p>
            </div>
          </div>
        </div>

        {/* Footer ID */}
        <div className="mt-auto w-full pt-4 flex justify-center">
          <div className="px-3 py-1.5 bg-slate-950 rounded-lg border border-white/5 flex items-center gap-2">
            <Radio size={10} className="text-rose-500" />
            <span className="text-[8px] font-mono font-bold text-slate-500 tracking-widest">
              {user.shadow_id_number || "NO-ID-FOUND"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
