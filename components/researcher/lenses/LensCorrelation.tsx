"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getLoyaltyData } from "@/app/actions/researcher";
import { Loader2 } from "lucide-react";

const PARTY_COLORS: Record<string, string> = {
  KOK: "#2563eb",
  SDP: "#dc2626",
  PS: "#ca8a04",
  VIHR: "#16a34a",
  RKP: "#eab308",
  KESK: "#65a30d",
  VAS: "#be123c",
};

export default function LensCorrelation() {
  const [data, setData] = useState<
    Array<{
      id: number;
      name: string;
      party: string;
      x: number;
      y: number;
      loyalty: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getLoyaltyData();
        if (!cancelled) setData(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ladataan korrelaatioaineistoa…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Korrelaatioanalyysi: talous–arvot-akseli
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Vaakasuunta: talouspainotus (mp_profiles). Pystysuunta:
          liberaali–konservatiivi -ulottuvuus. Pisteen väri: puolue.{" "}
          <span className="font-medium text-slate-700">
            Puoluekuri-indeksi näkyy pisteen koossa (Z-akseli)
          </span>{" "}
          — tulkinta on heuristinen visualisointi, ei tilastollista
          hypoteesitestiä.
        </p>
      </div>

      <div className="h-[420px] w-full rounded-2xl border border-slate-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="Talous"
              tick={{ fontSize: 10 }}
              label={{
                value: "Talous (oikeistolaisuus →)",
                position: "bottom",
                offset: 0,
                style: { fontSize: 10 },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Arvot"
              tick={{ fontSize: 10 }}
              label={{
                value: "Liberaali ↔ Konservatiivi",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10 },
              }}
            />
            <ZAxis
              type="number"
              dataKey="loyalty"
              range={[70, 400]}
              name="Kuri"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as (typeof data)[0];
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-slate-600">{p.party}</p>
                    <p className="text-slate-500">
                      Talous {p.x.toFixed(2)} · Arvot {p.y.toFixed(2)}
                    </p>
                    <p className="text-slate-500">
                      Heuristinen kuri: {p.loyalty}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter name="Edustajat" data={data}>
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={PARTY_COLORS[entry.party] ?? "#64748b"}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
