import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { render } from "@react-email/render";
import EditorialWeeklyMagazineEmail from "@/components/emails/EditorialWeeklyMagazineEmail";
import WeeklyBulletin, {
  type WeeklyEspooCaseHeader,
  type WeeklyParliamentBillHeader,
} from "@/components/emails/WeeklyBulletin";
import { buildEditorialBulletinPayloadForEmail } from "@/lib/bulletin/build-editorial-for-email";
import {
  getWeeklyMagazineEmailFromCache,
  saveWeeklyMagazineEmailCache,
} from "@/lib/bulletin/weekly-magazine-cache";

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
  html: string;
  parliamentBillHeaders: WeeklyParliamentBillHeader[];
  espooCaseHeaders: WeeklyEspooCaseHeader[];
  /** Present when OpenAI legacy path ran */
  report?: WeeklyReportData;
  variant?: "magazine" | "legacy";
};

/** Legacy JSON-polun fallback yksittäisen rikkinäisen rivin / OpenAI-vian varalle. */
export function fallbackWeeklyReportData(): WeeklyReportData {
  return {
    parliamentData: {
      summary:
        "Automaattista viikkoyhteenvetoa ei saatu luotua (data- tai AI-virhe). Seuraavassa lähteinä viikon lainsäädäntö- ja kuntaindeksi.",
      predictions: [],
      lobbyistHits: [],
    },
    espooData: {
      summary:
        "Espoo-osuuden tiivistelmää ei voitu tuottaa. Katso alla olevat viralliset esitysrivit.",
      updates: [],
    },
  };
}

const LEGISLATIVE_HEADER_LIMIT = 200;

function weeklyEmailBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  if (!raw) return "https://omatase.fi";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

function formatFiDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function sortKey(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Full title index for the bulletin: Eduskunta `bills` and Espoo `municipal_cases`
 * touched in the last week (published_date / meeting_date or sync created_at).
 */
export async function fetchWeeklyLegislativeHeaders(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  sevenDaysAgoIso: string,
): Promise<{
  parliament: WeeklyParliamentBillHeader[];
  espoo: WeeklyEspooCaseHeader[];
}> {
  type BillRow = {
    id: string;
    parliament_id: string | null;
    title: string | null;
    published_date: string | null;
    created_at: string | null;
    url: string | null;
  };
  type CaseRow = {
    id: string;
    title: string | null;
    meeting_date: string | null;
    created_at: string | null;
    url: string | null;
  };

  const [pubResult, creResult] = await Promise.all([
    supabase
      .from("bills")
      .select("id, parliament_id, title, published_date, created_at, url")
      .gte("published_date", sevenDaysAgoIso)
      .limit(LEGISLATIVE_HEADER_LIMIT),
    supabase
      .from("bills")
      .select("id, parliament_id, title, published_date, created_at, url")
      .gte("created_at", sevenDaysAgoIso)
      .limit(LEGISLATIVE_HEADER_LIMIT),
  ]);

  if (pubResult.error) {
    logger.warn(
      "bills (published_date) header query:",
      pubResult.error.message,
    );
  }
  if (creResult.error) {
    logger.warn("bills (created_at) header query:", creResult.error.message);
  }

  const billMap = new Map<string, BillRow>();
  for (const r of [
    ...(pubResult.data ?? []),
    ...(creResult.data ?? []),
  ] as BillRow[]) {
    billMap.set(r.id, r);
  }

  const parliament = Array.from(billMap.values())
    .sort(
      (a, b) =>
        sortKey(b.published_date || b.created_at) -
        sortKey(a.published_date || a.created_at),
    )
    .slice(0, LEGISLATIVE_HEADER_LIMIT)
    .map((b) => ({
      parliamentId: b.parliament_id?.trim() || "—",
      title: b.title?.trim() || "(ei otsikkoa)",
      dateLabel: formatFiDateShort(b.published_date || b.created_at),
      url: b.url,
    }));

  const [espooMeeting, espooCreated] = await Promise.all([
    supabase
      .from("municipal_cases")
      .select("id, title, meeting_date, created_at, url")
      .eq("municipality", "Espoo")
      .gte("meeting_date", sevenDaysAgoIso)
      .limit(LEGISLATIVE_HEADER_LIMIT),
    supabase
      .from("municipal_cases")
      .select("id, title, meeting_date, created_at, url")
      .eq("municipality", "Espoo")
      .gte("created_at", sevenDaysAgoIso)
      .limit(LEGISLATIVE_HEADER_LIMIT),
  ]);

  if (espooMeeting.error) {
    logger.warn(
      "municipal_cases Espoo (meeting_date):",
      espooMeeting.error.message,
    );
  }
  if (espooCreated.error) {
    logger.warn(
      "municipal_cases Espoo (created_at):",
      espooCreated.error.message,
    );
  }

  const caseMap = new Map<string, CaseRow>();
  for (const r of [
    ...(espooMeeting.data ?? []),
    ...(espooCreated.data ?? []),
  ] as CaseRow[]) {
    caseMap.set(r.id, r);
  }

  const espoo = Array.from(caseMap.values())
    .sort(
      (a, b) =>
        sortKey(b.meeting_date || b.created_at) -
        sortKey(a.meeting_date || a.created_at),
    )
    .slice(0, LEGISLATIVE_HEADER_LIMIT)
    .map((c) => ({
      title: c.title?.trim() || "(ei otsikkoa)",
      dateLabel: formatFiDateShort(c.meeting_date || c.created_at),
      url: c.url,
    }));

  return { parliament, espoo };
}

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
      logger.warn("decisions query:", decisionsResult.error.message);
    }
    if (tracesResult.error) {
      logger.warn("lobbyist_traces query:", tracesResult.error.message);
    }
    if (espooResult.error) {
      logger.warn("espoo_decisions query:", espooResult.error.message);
    }
    if (espooLobbyError) {
      logger.warn("espoo_lobby_traces query:", espooLobbyError.message);
    }

    const decisions = (decisionsResult.data ?? []) as DecisionRow[];
    const traces = tracesResult.error
      ? []
      : ((tracesResult.data ?? []) as TraceRow[]);
    const espooDecisions = espooResult.error
      ? []
      : ((espooResult.data ?? []) as EspooDecisionRow[]);
    const espooLobby = espooLobbyError
      ? []
      : ((espooLobbyTraces ?? []) as EspooLobbyTraceRow[]);

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

    const parsedJson: unknown = JSON.parse(content);
    const validated = WeeklyReportSchema.safeParse(parsedJson);
    if (!validated.success) {
      logger.warn(
        "generateWeeklyReport schema mismatch, using fallback:",
        validated.error.message,
      );
      return fallbackWeeklyReportData();
    }
    return validated.data;
  } catch (error: unknown) {
    logger.error(
      "generateWeeklyReport failed:",
      error instanceof Error ? error.message : error,
    );
    return fallbackWeeklyReportData();
  }
}

export async function generateWeeklyReportEmailPayload(): Promise<WeeklyReportEmailPayload> {
  try {
    const sevenDaysAgoIso = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const supabase = await createAdminClient();
    const forceLegacy =
      process.env.WEEKLY_BULLETIN_FORCE_LEGACY === "true" ||
      process.env.WEEKLY_BULLETIN_FORCE_LEGACY === "1";

    const [
      { parliament: parliamentBillHeaders, espoo: espooCaseHeaders },
      cached,
    ] = await Promise.all([
      fetchWeeklyLegislativeHeaders(supabase, sevenDaysAgoIso),
      getWeeklyMagazineEmailFromCache(),
    ]);

    const issueDateNow = new Date().toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (cached && !forceLegacy) {
      return {
        issueDate: cached.issueDate?.trim() ? cached.issueDate : issueDateNow,
        html: cached.html,
        parliamentBillHeaders,
        espooCaseHeaders,
        variant: "magazine",
      };
    }

    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    if (!forceLegacy) {
      try {
        const bulletin = await buildEditorialBulletinPayloadForEmail(
          startIso,
          endIso,
        );
        const periodLabel = `${start.toLocaleDateString("fi-FI")} – ${end.toLocaleDateString("fi-FI")}`;
        const html = await render(
          EditorialWeeklyMagazineEmail({
            issueDate: issueDateNow,
            periodLabel,
            bulletin,
            baseUrl: weeklyEmailBaseUrl(),
            parliamentBillHeaders,
            espooCaseHeaders,
          }),
        );
        await saveWeeklyMagazineEmailCache(html, issueDateNow);
        return {
          issueDate: issueDateNow,
          html,
          parliamentBillHeaders,
          espooCaseHeaders,
          variant: "magazine",
        };
      } catch (magErr: unknown) {
        logger.warn(
          "Magazine path failed, legacy fallback:",
          magErr instanceof Error ? magErr.message : magErr,
        );
      }
    }

    let report: WeeklyReportData;
    try {
      report = await generateWeeklyReport();
    } catch (e) {
      logger.warn(
        "generateWeeklyReport threw, fallback:",
        e instanceof Error ? e.message : e,
      );
      report = fallbackWeeklyReportData();
    }

    let html: string;
    try {
      html = await render(
        WeeklyBulletin({
          issueDate: issueDateNow,
          parliamentData: {
            ...report.parliamentData,
            weeklyBillHeaders: parliamentBillHeaders,
          },
          espooData: {
            ...report.espooData,
            weeklyCaseHeaders: espooCaseHeaders,
          },
        }),
      );
    } catch (renderErr) {
      logger.error(
        "WeeklyBulletin render failed:",
        renderErr instanceof Error ? renderErr.message : renderErr,
      );
      const safe = fallbackWeeklyReportData();
      html = await render(
        WeeklyBulletin({
          issueDate: issueDateNow,
          parliamentData: {
            ...safe.parliamentData,
            weeklyBillHeaders: parliamentBillHeaders,
          },
          espooData: {
            ...safe.espooData,
            weeklyCaseHeaders: espooCaseHeaders,
          },
        }),
      );
      report = safe;
    }

    return {
      issueDate: issueDateNow,
      report,
      parliamentBillHeaders,
      espooCaseHeaders,
      html,
      variant: "legacy",
    };
  } catch (error: unknown) {
    logger.error(
      "generateWeeklyReportEmailPayload failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}
