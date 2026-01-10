"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, ChevronRight, Fingerprint, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DNAActivation() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full overflow-hidden bg-slate-900 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl"
    >
      {/* Background Animation (Holographic Scan Line) */}
      <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent z-0 pointer-events-none"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 w-fit">
              <ShieldAlert size={14} className="text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Pääsy Rajoitettu</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
              Aktivoi Poliittinen <span className="text-purple-500">DNA-profiilisi</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-lg font-medium leading-relaxed max-w-md">
              Jotta voit saada valiokuntapaikan ja aloittaa työskentelyn digitaalisessa eduskunnassa, meidän on analysoitava poliittinen profiilisi.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                <Sparkles size={20} />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Testi kestää noin <span className="text-white font-bold">3 minuuttia</span> ja se perustuu todellisiin eduskunnan äänestyksiin.
              </p>
            </div>

            <Link href="/testi" className="block w-full">
              <button className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-purple-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-600/30 group">
                <Zap size={20} className="fill-white" />
                Astu DNA-testiin
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>

        {/* Visual: Animated DNA / Fingerprint */}
        <div className="flex justify-center relative">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            {/* Rotating Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-purple-500/20 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 border border-white/5 rounded-full"
            />
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Fingerprint size={120} className="text-purple-500/50" />
              </motion.div>
            </div>

            {/* Scanning Dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.25 
                }}
                className="absolute w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                style={{
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

