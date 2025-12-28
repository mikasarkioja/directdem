"use client";

import { FileText, Map, User } from "lucide-react";
import Auth from "./Auth";

type View = "bills" | "consensus" | "profile";

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  user: any;
}

export default function Sidebar({ activeView, setActiveView, user }: SidebarProps) {
  const menuItems = [
    { id: "bills" as View, label: "Active Bills", icon: FileText },
    { id: "consensus" as View, label: "Consensus Map", icon: Map },
    { id: "profile" as View, label: "My Profile", icon: User },
  ];
  
  // Add test API link (only in development)
  const isDev = process.env.NODE_ENV === "development";

  return (
    <aside className="w-64 bg-nordic-deep text-nordic-white flex flex-col">
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
      <div className="p-4 border-t border-nordic-darker">
        <Auth user={user} />
      </div>
    </aside>
  );
}


