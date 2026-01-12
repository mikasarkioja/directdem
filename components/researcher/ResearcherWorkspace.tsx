"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  BarChart2, 
  Search, 
  Target, 
  Users, 
  Download, 
  MessageSquare, 
  Terminal, 
  Layers,
  Activity,
  BookOpen,
  Send,
  Loader2,
  Lock,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getResearchNotes, addResearchNote, ResearchNote } from "@/app/actions/research-notes";
import LobbyistScorecard from "./LobbyistScorecard";
import ImpactMap from "./ImpactMap";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { exportResearcherData, getLoyaltyData } from "@/app/actions/researcher";

interface ResearcherWorkspaceProps {
  userPlan: string;
}

export default function ResearcherWorkspace({ userPlan }: ResearcherWorkspaceProps) {
  const [activeModule, setActiveModule] = useState<string>("overview");
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any[]>([]);

  // TEMPORARY: Access suspended for testing
  const isLocked = false; // userPlan !== 'researcher' && userPlan !== 'admin' && userPlan !== 'premium';

  // Categories for organization
  const modules = [
    { id: "overview", label: "Terminaali", icon: Terminal, group: "Yleinen" },
    { id: "scorecard", label: "Lobby-Scorecard", icon: BarChart2, group: "Lobbaus ja Vaikuttaminen" },
    { id: "impact", label: "Tekstuaalinen Vaikutus", icon: Target, group: "Lobbaus ja Vaikuttaminen" },
    { id: "discipline", label: "Puoluekuri-analyysi", icon: Users, group: "Poliittinen Analyysi" },
    { id: "lobbying", label: "Lobbaus-vahti", icon: Search, group: "Lobbaus ja Vaikuttaminen" },
    { id: "export", label: "Data Export", icon: Download, group: "Data-louhinta" }
  ];

  useEffect(() => {
    async function loadNotes() {
      const data = await getResearchNotes();
      setNotes(data);
    }
    loadNotes();
    
    if (!isLocked && activeModule === "discipline") {
      getLoyaltyData().then(setLoyaltyData);
    }
  }, [activeModule, isLocked]);

  const handleSendNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await addResearchNote(newNote, activeModule);
      setNewNote("");
      const updated = await getResearchNotes();
      setNotes(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocked) {
    return (
      <div className="bg-slate-950 border border-cyan-500/20 rounded-[2rem] p-12 text-center space-y-8 relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 bg-cyan-600/20 rounded-3xl flex items-center justify-center mx-auto border border-cyan-500/30">
            <Lock className="text-cyan-400 w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Researcher Terminal Access Required</h2>
            <p className="text-slate-400 text-sm font-mono tracking-tight">
              &gt; STATUS: ACCESS_DENIED<br/>
              &gt; REQUIRED_LEVEL: RESEARCHER_V1<br/>
              &gt; DESCRIPTION: Academic analysis tools, Transparency Register correlation, and mass data export modules are restricted.
            </p>
          </div>
          <button className="w-full py-4 bg-cyan-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            Upgrade to Researcher Protocol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-slate-950 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl font-mono">
      {/* Sidebar - Research Navigation */}
      <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={16} className="text-cyan-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Research_OS v2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Connection: Secure_Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {["Yleinen", "Lobbaus ja Vaikuttaminen", "Poliittinen Analyysi", "Data-louhinta"].map(group => (
            <div key={group} className="space-y-2">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">{group}</h4>
              <div className="space-y-1">
                {modules.filter(m => m.group === group).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                      activeModule === m.id ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <m.icon size={16} className={activeModule === m.id ? "text-cyan-400" : "text-slate-500 group-hover:text-white"} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 bg-black/20 border-t border-white/5">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <p className="text-[8px] font-black text-slate-500 uppercase">Active Sessions</p>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-cyan-400">
                  R{i}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full bg-cyan-600/20 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-cyan-400">
                +12
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-900/20">
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {activeModule === "overview" && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: "Analysoidut dokumentit", value: "14,209", icon: BookOpen, color: "text-cyan-400" },
                      { label: "Vaikutuspiikit (2025)", value: "182", icon: Activity, color: "text-emerald-400" },
                      { label: "Aktiiviset tutkijat", value: "42", icon: Users, color: "text-purple-400" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl space-y-2">
                        <stat.icon className={stat.color} size={20} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase text-white tracking-tighter flex items-center gap-3">
                      <Terminal size={24} className="text-cyan-400" />
                      Global Research Feed
                    </h3>
                    <div className="space-y-4">
                      {notes.slice(0, 5).map((note) => (
                        <div key={note.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{note.author_name}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{note.category}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">{new Date(note.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed tracking-tight">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeModule === "scorecard" && <LobbyistScorecard userPlan={userPlan} />}
              {activeModule === "impact" && <ImpactMap billId="latest" />}
              
              {activeModule === "discipline" && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Puoluekurin Scatter Plot</h3>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Loyalty Score vs. Ideological Deviation</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[3rem] h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Talous" domain={[-1, 1]} hide />
                        <YAxis type="number" dataKey="y" name="Arvot" domain={[-1, 1]} hide />
                        <ZAxis type="number" dataKey="loyalty" range={[50, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="MPS" data={loyaltyData}>
                          {loyaltyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.loyalty > 90 ? '#06b6d4' : '#8b5cf6'} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeModule === "export" && (
                <div className="max-w-2xl mx-auto py-20 text-center space-y-10">
                  <div className="w-24 h-24 bg-cyan-600/20 rounded-[2rem] flex items-center justify-center mx-auto border border-cyan-500/30">
                    <Download className="text-cyan-400 w-12 h-12" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Massadata Exporter</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg mx-auto">
                      Nouda DirectDem-alustan keräämää ja AI-rikastettua dataa akateemiseen tutkimukseen tai data-journalismiin.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <button className="py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10 flex flex-col items-center gap-3">
                      <Database size={24} className="text-cyan-400" />
                      Download JSON (Full)
                    </button>
                    <button className="py-6 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-emerald-500/30 flex flex-col items-center gap-3">
                      <Layers size={24} className="text-emerald-400" />
                      Download CSV (Table)
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar - Collaborative Insights */}
      <aside className="w-80 bg-slate-900/80 border-l border-white/5 flex flex-col backdrop-blur-md">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} className="text-cyan-400" />
              Collaborative Notes
            </h4>
            <span className="px-2 py-0.5 bg-cyan-600/20 rounded text-[8px] font-black text-cyan-400 uppercase">Live</span>
          </div>
          
          <div className="relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Jaa havainto tutkijayhteisölle..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-h-[100px] resize-none transition-all"
            />
            <button
              onClick={handleSendNote}
              disabled={isSubmitting || !newNote.trim()}
              className="absolute bottom-3 right-3 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-[8px] font-black text-cyan-400 uppercase">
                      {note.author_name[0]}
                    </div>
                    <span className="text-[9px] font-black text-white uppercase tracking-tight">{note.author_name}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-cyan-500/30 transition-all relative">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={10} className="text-cyan-500" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    <span className="text-cyan-500 mr-1">&gt;</span>
                    {note.content}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-black/40 rounded text-[7px] font-black text-slate-500 uppercase tracking-widest">{note.category}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <MessageSquare size={32} className="text-slate-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Ei havaintoja vielä</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

