"use client";

import { Home, Vote, Map as MapIcon, User } from "lucide-react";
import type { DashboardView } from "@/lib/types";

interface BottomNavProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const navItems = [
    { label: "Aloitus", view: "bills" as const, icon: Home },
    { label: "Äänestä", view: "bills" as const, icon: Vote },
    { label: "Kartta", view: "consensus" as const, icon: MapIcon },
    { label: "Profiili", view: "profile" as const, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-nordic-deep border-t border-nordic-gray dark:border-nordic-darker shadow-lg md:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-1 transition-colors touch-manipulation select-none ${
                isActive
                  ? "text-nordic-blue dark:text-nordic-blue"
                  : "text-nordic-dark dark:text-nordic-gray"
              }`}
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
              aria-label={item.label}
            >
              <Icon size={24} className={isActive ? "text-nordic-blue" : ""} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

