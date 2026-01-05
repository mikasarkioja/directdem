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
  Timer
} from "lucide-react";
import type { Bill, UserProfile } from "@/lib/types";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import Link from "next/link";

interface MPWorkspaceProps {
  user: UserProfile | null;
}

export default function MPWorkspace({ user }: MPWorkspaceProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [onlineCount, setOnlineCount] = useState(124); // Mock online users
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillsFromSupabase().then(data => {
      setBills(data.slice(0, 3)); // Only show top 3 for processing pile
      setLoading(false);
    });

    // Random online count variation
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const committees = [
    { name: "Sivistysvaliokunta", icon: "🎓", status: "Käynnissä" },
    { name: "Talousvaliokunta", icon: "💰", status: "Odottaa" },
    { name: "Ympäristövaliokunta", icon: "🌿", status: "Huomenna" }
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-white/10 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Kansanedustajan Työhuone</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            Tervetuloa <span className="text-[#8B0000]">Töihin</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            Eduskuntavahti v3.0 — Digitaalinen Työpöytä
          </p>
        </div>

        <button 
          onClick={() => setIsClockedIn(!isClockedIn)}
          className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center gap-3 ${
            isClockedIn 
              ? "bg-emerald-500 text-white shadow-emerald-500/20" 
              : "bg-[#8B0000] text-white shadow-[#8B0000]/20 hover:scale-105 active:scale-95"
          }`}
        >
          {isClockedIn ? <Timer size={16} /> : <Clock size={16} />}
          {isClockedIn ? "Leimattu sisään" : "Leimaa sisään"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Committees & Live */}
        <div className="space-y-8">
          {/* Live Plenary Hall Widget */}
          <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Radio size={64} className="text-[#D4AF37]" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Istuntosali LIVE</h3>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                  Täysistunto <br/><span className="text-[#D4AF37]">Menossa</span>
                </p>
                <p className="text-xs text-white/40 font-medium italic">"Hallituksen esitys EU-direktiivin täytäntöönpanosta..."</p>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">Päivän asialista</p>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-white/60 font-bold uppercase tracking-tight">
                    <span className="text-white/20">{i}.</span>
                    <span>Kohta {i}: Lakiehdotus {i*123}/2024</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Committees */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Shield size={14} className="text-[#8B0000]" />
              Omat Valiokunnat
            </h3>
            <div className="grid gap-3">
              {committees.map((c, i) => (
                <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between group hover:border-[#8B0000]/30 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-slate-900">{c.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.status}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[#8B0000] group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Processing Pile */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Briefcase size={14} className="text-[#D4AF37]" />
                Pino Käsittelyssä
              </h3>
              <p className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">{bills.length} Odottaa</p>
            </div>
            
            <div className="grid gap-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />)
              ) : (
                bills.map((bill, i) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-[#8B0000]/20 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8B0000]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex justify-between items-start gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">
                            {bill.parliamentId || "HE 123/2024"}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Calendar size={10} />
                            DL: 15.01.2026
                          </span>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-[#8B0000] transition-colors leading-tight">
                          {bill.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {bill.summary || "Tämä esitys odottaa analyysia ja lausuntoa Varjoparlamentilta."}
                        </p>
                        <Link 
                          href={`/lausunnot/${bill.id}`}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:text-[#8B0000] transition-colors"
                        >
                          Luo kansan lausunto <ChevronRight size={12} />
                        </Link>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#8B0000]/10 group-hover:text-[#8B0000] transition-all shrink-0">
                        <FileText size={24} />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8 space-y-4">
              <div className="flex items-center gap-2 text-[#8B0000]">
                <TrendingUp size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">Vaikuttavuus-mittari</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-black text-slate-900">1,450 <span className="text-xs text-slate-400 font-black tracking-widest uppercase">VP</span></p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase">+12%</p>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    className="h-full bg-gradient-to-r from-[#8B0000] to-[#D4AF37]" 
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right italic">Seuraava taso: Valtiomies</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] border border-white/10 p-8 space-y-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-2 text-white/60">
                <Users size={18} className="text-[#D4AF37]" />
                <h4 className="text-xs font-black uppercase tracking-widest">Varjoparlamentti</h4>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">
                  {onlineCount} <span className="text-[10px] text-[#D4AF37] font-black uppercase animate-pulse">Online</span>
                </p>
                <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed tracking-widest">
                  Kansalaista tällä hetkellä 'töissä' eduskunnassa
                </p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/5 border border-white/10 shadow-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

