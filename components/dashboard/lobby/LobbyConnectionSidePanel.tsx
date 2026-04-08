"use client";

import type { LobbyGraphNode } from "@/lib/lobby/connection-graph-model";
import { useMemo, useState } from "react";

type TabId = "bills" | "organizations" | "specialists";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "bills", label: "Lakiesitykset", hint: "HE / VNS jne. graafissa" },
  {
    id: "organizations",
    label: "Organisaatiot",
    hint: "Lausujat, sidonnaisuudet, tapaamiset",
  },
  {
    id: "specialists",
    label: "Asiantuntijat",
    hint: "Valiokunnan kuulemat (Vaski)",
  },
];

function ListBlock({
  items,
  empty,
  dotClass,
}: {
  items: LobbyGraphNode[];
  empty: string;
  dotClass: string;
}) {
  if (!items.length) {
    return (
      <p className="px-3 py-8 text-center text-xs text-slate-500">{empty}</p>
    );
  }
  return (
    <ul className="divide-y divide-slate-800/80">
      {items.map((n) => (
        <li
          key={n.id}
          className="flex gap-2 px-3 py-2.5 text-sm leading-snug text-slate-200 hover:bg-slate-800/50"
        >
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
            aria-hidden
          />
          <span className="min-w-0 break-words">{n.name}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LobbyConnectionSidePanel({
  bills,
  organizations,
  specialists,
}: {
  bills: LobbyGraphNode[];
  organizations: LobbyGraphNode[];
  specialists: LobbyGraphNode[];
}) {
  const [tab, setTab] = useState<TabId>("bills");

  const counts = useMemo(
    () => ({
      bills: bills.length,
      organizations: organizations.length,
      specialists: specialists.length,
    }),
    [bills.length, organizations.length, specialists.length],
  );

  return (
    <aside className="flex h-[min(72vh,640px)] w-full shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/50 lg:w-[min(100%,380px)]">
      <div className="border-b border-slate-800 p-2">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Luettelo (sama data kuin verkossa)
        </p>
        <div className="flex gap-1 rounded-lg bg-slate-950/80 p-1">
          {TABS.map((t) => {
            const c =
              t.id === "bills"
                ? counts.bills
                : t.id === "organizations"
                  ? counts.organizations
                  : counts.specialists;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                title={t.hint}
                onClick={() => setTab(t.id)}
                className={
                  active
                    ? "flex-1 rounded-md bg-slate-800 px-2 py-2 text-[11px] font-semibold text-white shadow-sm"
                    : "flex-1 rounded-md px-2 py-2 text-[11px] font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }
              >
                {t.label}
                <span className="ml-1 tabular-nums text-slate-500">({c})</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "bills" ? (
          <ListBlock
            items={bills}
            empty="Ei lakiesityssolmuja tässä näkymässä. Synkkaa lausuntoja tai valiokunta-asiantuntijoita."
            dotClass="bg-[#a78bfa]"
          />
        ) : null}
        {tab === "organizations" ? (
          <ListBlock
            items={organizations}
            empty="Ei organisaatioita — datan pitää sisältää lausuntoja, sidonnaisuuksia tai Avoimuusrekisterin tapaamisia."
            dotClass="bg-[#fbbf24]"
          />
        ) : null}
        {tab === "specialists" ? (
          <ListBlock
            items={specialists}
            empty="Ei asiantuntijasolmuja. Aja committee-experts -synkka (Vaski)."
            dotClass="bg-[#34d399]"
          />
        ) : null}
      </div>
    </aside>
  );
}
