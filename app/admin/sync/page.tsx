"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2, Play, CheckCircle2, AlertTriangle, Terminal as TerminalIcon } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function AdminSyncPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const runSync = async () => {
    setLoading(true);
    setStatus("running");
    setLogs(["🚀 Aloitetaan synkronointi...", "📍 Kutsutaan rajapintaa..."]);

    try {
      const response = await fetch("/api/admin/sync-eduskunta", { method: "POST" });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Stream ei saatavilla");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const newLogs = chunk.split("\n").filter(l => l.trim());
        setLogs(prev => [...prev, ...newLogs]);
      }

      setStatus("success");
    } catch (error: any) {
      console.error(error);
      setLogs(prev => [...prev, `❌ VIRHE: ${error.message}`]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-command-dark overflow-hidden">
      <Sidebar activeView="overview" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 md:p-10 pb-32">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Admin <span className="text-command-neon">Data Center</span>
            </h1>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <BrainCircuit size={14} className="text-command-neon" />
              Sync Monitor v1.0
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Controls */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Eduskunta Mass Sync</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hae kansanedustajat, äänestykset ja äänet</p>
                </div>
                <button
                  onClick={runSync}
                  disabled={loading}
                  className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                  Käynnistä Synkronointi
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-amber-500 animate-pulse' : status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tila: {status}</span>
                </div>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[500px]">
              <div className="p-6 border-b border-white/5 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TerminalIcon size={18} className="text-command-neon" />
                  <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">System Output Logs</span>
                </div>
                <button onClick={() => setLogs([])} className="text-[10px] font-black uppercase text-white/30 hover:text-white transition-colors">Tyhjennä</button>
              </div>
              <div className="flex-1 p-8 font-mono text-xs text-white/80 overflow-y-auto custom-scrollbar space-y-2">
                {logs.length === 0 && <p className="text-white/20 italic">Odottaa komentoa...</p>}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-white/20 shrink-0">{i + 1}</span>
                    <p className={log.includes('VIRHE') ? 'text-rose-400' : log.includes('✅') ? 'text-emerald-400' : ''}>
                      {log}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav activeView="overview" onViewChange={() => {}} />
    </div>
  );
}


