import type { ReactNode } from "react";
import type { LobbyConnectionGraphPayload } from "@/lib/lobby/connection-graph-model";

export type ResearcherLensId =
  | "export_hub"
  | "lobby_network"
  | "dna_rhetoric"
  | "correlation"
  | "chart_gallery"
  | "integrated_modules";

export type ResearcherWorkbenchContext = {
  lobbyGraph: LobbyConnectionGraphPayload;
  ingestion: ResearcherIngestionCounts;
  rhetoricPreview: RhetoricPreviewRow[];
};

export type ResearcherIngestionCounts = {
  personInterests: number;
  lobbyInterventions: number;
  mpVotes: number;
};

export type RhetoricPreviewRow = {
  mp_id: string;
  rhetoric_style: string | null;
};

export type ResearcherLensDefinition = {
  id: ResearcherLensId;
  labelFi: string;
  descriptionFi: string;
  /** Lucide icon name handled in shell */
  icon: "flask" | "download" | "share" | "activity" | "radar" | "gallery";
  render: (ctx: ResearcherWorkbenchContext) => ReactNode;
};
