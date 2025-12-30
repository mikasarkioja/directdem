"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ActiveBills from "./ActiveBills";
import ConsensusMap from "./ConsensusMap";
import MyProfile from "./MyProfile";
import BottomNav from "./BottomNav";
import Auth from "./Auth";

type View = "bills" | "consensus" | "profile";

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<View>("bills");

  return (
    <>
      <div className="flex h-screen bg-nordic-white">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {activeView === "bills" && <ActiveBills />}
          {activeView === "consensus" && <ConsensusMap />}
          {activeView === "profile" && <MyProfile />}
        </main>
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </>
  );
}


