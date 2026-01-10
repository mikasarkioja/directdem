"use client";

import { LayoutGrid, FileText, Map as MapIcon, User, Users, Radio } from "lucide-react";
import type { DashboardView } from "@/lib/types";
import Link from "next/link";

interface BottomNavProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const navItems = [
    { label: "Keskus", view: "overview" as const, icon: LayoutGrid },
    { label: "Areena", view: "arena" as const, icon: FileText, href: "/arena" },
    { label: "Väittely", view: "debate" as const, icon: Radio, href: "/vaittely/demo" },
    { label: "Profiili", view: "profile" as const, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-xl md:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const content = (
            <>
              <Icon size={20} className={isActive ? "scale-110" : "scale-100"} />
              <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{item.label}</span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-1 transition-all touch-manipulation select-none ${
                  isActive
                    ? "text-command-neon"
                    : "text-slate-400"
                }`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-1 transition-all touch-manipulation select-none ${
                isActive
                  ? "text-command-neon"
                  : "text-slate-400"
              }`}
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
              aria-label={item.label}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
