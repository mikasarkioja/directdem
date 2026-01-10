"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Radio, Users, MessageSquare, ChevronRight, 
  Play, Pause, Award, HelpCircle, TrendingUp,
  Shield, Zap, Search, User, Sparkles
} from "lucide-react";
import type { VirtualParty, DebateParticipant } from "@/lib/types";
import PartyIcon from "./PartyIcon";
import FlyingEmojis from "./FlyingEmojis";
import { readStreamableValue } from "ai/rsc";

interface DebateArenaProps {
  topic: string;
  billTitle?: string;
  participants: DebateParticipant[];
}

export default function DebateArena({ topic, billTitle, participants }: DebateArenaProps) {
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(0);
  const [messages, setMessages] = useState<{ speaker: DebateParticipant; text: string }[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [influence, setInfluence] = useState(50); // 0-100 slider
  const [showPoll, setShowPoll] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const startNextTurn = async () => {
    if (isStreaming) return;
    
    setIsStreaming(true);
    setCurrentText("");
    
    const speaker = participants[activeSpeakerIndex];
    
    try {
      // Create a rotation: current speaker is first in participants for the API
      const rotatedParticipants = [...participants];
      const [current] = rotatedParticipants.splice(activeSpeakerIndex, 1);
      rotatedParticipants.unshift(current);

      const response = await fetch("/api/debate/stream", {
        method: "POST",
        body: JSON.stringify({
          topic,
          billTitle,
          participants: rotatedParticipants,
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
          
          // Next.js AI SDK stream formatting handling (simple version)
          // Look for data: "..." or just text chunks
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

      setMessages(prev => [...prev, { speaker, text: fullText }]);
      setCurrentText("");
      setActiveSpeakerIndex((activeSpeakerIndex + 1) % participants.length);
      
      // Auto-trigger next after a delay if not at the end
      if (messages.length < 6) {
        setTimeout(startNextTurn, 3000);
      } else {
        setShowPoll(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentText]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
      {/* Social Layer: Flying Emojis */}
      <FlyingEmojis />

      {/* Header: Stream Meta */}
      <div className="bg-slate-800/50 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]">
            <Radio size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Live</span>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">The Agora: {topic}</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {participants.length} Factions Competing • {842 + messages.length * 12} Watching
            </p>
          </div>
        </div>
        
        {!isStreaming && messages.length === 0 && (
          <button 
            onClick={startNextTurn}
            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
          >
            <Play size={16} />
            Start Debate
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Stage: Debaters */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8 relative">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-4 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse text-right'}`}
              >
                <div className="shrink-0">
                  <PartyIcon dnaProfile={msg.speaker.party.dna_profile_avg} level={msg.speaker.party.level} size="md" />
                </div>
                <div className={`max-w-[70%] space-y-2`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{msg.speaker.party.name}</p>
                  <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                    i % 2 === 0 ? 'bg-white/5 text-slate-200 border border-white/5' : 'bg-blue-500/10 text-blue-100 border border-blue-500/20'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}

            {isStreaming && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${activeSpeakerIndex % 2 === 0 ? 'flex-row' : 'flex-row-reverse text-right'}`}
              >
                <div className="shrink-0">
                  <PartyIcon dnaProfile={participants[activeSpeakerIndex].party.dna_profile_avg} level={participants[activeSpeakerIndex].party.level} size="md" />
                </div>
                <div className={`max-w-[70%] space-y-2`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {participants[activeSpeakerIndex].party.name} is typing...
                  </p>
                  <div className="p-4 rounded-2xl bg-white/10 text-white text-sm font-medium leading-relaxed border border-white/10 italic">
                    {currentText}<span className="animate-pulse">|</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Sidebar: Interactions */}
        <div className="w-80 bg-slate-800/30 backdrop-blur-sm border-l border-white/5 p-6 flex flex-col gap-8 z-10">
          {/* Influence Slider */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-command-neon" />
              Influence Tracker
            </h3>
            <p className="text-xs text-slate-300 font-bold">Vaikuttiko tämä kantaasi?</p>
            <div className="space-y-6 pt-4">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={influence}
                onChange={(e) => setInfluence(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-command-neon"
              />
              <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-widest">
                <span>Ei vaikuttanut</span>
                <span>Täysin samaa mieltä</span>
              </div>
            </div>
          </div>

          {/* Participant DNA comparison */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              DNA Resonance
            </h3>
            <div className="space-y-3">
              {participants.map((p, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase text-slate-300">{p.party.name}</span>
                    <span className="text-[9px] font-black text-command-neon">84% Match</span>
                  </div>
                  <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${80 - i * 15}%` }}
                      className="h-full bg-command-neon"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Poll Popup */}
          <AnimatePresence>
            {showPoll && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-auto bg-command-neon/10 border border-command-neon/20 p-4 rounded-2xl space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-command-neon" />
                  <h4 className="text-[10px] font-black uppercase text-white">Yleisöäänestys</h4>
                </div>
                <p className="text-xs text-white font-bold">Kuka puolue esitti vakuuttavimmat perustelut?</p>
                <div className="space-y-2">
                  {participants.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => setShowPoll(false)}
                      className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[10px] font-black uppercase text-white transition-all border border-white/5"
                    >
                      {p.party.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


