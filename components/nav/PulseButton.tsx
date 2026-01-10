"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/lib/context/RoleContext";
import { Zap, Search, Radio, X, CheckCircle2, BarChart2, Filter } from "lucide-react";

export default function PulseButton() {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  // Define visuals based on role
  const getRoleConfig = () => {
    switch (role) {
      case 'shadow_mp':
        return {
          color: "bg-purple-600",
          glow: "shadow-purple-500/50",
          icon: <Zap size={24} fill="currentColor" />,
          label: "Pikatehtävät",
          modalTitle: "Shadow MP: Pikatoiminnot"
        };
      case 'researcher':
        return {
          color: "bg-cyan-500",
          glow: "shadow-cyan-400/50",
          icon: <Search size={24} />,
          label: "Data-analyysi",
          modalTitle: "Tutkija: Global Search & Filter"
        };
      case 'citizen':
      default:
        return {
          color: "bg-emerald-500",
          glow: "shadow-emerald-400/50",
          icon: <Radio size={24} />,
          label: "Päivän kysymys",
          modalTitle: "Kansalainen: Hjallis-haaste"
        };
    }
  };

  const config = getRoleConfig();

  return (
    <>
      <div className="relative">
        {/* The Pulsing Background */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 rounded-full ${config.color} opacity-20 blur-xl`}
        />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className={`relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full ${config.color} text-white flex items-center justify-center shadow-2xl ${config.glow} transition-colors duration-500`}
        >
          {config.icon}
        </motion.button>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className={`p-8 border-b border-white/5 ${config.color} bg-opacity-10 flex justify-between items-center`}>
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">{config.modalTitle}</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {role === 'shadow_mp' && (
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: <CheckCircle2 className="text-purple-400" />, title: "Kuittaa valiokunnan muistio", points: "+10" },
                      { icon: <Zap className="text-purple-400" />, title: "Anna pika-lausunto", points: "+25" },
                      { icon: <BarChart2 className="text-purple-400" />, title: "Tarkista äänestystulos", points: "+5" },
                    ].map((task, i) => (
                      <button key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-left">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">{task.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white uppercase tracking-tight">{task.title}</p>
                          <p className="text-[10px] font-black text-purple-400">{task.points} Impact Points</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {role === 'researcher' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Hae korrelaatioita (esim. 'talous vs ilmasto')..."
                        className="w-full bg-slate-800 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Puoluekuri', 'Polarisaatio', 'Äänestysaktiivisuus', 'Regionalismi'].map((tag) => (
                        <button key={tag} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black uppercase text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all">
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {role === 'citizen' && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
                      <Radio size={40} className="text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black uppercase tracking-tighter text-white">Päivän Kysymys</h4>
                      <p className="text-slate-400 text-sm italic">"Pitäisikö perustulo ottaa käyttöön Suomessa?"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all">Kyllä</button>
                      <button className="py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all">Ei</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

