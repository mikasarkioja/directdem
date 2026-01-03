"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Radio, Play, Users, MessageSquare, ChevronRight, 
  Sparkles, Zap, Heart, ThumbsUp, Loader2, 
  ArrowLeft, CheckCircle2, Building2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { Bill, MunicipalCase, UserProfile } from "@/lib/types";
import FlyingEmojis from "@/components/FlyingEmojis";
import VoteButton from "@/components/VoteButton";

const CHALLENGERS = ["SDP", "Kokoomus", "Vihreät", "Perussuomalaiset", "Keskusta"];

export default function DebateDemo() {
  const [step, setStep] = useState<"selection" | "arena" | "conclusion">("selection");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Bill | MunicipalCase | null>(null);
  const [challenger, setChallenger] = useState(CHALLENGERS[0]);
  
  // Arena State
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [debateFinished, setDebateFinished] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
        setUser(profile as any);
      }
      const { data: billsData } = await supabase.from("bills").select("*").limit(5);
      setBills(billsData || []);
    }
    load();
  }, []);

  const startDebate = async () => {
    if (!selectedTopic) return;
    setStep("arena");
    setMessages([]);
    setDebateFinished(false);
    // Automatically trigger first turn
    setTimeout(() => runTurn([]), 1000);
  };

  const runTurn = async (history: { role: string; text: string }[]) => {
    if (history.length >= 6) {
      setDebateFinished(true);
      return;
    }

    setIsStreaming(true);
    setCurrentText("");
    const currentSpeaker = history.length % 2 === 0 ? "Liike Nyt" : challenger;

    try {
      const response = await fetch("/api/debate/demo", {
        method: "POST",
        body: JSON.stringify({
          topic: selectedTopic?.title,
          challengerParty: challenger,
          history
        }),
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const text = JSON.parse(line.substring(2));
              fullText += text;
              setCurrentText(fullText);
            }
          }
        }
      }

      const newHistory = [...history, { role: currentSpeaker, text: fullText }];
      setMessages(newHistory);
      setCurrentText("");
      setIsStreaming(false);

      // Wait a bit then next turn
      if (newHistory.length < 6) {
        setTimeout(() => runTurn(newHistory), 3000);
      } else {
        setDebateFinished(true);
      }
    } catch (e) {
      console.error(e);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentText]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-command-dark overflow-hidden">
      <Sidebar activeView="debate" setActiveView={() => {}} user={user} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 md:p-10 relative z-10">
          
          <AnimatePresence mode="wait">
            {step === "selection" && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-command-neon/10 rounded-2xl flex items-center justify-center text-command-neon mx-auto">
                    <Sparkles size={32} />
                  </div>
                  <h1 className="text-4xl font-black uppercase tracking-tighter">The Agora Demo</h1>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Valitse aihe ja haastaja aloittaaksesi AI-väittelyn</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Topic Selection */}
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">1. Valitse aihe</h3>
                    <div className="space-y-3">
                      {bills.map(bill => (
                        <button
                          key={bill.id}
                          onClick={() => setSelectedTopic(bill)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${
                            selectedTopic?.id === bill.id 
                              ? "bg-blue-50 border-command-neon text-command-dark shadow-sm" 
                              : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <p className="text-xs font-bold leading-tight">{bill.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Challenger Selection */}
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">2. Valitse haastaja</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl opacity-50">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Osallistuja 1</p>
                        <p className="text-sm font-black text-command-dark">Liike Nyt</p>
                      </div>
                      <div className="relative">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Osallistuja 2 (Haastaja)</p>
                        <div className="grid grid-cols-1 gap-2">
                          {CHALLENGERS.map(c => (
                            <button
                              key={c}
                              onClick={() => setChallenger(c)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                challenger === c 
                                  ? "bg-rose-50 border-rose-500 text-command-dark shadow-sm" 
                                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <span className="text-sm font-black">{c}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    disabled={!selectedTopic}
                    onClick={startDebate}
                    className="flex items-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-105 hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                  >
                    <Play size={20} fill="currentColor" />
                    Aloita Väittely
                  </button>
                </div>
              </motion.div>
            )}

            {step === "arena" && (
              <motion.div 
                key="arena"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-[80vh] bg-slate-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              >
                <FlyingEmojis />
                
                {/* Arena Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50 backdrop-blur-xl z-30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                      <Radio size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">LIVE</span>
                        <h2 className="text-lg font-black uppercase tracking-tight text-white">{selectedTopic?.title}</h2>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Liike Nyt vs {challenger}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep("selection")} className="text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                  </button>
                </div>

                {/* Arena Chat */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8 pb-32">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: m.role === "Liike Nyt" ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-4 ${m.role === "Liike Nyt" ? "flex-row" : "flex-row-reverse text-right"}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                        m.role === "Liike Nyt" ? "bg-blue-500 border-blue-400 text-white" : "bg-rose-500 border-rose-400 text-white"
                      }`}>
                        <span className="font-black text-xs">{m.role[0]}</span>
                      </div>
                      <div className="max-w-[75%] space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{m.role}</p>
                        <div className={`p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${
                          m.role === "Liike Nyt" 
                            ? "bg-white/10 text-white border border-white/10" 
                            : "bg-blue-500/10 text-blue-100 border border-blue-500/20"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isStreaming && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${messages.length % 2 === 0 ? "flex-row" : "flex-row-reverse text-right"}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border animate-pulse ${
                        messages.length % 2 === 0 ? "bg-blue-500 border-blue-400" : "bg-rose-500 border-rose-400"
                      }`}>
                        <span className="font-black text-white text-xs">...</span>
                      </div>
                      <div className="max-w-[75%] space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                          {messages.length % 2 === 0 ? "Liike Nyt" : challenger} kirjoittaa...
                        </p>
                        <div className="p-5 rounded-[2rem] bg-white/5 text-white/80 text-sm italic border border-white/5">
                          {currentText}<span className="animate-pulse">|</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Final Button */}
                {debateFinished && (
                  <motion.div 
                    initial={{ y: 100 }} 
                    animate={{ y: 0 }} 
                    className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900 to-transparent flex justify-center z-40"
                  >
                    <button 
                      onClick={() => setStep("conclusion")}
                      className="bg-command-neon text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                    >
                      Katso yhteenveto
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === "conclusion" && (
              <motion.div 
                key="conclusion"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Väittely päättynyt</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Yhteenveto parhaista perusteluista</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-blue-500">
                      <Zap size={18} />
                      <h4 className="text-sm font-black uppercase">Liike Nyt: Vapaus & Teknologia</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      "Pääpaino oli yksilön valinnanvapaudessa ja sääntelyn purkamisessa digitaalisten ratkaisujen avulla. Teknologia mahdollistaa turvallisen valvonnan ilman raskasta byrokratiaa."
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Building2 size={18} />
                      <h4 className="text-sm font-black uppercase">{challenger}: Perinteet & Vastuullisuus</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      "Painotimme yhteiskunnan kokonaisvastuuta ja heikoimmista huolehtimista. Muutosten on oltava hallittuja ja niiden vaikutukset kansanterveyteen on analysoitava huolella."
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-10 rounded-[3rem] text-center space-y-8 shadow-inner">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase text-command-dark">Sinun Varjoäänesi</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Minkä kannan otat väittelyn jälkeen?</p>
                  </div>
                  <div className="max-w-md mx-auto">
                    <VoteButton billId={selectedTopic?.id || ""} onVoteChange={() => {}} />
                  </div>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => setStep("selection")} className="text-slate-400 hover:text-command-dark text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <ArrowLeft size={14} />
                    Aloita uusi demo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
      <BottomNav activeView="debate" onViewChange={() => {}} />
    </div>
  );
}

