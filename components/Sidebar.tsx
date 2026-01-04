"use client";

import { FileText, Map, User, LayoutGrid, Users, Radio, BarChart3, TrendingUp, Activity } from "lucide-react";
import type { DashboardView, UserProfile } from "@/lib/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PartyPin from "./PartyPin";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  user: UserProfile | null;
}

export default function Sidebar({ activeView, setActiveView, user }: SidebarProps) {
  const [userParty, setUserParty] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadParty() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("party_members")
        .select("virtual_parties(*)")
        .eq("user_id", user.id)
        .single();
      
      if (data && data.virtual_parties) {
        setUserParty(data.virtual_parties);
      }
    }
    loadParty();
  }, [user]);

  const handleViewChange = (view: DashboardView) => {
    if (pathname !== "/") {
      router.push("/");
      // Small timeout to allow navigation before setting view
      setTimeout(() => setActiveView(view), 100);
    } else {
      setActiveView(view);
    }
  };

  const menuItems: Array<{ id: DashboardView; label: string; icon: typeof FileText; href?: string }> = [
    { id: "overview", label: "Keskus", icon: LayoutGrid },
    { id: "bills", label: "Äänestysareena", icon: FileText },
    { id: "profile", label: "DNA-Testi", icon: Sparkles, href: "/testi" },
    { id: "consensus", label: "Konsensuskartta", icon: Map },
    { id: "parties", label: "Heimot", icon: Users },
    { id: "ranking", label: "Voimasuhteet", icon: TrendingUp, href: "/ranking" },
    { id: "analysis", label: "Takinkääntö-vahti", icon: Activity, href: "/puolueet/analyysi" },
    { id: "debate", label: "The Agora", icon: Radio, href: "/vaittely/demo" },
    { id: "overview", label: "Hjallis-haaste", icon: BarChart3, href: "/demo/harkimo" },
    { id: "profile", label: "Oma DNA", icon: User },
  ];

  return (
    <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col h-full shadow-sm">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-command-neon rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs italic">DD</span>
          </div>
          <Link href="/" className="text-xl font-black uppercase tracking-tighter text-command-dark hover:text-command-neon transition-colors">DirectDem</Link>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Democracy OS v1.0</p>
      </div>

      <nav className="flex-1 px-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          const content = (
            <>
              <Icon size={18} className={`${isActive ? "text-command-neon" : "text-slate-400 group-hover:text-command-dark"} transition-colors`} />
              <span className={`text-sm font-black uppercase tracking-tight ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-1 h-6 bg-command-neon rounded-r-full"
                />
              )}
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${
                  isActive
                    ? "bg-blue-50 text-command-neon shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-command-dark"
                }`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${
                isActive
                  ? "bg-blue-50 text-command-neon shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-command-dark"
              }`}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className="p-8 border-t border-slate-50">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-command-dark">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <p className="text-[10px] font-black uppercase text-command-dark truncate">{user?.full_name || "Guest"}</p>
              {userParty && (
                <PartyPin 
                  dnaProfile={userParty.dna_profile_avg} 
                  level={userParty.level} 
                  partyName={userParty.name} 
                />
              )}
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase truncate">Citizen ID Verified</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
