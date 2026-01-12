"use client";

import { motion } from "framer-motion";
import { LayoutGrid, Info } from "lucide-react";

interface HeatmapData {
  org: string;
  committee: string;
  intensity: number; // 0-100
}

const COMMITTEES = ["Talous", "Ympäristö", "Sivistys", "Sote", "Puolustus"];
const ORGS = ["EK", "SAK", "MTK", "Metsäteollisuus", "Kuntaliitto"];

export default function CommitteeHeatmap() {
  // Simulated data for the heatmap
  const data: HeatmapData[] = [];
  ORGS.forEach(org => {
    COMMITTEES.forEach(comm => {
      data.push({
        org,
        committee: comm,
        intensity: Math.floor(Math.random() * 100)
      });
    });
  });

  const getBgColor = (intensity: number) => {
    if (intensity > 80) return "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]";
    if (intensity > 60) return "bg-cyan-600/80";
    if (intensity > 40) return "bg-cyan-700/60";
    if (intensity > 20) return "bg-cyan-800/40";
    return "bg-slate-800/40";
  };

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8 overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LayoutGrid className="text-cyan-400" size={24} />
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Power Pockets Matrix</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-slate-800" />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Matala</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Korkea</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* X-axis labels */}
        <div className="grid grid-cols-6 mb-4">
          <div /> {/* Empty corner */}
          {COMMITTEES.map(c => (
            <div key={c} className="text-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{c}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {ORGS.map(org => (
            <div key={org} className="grid grid-cols-6 items-center gap-2">
              <div className="text-right pr-4">
                <span className="text-[9px] font-black text-white uppercase">{org}</span>
              </div>
              {COMMITTEES.map(comm => {
                const cell = data.find(d => d.org === org && d.committee === comm);
                const intensity = cell?.intensity || 0;
                return (
                  <motion.div
                    key={`${org}-${comm}`}
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                    className={`h-12 rounded-xl border border-white/5 transition-all cursor-help relative group ${getBgColor(intensity)}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <span className="text-[10px] font-black text-white">{intensity}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
        <Info size={16} className="text-cyan-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-cyan-100/60 font-medium leading-relaxed uppercase tracking-wider">
          Matrix paljastaa missä valiokunnissa kukin järjestö on hallitseva. Korkea intensiteetti viittaa siihen, että järjestön lausunnot ovat muuttaneet merkittävästi valiokunnan mietintöjen sanamuotoja.
        </p>
      </div>
    </div>
  );
}

