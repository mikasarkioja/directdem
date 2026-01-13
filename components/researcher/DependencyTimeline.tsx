"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  MessageSquare, 
  Briefcase, 
  AlertCircle, 
  Calendar,
  Filter,
  ArrowRightLeft
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: 'financial' | 'political';
  date: string;
  title: string;
  description: string;
  correlation?: {
    score: number;
    reasoning: string;
  };
  theme?: string;
}

interface DependencyTimelineProps {
  events: TimelineEvent[];
  summary: string;
}

export const DependencyTimeline: React.FC<DependencyTimelineProps> = ({ events, summary }) => {
  const [filter, setFilter] = useState<string>("all");

  const filteredEvents = filter === "all" 
    ? events 
    : events.filter(e => e.theme?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-8 space-y-12">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <TrendingUp className="text-orange-500" />
            Sidonnaisuus-aikajana
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-orange-500/30 pl-4">
            {summary}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-slate-500" />
            <div className="flex gap-2">
              {["all", "Energia", "Talous", "Sote"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    filter === t 
                      ? "bg-orange-500 border-orange-600 text-white" 
                      : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                  }`}
                >
                  {t === "all" ? "Kaikki" : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The Timeline */}
      <div className="relative">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2 hidden md:block" />

        <div className="space-y-12 relative">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row items-center gap-8 ${
                event.type === 'financial' ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Content Card */}
              <div className="w-full md:w-[45%]">
                <div className={`p-6 rounded-[2rem] border transition-all hover:bg-white/5 ${
                  event.type === 'financial' 
                    ? 'bg-slate-800/50 border-emerald-500/20 text-left' 
                    : 'bg-slate-800/50 border-orange-500/20 text-left'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl ${
                      event.type === 'financial' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {event.type === 'financial' ? <Briefcase size={18} /> : <MessageSquare size={18} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {new Date(event.date).toLocaleDateString('fi-FI')}
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tight mb-2">{event.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                </div>
              </div>

              {/* Center Icon */}
              <div className="z-10 bg-slate-950 p-3 rounded-full border border-white/10 text-slate-500 hidden md:block">
                <Calendar size={16} />
              </div>

              {/* Connection / Correlation Placeholder for the other side */}
              <div className="w-full md:w-[45%] flex items-center justify-center">
                {event.correlation && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-3 w-full"
                  >
                    <ArrowRightLeft className="text-orange-500 shrink-0" size={16} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Korrelatatio: {event.correlation.score}%</span>
                        {event.correlation.score > 70 && <AlertCircle size={10} className="text-rose-500 animate-pulse" />}
                      </div>
                      <p className="text-[10px] text-slate-400 italic leading-tight">
                        "{event.correlation.reasoning}"
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer / Summary Info */}
      <div className="pt-8 border-t border-white/5 flex justify-center">
        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
          <AlertCircle size={12} />
          Automaattinen aikajana-analyysi v1.0
        </div>
      </div>
    </div>
  );
};

