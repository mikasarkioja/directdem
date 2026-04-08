import { getLatestNews } from "@/lib/news/news-service";
import type { PoliticalVector } from "../ai/tagger";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { isFeatureEnabled } from "@/lib/config/features";
import { fetchMediaWatchFeed } from "@/app/actions/media-watch";
import { resolveConstituencyMpId } from "@/lib/feed/resolve-constituency-mp";
import { enrichBillsWithLobbyMetadata } from "@/lib/feed/lobby-feed-metadata";
import { computeBillInsightSignals } from "@/lib/feed/bill-insight-signals";
import type { Bill } from "@/lib/types";

const YLE_POLITICS_RSS =
  "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&categories=64-123";

export type FeedGroundingSource = { label: string; url: string };

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  type: "news" | "local" | "bill" | "media_match";
  link: string;
  tags: string[];
  category?: string;
  political_vector?: PoliticalVector;
  relevanceScore?: number;
  takeActionHref?: string;
  /** Julkinen päätös-/lähdeputki: Eduskunta tai kunnan Dynasty-aineisto */
  verifiedOfficial?: boolean;
  /** Näytetään kortilla (läpinäkyvyys) */
  groundingSources?: FeedGroundingSource[];
  /** Pieni esikatselukuva (RSS / uutinen), jos saatavilla */
  imageUrl?: string;
  /** Lakikortti: bills.id (UUID) */
  billUuid?: string;
  /** lobbyist_interventions määrä tälle hankkeelle */
  lobbyInterventionCount?: number;
  /** Heuristiikka: sidonnaisuusrekisteri osuu aiheeseen */
  interestSectorConflict?: boolean;
  /** Varjo-/istumapohjainen läpimenon todennäköisyys (%) — vain bill */
  passageProbabilityPercent?: number;
  /** Vaikutusindeksi 0–100 (heuristiikka) — vain bill */
  lobbyInfluenceIndex?: number;
}

export async function getIntelligenceFeed(userDna?: any): Promise<FeedItem[]> {
  try {
    const constituencyMpId = userDna?.vaalipiiri
      ? await resolveConstituencyMpId(userDna.vaalipiiri as string)
      : null;

    // 1. Uutiset (Yle RSS) — ei Gemini-taggauksia käyttäjäpolulla (suorituskyky).
    const newsItems = await getLatestNews();
    const formattedNews: FeedItem[] = newsItems.map((item, idx) => ({
      id: `news-${idx}-${encodeURIComponent(item.link).slice(0, 48)}`,
      title: item.title,
      description: item.contentSnippet,
      date: item.pubDate,
      source: item.source,
      type: "news",
      link: item.link,
      tags: ["Politiikka"],
      verifiedOfficial: false,
      groundingSources: [
        { label: "Lähde: Yle Politiikka (RSS)", url: YLE_POLITICS_RSS },
        { label: "Artikkeli", url: item.link },
      ],
    }));

    // 2. Fetch Local Decisions (Espoo)
    const { getEspooDecisions } = await import("@/app/actions/espoo-actions");
    const decisions = await getEspooDecisions();

    const formattedLocal: FeedItem[] = (decisions || []).map((item: any) => {
      const url = item.url || `/dashboard/espoo?id=${item.id}`;
      return {
        id: `local-${item.id || item.external_id}`,
        title: item.title,
        description: item.summary || item.description || "",
        date: item.decision_date,
        source: "Espoon kaupunki",
        type: "local" as const,
        link: url,
        tags: item.neighborhoods || [],
        category: item.category,
        political_vector: item.political_vector,
        verifiedOfficial: true,
        groundingSources: [
          {
            label: "Virallinen kunta-aineisto (Espoo, Dynasty-putki)",
            url:
              item.url ||
              "https://www.espoo.fi/fi/paatoksenteko/avoimuus-ja-asiakirjat",
          },
        ],
      };
    });

    // 3. Fetch National Bills + lobbari-/sidonnaisuusmetat
    const bills = await fetchBillsFromSupabase();
    const billSlice = bills.slice(0, 50) as Bill[];
    const lobbyMeta = await enrichBillsWithLobbyMetadata(
      billSlice.map((b) => ({
        id: b.id,
        parliamentId: b.parliamentId,
        title: b.title,
        category: b.category,
      })),
    );

    const formattedBills: FeedItem[] = billSlice.map((item) => {
      const eduskuntaUrl =
        item.url ||
        (item.parliamentId
          ? `https://www.eduskunta.fi/FI/vaski/Hakutulos?haku=${encodeURIComponent(item.parliamentId)}`
          : "https://www.eduskunta.fi");
      const meta = lobbyMeta.get(item.id);
      const interventionCount = meta?.lobbyInterventionCount ?? 0;
      const { passageProbabilityPercent, lobbyInfluenceIndex } =
        computeBillInsightSignals(item);
      return {
        id: `bill-${item.id}`,
        billUuid: item.id,
        title: item.title,
        description: item.summary || "",
        date: item.publishedDate || new Date().toISOString(),
        source: "Eduskunta",
        type: "bill" as const,
        link: `/dashboard?view=committee&billId=${item.id}`,
        tags: [item.category || "Lainsäädäntö"],
        category: item.category,
        political_vector: undefined,
        takeActionHref:
          constituencyMpId != null
            ? `/dashboard/mps/${constituencyMpId}?billId=${item.id}`
            : undefined,
        verifiedOfficial: true,
        lobbyInterventionCount: interventionCount,
        interestSectorConflict: meta?.interestSectorConflict ?? false,
        passageProbabilityPercent,
        lobbyInfluenceIndex,
        groundingSources: [
          { label: "Eduskunta / palvelun lakiaineisto", url: eduskuntaUrl },
          ...(interventionCount > 0
            ? [
                {
                  label: `Vaikuttajamerkinnät (${interventionCount})`,
                  url: eduskuntaUrl,
                },
              ]
            : []),
        ],
      };
    });

    let formattedMedia: FeedItem[] = [];
    if (isFeatureEnabled("MEDIA_WATCH_ENABLED")) {
      const mediaRows = await fetchMediaWatchFeed(30);
      formattedMedia = mediaRows.map((row, idx) => {
        const matchBits = [
          row.decision_title && `Päätös: ${row.decision_title}`,
          row.bill_title && `Laki: ${row.bill_title}`,
          row.municipal_title &&
            `${row.municipal_municipality || "Kunta"}: ${row.municipal_title}`,
        ].filter(Boolean);
        return {
          id: `media-${row.match_id || idx}`,
          title: row.news_title,
          description:
            matchBits.join(" · ") ||
            "Uutinen linkitetty päätösdataan (Media Watch).",
          date:
            row.matched_at || row.news_published_at || new Date().toISOString(),
          source: "Media Watch",
          type: "media_match" as const,
          link: row.news_url,
          tags: [
            "Media Watch",
            ...(row.news_source_name ? [row.news_source_name] : []),
          ],
          takeActionHref:
            constituencyMpId != null && row.bill_id
              ? `/dashboard/mps/${constituencyMpId}?billId=${row.bill_id}`
              : undefined,
          verifiedOfficial: false,
          groundingSources: [
            { label: "Uutinen", url: row.news_url },
            ...(row.bill_title
              ? [
                  {
                    label: "Linkitetty lakiaineisto",
                    url: `https://www.eduskunta.fi`,
                  },
                ]
              : []),
          ],
        };
      });
    }

    // 4. Combine and Sort
    let combined = [
      ...formattedNews,
      ...formattedLocal,
      ...formattedBills,
      ...formattedMedia,
    ];

    if (userDna) {
      const { calculateFeedRelevance } = await import("./relevance");
      combined = combined.map((item) => {
        if (item.political_vector) {
          const rel = calculateFeedRelevance(userDna, item.political_vector);
          return { ...item, relevanceScore: rel.score };
        }
        return item;
      });
    }

    combined.sort((a, b) => {
      // If userDna and relevanceScore exist, we can influence sorting
      // but usually we want to keep it chronological or high relevance
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return combined;
  } catch (error) {
    console.error("Failed to fetch intelligence feed:", error);
    return [];
  }
}
