"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ActiveBills from "./ActiveBills";
import MunicipalDashboard from "./MunicipalDashboard";
import ConsensusMap from "./ConsensusMap";
import MyProfile from "./MyProfile";
import BottomNav from "./BottomNav";
import ContextSwitcher, { ViewContext } from "./ContextSwitcher";
import ImpactStats from "./ImpactStats";
import QuestLog from "./QuestLog";
import PartiesView from "./PartiesView";
import DebateArena from "./DebateArena";
import type { DashboardView, UserProfile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Radio } from "lucide-react";

interface DashboardProps {
  user: UserProfile | null;
  initialView?: DashboardView;
}

export default function Dashboard({ user, initialView = "overview" }: DashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [viewContext, setViewContext] = useState<ViewContext>("parliament");
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality || "Espoo");

  // Sync state with initialView prop if it changes (e.g. navigation)
  useEffect(() => {
    if (initialView && initialView !== activeView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Suggest municipal context if user has municipality in profile
  useEffect(() => {
    if (user?.municipality) {
      setSelectedMunicipality(user.municipality);
    }
  }, [user]);

  return (
    <>
      <div className="flex h-screen bg-[#F8FAFC] text-command-dark overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
        
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative custom-scrollbar">
          <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-black uppercase tracking-tight text-command-dark"
                >
                  Civic <span className="text-command-neon">Command Center</span>
                </motion.h1>
                <p className="text-command-gray text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">
                  User: {user?.full_name || "Guest Citizen"} — Identity Verified
                </p>
              </div>

              <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setActiveView("overview")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeView === "overview" ? "bg-command-neon text-white shadow-md" : "text-command-gray hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView("bills")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeView !== "overview" ? "bg-command-neon text-white shadow-md" : "text-command-gray hover:bg-slate-50"
                  }`}
                >
                  <Radio size={14} />
                  Live Arena
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeView === "overview" ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-10"
                >
                  <ImpactStats 
                    impactPoints={user?.impact_points || 450} 
                    democracyGapReduced={34} 
                    level={user?.level || 4} 
                    xp={user?.xp || 1200} 
                    nextLevelXp={2500} 
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                          <h3 className="text-sm font-black uppercase tracking-widest text-command-dark">Viimeisimmät esitykset</h3>
                          <ContextSwitcher 
                            currentContext={viewContext} 
                            onContextChange={setViewContext} 
                            municipality={selectedMunicipality}
                          />
                        </div>
                        <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {viewContext === "parliament" 
                            ? <ActiveBills user={user} /> 
                            : <MunicipalDashboard user={user} initialMunicipality={selectedMunicipality} />
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-10">
                      <QuestLog />
                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-command-dark mb-6">Tribe Map</h3>
                        <div className="aspect-square bg-[#F8FAFC] rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden group cursor-help">
                          {/* Tribe Map SVG Visual */}
                          <svg viewBox="0 0 200 200" className="w-full h-full p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <defs>
                              <radialGradient id="nordicGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                <stop offset="0%" stopColor="#005EB8" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#005EB8" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
                            <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
                            <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
                            
                            {/* Tribe Clusters */}
                            <motion.circle 
                              animate={{ scale: [1, 1.05, 1] }} 
                              transition={{ duration: 4, repeat: Infinity }}
                              cx="60" cy="70" r="15" fill="url(#nordicGradient)" 
                            />
                            <motion.circle 
                              animate={{ scale: [1, 1.1, 1] }} 
                              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                              cx="140" cy="80" r="20" fill="rgba(225, 29, 72, 0.05)" 
                            />
                            <motion.circle 
                              animate={{ scale: [1, 1.08, 1] }} 
                              transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                              cx="90" cy="140" r="18" fill="rgba(5, 150, 105, 0.05)" 
                            />

                            {/* User Position */}
                            <motion.circle 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              cx="100" cy="100" r="5" fill="#005EB8" 
                            />
                            <line x1="100" y1="100" x2="60" y2="70" stroke="rgba(0,94,184,0.1)" strokeWidth="1" />
                          </svg>
                          <div className="absolute bottom-6 left-0 right-0 text-center">
                            <span className="text-command-gray text-[8px] font-black uppercase tracking-[0.2em]">Olet tässä: Siviili-keskiö</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="other-views"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {activeView === "bills" && (
                    viewContext === "parliament" 
                      ? <ActiveBills user={user} /> 
                      : <MunicipalDashboard user={user} initialMunicipality={selectedMunicipality} />
                  )}
                  {activeView === "consensus" && <ConsensusMap />}
                  {activeView === "profile" && <MyProfile user={user} />}
                  {activeView === "parties" && <PartiesView user={user} />}
                  {activeView === "debate" && (
                    <DebateArena 
                      topic="Uusi pyörätieverkosto ja sen rahoitus" 
                      participants={[
                        { 
                          party: { 
                            id: "1", name: "Espoon Datapuolue", manifesto: "Olemme tiedon puolella.", 
                            dna_profile_avg: { fact_checker: 80, local_hero: 20 }, level: 5,
                            total_xp: 500, created_by: "1", logo_url: null
                          } as any, 
                          representativeName: "Data-Bot" 
                        },
                        { 
                          party: { 
                            id: "2", name: "Uudistajat", manifesto: "Uskallamme haastaa tilanteen.", 
                            dna_profile_avg: { reformer: 90, active: 10 }, level: 4,
                            total_xp: 400, created_by: "2", logo_url: null
                          } as any, 
                          representativeName: "Reform-Bot" 
                        },
                      ]}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </>
  );
}
