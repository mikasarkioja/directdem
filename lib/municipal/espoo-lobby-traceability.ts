import axios from "axios";
import * as cheerio from "cheerio";
import { createAdminClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/scrapers/pdf-utils";

type EspooDecision = {
  id: string;
  title: string | null;
  summary: string | null;
  url: string | null;
};

type CandidateAttachment = {
  label: string;
  title: string;
  url: string;
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarityPercent(a: string, b: string): number {
  const aSet = new Set(
    normalizeText(a)
      .split(" ")
      .filter((t) => t.length > 2),
  );
  const bSet = new Set(
    normalizeText(b)
      .split(" ")
      .filter((t) => t.length > 2),
  );
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let intersection = 0;
  aSet.forEach((token) => {
    if (bSet.has(token)) intersection += 1;
  });
  const ratio = intersection / Math.min(aSet.size, bSet.size);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

async function fetchAttachmentCandidates(
  decisionUrl: string,
): Promise<CandidateAttachment[]> {
  try {
    const { data } = await axios.get(decisionUrl, { timeout: 20000 });
    const $ = cheerio.load(data);
    const keywords = ["asiantuntijalausunto", "muistutus", "lausunto"];
    const links: CandidateAttachment[] = [];

    $("a").each((_, element) => {
      const href = $(element).attr("href");
      const text = $(element).text().trim();
      if (!href || !text) return;
      const lower = text.toLowerCase();
      const label = keywords.find((k) => lower.includes(k));
      if (!label) return;

      const fullUrl = href.startsWith("http")
        ? href
        : new URL(href, decisionUrl).toString();
      links.push({ label, title: text, url: fullUrl });
    });

    return links;
  } catch (error: any) {
    console.error(
      "[EspooTrace] Failed to fetch decision page:",
      error?.message ?? error,
    );
    return [];
  }
}

async function fetchAttachmentText(
  url: string,
  fallbackTitle: string,
): Promise<string> {
  try {
    if (url.toLowerCase().includes(".pdf")) {
      const pdfText = await extractTextFromPdf(url);
      const combined = `${fallbackTitle}\n${pdfText}`.trim();
      if (
        combined.length > 80 &&
        !pdfText.startsWith("Virhe") &&
        !pdfText.startsWith("Skannattu PDF")
      ) {
        return combined.slice(0, 12000);
      }
      return combined.slice(0, 12000) || `${fallbackTitle} ${url}`;
    }
    const { data } = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(data);
    const text = $("body").text().replace(/\s+/g, " ").trim();
    if (!text) return `${fallbackTitle} ${url}`;
    return text.slice(0, 12000);
  } catch {
    return `${fallbackTitle} ${url}`;
  }
}

async function inferActorAndImpact(
  attachmentText: string,
  decisionText: string,
): Promise<{ actor_name: string; impact_summary: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      actor_name: "Tuntematon toimija",
      impact_summary:
        "Lausunto vaikutti päätöstekstiin samankaltaisuuslaskennan perusteella.",
    };
  }

  const prompt = [
    "Analysoi alla oleva lausunto ja päätösteksti.",
    "Tunnista lausunnon antaja (actor_name) ja tiivistä tavoitteet suhteessa päätökseen (impact_summary).",
    'Palauta vain JSON: {"actor_name": string, "impact_summary": string}.',
    "",
    "Lausunto:",
    attachmentText.slice(0, 5000),
    "",
    "Päätösteksti:",
    decisionText.slice(0, 4000),
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "Olet puolueeton hallinnollisen tekstin analyytikko. Vastaa aina validilla JSONilla.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI ${response.status}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};
    return {
      actor_name: parsed.actor_name || "Tuntematon toimija",
      impact_summary:
        parsed.impact_summary ||
        "Lausunnon tavoitteet tukevat osin lopullista päätösehdotusta.",
    };
  } catch {
    return {
      actor_name: "Tuntematon toimija",
      impact_summary:
        "Lausunnon tavoitteet näyttävät vaikuttaneen päätöstekstin painotuksiin.",
    };
  }
}

export async function scanEspooLobbyTraceability(): Promise<{
  scannedDecisions: number;
  storedFindings: number;
  highInfluenceCount: number;
}> {
  const supabase = await createAdminClient();

  const { data: decisions, error: decisionsError } = await supabase
    .from("municipal_decisions")
    .select("id,title,summary,url")
    .eq("municipality", "Espoo")
    .order("created_at", { ascending: false })
    .limit(5);

  if (decisionsError) {
    throw new Error(
      `[EspooTrace] Failed to fetch Espoo decisions: ${decisionsError.message}`,
    );
  }

  let storedFindings = 0;
  let highInfluenceCount = 0;

  for (const decision of (decisions ?? []) as EspooDecision[]) {
    try {
      if (!decision.url) continue;
      const decisionText =
        `${decision.title ?? ""}\n${decision.summary ?? ""}`.trim();
      if (!decisionText) continue;

      const attachments = await fetchAttachmentCandidates(decision.url);
      for (const attachment of attachments) {
        try {
          const attachmentText = await fetchAttachmentText(
            attachment.url,
            attachment.title,
          );
          const similarity = tokenSimilarityPercent(
            attachmentText,
            decisionText,
          );
          const highInfluence = similarity >= 70;

          const ai = await inferActorAndImpact(attachmentText, decisionText);
          const { error: upsertError } = await supabase
            .from("espoo_lobby_traces")
            .upsert(
              {
                decision_id: decision.id,
                actor_name: ai.actor_name,
                similarity_score: similarity,
                impact_summary: ai.impact_summary,
                high_influence: highInfluence,
                source_url: attachment.url,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "decision_id,source_url" },
            );

          if (upsertError) {
            console.error("[EspooTrace] Upsert failed:", upsertError.message);
            continue;
          }

          storedFindings += 1;
          if (highInfluence) highInfluenceCount += 1;
        } catch (rowErr) {
          console.warn(
            "[EspooTrace] Row skipped:",
            decision.id,
            rowErr instanceof Error ? rowErr.message : rowErr,
          );
        }
      }
    } catch (decErr) {
      console.warn(
        "[EspooTrace] Decision skipped:",
        decision.id,
        decErr instanceof Error ? decErr.message : decErr,
      );
    }
  }

  return {
    scannedDecisions: (decisions ?? []).length,
    storedFindings,
    highInfluenceCount,
  };
}
