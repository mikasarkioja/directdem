"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ActiveBills from "./ActiveBills";
import MunicipalDashboard from "./MunicipalDashboard";
import ConsensusMap from "./ConsensusMap";
import MyProfile from "./MyProfile";
import BottomNav from "./BottomNav";
import ContextSwitcher, { ViewContext } from "./ContextSwitcher";
import type { DashboardView, UserProfile } from "@/lib/types";

interface DashboardProps {
  user: UserProfile | null;
}

import Sidebar from "./Sidebar";
import ActiveBills from "./ActiveBills";
import MunicipalDashboard from "./MunicipalDashboard";
import ConsensusMap from "./ConsensusMap";
import MyProfile from "./MyProfile";
import BottomNav from "./BottomNav";
import ContextSwitcher, { ViewContext } from "./ContextSwitcher";
import ImpactStats from "./ImpactStats";
import QuestLog from "./QuestLog";
import type { DashboardView, UserProfile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Radio } from "lucide-react";

interface DashboardProps {
  user: UserProfile | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>("bills");
  const [viewContext, setViewContext] = useState<ViewContext>("parliament");
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality || "Espoo");
  const [isCommandCenter, setIsCommandCenter] = useState(true);

  // Suggest municipal context if user has municipality in profile
  useEffect(() => {
    if (user?.municipality) {
      setSelectedMunicipality(user.municipality);
    }
  }, [user]);

  return (
    <>
      <div className="flex h-screen bg-command-bg text-white overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
        
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative custom-scrollbar">
          {/* Neon Grid Background Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl font-black uppercase tracking-tighter neon-text text-command-neon"
                >
                  Civic Command Center
                </motion.h1>
                <p className="text-command-gray text-xs font-black uppercase tracking-[0.3em] mt-1">
                  System Active — User: {user?.full_name || "Guest Citizen"}
                </p>
              </div>

              <div className="flex items-center gap-2 p-1 bg-command-card rounded-xl border border-white/5 shadow-inner">
                <button
                  onClick={() => setIsCommandCenter(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    isCommandCenter ? "bg-command-neon text-command-bg shadow-lg" : "text-command-gray hover:text-white"
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Overview
                </button>
                <button
                  onClick={() => setIsCommandCenter(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    !isCommandCenter ? "bg-command-neon text-command-bg shadow-lg" : "text-command-gray hover:text-white"
                  }`}
                >
                  <Radio size={14} />
                  Live Arena
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isCommandCenter ? (
                <motion.div
                  key="command-center"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-8"
                >
                  <ImpactStats 
                    impactPoints={user?.impact_points || 450} 
                    democracyGapReduced={34} 
                    level={user?.level || 4} 
                    xp={user?.xp || 1200} 
                    nextLevelXp={2500} 
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-command-card rounded-2xl border border-white/5 p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-black uppercase tracking-tighter text-white">Viimeisimmät esitykset</h3>
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
                    
                    <div className="space-y-8">
                      <QuestLog />
                      <div className="bg-command-card rounded-2xl border border-white/5 p-6">
                        <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-4">Tribe Map</h3>
                        <div className="aspect-square bg-command-bg rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.1)_0%,transparent_70%)]"></div>
                          <span className="text-command-gray text-[10px] font-black uppercase tracking-widest">Visualizing Tribes...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="live-arena"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {activeView === "bills" && (
                    viewContext === "parliament" 
                      ? <ActiveBills user={user} /> 
                      : <MunicipalDashboard user={user} initialMunicipality={selectedMunicipality} />
                  )}
                  {activeView === "consensus" && <ConsensusMap />}
                  {activeView === "profile" && <MyProfile user={user} />}
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
