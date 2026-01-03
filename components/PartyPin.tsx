"use client";

import React from "react";
import PartyIcon from "./PartyIcon";
import { motion } from "framer-motion";
import type { ArchetypePoints } from "@/lib/types";

interface PartyPinProps {
  dnaProfile: ArchetypePoints;
  level: number;
  partyName: string;
}

export default function PartyPin({ dnaProfile, level, partyName }: PartyPinProps) {
  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-1.5 ml-2 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-md cursor-help group relative"
      title={`Member of ${partyName}`}
    >
      <PartyIcon dnaProfile={dnaProfile} level={level} size="sm" />
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter group-hover:text-command-neon transition-colors">
        {partyName.split(" ").map(n => n[0]).join("")}
      </span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-command-dark text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
          {partyName} Member (Lv.{level})
        </div>
      </div>
    </motion.div>
  );
}

