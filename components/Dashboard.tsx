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

export default function Dashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>("bills");
  const [viewContext, setViewContext] = useState<ViewContext>("parliament");
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality || "Espoo");

  // Suggest municipal context if user has municipality in profile
  useEffect(() => {
    if (user?.municipality) {
      setSelectedMunicipality(user.municipality);
    }
  }, [user]);

  return (
    <>
      <div className="flex h-screen bg-nordic-white">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {/* Main Context Header */}
          {activeView === "bills" && (
            <div className="flex flex-col items-center p-4 bg-white border-b border-nordic-gray/20 sticky top-0 z-20 gap-3">
              <ContextSwitcher 
                currentContext={viewContext} 
                onContextChange={setViewContext} 
                municipality={selectedMunicipality}
              />
              
              {viewContext === "municipal" && (
                <div className="flex gap-3">
                  {["Espoo", "Helsinki", "Aloitteet"].map(muni => {
                    const isActive = selectedMunicipality === muni;
                    return (
                      <button
                        key={muni}
                        onClick={() => setSelectedMunicipality(muni)}
                        className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all shadow-sm ${
                          isActive
                            ? "bg-white text-nordic-blue border-nordic-blue ring-2 ring-nordic-blue/10"
                            : "bg-white/50 text-nordic-dark border-nordic-gray/30 hover:bg-white"
                        }`}
                      >
                        {muni === "Espoo" && (
                          <div className="w-4 h-4 bg-[#005eb8] rounded-sm flex items-center justify-center text-white text-[10px] font-bold">E</div>
                        )}
                        {muni === "Helsinki" && (
                          <div className="w-4 h-4 bg-[#0000bf] rounded-sm flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" /></svg>
                          </div>
                        )}
                        {muni === "Aloitteet" ? "🔥 Aloitteet" : muni}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeView === "bills" && (
            viewContext === "parliament" 
              ? <ActiveBills user={user} /> 
              : <MunicipalDashboard user={user} initialMunicipality={selectedMunicipality} />
          )}
          
          {activeView === "consensus" && <ConsensusMap />}
          {activeView === "profile" && <MyProfile user={user} />}
        </main>
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </>
  );
}
