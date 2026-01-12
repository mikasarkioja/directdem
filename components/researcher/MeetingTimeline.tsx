"use client";

import { motion } from "framer-motion";
import { Users, FileText, Activity, AlertCircle } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: 'STATEMENT' | 'MEETING' | 'CHANGE';
  org: string;
  date: string;
  desc: string;
  isLead?: boolean;
}

export default function MeetingTimeline() {
  const events: TimelineEvent[] = [
    { id: "1", type: "STATEMENT", org: "EK", date: "2025-02-10", desc: "Asiantuntijalausunto jätetty" },
    { id: "2", type: "MEETING", org: "EK", date: "2025-02-15", desc: "Tapaaminen: Valiokunnan puheenjohtaja", isLead: true },
    { id: "3", type: "CHANGE", org: "EK", date: "2025-02-25", desc: "Tekstimuutos havaittu mietintöluonnoksessa" },
    { id: "4", type: "STATEMENT", org: "SAK", date: "2025-02-12", desc: "Asiantuntijalausunto jätetty" },
    { id: "5", type: "MEETING", org: "SAK", date: "2025-02-18", desc: "Tapaaminen: Valiokunnan jäsen" },
  ];

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Activity className="text-cyan-400" size={24} />
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Vaikutus-aikajana</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Lausunto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Tapaaminen</span>
          </div>
        </div>
      </div>

      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
        {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className={`absolute -left-[33px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-xl ${
              event.type === 'STATEMENT' ? 'bg-cyan-500' : (event.type === 'MEETING' ? 'bg-rose-500' : 'bg-emerald-500')
            }`}>
              {event.type === 'STATEMENT' ? <FileText size={10} className="text-white" /> : (event.type === 'MEETING' ? <Users size={10} className="text-white" /> : <Activity size={10} className="text-white" />)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{event.date}</span>
                <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-bold text-cyan-400 uppercase border border-white/5">{event.org}</span>
                {event.isLead && (
                  <span className="flex items-center gap-1 text-[8px] font-black text-rose-400 uppercase animate-pulse">
                    <AlertCircle size={8} /> High Priority Contact
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-tight">{event.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

