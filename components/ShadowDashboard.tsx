"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Clock, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  Radio, 
  Shield, 
  Zap, 
  ChevronRight, 
  Sparkles,
  Lock,
  Edit3
} from "lucide-react";
import type { Bill, UserProfile } from "@/lib/types";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import ShadowIDCard from "./ShadowIDCard";
import ExpertHearing from "./ExpertHearing";
import CommitteeWorkspace from "./CommitteeWorkspace";

interface ShadowDashboardProps {
  user: UserProfile;
}

export default function ShadowDashboard({ user }: ShadowDashboardProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBillsFromSupabase().then(data => {
      // Logic to filter bills based on committee assignment
      // In a real app, bills would have a committee_id or similar
      setBills(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-10 pb-20">
      {/* 1. MP Identity Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-white/10 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Varjokansanedustajan Työhuone</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
            Tervetuloa <span className="text-purple-500">Töihin</span>
          </h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            Olet Varjokansanedustaja. Tehtäväsi on perehtyä lakiesityksiin, kuulla asiantuntijoita ja muodostaa kansalaisten oma kanta valitsemassasi valiokunnassa.
          </p>
        </div>
        <ShadowIDCard user={user} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Bill Queue (Processing Pile) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Briefcase size={14} className="text-purple-500" />
              Pino Käsittelyssä
            </h3>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{bills.length} Odottaa</p>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-900 border border-white/5 rounded-3xl animate-pulse" />)
            ) : (
              bills.map((bill, i) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedBill(bill)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all group relative overflow-hidden ${
                    selectedBill?.id === bill.id 
                      ? "bg-purple-600/10 border-purple-500/30 ring-1 ring-purple-500/20" 
                      : "bg-slate-900/50 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="relative z-10 flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{bill.parliamentId || "HE 123/2024"}</p>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                        {bill.title}
                      </h4>
                    </div>
                    {i > 2 && (
                      <div className="p-2 bg-slate-800 rounded-xl text-slate-500">
                        <Lock size={14} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* 3. Main Workspace / Detail Area */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {selectedBill ? (
              <motion.div
                key={selectedBill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-10 shadow-2xl"
              >
                {/* Bill Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[8px] font-black uppercase tracking-widest">
                      Käsittelyssä
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar size={12} />
                      DL: 15.01.2026
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white leading-tight">
                    {selectedBill.title}
                  </h2>
                </div>

                {/* Committee Workspace (Includes Tasks, Amendments, Context) */}
                <CommitteeWorkspace bill={selectedBill} user={user} />

                {/* Submit Action */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Varjon lopullinen kanta</p>
                    <p className="text-xs text-slate-400">Lausunnon antaminen kerryttää vaikuttavuuspisteitäsi.</p>
                  </div>
                  <button className="w-full md:w-auto flex items-center justify-center gap-3 bg-purple-600 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-purple-500 hover:scale-[1.02] transition-all shadow-xl shadow-purple-600/20 group">
                    <span>Anna Varjon lausunto</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-900/30 border border-dashed border-white/5 rounded-[3rem] p-12">
                <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-600">
                  <Briefcase size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white/40">Valitse esitys käsittelyyn</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto uppercase tracking-widest font-bold">
                    Aloita asiantuntijakuuleminen ja muokkaa lakitekstiä Varjona.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

