import type { SupabaseClient } from "@supabase/supabase-js";
import { embedFinnishNewsText } from "@/lib/media-watch/embeddings";
import { analyzeNewsVsCorpusWithGemini } from "@/lib/media-watch/gemini-analysis";

type CorpusRow = {
  corpus_type: string;
  record_id: string;
  similarity: number;
};

export async function backfillDecisionCorpusEmbeddings(
  admin: SupabaseClient,
  options?: { maxPerTable?: number },
): Promise<{ bills: number; decisions: number; municipal: number }> {
  const max = options?.maxPerTable ?? 30;
  let billsN = 0;
  let decisionsN = 0;
  let municipalN = 0;

  const { data: bills } = await admin
    .from("bills")
    .select("id, title, summary, raw_text")
    .is("embedding", null)
    .limit(max);

  for (const b of bills || []) {
    const text = [b.title, b.summary || "", (b.raw_text || "").slice(0, 6000)]
      .join("\n")
      .slice(0, 8000);
    if (!text.trim()) continue;
    try {
      const embedding = await embedFinnishNewsText(text);
      const { error } = await admin
        .from("bills")
        .update({ embedding })
        .eq("id", b.id);
      if (!error) billsN++;
    } catch (e) {
      console.warn("[MediaWatch] bill embedding skip", b.id, e);
    }
  }

  const { data: decs } = await admin
    .from("decisions")
    .select("id, title, summary")
    .is("embedding", null)
    .limit(max);

  for (const d of decs || []) {
    const text = [d.title, d.summary || ""].join("\n").slice(0, 8000);
    if (!text.trim()) continue;
    try {
      const embedding = await embedFinnishNewsText(text);
      const { error } = await admin
        .from("decisions")
        .update({ embedding })
        .eq("id", d.id);
      if (!error) decisionsN++;
    } catch (e) {
      console.warn("[MediaWatch] decision embedding skip", d.id, e);
    }
  }

  const { data: munis } = await admin
    .from("municipal_decisions")
    .select("id, title, summary")
    .is("embedding", null)
    .limit(max);

  for (const m of munis || []) {
    const text = [m.title, m.summary || ""].join("\n").slice(0, 8000);
    if (!text.trim()) continue;
    try {
      const embedding = await embedFinnishNewsText(text);
      const { error } = await admin
        .from("municipal_decisions")
        .update({ embedding })
        .eq("id", m.id);
      if (!error) municipalN++;
    } catch (e) {
      console.warn("[MediaWatch] municipal embedding skip", m.id, e);
    }
  }

  return { bills: billsN, decisions: decisionsN, municipal: municipalN };
}

async function loadCorpusForGemini(
  admin: SupabaseClient,
  corpusType: string,
  recordId: string,
): Promise<{
  label: string;
  title: string;
  summary: string;
  legalExcerpt?: string;
}> {
  if (corpusType === "bill") {
    const { data } = await admin
      .from("bills")
      .select("title, summary, raw_text, parliament_id")
      .eq("id", recordId)
      .maybeSingle();
    const title = data?.title || "(lakiesitys)";
    const summary = data?.summary || "";
    const legalExcerpt = (data?.raw_text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);
    const label = data?.parliament_id
      ? `Lakiesitys (${data.parliament_id})`
      : "Lakiesitys";
    return { label, title, summary, legalExcerpt: legalExcerpt || undefined };
  }
  if (corpusType === "decision") {
    const { data } = await admin
      .from("decisions")
      .select("title, summary, external_ref")
      .eq("id", recordId)
      .maybeSingle();
    const ref = data?.external_ref ? ` viite ${data.external_ref}` : "";
    return {
      label: `Eduskuntavahti-päätös${ref}`,
      title: data?.title || "",
      summary: data?.summary || "",
    };
  }
  if (corpusType === "municipal_decision") {
    const { data } = await admin
      .from("municipal_decisions")
      .select("title, summary, municipality")
      .eq("id", recordId)
      .maybeSingle();
    return {
      label: `Kunnallispäätös (${data?.municipality || "kunta"})`,
      title: data?.title || "",
      summary: data?.summary || "",
    };
  }
  return { label: corpusType, title: "", summary: "" };
}

async function matchAlreadyExists(
  admin: SupabaseClient,
  newsId: string,
  corpusType: string,
  recordId: string,
): Promise<boolean> {
  let query = admin
    .from("news_decision_matches")
    .select("id")
    .eq("news_id", newsId);
  if (corpusType === "bill") {
    query = query.eq("bill_id", recordId);
  } else if (corpusType === "decision") {
    query = query.eq("decision_id", recordId);
  } else if (corpusType === "municipal_decision") {
    query = query.eq("municipal_decision_id", recordId);
  } else {
    return true;
  }
  const { data } = await query.maybeSingle();
  return !!data;
}

export async function matchNewsArticleToCorpus(
  admin: SupabaseClient,
  params: {
    newsId: string;
    newsTitle: string;
    newsSummary: string;
    embedding: number[];
    similarityThreshold?: number;
  },
): Promise<number> {
  const threshold = params.similarityThreshold ?? 0.85;
  const { data: rows, error } = await admin.rpc(
    "match_news_to_decision_corpus",
    {
      query_embedding: params.embedding,
      match_threshold: threshold,
      match_count: 12,
    },
  );

  if (error) {
    console.error("[MediaWatch] match_news_to_decision_corpus:", error);
    return 0;
  }

  const matches = (rows || []) as CorpusRow[];
  let created = 0;
  /** Rajoitus: yksi uutinen × usea osuma × Gemini = kallista; käsitellään vain kärki. */
  const maxLlmCalls = 4;
  let llmCalls = 0;

  for (const row of matches) {
    if (
      await matchAlreadyExists(
        admin,
        params.newsId,
        row.corpus_type,
        row.record_id,
      )
    ) {
      continue;
    }

    const corpus = await loadCorpusForGemini(
      admin,
      row.corpus_type,
      row.record_id,
    );
    let ai: Awaited<ReturnType<typeof analyzeNewsVsCorpusWithGemini>>;
    if (llmCalls < maxLlmCalls) {
      llmCalls++;
      ai = await analyzeNewsVsCorpusWithGemini({
        newsTitle: params.newsTitle,
        newsSummary: params.newsSummary,
        corpusLabel: corpus.label,
        corpusTitle: corpus.title,
        corpusSummary: corpus.summary,
        legalExcerpt: corpus.legalExcerpt,
      });
    } else {
      ai = {
        accuracyScore: 0,
        keyDiscrepancy: "",
        politicalContext:
          "Automaattinen analyysi ohitettiin tässä osumassa (kustannusrajoitus: käsitellään vain kärki-osumat).",
        badge: "context",
      };
    }

    const base = {
      news_id: params.newsId,
      similarity_score: row.similarity,
      ai_analysis_summary: ai as unknown as Record<string, unknown>,
    };

    const insert =
      row.corpus_type === "bill"
        ? {
            ...base,
            bill_id: row.record_id,
            decision_id: null,
            municipal_decision_id: null,
          }
        : row.corpus_type === "decision"
          ? {
              ...base,
              bill_id: null,
              decision_id: row.record_id,
              municipal_decision_id: null,
            }
          : row.corpus_type === "municipal_decision"
            ? {
                ...base,
                bill_id: null,
                decision_id: null,
                municipal_decision_id: row.record_id,
              }
            : null;

    if (!insert) continue;

    const { error: insErr } = await admin
      .from("news_decision_matches")
      .insert(insert);
    if (!insErr) created++;
    else console.warn("[MediaWatch] insert match:", insErr);
  }

  return created;
}
