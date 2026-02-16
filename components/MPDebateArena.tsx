"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Bot,
  ShieldCheck,
  Info,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface MPDebateArenaProps {
  mpId: string;
  mpName: string;
  party: string;
  billId?: string;
  initialMessage?: string;
}

export default function MPDebateArena({
  mpId,
  mpName,
  party,
  billId,
  initialMessage,
}: MPDebateArenaProps) {
  const [userDna, setUserDna] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState("Kuuntelee");
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dna_test_results");
    if (saved) setUserDna(JSON.parse(saved));
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
  } = useChat({
    api: "/api/chat/mp",
    body: { mpId, userDna, billId },
  });

  // Lähetä aloitusviesti jos sellainen on annettu ja viestejä ei vielä ole
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      append({ role: "user", content: initialMessage });
    }
  }, [initialMessage, messages.length, append]);

  // Apufunktio tagien poistoon ja tiedon erotteluun
  const parseMessage = (content: string) => {
    const statusMatch = content.match(/\[STATUS: (.*?)\]/);
    const factsMatch = content.match(/\[FACTS: (.*?)\]/);

    // Yritetään poimia myös distance jos se joskus lähetetään (nyt se on vain system promptissa)
    // Mutta voimme laskea sen myös tässä clientillä jos userDna on ladattu

    const cleanText = content
      .replace(/\[STATUS: (.*?)\]/g, "")
      .replace(/\[FACTS: (.*?)\]/g, "")
      .trim();

    return {
      status: statusMatch ? statusMatch[1] : null,
      facts: factsMatch ? JSON.parse(factsMatch[1]) : null,
      text: cleanText,
    };
  };

  // Päivitä tila kun uusi viesti tulee
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      const { status } = parseMessage(lastMessage.content);
      if (status) setCurrentStatus(status);
    }
  }, [messages]);

  // Jännitemittari (placeholder, todellinen logiikka APIn puolella,
  // mutta voimme näyttää sen jos status viittaa aggressioon)
  const getTensionColor = () => {
    if (
      currentStatus === "Hyökkää" ||
      currentStatus === "Heittäytyy piikikkääksi"
    )
      return "bg-rose-500";
    if (
      currentStatus === "Puolustautuu" ||
      currentStatus === "Selittää kompromissia"
    )
      return "bg-amber-500";
    if (currentStatus === "Kunnioittaa") return "bg-emerald-500";
    return "bg-slate-500";
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-6 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 relative">
            <User size={24} />
            {isLoading && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              {mpName}
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/10">
                {party}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getTensionColor()} shadow-[0_0_8px_currentColor]`}
                />
                <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-300">
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20">
          <Sparkles size={14} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
            Poliittinen Areena
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <MessageSquare size={48} className="text-slate-600" />
            <div className="max-w-xs">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Haasta kansanedustaja
              </p>
              <p className="text-xs text-slate-500 italic mt-1">
                Kysy äänestyksistä, vaalilupauksista tai puolueen linjasta.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const parsed =
              m.role === "assistant"
                ? parseMessage(m.content)
                : { text: m.content, facts: null };

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] space-y-2`}>
                  <div
                    className={`flex items-center gap-2 mb-1 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`p-1 rounded-md ${m.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}
                    >
                      {m.role === "user" ? (
                        <User size={12} />
                      ) : (
                        <Bot size={12} />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {m.role === "user" ? "Sinä" : mpName}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-3xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10"
                        : "bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none shadow-xl"
                    }`}
                  >
                    {parsed.text}
                  </div>

                  {m.role === "assistant" && parsed.facts && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3 ml-2"
                    >
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                        <ShieldCheck size={14} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                          Faktantarkistus
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 leading-tight">
                          Perustuu äänestykseen:{" "}
                          <span className="text-slate-200">
                            {parsed.facts.bill}
                          </span>
                          ({parsed.facts.vote === "jaa" ? "JAA" : "EI"})
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 p-4 rounded-3xl rounded-tl-none animate-pulse flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-slate-900 border-t border-white/5"
      >
        <div className="relative flex items-center gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Miksi äänestit lakiesityksen X puolesta?"
            className="flex-1 bg-slate-800 border border-white/5 p-4 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition-all shadow-xl shadow-purple-600/20"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="mt-3 text-[9px] text-center font-bold text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Info size={10} />
          AI-persona voi erehtyä. Tarkista aina viralliset äänestyspöytäkirjat.
        </p>
      </form>
    </div>
  );
}
