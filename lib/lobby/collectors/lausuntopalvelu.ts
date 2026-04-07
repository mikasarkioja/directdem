import * as cheerio from "cheerio";
import type { LobbySourceDocument } from "@/lib/lobby/types";

const DEFAULT_ORIGIN = "https://www.lausuntopalvelu.fi";

/**
 * Hakee lausuntopalvelusta ehdokkaita HE-tunnuksella (otsikko / teksti).
 * Toteutus perustuu julkiseen HTML-listan parsintaan; virallinen REST-kuvaus kannattaa
 * vaihtaa paikalleen kun API-avaimet ja polut on varmistettu ylläpidolta.
 */
export async function fetchLausuntoSourcesForHe(
  heTunnus: string,
): Promise<LobbySourceDocument[]> {
  const normalized = heTunnus.trim();
  if (!normalized) return [];

  if (process.env.LOBBY_TRACE_USE_MOCK === "true") {
    return mockLausunnot(normalized);
  }

  const q = encodeURIComponent(normalized);
  const listUrl = `${DEFAULT_ORIGIN}/FI/Proposal/List?searchString=${q}`;

  try {
    const res = await fetch(listUrl, {
      headers: {
        "User-Agent":
          "DirectDem-LobbyTrace/1.0 (+https://github.com/mikasarkioja/directdem)",
        "Accept-Language": "fi,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(
        `[lausuntopalvelu] List HTTP ${res.status} for ${normalized}`,
      );
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const out: LobbySourceDocument[] = [];

    $("a[href*='/FI/Proposal/']").each((_, el) => {
      const href = $(el).attr("href");
      const title = $(el).text().replace(/\s+/g, " ").trim();
      if (!href || !title) return;
      if (!title.toLowerCase().includes(normalized.toLowerCase())) return;

      const absolute = href.startsWith("http")
        ? href
        : `${DEFAULT_ORIGIN}${href.startsWith("/") ? "" : "/"}${href}`;

      const textContent =
        title.length > 40
          ? title
          : `${title}\n(Lausuntodata: täydennä tämä PDF- tai HTML-liitteellä kun linkki on varmistettu.)`;

      out.push({
        sourceType: "lausunto",
        sourceUrl: absolute,
        title,
        textContent,
      });
    });

    return dedupeByUrl(out).slice(0, 12);
  } catch (e) {
    console.warn("[lausuntopalvelu] fetch failed", e);
    return [];
  }
}

function dedupeByUrl(docs: LobbySourceDocument[]): LobbySourceDocument[] {
  const seen = new Set<string>();
  return docs.filter((d) => {
    if (seen.has(d.sourceUrl)) return false;
    seen.add(d.sourceUrl);
    return true;
  });
}

function mockLausunnot(heLabel: string): LobbySourceDocument[] {
  return [
    {
      sourceType: "lausunto",
      sourceUrl: `https://example.invalid/lausunto/mock-ek-${encodeURIComponent(heLabel)}`,
      title: `Mock: EK – lausunto ${heLabel}`,
      organizationHint: "Elinkeinoelämän keskusliitto",
      textContent: [
        "ESIMERKKI (mock): EK pitää hallituksen esitystä pääosin tärkeänä elinkeinoelämän ennakoitavuuden kannalta.",
        "Silti verotuksen kiristykset tulevat säätää maltillisesti ettei investointeja siirry ulkomaille.",
        "Toivomme pykälä 4 muotoilun lievennystä yrittäjävähennyksen osalta.",
      ].join("\n"),
    },
    {
      sourceType: "lausunto",
      sourceUrl: `https://example.invalid/lausunto/mock-sak-${encodeURIComponent(heLabel)}`,
      title: `Mock: SAK – lausunto ${heLabel}`,
      organizationHint: "Suomen Ammattiliittojen Keskusjärjestö SAK",
      textContent: [
        "ESIMERKKI (mock): SAK vastustaa esityksen leikkauslinjaa julkisten palveluiden osalta.",
        "Työntekijöiden turvaverkkoa ei tule heikentää.",
        "Vaadimme, että hallituksen sovittelu etuuksista tapahtuu kolmikantaisesti.",
      ].join("\n"),
    },
  ];
}
