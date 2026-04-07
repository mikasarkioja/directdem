"use server";

import {
  GoogleGenerativeAI,
  DynamicRetrievalMode,
} from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/server";
import {
  mediaWatchComparisonSchema,
  type MediaWatchComparisonAnalysis,
} from "@/lib/media-watch/comparison-analysis";
import {
  emptyGroundingPayload,
  extractGroundingPayload,
  type MediaWatchAiAnalysisJson,
} from "@/lib/media-watch/grounding";

export type MatchNewsToDecisionResult =
  | {
      success: true;
      analysis: MediaWatchComparisonAnalysis;
      grounding: MediaWatchAiAnalysisJson;
    }
  | { success: false; error: string };

function parseJsonResponse(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function coerceAnalysisPayload(raw: Record<string, unknown>): unknown {
  const accuracyScore =
    typeof raw.accuracyScore === "number"
      ? raw.accuracyScore
      : typeof raw.accuracy === "number"
        ? raw.accuracy
        : undefined;

  let discrepancies = raw.discrepancies;
  if (!Array.isArray(discrepancies)) discrepancies = [];
  discrepancies = (discrepancies as unknown[]).map((item) => {
    if (typeof item === "string") {
      return { kind: "error" as const, text: item };
    }
    if (item && typeof item === "object" && "text" in item) {
      const o = item as Record<string, unknown>;
      const kind = o.kind === "fact" ? "fact" : "error";
      return { kind, text: String(o.text ?? "") };
    }
    return { kind: "error" as const, text: String(item) };
  });

  return {
    accuracyScore,
    discrepancies,
    framing: typeof raw.framing === "string" ? raw.framing : "",
    selkokieliSummary:
      typeof raw.selkokieliSummary === "string"
        ? raw.selkokieliSummary
        : typeof raw.summary === "string"
          ? raw.summary
          : "",
    badge: raw.badge === "context" ? "context" : "fact_check",
  };
}

/**
 * Uudelleenanalysoi yksi news_decision_matches-rivi (Media Watch).
 * Tallentaa vertailun `ai_analysis_summary`-sarakkeeseen ja grounding-lähteet `ai_analysis_json`-sarakkeeseen.
 */
export async function matchNewsToDecision(
  matchId: string,
): Promise<MatchNewsToDecisionResult> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY ei ole asetettu." };
  }

  try {
    const admin = await createAdminClient();

    const { data: match, error: matchErr } = await admin
      .from("news_decision_matches")
      .select(
        "id, news_id, bill_id, decision_id, municipal_decision_id, similarity_score",
      )
      .eq("id", matchId)
      .single();

    if (matchErr || !match) {
      return { success: false, error: "Osumariviä ei löydy." };
    }

    const { data: news, error: newsErr } = await admin
      .from("news_articles")
      .select("id, title, content, source_url, source_name, published_at")
      .eq("id", match.news_id)
      .single();

    if (newsErr || !news) {
      return { success: false, error: "Uutisriviä ei löydy." };
    }

    let corpusLabel = "Päätös";
    let corpusTitle = "";
    let corpusSummary = "";
    let corpusStatus: string | null = null;

    if (match.bill_id) {
      corpusLabel = "Lakiesitys";
      const { data: b } = await admin
        .from("bills")
        .select("title, summary, status, parliament_id")
        .eq("id", match.bill_id)
        .single();
      corpusTitle = [b?.parliament_id, b?.title].filter(Boolean).join(" — ");
      corpusSummary = b?.summary ?? "";
      corpusStatus = b?.status ?? null;
    } else if (match.decision_id) {
      corpusLabel = "Eduskuntavahti-päätös";
      const { data: d } = await admin
        .from("decisions")
        .select("title, summary, external_ref")
        .eq("id", match.decision_id)
        .single();
      corpusTitle = d?.title ?? "";
      corpusSummary = d?.summary ?? "";
      corpusStatus = d?.external_ref ?? null;
    } else if (match.municipal_decision_id) {
      corpusLabel = "Kunnallinen päätös";
      const { data: m } = await admin
        .from("municipal_decisions")
        .select("title, summary, municipality")
        .eq("id", match.municipal_decision_id)
        .single();
      corpusTitle = [m?.municipality, m?.title].filter(Boolean).join(" — ");
      corpusSummary = m?.summary ?? "";
      corpusStatus = m?.municipality ?? null;
    } else {
      return { success: false, error: "Kohteen tyyppiä ei voitu päätellä." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName =
      process.env.GEMINI_MEDIA_WATCH_MODEL?.trim() || "gemini-3-flash-preview";

    const systemStyle = `Olet poliittinen ja juridinen analyytikko Eduskuntavahti / Omatase -palvelussa.
Vertaa median kuvaa viralliseen päätöstekstiin.
Kun teet analyysia, käytä aktiivisesti Google Search Groundingia varmistaaksesi lakitekstien ja uutisten tuoreuden. Palauta vastauksessa viittaukset niihin kohtiin, joista löysit ristiriitaisuuksia (kuvaa ne discrepancies-kentässä selkeästi).
Palauta VAIN kelvollinen JSON (ei markdown-sulkuja), täsmälleen näillä avaimilla:
{
  "accuracyScore": number (0–100),
  "discrepancies": [ { "kind": "error" | "fact", "text": string } ],
  "framing": string (esim. sensaatiohakuisuus vs. neutraali + perustelu),
  "selkokieliSummary": string (yksi selkeä virke kansalaiselle),
  "badge": "fact_check" | "context"
}
discrepancies: kind "error" = asiavirhe tai harhaanjohtava väite; kind "fact" = uutisessa oikein korostettu fakta.`;

    const userPrompt = `${corpusLabel.toUpperCase()}
Otsikko / tunniste: ${corpusTitle}
Tila / viite: ${corpusStatus ?? "—"}
Tiivistelmä / sisältö:
${corpusSummary.slice(0, 12000)}

UUTINEN
Lähde: ${news.source_name ?? "—"}
Otsikko: ${news.title}
Sisältö / ingressi:
${(news.content ?? "").toString().slice(0, 8000)}`;

    const tools = [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.35,
          },
        },
      },
    ];

    const runModel = async (useSearch: boolean) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(useSearch ? { tools } : {}),
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.25,
        },
      });
      return model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: systemStyle + "\n\n" + userPrompt }],
          },
        ],
      });
    };

    let usedWebGrounding = false;
    let genResult;
    try {
      genResult = await runModel(true);
      usedWebGrounding = true;
    } catch (first) {
      console.warn("[matchNewsToDecision] retry without search:", first);
      genResult = await runModel(false);
      usedWebGrounding = false;
    }

    const candidate = genResult.response.candidates?.[0];
    let groundingPayload = extractGroundingPayload(
      candidate?.groundingMetadata,
    );
    if (!usedWebGrounding) {
      groundingPayload = emptyGroundingPayload();
    }

    const text = genResult.response.text();
    const raw = parseJsonResponse(text) as Record<string, unknown>;
    const coerced = coerceAnalysisPayload(raw);
    const parsed = mediaWatchComparisonSchema.safeParse(coerced);
    if (!parsed.success) {
      console.error("[matchNewsToDecision] schema", parsed.error);
      return { success: false, error: "Analyysin jäsentäminen epäonnistui." };
    }

    const analysis = parsed.data;

    const { error: upErr } = await admin
      .from("news_decision_matches")
      .update({
        ai_analysis_summary: analysis as unknown as Record<string, unknown>,
        ai_analysis_json: groundingPayload as unknown as Record<
          string,
          unknown
        >,
      })
      .eq("id", matchId);

    if (upErr) {
      console.error("[matchNewsToDecision] update", upErr);
      return {
        success: false,
        error: "Analyysin tallennus tietokantaan epäonnistui.",
      };
    }

    return { success: true, analysis, grounding: groundingPayload };
  } catch (e) {
    console.error("[matchNewsToDecision]", e);
    const msg = e instanceof Error ? e.message : "Analyysi epäonnistui.";
    return { success: false, error: msg };
  }
}
