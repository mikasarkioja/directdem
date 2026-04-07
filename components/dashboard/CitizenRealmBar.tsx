"use client";

import { Building2, Landmark } from "lucide-react";
import { motion } from "framer-motion";

export type CitizenRealm = "parliament" | "municipal";

interface CitizenRealmBarProps {
  realm: CitizenRealm;
  onChange: (realm: CitizenRealm) => void;
}

/**
 * Yksi selkeä kytkin: kansallinen lainsäätäjä vs. oma kunta (Kuntavahti).
 */
export default function CitizenRealmBar({
  realm,
  onChange,
}: CitizenRealmBarProps) {
  const items: {
    id: CitizenRealm;
    label: string;
    hint: string;
    icon: typeof Landmark;
  }[] = [
    {
      id: "parliament",
      label: "Eduskunta",
      hint: "Uusimmat lakiesitykset",
      icon: Landmark,
    },
    {
      id: "municipal",
      label: "Kunta",
      hint: "Paikalliset päätökset",
      icon: Building2,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Selaustila: eduskunta tai kunta"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5 sm:p-2"
    >
      <div className="flex rounded-xl bg-black/30 p-1 gap-0.5 flex-1 max-w-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const active = realm === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-3 sm:py-2.5 text-left transition-all ${
                active ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="citizen-realm-pill"
                  className="absolute inset-0 rounded-lg bg-white/[0.12] border border-white/10 shadow-inner"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={16}
                className={`relative z-10 shrink-0 ${active ? "text-purple-300" : "text-slate-600"}`}
              />
              <span className="relative z-10 flex flex-col items-start min-w-0">
                <span className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest leading-tight">
                  {item.label}
                </span>
                <span className="hidden sm:block text-[9px] font-medium text-slate-500 normal-case tracking-normal truncate max-w-[10rem]">
                  {item.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500 font-medium px-2 sm:pr-3 max-sm:hidden">
        Sama työtila: vaihda näkymää yhdellä napilla. Syvälliset työkalut
        löytyvät edustajan näkymästä.
      </p>
    </div>
  );
}
