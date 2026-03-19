import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { render } from "@react-email/render";
import WeeklyBulletin from "@/components/emails/WeeklyBulletin";

type DecisionRow = {
  id: string;
  title: string | null;
  summary: string | null;
  impact_score: number | null;
  created_at: string | null;
};

type TraceRow = {
  id: string;
  organization_name: string | null;
  analysis_summary: string | null;
  similarity_score: number | null;
  impact_score: number | null;
  created_at: string | null;
};

type EspooDecisionRow = {
  id: string;
  title: string | null;
  summary: string | null;
  category: string | null;
  neighborhood: string | null;
  impact_score: number | null;
  created_at: string | null;
};

type EspooLobbyTraceRow = {
  decision_id: string;
  actor_name: string | null;
  similarity_score: number | null;
  impact_summary: string | null;
  high_influence: boolean | null;
  created_at: string | null;
};

const WeeklyReportSchema = z.object({
  parliamentData: z.object({
    summary: z.string(),
    predictions: z
      .array(
        z.object({
          title: z.string(),
          probability: z.number().min(0).max(100),
          trend: z.string(),
        }),
      )
      .max(5),
    lobbyistHits: z
      .array(
        z.object({
          title: z.string(),
          similarity: z.number().min(0).max(100),
          actor: z.string(),
        }),
      )
      .max(3),
    deficitIndicator: z
      .object({
        title: z.string(),
        percentage: z.number().min(0).max(100),
      })
      .optional(),
  }),
  espooData: z.object({
    summary: z.string(),
    updates: z
      .array(
        z.object({
          title: z.string(),
          category: z.string(),
          description: z.string(),
        }),
      )
      .max(5),
    deficitIndicator: z
      .object({
        title: z.string(),
        percentage: z.number().min(0).max(100),
      })
      .optional(),
  }),
});

export type WeeklyReportData = z.infer<typeof WeeklyReportSchema>;
export type WeeklyReportEmailPayload = {
  issueDate: string;
  report: WeeklyReportData;
  html: string;
};

const logger = {
  info: (...args: unknown[]) => console.log("[WeeklyGenerator]", ...args),
  warn: (...args: unknown[]) => console.warn("[WeeklyGenerator]", ...args),
  error: (...args: unknown[]) => console.error("[WeeklyGenerator]", ...args),
};

/**
 * Builds a generic Finnish weekly report data object for WeeklyBulletin.tsx.
 * Fetches key national + lobbyist + Espoo data and synthesizes a structured JSON via GPT-4o.
 */
export async function generateWeeklyReport(): Promise<WeeklyReportData> {
  try {
    const supabase = await createAdminClient();
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [decisionsResult, tracesResult, espooResult] = await Promise.all([
      supabase
        .from("decisions")
        .select("id,title,summary,impact_score,created_at")
        .gte("created_at", sevenDaysAgo)
        .order("impact_score", { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from("lobbyist_traces")
        .select(
          "id,organization_name,analysis_summary,similarity_score,impact_score,created_at",
        )
        .order("similarity_score", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase
        .from("espoo_decisions")
        .select(
          "id,title,summary,category,neighborhood,impact_score,created_at",
        )
        .gte("created_at", sevenDaysAgo)
        .order("impact_score", { ascending: false, nullsFirst: false })
        .limit(3),
    ]);
    const { data: espooLobbyTraces, error: espooLobbyError } = await supabase
      .from("espoo_lobby_traces")
      .select(
        "decision_id,actor_name,similarity_score,impact_summary,high_influence,created_at",
      )
      .order("similarity_score", { ascending: false, nullsFirst: false })
      .limit(3);

    if (decisionsResult.error) {
      throw new Error(
        `decisions query failed: ${decisionsResult.error.message}`,
      );
    }
    if (tracesResult.error) {
      throw new Error(
        `lobbyist_traces query failed: ${tracesResult.error.message}`,
      );
    }
    if (espooResult.error) {
      throw new Error(
        `espoo_decisions query failed: ${espooResult.error.message}`,
      );
    }
    if (espooLobbyError) {
      throw new Error(
        `espoo_lobby_traces query failed: ${espooLobbyError.message}`,
      );
    }

    const decisions = (decisionsResult.data ?? []) as DecisionRow[];
    const traces = (tracesResult.data ?? []) as TraceRow[];
    const espooDecisions = (espooResult.data ?? []) as EspooDecisionRow[];
    const espooLobby = (espooLobbyTraces ?? []) as EspooLobbyTraceRow[];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing");
    }

    const prompt = [
      "Muunna annettu data suomenkieliseksi viikkoraportiksi ja palauta VAIN validi JSON.",
      "Raportti on geneerinen yleiskatsaus ilman henkilökohtaista kohdennusta.",
      "Käytä selkokieltä ja analyyttistä sävyä.",
      "JSON-rakenne:",
      "{",
      '  "parliamentData": {',
      '    "summary": string,',
      '    "predictions": [{"title": string, "probability": number, "trend": string}],',
      '    "lobbyistHits": [{"title": string, "similarity": number, "actor": string}],',
      '    "deficitIndicator": {"title": string, "percentage": number}',
      "  },",
      '  "espooData": {',
      '    "summary": string,',
      '    "updates": [{"title": string, "category": string, "description": string}],',
      '    "deficitIndicator": {"title": string, "percentage": number}',
      "  }",
      "}",
      "Rajoitukset:",
      "- parliamentData.predictions max 5",
      "- parliamentData.lobbyistHits max 3",
      "- espooData.updates max 3",
      "- Kaikki prosentit välille 0..100",
      "",
      "Data / decisions:",
      JSON.stringify(decisions),
      "",
      "Data / lobbyist_traces:",
      JSON.stringify(traces),
      "",
      "Data / espoo_decisions:",
      JSON.stringify(espooDecisions),
      "",
      "Data / espoo_lobby_traces:",
      JSON.stringify(espooLobby),
    ].join("\n");

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Olet puolueeton yhteiskunta-analyytikko. Vastaat aina validilla JSON-objektilla annetun skeeman mukaan.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      },
    );

    if (!openAiResponse.ok) {
      const errorBody = await openAiResponse.text();
      throw new Error(
        `OpenAI request failed: ${openAiResponse.status} ${errorBody}`,
      );
    }

    const json = await openAiResponse.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("OpenAI response missing message.content");
    }

    return WeeklyReportSchema.parse(JSON.parse(content));
  } catch (error: any) {
    logger.error("generateWeeklyReport failed:", error?.message ?? error);
    throw error;
  }
}

export async function generateWeeklyReportEmailPayload(): Promise<WeeklyReportEmailPayload> {
  try {
    const report = await generateWeeklyReport();
    const issueDate = new Date().toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const html = await render(
      WeeklyBulletin({
        issueDate,
        parliamentData: report.parliamentData,
        espooData: report.espooData,
      }),
    );
    return { issueDate, report, html };
  } catch (error: any) {
    logger.error(
      "generateWeeklyReportEmailPayload failed:",
      error?.message ?? error,
    );
    throw error;
  }
}
