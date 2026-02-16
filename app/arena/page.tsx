"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "ai/react";
import {
  Trophy,
  Sword,
  Shield,
  Zap,
  Flame,
  User,
  Bot,
  ChevronRight,
  Send,
  ShieldCheck,
  AlertCircle,
  Info,
  Loader2,
  Search,
  X,
  MessageSquare,
  Play,
  Link as LinkIcon,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { fetchMunicipalCouncilors } from "@/app/actions/councilors";
import { useRole } from "@/lib/context/RoleContext";
import { getUser } from "@/app/actions/auth";
import type { UserProfile } from "@/lib/types";

import { RadarAlert } from "@/components/arena/RadarAlert";
import { startGhostSession } from "@/lib/auth/ghost-actions";
import { logUserActivity } from "@/app/actions/logUserActivity";
import toast from "react-hot-toast";

interface MP {
  id: string;
  first_name: string;
  last_name: string;
  party: string;
}

interface Bill {
  bill_id: string;
  title: string;
  analysis_data?: any;
}

interface IntegrityAlert {
  id: string;
  mp_id: number;
  category: string;
  reasoning: string;
  severity: string;
}

export default function ArenaDuelPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mps, setMps] = useState<MP[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedChallenger, setSelectedChallenger] = useState<MP | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [alerts, setAlerts] = useState<IntegrityAlert[]>([]);
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tensionLevel, setTensionLevel] = useState(0);
  const [lens, setLens] = useState<
    "national" | "Helsinki" | "Espoo" | "Vantaa"
  >("national");
  const [champConflict, setChampConflict] = useState<any>(null);
  const [challengerConflict, setChallengerConflict] = useState<any>(null);

  // Harry Harkimo ID (Champion)
  const championId = "1328";
  const championName = "Harry Harkimo";
  const championParty = "Liike Nyt";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mpsRes, billsRes, userRes] = await Promise.all([
          lens === "national"
            ? fetch("/api/mps").then((r) => r.json())
            : fetchMunicipalCouncilors(lens),
          fetch("/api/bills/ai-profiles").then((r) => r.json()),
          getUser(),
        ]);

        const mpsData = mpsRes;
        const billsData = billsRes;
        setUser(userRes);

        console.log(`Arena Load (${lens}) - MPs:`, mpsData);
        console.log("Arena Load - Bills:", billsData);

        if (Array.isArray(mpsData)) {
          setMps(mpsData.filter((m: MP) => m.id !== championId));
        } else {
          setMps([]);
        }

        if (Array.isArray(billsData)) {
          // Jos ollaan kuntalinssissä, näytetään vain kunnan esitykset
          if (lens !== "national") {
            setBills(
              billsData.filter((b: any) =>
                b.bill_id.startsWith(`MUNI-${lens.toUpperCase()}`),
              ),
            );
          } else {
            setBills(
              billsData.filter((b: any) => !b.bill_id.startsWith("MUNI-")),
            );
          }
        } else {
          setBills([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lens]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
  } = useChat({
    api: "/api/arena/duel",
    body: {
      championId,
      challengerId: selectedChallenger?.id,
      billId: selectedBill?.bill_id,
    },
    onError: (err) => {
      console.error("Arena Error:", err);
      const errorMsg = JSON.parse(err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `[SPEAKER: MODERATOR][STATUS: Virhe] Järjestelmävirhe: ${errorMsg.error || err.message}`,
        } as any,
      ]);
    },
  });

  // Calculate tension level based on messages whenever they change
  useEffect(() => {
    let level = 0;
    messages.forEach((m) => {
      if (m.role === "assistant") {
        const statusMatch = m.content.match(/\[STATUS: (.*?)\]/);
        if (statusMatch) {
          const status = statusMatch[1];
          if (
            status === "Hyökkää" ||
            status === "Haastaa takinkäännöstä" ||
            status === "Haastaa kytköksistä"
          )
            level = Math.min(100, level + 15);
          else if (status === "Kunnioittaa") level = Math.max(0, level - 10);
        }
      }
    });
    setTensionLevel(level);
  }, [messages]);

  const startDuel = async () => {
    if (!selectedChallenger || !selectedBill) return;

    // Hae mahdolliset hälytykset edustajille tästä aiheesta
    try {
      const [alertsRes, champConflictsRes, challConflictsRes] =
        await Promise.all([
          fetch(
            `/api/arena/alerts?billId=${selectedBill.bill_id}&mps=${championId},${selectedChallenger.id}`,
          ).then((r) => r.json()),
          fetch(
            `/api/arena/conflicts?billId=${selectedBill.bill_id}&mpId=${championId}`,
          ).then((r) => r.json()),
          fetch(
            `/api/arena/conflicts?billId=${selectedBill.bill_id}&mpId=${selectedChallenger.id}`,
          ).then((r) => r.json()),
        ]);

      setAlerts(alertsRes || []);
      setChampConflict(champConflictsRes);
      setChallengerConflict(challConflictsRes);
    } catch (e) {
      console.error("Failed to fetch alerts/conflicts:", e);
    }

    setIsDuelActive(true);
    setMessages([]);

    // Log Activity and award XP (Only for logged-in or ghost users)
    if (user) {
      try {
        await logUserActivity("ARENA_DUEL", {
          billId: selectedBill.bill_id,
          challengerId: selectedChallenger.id,
        });
      } catch (err) {
        console.warn("Activity logging failed (might be anonymous session)");
      }
    }

    append({
      role: "user",
      content: `Aloitetaan kaksintaistelu aiheesta: ${selectedBill.title}. Hjallis, ole hyvä ja aloita.`,
    });
  };

  const triggerNextTurn = () => {
    if (isLoading) return;

    // Determine who was the last speaker
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    let nextSpeakerPrompt = "";

    if (lastAssistantMessage) {
      const parsed = parseMessage(lastAssistantMessage.content);
      if (parsed.speaker === "CHAMPION") {
        nextSpeakerPrompt = `${selectedChallenger?.first_name}, mitä vastaat tähän? Käytä faktoja.`;
      } else {
        nextSpeakerPrompt = `Hjallis, mikä on kuittisi tähän? Ole suora.`;
      }
    } else {
      nextSpeakerPrompt = "Aloittakaa väittely.";
    }

    append({
      role: "user",
      content: nextSpeakerPrompt,
    });
  };

  const parseMessage = (content: string) => {
    const speakerMatch = content.match(/\[SPEAKER: (.*?)\]/);
    const statusMatch = content.match(/\[STATUS: (.*?)\]/);
    const factsMatch = content.match(/\[FACTS: (.*?)\]/);

    const cleanText = content
      .replace(/\[SPEAKER: (.*?)\]/g, "")
      .replace(/\[STATUS: (.*?)\]/g, "")
      .replace(/\[FACTS: (.*?)\]/g, "")
      .trim();

    let parsedFacts = null;
    if (factsMatch) {
      try {
        parsedFacts = JSON.parse(factsMatch[1]);
      } catch (e) {
        console.error("Failed to parse facts JSON:", e);
      }
    }

    return {
      speaker: speakerMatch ? speakerMatch[1] : "CHAMPION",
      status: statusMatch ? statusMatch[1] : "Kuuntelee",
      facts: parsedFacts,
      text: cleanText,
    };
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar activeView="arena" setActiveView={() => {}} user={user} />

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
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest italic">
              Kaksintaistelu: Champion vs Challenger
            </p>

            {/* Lens Switcher */}
            <div className="flex justify-center gap-2 pt-4">
              {["national", "Helsinki", "Espoo", "Vantaa"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLens(l as any)}
                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                    lens === l
                      ? "bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                  }`}
                >
                  {l === "national" ? "Valtakunnallinen" : l}
                </button>
              ))}
            </div>
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
                    <h3 className="text-3xl font-black uppercase tracking-tight">
                      {championName}
                    </h3>
                    <p className="text-xs font-black uppercase text-yellow-500 tracking-widest">
                      {championParty}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 relative z-10">
                    <p className="text-xs text-slate-400 italic">
                      "Suoraa puhetta, ei selittelyä. Liike Nyt haastaa vanhat
                      rakenteet."
                    </p>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                      Valitse Väittelyaihe
                    </label>
                    <select
                      onChange={(e) =>
                        setSelectedBill(
                          bills.find((b) => b.bill_id === e.target.value) ||
                            null,
                        )
                      }
                      className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Valitse lakiesitys --</option>
                      {bills.map((b) => (
                        <option key={b.bill_id} value={b.bill_id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MP Search */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                      Etsi Haastaja
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        size={18}
                      />
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
                    {mps
                      .filter(
                        (m) =>
                          `${m.first_name} ${m.last_name}`
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          m.party.toLowerCase().includes(search.toLowerCase()),
                      )
                      .slice(0, 20)
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedChallenger(m)}
                          className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${
                            selectedChallenger?.id === m.id
                              ? "bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20 scale-[1.02]"
                              : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          <p className="text-xs font-black uppercase truncate">
                            {m.first_name} {m.last_name}
                          </p>
                          <p className="text-[8px] font-bold uppercase opacity-60 truncate">
                            {m.party}
                          </p>
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
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* Duel Header & Live Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left/Main: VS Bar */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-3 items-center gap-4 bg-slate-900/50 p-8 rounded-[3rem] border border-white/5 backdrop-blur-md">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-yellow-500 shadow-lg shadow-yellow-500/10">
                        <User size={40} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white truncate">
                          {championName}
                        </p>
                        <p className="text-[8px] font-bold uppercase text-yellow-500/70">
                          {championParty}
                        </p>
                        {champConflict && (
                          <div className="mt-2">
                            <RadarAlert
                              score={champConflict.score}
                              explanation={champConflict.explanation}
                              connections={champConflict.detected_connections}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="inline-flex p-4 bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/20 font-black italic text-2xl">
                        VS
                      </div>
                      <div className="mt-6 space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                          Ideologinen Jännite
                        </p>
                        <div className="h-2 w-32 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tensionLevel}%` }}
                            className={`h-full transition-all duration-500 ${tensionLevel > 70 ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]" : tensionLevel > 40 ? "bg-orange-500" : "bg-emerald-500"}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-orange-500 shadow-lg shadow-orange-500/10">
                        <User size={40} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white truncate">
                          {selectedChallenger?.first_name}{" "}
                          {selectedChallenger?.last_name}
                        </p>
                        <p className="text-[8px] font-bold uppercase text-orange-500/70">
                          {selectedChallenger?.party}
                        </p>
                        {challengerConflict && (
                          <div className="mt-2">
                            <RadarAlert
                              score={challengerConflict.score}
                              explanation={challengerConflict.explanation}
                              connections={
                                challengerConflict.detected_connections
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Insights (Hotspots & Alerts) */}
                <div className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] p-6 space-y-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Flame size={18} fill="currentColor" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">
                      Live-analyysi
                    </h3>
                  </div>

                  {/* Hotspots */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                      Lain Hotspotit
                    </p>
                    <div className="space-y-2">
                      {(
                        (selectedBill?.analysis_data as any)?.hotspots ||
                        (selectedBill?.analysis_data as any)
                          ?.controversy_hotspots || [
                          "Rahoitusmalli",
                          "Vaikutukset pienituloisiin",
                        ]
                      )
                        .slice(0, 3)
                        .map((h: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-white/5 p-2 rounded-xl"
                          >
                            <AlertCircle
                              size={12}
                              className="text-orange-500"
                            />
                            {typeof h === "string" ? h : h.topic}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Integrity Alerts */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                      Takinkääntö-hälytykset
                    </p>
                    <div className="space-y-2">
                      {alerts.length > 0 ? (
                        alerts.map((a, i) => (
                          <div
                            key={i}
                            className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-rose-400 uppercase">
                                {a.category}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            </div>
                            <p className="text-[9px] text-slate-400 leading-tight italic">
                              "{a.reasoning.substring(0, 50)}..."
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500/70 py-2">
                          <ShieldCheck size={14} />
                          Ei havaittuja ristiriitoja
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex flex-col h-[600px] bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-950/30">
                  <AnimatePresence initial={false}>
                    {messages
                      .filter(
                        (m) =>
                          m.role !== "user" || m.content.includes("Aloitetaan"),
                      )
                      .map((m) => {
                        if (
                          m.role === "user" &&
                          m.content.includes("Aloitetaan")
                        )
                          return null;

                        const parsed =
                          m.role === "assistant"
                            ? parseMessage(m.content)
                            : {
                                text: m.content,
                                speaker: "USER",
                                status: "Referee",
                                facts: null as any,
                              };
                        const isChamp = parsed.speaker === "CHAMPION";
                        const isMod = parsed.speaker === "MODERATOR";

                        return (
                          <motion.div
                            key={m.id}
                            initial={{
                              opacity: 0,
                              x: isChamp ? -20 : isMod ? 0 : 20,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${isChamp ? "justify-start" : isMod ? "justify-center" : "justify-end"}`}
                          >
                            <div
                              className={`${isMod ? "max-w-full w-full" : "max-w-[85%]"} space-y-3`}
                            >
                              <div
                                className={`flex items-center gap-3 ${isChamp ? "flex-row" : isMod ? "justify-center" : "flex-row-reverse"}`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${isChamp ? "bg-yellow-500 text-slate-950" : isMod ? "bg-slate-700 text-slate-300" : "bg-orange-500 text-white"}`}
                                >
                                  {isChamp ? (
                                    <Trophy size={16} />
                                  ) : isMod ? (
                                    <Info size={16} />
                                  ) : (
                                    <Sword size={16} />
                                  )}
                                </div>
                                <div
                                  className={`flex flex-col ${isMod ? "items-center" : ""}`}
                                >
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    {isChamp
                                      ? championName
                                      : isMod
                                        ? "Moderaattori"
                                        : parsed.speaker === "USER"
                                          ? "Erotuomari"
                                          : `${selectedChallenger?.first_name} ${selectedChallenger?.last_name}`}
                                  </span>
                                  <span
                                    className={`text-[8px] font-bold uppercase italic ${isChamp ? "text-yellow-500" : isMod ? "text-slate-400" : "text-orange-500"}`}
                                  >
                                    {parsed.status}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-xl border ${
                                  isChamp
                                    ? "bg-slate-800 text-slate-200 border-yellow-500/10 rounded-tl-none"
                                    : isMod
                                      ? "bg-slate-900/80 text-slate-400 border-white/5 text-center italic"
                                      : parsed.speaker === "USER"
                                        ? "bg-blue-600 text-white border-none rounded-tr-none"
                                        : "bg-slate-800 text-slate-200 border-orange-500/10 rounded-tr-none"
                                }`}
                              >
                                {parsed.text}
                              </div>

                              {m.role === "assistant" && parsed.facts && (
                                <div
                                  className={`p-3 border rounded-2xl flex items-start gap-3 ml-2 ${parsed.facts.source === "Sidonnaisuus" ? "bg-orange-500/5 border-orange-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}
                                >
                                  {parsed.facts.source === "Sidonnaisuus" ? (
                                    <LinkIcon
                                      size={14}
                                      className="text-orange-400 shrink-0"
                                    />
                                  ) : (
                                    <ShieldCheck
                                      size={14}
                                      className="text-emerald-400 shrink-0"
                                    />
                                  )}
                                  <div className="space-y-1">
                                    <p
                                      className={`text-[8px] font-black uppercase tracking-widest ${parsed.facts.source === "Sidonnaisuus" ? "text-orange-400" : "text-emerald-400"}`}
                                    >
                                      {parsed.facts.source === "Sidonnaisuus"
                                        ? "Kytkökset"
                                        : "Referenssi"}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400">
                                      {parsed.facts.details ||
                                        parsed.facts.bill}{" "}
                                      {parsed.facts.vote
                                        ? `(${parsed.facts.vote})`
                                        : ""}
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
                <form
                  onSubmit={handleSubmit}
                  className="p-8 bg-slate-900 border-t border-white/5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Heitä haastava kysymys molemmille..."
                        className="w-full bg-slate-800 border border-white/5 p-5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner pr-16"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-all shadow-lg"
                      >
                        <Send size={20} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={triggerNextTurn}
                      disabled={isLoading}
                      className="w-full md:w-auto px-8 py-5 bg-slate-800 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Zap size={16} className="text-yellow-500" />
                      )}
                      Seuraava puheenvuoro
                    </button>
                  </div>

                  <div className="flex justify-between items-center px-2">
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
