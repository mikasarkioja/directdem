"use client";

import { FileText, Map, User, LayoutGrid, Users, Radio, BarChart3, TrendingUp, Activity, Sparkles, Briefcase, Shield, RefreshCw, Search, Database, Newspaper, Building2, Terminal, Settings } from "lucide-react";
import type { DashboardView, UserProfile } from "@/lib/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/lib/context/RoleContext";
import PartyPin from "./PartyPin";
import PulseButton from "./nav/PulseButton";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  user: UserProfile | null;
}

export default function Sidebar({ activeView, setActiveView, user }: SidebarProps) {
  const [userParty, setUserParty] = useState<any>(null);
  const { role, switchRole, isSwitching } = useRole();
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

  const citizenItems: Array<{ id: DashboardView; label: string; icon: typeof FileText; href?: string }> = [
    { id: "overview", label: "Uutisvirta", icon: Newspaper, href: "/?view=overview" },
    { id: "arena", label: "Hjallis-haaste", icon: BarChart3, href: "/arena" },
    { id: "profile", label: "Oma DNA", icon: User, href: "/profiili" },
    { id: "profile", label: "DNA-Testi", icon: Sparkles, href: "/testi" },
  ];

  const shadowItems: Array<{ id: DashboardView; label: string; icon: typeof FileText; href?: string }> = [
    { id: "workspace", label: "Työhuone", icon: Briefcase, href: "/dashboard" },
    { id: "bills", label: "Äänestysareena", icon: FileText, href: "/?view=bills" },
    { id: "municipal", label: "Valiokunta", icon: Shield, href: "/?view=municipal" },
    { id: "kuntavahti", label: "Kuntavahti", icon: Building2, href: "/dashboard?view=kuntavahti" },
  ];

  const researcherItems: Array<{ id: DashboardView; label: string; icon: typeof FileText; href?: string }> = [
    { id: "researcher", label: "Research Terminal", icon: Terminal, href: "/dashboard?view=researcher" },
    { id: "consensus", label: "Konsensuskartta", icon: Map, href: "/?view=consensus" },
    { id: "analysis", label: "Takinkääntö-vahti", icon: Activity, href: "/puolueet/analyysi" },
    { id: "ranking", label: "Massadata", icon: Database, href: "/ranking" },
  ];

  const menuItems = role === 'shadow_mp' 
    ? shadowItems 
    : (role === 'researcher' ? researcherItems : citizenItems);

  // const isAdmin = user?.email === 'nika.sarkioja@gmail.com' || user?.email?.includes('admin');
  const isAdmin = true; // TEMPORARY: Show for all users

  return (
    <aside className="hidden md:flex w-72 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex-col h-full shadow-2xl relative overflow-hidden transition-colors duration-500">
      <div className="p-10 pb-6 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-command-neon rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--accent-glow)]">
            <span className="text-white font-black text-xs italic">DD</span>
          </div>
          <Link href="/" className="text-xl font-black uppercase tracking-tighter text-command-dark dark:text-white hover:text-command-neon transition-colors">DirectDem</Link>
        </div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Democracy OS v1.0</p>
      </div>

      {isAdmin && (
        <div className="px-6 mb-4 relative z-10">
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 px-4 py-2 text-[10px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all uppercase tracking-widest"
          >
            <Shield size={12} />
            Admin Control
          </Link>
        </div>
      )}

      <div className="px-6 mb-6 relative z-10">
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
          {[
            { id: 'citizen', label: 'Kansalainen', icon: User },
            { id: 'shadow_mp', label: 'Edustaja', icon: Shield },
            { id: 'researcher', label: 'Tutkija', icon: Search }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => switchRole(r.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                role === r.id 
                  ? "bg-white dark:bg-white/10 shadow-sm text-command-neon" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <r.icon size={14} className={role === r.id ? "text-[var(--accent-primary)]" : ""} />
              <span className="text-[7px] font-black uppercase mt-1 tracking-tighter">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="mb-4 pt-4">
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">
            The Lens: {role.replace('_', ' ').toUpperCase()}
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            const content = (
              <>
                <Icon size={18} className={`${isActive ? "text-[var(--accent-primary)]" : "text-slate-400 group-hover:text-command-dark dark:group-hover:text-white"} transition-colors`} />
                <span className={`text-sm font-black uppercase tracking-tight ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100 text-slate-500 dark:text-slate-400"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1.5 h-6 bg-[var(--accent-primary)] rounded-r-full shadow-[4px_0_15px_var(--accent-glow)]"
                  />
                )}
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id + item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${
                    isActive
                      ? "bg-blue-50 dark:bg-white/5 text-command-dark dark:text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-command-dark dark:hover:text-white"
                  }`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id + item.label}
                onClick={() => handleViewChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${
                  isActive
                    ? "bg-blue-50 dark:bg-white/5 text-command-dark dark:text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-command-dark dark:hover:text-white"
                }`}
              >
                {content}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-8 border-t border-slate-100 dark:border-white/5 relative z-10 flex flex-col items-center gap-6">
        <PulseButton />
        
        <div className="w-full bg-slate-50 dark:bg-white/5 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 flex items-center justify-center text-command-dark dark:text-white">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase text-command-dark dark:text-white truncate">{user?.full_name || "Vieras"}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">Henkilöllisyys vahvistettu</p>
          </div>
        </div>
      </div>

      {/* Decorative background pulse */}
      <div className={`absolute bottom-[-10%] -right-10 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none transition-colors duration-1000 bg-[var(--accent-primary)]`} />
    </aside>
  );
}
