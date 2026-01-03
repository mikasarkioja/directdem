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

  // Suggest municipal context if user has municipality in profile
  useEffect(() => {
    if (user?.municipality && viewContext === "parliament" && activeView === "bills") {
      // Auto-switch to municipal if they are from Espoo (for now)
      if (user.municipality.toLowerCase() === "espoo") {
        // We could auto-switch here, but it might be better to just show the option
      }
    }
  }, [user, activeView, viewContext]);

  return (
    <>
      <div className="flex h-screen bg-nordic-white">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {/* Main Context Header */}
          {activeView === "bills" && (
            <div className="flex justify-center p-4 bg-white border-b border-nordic-gray/20 sticky top-0 z-20">
              <ContextSwitcher 
                currentContext={viewContext} 
                onContextChange={setViewContext} 
                municipality={user?.municipality || "Espoo"}
              />
            </div>
          )}

          {activeView === "bills" && (
            viewContext === "parliament" 
              ? <ActiveBills user={user} /> 
              : <MunicipalDashboard user={user} initialMunicipality={user?.municipality || "Espoo"} />
          )}
          
          {activeView === "consensus" && <ConsensusMap />}
          {activeView === "profile" && <MyProfile user={user} />}
        </main>
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </>
  );
}
