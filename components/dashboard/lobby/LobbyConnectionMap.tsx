"use client";

import dynamic from "next/dynamic";
import type { LobbyConnectionGraphPayload } from "@/lib/lobby/connection-graph-model";
import { groupLobbyGraphNodesByRole } from "@/lib/lobby/connection-graph-model";
import LobbyConnectionSidePanel from "@/components/dashboard/lobby/LobbyConnectionSidePanel";
import { useMemo } from "react";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false },
);

const LINK_COLORS: Record<string, string> = {
  avoimuustapaaminen: "rgba(96, 165, 250, 0.55)",
  sidonnaisuus: "rgba(251, 191, 36, 0.55)",
  lausunto: "rgba(167, 139, 250, 0.55)",
  asiantuntijakuuleminen: "rgba(52, 211, 153, 0.55)",
};

const NODE_COLORS: Record<string, string> = {
  mp: "#60a5fa",
  org: "#fbbf24",
  expert: "#34d399",
  bill: "#a78bfa",
};

export default function LobbyConnectionMap({
  data,
}: {
  data: LobbyConnectionGraphPayload;
}) {
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );

  const { bills, organizations, specialists } = useMemo(
    () => groupLobbyGraphNodesByRole(data.nodes),
    [data.nodes],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        {data.disclaimerFi}
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="min-h-0 min-w-0 flex-1 space-y-3">
          <div className="h-[min(72vh,640px)] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <ForceGraph2D
              graphData={graphData}
              nodeLabel={(n) => String((n as { name?: string }).name || "")}
              nodeCanvasObjectMode={() => "after"}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const o = node as {
                  x?: number;
                  y?: number;
                  name?: string;
                  group?: string;
                };
                if (o.x == null || o.y == null) return;
                const label = o.name || "";
                const font = `${12 / globalScale}px Sans`;
                ctx.font = font;
                const r = 5 / globalScale;
                ctx.beginPath();
                ctx.arc(o.x, o.y, r, 0, 2 * Math.PI, false);
                ctx.fillStyle =
                  NODE_COLORS[String(o.group)] ?? "rgba(148, 163, 184, 0.9)";
                ctx.fill();
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
                ctx.fillText(
                  label.slice(0, 42),
                  o.x,
                  o.y + r + 2 / globalScale,
                );
              }}
              linkColor={(l) =>
                LINK_COLORS[String((l as { kind?: string }).kind)] ??
                "rgba(148,163,184,0.35)"
              }
              linkDirectionalParticles={0}
              backgroundColor="#020617"
            />
          </div>
          <ul className="flex flex-wrap gap-3 text-[11px] text-slate-500">
            <li>
              <span className="inline-block h-2 w-2 rounded-full bg-[#60a5fa]" />{" "}
              Kansanedustaja
            </li>
            <li>
              <span className="inline-block h-2 w-2 rounded-full bg-[#fbbf24]" />{" "}
              Organisaatio
            </li>
            <li>
              <span className="inline-block h-2 w-2 rounded-full bg-[#34d399]" />{" "}
              Asiantuntija (valiokunta)
            </li>
            <li>
              <span className="inline-block h-2 w-2 rounded-full bg-[#a78bfa]" />{" "}
              Lakiesitys (HE)
            </li>
          </ul>
        </div>

        <LobbyConnectionSidePanel
          bills={bills}
          organizations={organizations}
          specialists={specialists}
        />
      </div>
    </div>
  );
}
