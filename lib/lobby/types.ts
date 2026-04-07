import { z } from "zod";

/** Raw text captured from Lausuntopalvelu / Avoimuusrekisteri (or mocks). */
export type LobbySourceDocument = {
  sourceType: "lausunto" | "avoimuus";
  sourceUrl: string;
  title: string;
  organizationHint?: string;
  /** UTF-8 text; must preserve ä, ö, å */
  textContent: string;
};

/** LLM structured stance (stored inside summary_json + sentiment_score column). */
export const lobbyStanceSummarySchema = z.object({
  organizationName: z
    .string()
    .describe("Official organization name in Finnish context"),
  organizationCategory: z
    .string()
    .describe("E.g. Ammattiliitto, NGO, Elinkeinoelämä, Viranomainen"),
  coreStance: z.enum(["support", "oppose", "conditional"]),
  keyArguments: z.array(z.string()).max(3),
  proposedChanges: z.string().describe("Concrete wording / pykälä-toiveet"),
  plainLanguageSummary: z
    .string()
    .describe("2–3 short sentences, selkokieli, citizen-friendly"),
  sentimentScore: z.number().min(-1).max(1),
});

export type LobbyStanceSummary = z.infer<typeof lobbyStanceSummarySchema>;

export type LobbyInterventionRow = {
  id: string;
  legislative_project_id: string;
  organization_name: string;
  category: string | null;
  summary_json: Record<string, unknown>;
  sentiment_score: number | null;
  source_url: string | null;
  source_type: string;
};
