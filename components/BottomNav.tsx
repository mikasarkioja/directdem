"use client";

import { LayoutGrid, FileText, Map as MapIcon, User, Users, Radio, Search } from "lucide-react";
import type { DashboardView } from "@/lib/types";
import Link from "next/link";
import PulseButton from "./nav/PulseButton";
import { useRole } from "@/lib/context/RoleContext";

interface BottomNavProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

interface NavItem {
  label: string;
  view: DashboardView;
  icon: any;
  href?: string;
}

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const { role } = useRole();

  const getNavItems = (): NavItem[] => {
    const common: NavItem[] = [
      { label: "Keskus", view: "overview" as const, icon: LayoutGrid },
    ];

    if (role === 'shadow_mp') {
      return [
        ...common,
        { label: "Areena", view: "arena" as const, icon: FileText, href: "/arena" },
        { label: "Väittely", view: "debate" as const, icon: Radio, href: "/vaittely/demo" },
      ];
    } else if (role === 'researcher') {
      return [
        ...common,
        { label: "Data", view: "ranking" as const, icon: Search, href: "/ranking" },
        { label: "Kartta", view: "consensus" as const, icon: MapIcon },
      ];
    } else {
      return [
        ...common,
        { label: "Areena", view: "arena" as const, icon: Radio, href: "/arena" },
        { label: "DNA", view: "profile" as const, icon: User },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const content = (
            <>
              <Icon size={20} className={isActive ? "scale-110 text-command-neon" : "scale-100"} />
              <span className={`text-[8px] font-black uppercase tracking-tight leading-tight mt-1 ${isActive ? "text-command-neon" : "text-slate-400"}`}>{item.label}</span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-[64px] h-full transition-all"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => onViewChange(item.view)}
              className="flex flex-col items-center justify-center min-w-[64px] h-full transition-all"
            >
              {content}
            </button>
          );
        })}

        {/* Center Pulse Button */}
        <div className="-translate-y-4">
          <PulseButton />
        </div>

        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const content = (
            <>
              <Icon size={20} className={isActive ? "scale-110 text-command-neon" : "scale-100"} />
              <span className={`text-[8px] font-black uppercase tracking-tight leading-tight mt-1 ${isActive ? "text-command-neon" : "text-slate-400"}`}>{item.label}</span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-[64px] h-full transition-all"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => onViewChange(item.view)}
              className="flex flex-col items-center justify-center min-w-[64px] h-full transition-all"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
