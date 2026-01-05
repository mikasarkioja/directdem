"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Info } from "lucide-react";

interface SpeakerReprimandProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
}

export default function SpeakerReprimand({ isVisible, message, onClose }: SpeakerReprimandProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 pointer-events-none"
        >
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_50px_rgba(244,63,94,0.3)] pointer-events-auto relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center border-2 border-rose-500/30 animate-pulse">
                <ShieldAlert size={32} className="text-rose-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Puhemiehen Huomautus</h3>
                <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Epäasiallinen puheenvuoro havaittu</p>
              </div>

              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 w-full">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{message}"
                </p>
              </div>

              <div className="flex items-center gap-2 text-rose-400">
                <Info size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Luottamusindeksisi on laskenut -10 pistettä.</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
              >
                Ymmärrän ja korjaan kielenkäyttöäni
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

