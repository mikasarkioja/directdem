"use client";

import { FileText, Map, User } from "lucide-react";
import type { DashboardView, UserProfile } from "@/lib/types";

interface SidebarProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  user: UserProfile | null;
}

export default function Sidebar({ activeView, setActiveView, user }: SidebarProps) {
  const menuItems: Array<{ id: DashboardView; label: string; icon: typeof FileText }> = [
    { id: "bills", label: "Active Bills", icon: FileText },
    { id: "consensus", label: "Consensus Map", icon: Map },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-nordic-deep text-nordic-white flex-col">
      <div className="p-6 border-b border-nordic-darker">
        <h1 className="text-2xl font-bold">DirectDem</h1>
        <p className="text-sm text-nordic-gray mt-1">Finnish Democracy Dashboard</p>
      </div>
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? "bg-nordic-blue text-white"
                  : "text-nordic-gray hover:bg-nordic-darker hover:text-nordic-white"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}


