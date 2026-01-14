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
  ChevronRight,
  TrendingUp,
  PieChart,
  FileText,
  Clock,
  Calendar,
  LayoutGrid,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { DependencyTimeline } from "./DependencyTimeline";
import { getDependencyTimelineData } from "@/app/actions/dependency-timeline";
import { MeetingTimeline } from "./MeetingTimeline";
import { getMeetingTimelineData } from "@/app/actions/researcher";
import { motion, AnimatePresence } from "framer-motion";
import { getResearchNotes, addResearchNote, ResearchNote } from "@/app/actions/research-notes";
import LobbyistScorecard from "./LobbyistScorecard";
import ImpactMap from "./ImpactMap";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { exportResearcherData, getLoyaltyData, getResearcherStats } from "@/app/actions/researcher";
import { UserProfile } from "@/lib/types";

interface ResearcherWorkspaceProps {
  userPlan: string;
  researcherProfile?: any;
}

export default function ResearcherWorkspace({ userPlan, researcherProfile }: ResearcherWorkspaceProps) {
  const [activeModule, setActiveModule] = useState<string>("overview");
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<{events: any[], summary: string}>({ events: [], summary: "" });
  const [meetingPoints, setMeetingPoints] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [stats, setStats] = useState({ corpusSize: 0, significanceSpikes: 0, collaborativePeak: 0 });

  const isLocked = false; 

  const modules = [
    { id: "overview", label: "Tutkijan Dashboard", icon: LayoutGrid, group: "Yleinen" },
    { id: "behavior", label: "Päättäjä-analytiikka", icon: Activity, group: "Poliittinen Analyysi" },
    { id: "dependency_timeline", label: "Sidonnaisuus-aikajana", icon: Clock, group: "Poliittinen Analyysi" },
    { id: "democracy_state", label: "Demokratian Tila", icon: BarChart2, group: "Poliittinen Analyysi" },
    { id: "scorecard", label: "Lobby-Scorecard", icon: Target, group: "Vaikuttavuus" },
    { id: "impact", label: "Lobbari-jäljitys", icon: Search, group: "Vaikuttavuus" },
    { id: "meeting_timeline", label: "Tapaamis-aikajana", icon: Calendar, group: "Vaikuttavuus" },
    { id: "discipline", label: "Puoluekuri-indeksi", icon: Users, group: "Poliittinen Analyysi" },
    { id: "export", label: "Datan ulosvienti", icon: Download, group: "Data" }
  ];

  const researcherTypeLabels: Record<string, string> = {
    academic: "Akateeminen Tutkija",
    journalist: "Tutkiva Toimittaja",
    policy_expert: "Politiikan Asiantuntija",
    strategist: "Strateginen Neuvonantaja"
  };

  useEffect(() => {
    async function loadNotes() {
      const data = await getResearchNotes();
      setNotes(data);
    }
    loadNotes();
    
    if (!isLocked && activeModule === "discipline") {
      getLoyaltyData().then(setLoyaltyData);
    }

    if (!isLocked && activeModule === "dependency_timeline") {
      setIsLoadingTimeline(true);
      // Using a sample MP ID (e.g., 1328 for Harkimo) for the timeline demo
      getDependencyTimelineData(1328).then(data => {
        setTimelineData(data);
        setIsLoadingTimeline(false);
      });
    }

    if (!isLocked && activeModule === "meeting_timeline") {
      setIsLoadingTimeline(true);
      getMeetingTimelineData("latest").then(points => {
        setMeetingPoints(points);
        setIsLoadingTimeline(false);
      });
    }

    // Fetch live stats
    getResearcherStats().then(setStats);
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
      <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center space-y-8 min-h-[600px] flex flex-col items-center justify-center shadow-2xl">
        <Lock className="text-slate-300 w-16 h-16 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Tutkijan tunnistautuminen vaaditaan</h2>
        <p className="text-slate-400 max-w-md mx-auto font-serif">Syväanalyysimoduulit on rajoitettu vain vahvistetuille akateemisille ja journalistisille tileille.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-[#fdfdfd] border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl font-sans text-slate-900">
      {/* Sidebar - Scientific Navigation */}
      <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 leading-none mb-1 truncate">
                {researcherProfile?.researcher_type ? researcherTypeLabels[researcherProfile.researcher_type] : "Akateeminen_Protokolla"}
              </h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">
                ID: {researcherProfile?.id?.substring(0, 8) || "VIERAS"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {["Yleinen", "Poliittinen Analyysi", "Vaikuttavuus", "Data"].map(group => (
            <div key={group} className="space-y-2">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{group}</h4>
              <div className="space-y-0.5">
                {modules.filter(m => m.group === group).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                      activeModule === m.id 
                        ? "bg-white shadow-sm border border-slate-200 text-slate-900" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent"
                    }`}
                  >
                    <m.icon size={15} className={activeModule === m.id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"} />
                    <span className="text-[10px] font-bold tracking-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Aktiivinen tutkimusympäristö</span>
          </div>
        </div>
      </aside>

      {/* Main Research Content Area */}
      <main className="flex-1 flex flex-col bg-white">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-10">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nykyinen projekti</span>
            <div className="w-px h-4 bg-slate-200" />
            <span className="text-xs font-bold text-slate-900">Suora demokratia & Lainsäädännöllinen vaikutusindeksi 2025</span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <MessageSquare size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-16 max-w-[1200px] mx-auto"
            >
              {activeModule === "overview" && (
                <div className="space-y-16">
                  {/* Dashboard Header */}
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Tutkijan Dashboard</h3>
                    <p className="text-base text-slate-500 font-serif italic">Keskitetty näkymä poliittiseen dataan, analyyseihin ja havaintoihin.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                      { label: "Analyysikorpuksen koko", value: stats.corpusSize.toLocaleString(), sub: "Analysoitua asiatekstiä", color: "border-slate-200" },
                      { label: "Merkittävyyspiikit", value: stats.significanceSpikes.toLocaleString(), sub: "Käyttäytymishavaintoa", color: "border-emerald-200" },
                      { label: "Yhteistyön huippuarvo", value: stats.collaborativePeak.toLocaleString(), sub: "Asiantuntijaverkosto", color: "border-purple-200" }
                    ].map((stat, i) => (
                      <div key={i} className={`bg-white border-b-2 ${stat.color} p-10 space-y-4 shadow-sm rounded-2xl`}>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary Widgets Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Widget 1: Gap Analysis */}
                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-8 shadow-inner">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Kansalaiskuilu (Gap Analysis)</h4>
                        <button onClick={() => setActiveModule("behavior")} className="text-[8px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1">
                          Kaikki analyysit <ChevronRight size={10} />
                        </button>
                      </div>
                      <p className="text-xl text-slate-800 leading-relaxed italic font-serif border-l-4 border-slate-200 pl-6">
                        "Suurin divergenssi havaittu **ympäristöpolitiikassa**: Kansalaiset +8.2 vs. Päättäjät 3.4."
                      </p>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Divergenssi</p>
                          <p className="text-xl font-black text-rose-600">4.8 pistettä</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Trendi</p>
                          <p className="text-xl font-black text-slate-900">Kasvava</p>
                        </div>
                      </div>
                    </div>

                    {/* Widget 2: Transparency & Radar */}
                    <div className="p-10 bg-white border border-slate-200 rounded-[2.5rem] space-y-8 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Läpinäkyvyys-tutka</h4>
                        <button onClick={() => setActiveModule("scorecard")} className="text-[8px] font-black uppercase text-cyan-600 hover:underline flex items-center gap-1">
                          Lobby-scorecard <ChevronRight size={10} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 uppercase">Korkea sidonnaisuus-riski</p>
                            <p className="text-[11px] text-slate-500 leading-tight mt-1">HE 123/2025: 12 edustajalla havaittu suora kytkös toimialaan.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 uppercase">Lobbari-jäljitys aktiivinen</p>
                            <p className="text-[11px] text-slate-500 leading-tight mt-1">EK:n asiantuntijalausuntojen tekstivaste noussut 15%:iin talousvaliokunnassa.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collaborative Notes Preview */}
                  <div className="bg-slate-900 rounded-[3rem] p-12 text-white space-y-8">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                      <div className="flex items-center gap-4">
                        <Users className="text-purple-400" size={24} />
                        <h4 className="text-xl font-black uppercase tracking-tighter">Asiantuntijaverkosto & Huomiot</h4>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{notes.length} Aktiivista keskustelua</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {notes.slice(0, 4).map((note) => (
                        <div key={note.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                              {note.category || "Yleinen"}
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase">{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 italic leading-relaxed">"{note.content.substring(0, 120)}..."</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 text-center">
                      <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                        Avaa yhteistyö-terminaali ja lisää huomioita
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === "behavior" && (
                <div className="space-y-16">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Päättäjä-analytiikka</h3>
                    <p className="text-base text-slate-500 font-serif italic">Kvantitatiivinen analyysi eduskunnan ja kunnanvaltuustojen työskentelytavoista.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-serif">
                    <div className="bg-white border border-slate-200 p-12 rounded-[2.5rem] space-y-10 shadow-sm">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Valtakunnallinen Dynamiikka</h4>
                      <div className="space-y-10">
                        {[
                          { title: "Ryhmäkurin Vaikutus", val: "98.4%", desc: "Hallituspuolueiden äänestysyhtenäisyys on historiallisen korkealla tasolla." },
                          { title: "Polarisoitunut Retoriikka", val: "+15%", desc: "Vastakkainasettelua kuvaavien termien käyttö on lisääntynyt talousdebateissa." },
                          { title: "Poikkeava Käyttäytyminen", val: "2.1%", desc: "Yksittäisten kansanedustajien irtiotot puolueen linjasta ovat harvinaisia." }
                        ].map((m, i) => (
                          <div key={i} className="space-y-3 pb-8 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className="flex justify-between items-end">
                              <span className="text-xl font-bold text-slate-900 italic">{m.title}</span>
                              <span className="text-3xl font-black text-slate-900">{m.val}</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 p-12 rounded-[2.5rem] space-y-10 shadow-xl text-white">
                      <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] mb-6">Kunnallinen Työskentely</h4>
                      <div className="space-y-10">
                        {[
                          { title: "Paikalliset Koalitiot", val: "Epävakaa", desc: "Helsingissä on syntymässä uusia, dynaamisia koalitioita kaavoituskysymyksissä." },
                          { title: "Budjettikuri", val: "Tiukka", desc: "Säästöpaineet ohittavat nyt investointilupaukset Espoossa ja Vantaalla." },
                          { title: "Kansalaisvaikuttavuus", val: "Nouseva", desc: "Paikalliset aloitteet saavat nyt 12% enemmän painoarvoa päätöksissä." }
                        ].map((m, i) => (
                          <div key={i} className="space-y-3 pb-8 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="flex justify-between items-end">
                              <span className="text-xl font-bold text-white italic">{m.title}</span>
                              <span className="text-3xl font-black text-white">{m.val}</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === "dependency_timeline" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Sidonnaisuus-aikajana</h3>
                    <p className="text-base text-slate-500 font-serif italic">Sidonnaisuuksien kehitys suhteessa poliittiseen toimintaan.</p>
                  </div>
                  
                  {isLoadingTimeline ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <Loader2 className="animate-spin text-slate-300" size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lasketaan korrelaatioita...</p>
                    </div>
                  ) : (
                    <DependencyTimeline 
                      events={timelineData.events} 
                      summary={timelineData.summary} 
                    />
                  )}
                </div>
              )}

              {activeModule === "democracy_state" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Suoran Demokratian Tila</h3>
                    <p className="text-sm text-slate-500 font-serif italic">Pitkän aikavälin trendit ja kansalaismielipiteen vaikutus valtaan.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ideologinen Vastaavuus (DNA vs Äänestykset)</h4>
                        <div className="h-64 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,.02)_25%,_rgba(0,0,0,.02)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,.02)_75%,_rgba(0,0,0,.02))] bg-[length:20px_20px]" />
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest z-10 animate-pulse">Lasketaan edustavuusindeksiä...</p>
                        </div>
                        <div className="space-y-4 font-serif">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Viimeisen kuuden kuukauden aikana **Representation Index** on laskenut 4.2%. 
                            Tämä viittaa siihen, että eduskunnan agendat erkanevat digitaalisesti aktiivisten kansalaisten tavoitteista.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-10 rounded-[2rem] space-y-10 border border-slate-200">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Demokratian Tunnusluvut (Q1 2025)</h4>
                      <div className="space-y-8">
                        {[
                          { label: "Kansalaisosallistuminen", value: 74, color: "bg-slate-900", trend: "+12%" },
                          { label: "Poliittinen Vaste (Responsiveness)", value: 22, color: "bg-rose-500", trend: "-5%" },
                          { label: "Datan Läpinäkyvyys", value: 89, color: "bg-emerald-500", trend: "0%" }
                        ].map((metric, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-500 block">{metric.label}</span>
                                <span className="text-xs font-bold text-slate-400">{metric.trend} vs ed. kausi</span>
                              </div>
                              <span className="text-xl font-black text-slate-900">{metric.value}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                className={`h-full ${metric.color}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === "scorecard" && <LobbyistScorecard userPlan={userPlan} />}
              {activeModule === "impact" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Lobbari-jäljitys</h3>
                    <p className="text-base text-slate-500 font-serif italic">Analyysi etujärjestöjen lausuntojen vaikutuksesta lopulliseen lakitekstiin.</p>
                  </div>
                  <ImpactMap billId="latest" />
                </div>
              )}
              
              {activeModule === "meeting_timeline" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Tapaamis-aikajana</h3>
                    <p className="text-base text-slate-500 font-serif italic">Lakiesityksen elinkaari: Tunnista korrelaatiot lobbaustapaamisten ja lakitekstin muutosten välillä.</p>
                  </div>
                  <MeetingTimeline points={meetingPoints} />
                </div>
              )}
              
              {activeModule === "discipline" && (
                <div className="space-y-12">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Ryhmäkuri-matriisi</h3>
                    <p className="text-xs text-slate-500 font-serif italic">Ideologinen vapausaste vs. puolueen virallinen äänestyslinja.</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-12 rounded-[3rem] h-[500px] shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Economic" domain={[-1, 1]} stroke="#94a3b8" />
                        <YAxis type="number" dataKey="y" name="Social" domain={[-1, 1]} stroke="#94a3b8" />
                        <ZAxis type="number" dataKey="loyalty" range={[50, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="MPS" data={loyaltyData}>
                          {loyaltyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.loyalty > 90 ? '#0f172a' : '#cbd5e1'} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeModule === "export" && (
                <div className="max-w-2xl mx-auto py-20 text-center space-y-12">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-slate-200 shadow-sm">
                    <Download className="text-slate-900 w-12 h-12" />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Datan_vienti_protokolla</h3>
                    <p className="text-slate-500 text-sm font-serif leading-relaxed max-w-lg mx-auto italic">
                      Nouda DirectDem-alustan keräämä anonymisoitu raakadata akateemista tutkimusta varten. 
                      Datasetit sisältävät koodatut äänestystulokset, DNA-trendit ja kielimallien analyysit.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button className="p-10 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl hover:bg-slate-800 flex flex-col items-center gap-6 border border-white/10">
                      <Database size={32} />
                      Lataa täysi JSON-paketti
                    </button>
                    <button className="p-10 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-50 flex flex-col items-center gap-6">
                      <Layers size={32} />
                      Vie CSV-muodossa (tilastot)
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
