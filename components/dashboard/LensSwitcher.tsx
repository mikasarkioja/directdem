"use client";

import React from "react";
import { LensMode } from "@/lib/types";
import { Globe, MapPin, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface LensSwitcherProps {
  currentLens: LensMode;
  onLensChange: (lens: LensMode) => void;
}

export default function LensSwitcher({ currentLens, onLensChange }: LensSwitcherProps) {
  const lenses: { id: LensMode; label: string; icon: any; color: string }[] = [
    { id: "national", label: "Valtakunnallinen", icon: Globe, color: "text-purple-400" },
    { id: "helsinki", label: "Helsinki", icon: Building2, color: "text-blue-400" },
    { id: "espoo", label: "Espoo", icon: MapPin, color: "text-emerald-400" },
    { id: "vantaa", label: "Vantaa", icon: MapPin, color: "text-orange-400" },
  ];

  return (
    <div className="flex bg-slate-900/80 border border-white/5 rounded-2xl p-1 gap-1 backdrop-blur-md">
      {lenses.map((l) => {
        const Icon = l.icon;
        const isActive = currentLens === l.id;
        
        return (
          <button
            key={l.id}
            onClick={() => onLensChange(l.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
              isActive 
                ? "bg-white/10 text-white shadow-xl" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="lens-active-bg"
                className="absolute inset-0 bg-white/5 rounded-xl -z-10"
              />
            )}
            <Icon size={14} className={isActive ? l.color : "text-slate-600"} />
            <span className="hidden md:inline">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}

