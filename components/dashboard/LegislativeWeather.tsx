"use client";

import React from "react";
import { motion } from "framer-motion";
import { CloudRain, CloudLightning, Sun, Wind, Thermometer, Users, AlertTriangle } from "lucide-react";

interface WeatherProps {
  frictionIndex: number;
  primaryImpact: string;
  voterSensitivity: string;
  winners: string[];
  losers: string[];
}

export default function LegislativeWeather({ 
  frictionIndex, 
  primaryImpact, 
  voterSensitivity,
  winners,
  losers
}: WeatherProps) {
  
  const getWeatherIcon = () => {
    if (frictionIndex > 80) return <CloudLightning className="text-yellow-400 w-12 h-12" />;
    if (frictionIndex > 50) return <CloudRain className="text-blue-400 w-12 h-12" />;
    if (frictionIndex > 20) return <Wind className="text-slate-400 w-12 h-12" />;
    return <Sun className="text-orange-400 w-12 h-12" />;
  };

  const getStatusText = () => {
    if (frictionIndex > 80) return "Poliittinen Myrsky";
    if (frictionIndex > 50) return "Rajuilma Mahdollinen";
    if (frictionIndex > 20) return "Puuskaista";
    return "Selkeää";
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
      {/* Background Glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-20 transition-colors duration-1000 ${
        frictionIndex > 50 ? "bg-red-500" : "bg-emerald-500"
      }`} />

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lainsäädännön Sääasema</p>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{getStatusText()}</h3>
        </div>
        <motion.div 
          animate={frictionIndex > 80 ? { y: [0, -5, 0], scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getWeatherIcon()}
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-1 text-slate-400">
            <Thermometer size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Kitka-indeksi</span>
          </div>
          <p className="text-2xl font-black text-white">{frictionIndex}<span className="text-xs text-slate-500 ml-1">/100</span></p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-1 text-slate-400">
            <AlertTriangle size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Väestöherkkyys</span>
          </div>
          <p className={`text-sm font-black uppercase tracking-tight ${voterSensitivity === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>
            {voterSensitivity === 'High' ? 'Erittäin Korkea' : 'Matala'}
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Users size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Voittajat</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {winners.map(w => (
              <span key={w} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                {w}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-rose-400">
            <Users size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Häviäjät</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {losers.map(l => (
              <span key={l} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-bold text-rose-400 uppercase tracking-wider">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pääasiallinen Vaikutus</span>
          <span className="text-[10px] font-black uppercase text-white bg-white/10 px-3 py-1 rounded-lg">
            {primaryImpact}
          </span>
        </div>
      </div>
    </div>
  );
}

