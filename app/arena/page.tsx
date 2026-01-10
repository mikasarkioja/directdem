"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "ai/react";
import { 
  Trophy, Sword, Shield, Zap, Flame, User, Bot, 
  ChevronRight, Send, ShieldCheck, AlertCircle, Info,
  Loader2, Search, X, MessageSquare, Play
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

interface MP {
  id: string;
  first_name: string;
  last_name: string;
  party: string;
}

interface Bill {
  bill_id: string;
  title: string;
}

export default function ArenaDuelPage() {
  const [mps, setMps] = useState<MP[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedChallenger, setSelectedChallenger] = useState<MP | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tensionLevel, setTensionLevel] = useState(0);

  // Harry Harkimo ID (Champion)
  const championId = "1328";
  const championName = "Harry Harkimo";
  const championParty = "Liike Nyt";

  useEffect(() => {
    async function load() {
      try {
        const [mpsRes, billsRes] = await Promise.all([
          fetch("/api/mps"), // Pitää varmistaa että tämä API löytyy
          fetch("/api/bills/ai-profiles") // Pitää varmistaa että tämä API löytyy tai korvata
        ]);
        
        // Mock data jos APIa ei ole vielä
        const mpsData = await mpsRes.json();
        const billsData = await billsRes.json();
        
        setMps(mpsData.filter((m: MP) => m.id !== championId));
        setBills(billsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: "/api/arena/duel",
    body: { 
      championId, 
      challengerId: selectedChallenger?.id, 
      billId: selectedBill?.bill_id 
    },
  });

  const startDuel = () => {
    if (!selectedChallenger || !selectedBill) return;
    setIsDuelActive(true);
    setMessages([]);
    append({ 
      role: "user", 
      content: `Aloitetaan kaksintaistelu aiheesta: ${selectedBill.title}. Hjallis, ole hyvä ja aloita.` 
    });
  };

  const parseMessage = (content: string) => {
    const speakerMatch = content.match(/\[SPEAKER: (.*?)\]/);
    const statusMatch = content.match(/\[STATUS: (.*?)\]/);
    const factsMatch = content.match(/\[FACTS: (.*?)\]/);
    
    // Update Tension Level based on status
    if (statusMatch) {
      const status = statusMatch[1];
      if (status === "Hyökkää" || status === "Haastaa takinkäännöstä") setTensionLevel(prev => Math.min(100, prev + 15));
      else if (status === "Kunnioittaa") setTensionLevel(prev => Math.max(0, prev - 10));
    }

    let cleanText = content
      .replace(/\[SPEAKER: (.*?)\]/g, "")
      .replace(/\[STATUS: (.*?)\]/g, "")
      .replace(/\[FACTS: (.*?)\]/g, "")
      .trim();

    return {
      speaker: speakerMatch ? speakerMatch[1] : "CHAMPION",
      status: statusMatch ? statusMatch[1] : "Kuuntelee",
      facts: factsMatch ? JSON.parse(factsMatch[1]) : null,
      text: cleanText
    };
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-purple-500" size={48} />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar activeView="arena" setActiveView={() => {}} user={null} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex p-4 rounded-3xl bg-orange-500/10 text-orange-500 mb-2 border border-orange-500/20"
            >
              <Sword size={40} />
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
              Poliittinen <span className="text-orange-500">Areena</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest italic">Kaksintaistelu: Champion vs Challenger</p>
          </div>

          {!isDuelActive ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left: Champion (Static) */}
              <div className="space-y-8">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={24} />
                  Hallitseva Champion
                </h2>
                <div className="bg-slate-900 border-2 border-yellow-500/30 p-8 rounded-[3rem] text-center space-y-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                  <div className="w-32 h-32 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-4 border-yellow-500 shadow-2xl shadow-yellow-500/20 relative z-10">
                    <User size={64} className="text-slate-400" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight">{championName}</h3>
                    <p className="text-xs font-black uppercase text-yellow-500 tracking-widest">{championParty}</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 relative z-10">
                    <p className="text-xs text-slate-400 italic">"Suoraa puhetta, ei selittelyä. Liike Nyt haastaa vanhat rakenteet."</p>
                  </div>
                </div>
              </div>

              {/* Right: Select Challenger */}
              <div className="space-y-8">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Sword className="text-orange-500" size={24} />
                  Valitse Haastaja
                </h2>
                
                <div className="bg-slate-900 border border-white/5 p-8 rounded-[3rem] space-y-6">
                  {/* Topic Selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Valitse Väittelyaihe</label>
                    <select 
                      onChange={(e) => setSelectedBill(bills.find(b => b.bill_id === e.target.value) || null)}
                      className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Valitse lakiesitys --</option>
                      {bills.map(b => (
                        <option key={b.bill_id} value={b.bill_id}>{b.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* MP Search */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Etsi Haastaja</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text"
                        placeholder="Nimi tai puolue..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* MP Grid (Small sample) */}
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {mps.filter(m => 
                      `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) || 
                      m.party.toLowerCase().includes(search.toLowerCase())
                    ).slice(0, 20).map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedChallenger(m)}
                        className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${
                          selectedChallenger?.id === m.id 
                            ? "bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20 scale-[1.02]" 
                            : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <p className="text-xs font-black uppercase truncate">{m.first_name} {m.last_name}</p>
                        <p className="text-[8px] font-bold uppercase opacity-60 truncate">{m.party}</p>
                      </button>
                    ))}
                  </div>

                  <button 
                    disabled={!selectedChallenger || !selectedBill}
                    onClick={startDuel}
                    className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-400 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
                  >
                    <Play size={18} fill="currentColor" />
                    Aloita Kaksintaistelu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Duel UI */
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* VS Bar */}
              <div className="grid grid-cols-3 items-center gap-4 bg-slate-900/50 p-6 rounded-[3rem] border border-white/5 backdrop-blur-md">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-yellow-500 shadow-lg shadow-yellow-500/10">
                    <User size={32} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase truncate">{championName}</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex p-3 bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/20 font-black italic text-xl">VS</div>
                  <div className="mt-4 space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest uppercase">Ideologinen Jännite</p>
                    <div className="h-1.5 w-32 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${tensionLevel}%` }}
                        className={`h-full ${tensionLevel > 70 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : (tensionLevel > 40 ? 'bg-orange-500' : 'bg-emerald-500')}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-orange-500 shadow-lg shadow-orange-500/10">
                    <User size={32} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase truncate">{selectedChallenger?.first_name} {selectedChallenger?.last_name}</p>
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex flex-col h-[600px] bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-950/30">
                  <AnimatePresence initial={false}>
                    {messages.filter(m => m.role !== "user" || m.content.includes("Aloitetaan")).map((m) => {
                      if (m.role === "user" && m.content.includes("Aloitetaan")) return null;
                      
                      const parsed = m.role === "assistant" ? parseMessage(m.content) : { text: m.content, speaker: "USER", status: "Referee", facts: null as any };
                      const isChamp = parsed.speaker === "CHAMPION";
                      
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: isChamp ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex ${isChamp ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`max-w-[85%] space-y-3`}>
                            <div className={`flex items-center gap-3 ${isChamp ? "flex-row" : "flex-row-reverse"}`}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isChamp ? "bg-yellow-500 text-slate-950" : "bg-orange-500 text-white"}`}>
                                {isChamp ? <Trophy size={16} /> : <Sword size={16} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                  {isChamp ? championName : (parsed.speaker === "USER" ? "Erotuomari" : `${selectedChallenger?.first_name} ${selectedChallenger?.last_name}`)}
                                </span>
                                <span className={`text-[8px] font-bold uppercase italic ${isChamp ? "text-yellow-500" : "text-orange-500"}`}>
                                  {parsed.status}
                                </span>
                              </div>
                            </div>

                            <div className={`p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-xl border ${
                              isChamp 
                                ? "bg-slate-800 text-slate-200 border-yellow-500/10 rounded-tl-none" 
                                : (parsed.speaker === "USER" ? "bg-blue-600 text-white border-none rounded-tr-none" : "bg-slate-800 text-slate-200 border-orange-500/10 rounded-tr-none")
                            }`}>
                              {parsed.text}
                            </div>

                            {m.role === "assistant" && parsed.facts && (
                              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3 ml-2">
                                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                                <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Referenssi</p>
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {parsed.facts.bill} ({parsed.facts.vote})
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {isLoading && (
                    <div className="flex justify-center p-4">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-8 bg-slate-900 border-t border-white/5">
                  <div className="relative flex items-center gap-4">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Heitä haastava kysymys molemmille..."
                      className="flex-1 bg-slate-800 border border-white/5 p-5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-5 bg-orange-500 text-white rounded-2xl hover:bg-orange-400 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/20"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                  <div className="mt-4 flex justify-between items-center px-2">
                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] flex items-center gap-2">
                      <Info size={10} />
                      Käyttäjä toimii erotuomarina ja moderaattorina
                    </p>
                    <button 
                      onClick={() => setIsDuelActive(false)}
                      className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-400 underline transition-colors"
                    >
                      Lopeta Kaksintaistelu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav activeView="arena" onViewChange={() => {}} />
    </div>
  );
}

