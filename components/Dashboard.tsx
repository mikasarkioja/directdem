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
                <div className="flex gap-2">
                  {["Espoo", "Helsinki"].map(muni => (
                    <button
                      key={muni}
                      onClick={() => setSelectedMunicipality(muni)}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all ${
                        selectedMunicipality === muni
                          ? "bg-nordic-blue text-white border-nordic-blue"
                          : "bg-white text-nordic-dark border-nordic-gray/20"
                      }`}
                    >
                      {muni}
                    </button>
                  ))}
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
