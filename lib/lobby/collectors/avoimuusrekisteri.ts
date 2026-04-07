import type { LobbySourceDocument } from "@/lib/lobby/types";

const DEFAULT_API = "https://public.api.avoimuusrekisteri.fi";

/**
 * Hakee avoimuusrekisteristä raportointimerkintöjä, joiden kuvaus viittaa HE-tunnukseen.
 * Tarkka polku ja hakuparametrit: public.api.avoimuusrekisteri.fi Swagger.
 * Kun virallinen endpoint on kovakoodattu, korvaa fetchUrl ja parsinta.
 */
export async function fetchAvoimuusSourcesForHe(
  heTunnus: string,
): Promise<LobbySourceDocument[]> {
  const normalized = heTunnus.trim();
  if (!normalized) return [];

  if (process.env.LOBBY_TRACE_USE_MOCK === "true") {
    return mockAvoimuus(normalized);
  }

  const base =
    process.env.AVOIMUUSREKISTERI_API_BASE?.replace(/\/$/, "") || DEFAULT_API;
  const token = process.env.AVOIMUUSREKISTERI_API_TOKEN;

  const tryPaths = [
    `/api/v1/disclosure?search=${encodeURIComponent(normalized)}`,
    `/api/v1/reportingentries?freeText=${encodeURIComponent(normalized)}`,
  ];

  for (const path of tryPaths) {
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Accept-Language": "fi",
        "User-Agent":
          "DirectDem-LobbyTrace/1.0 (+https://github.com/mikasarkioja/directdem)",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${base}${path}`, {
        headers,
        next: { revalidate: 7200 },
      });
      if (!res.ok) continue;

      const data = (await res.json()) as unknown;
      const parsed = parseReportingNoise(data, normalized, base + path);
      if (parsed.length) return parsed;
    } catch {
      // try next path
    }
  }

  if (process.env.LOBBY_TRACE_AVOIMUUS_OFF !== "true") {
    console.info(
      "[avoimuusrekisteri] No rows parsed for",
      normalized,
      "- confirm API path in Swagger",
    );
  }
  return [];
}

function parseReportingNoise(
  data: unknown,
  heTunnus: string,
  sourceBase: string,
): LobbySourceDocument[] {
  const lowerHe = heTunnus.toLowerCase();
  const rows: LobbySourceDocument[] = [];

  const items = extractArray(data);
  let idx = 0;
  for (const item of items) {
    const blob = JSON.stringify(item).toLowerCase();
    if (!blob.includes(lowerHe)) continue;

    const title =
      (item as Record<string, unknown>)["title"] ??
      (item as Record<string, unknown>)["subject"] ??
      `Avoimuusrekisteri-merkintä ${++idx}`;
    const url =
      (typeof (item as Record<string, unknown>)["uri"] === "string"
        ? (item as Record<string, unknown>)["uri"]
        : null) ||
      (typeof (item as Record<string, unknown>)["url"] === "string"
        ? (item as Record<string, unknown>)["url"]
        : null) ||
      sourceBase;

    rows.push({
      sourceType: "avoimuus",
      sourceUrl: String(url),
      title: String(title),
      textContent: [
        `Automaattinen poiminta HE-viitteen ${heTunnus} perusteella.`,
        `Raakadatan lyhenne: ${String(blob).slice(0, 1200)}`,
      ].join("\n"),
    });
    if (rows.length >= 10) break;
  }

  return rows;
}

function extractArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["items", "data", "results", "reportingEntries"]) {
      const v = o[key];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

function mockAvoimuus(heLabel: string): LobbySourceDocument[] {
  return [
    {
      sourceType: "avoimuus",
      sourceUrl: `https://example.invalid/avoimuus/mock-ek-${encodeURIComponent(heLabel)}`,
      title: `Mock tapaaminen: EK – hallituksen esitys ${heLabel}`,
      organizationHint: "Elinkeinoelämän keskusliitto",
      textContent:
        "ESIMERKKI (mock): EK on tavannut valmisteluhenkilöitä koskien esitystä. Keskusteltu verotuksen ja kilpailukyvyn vaikutuksista.",
    },
    {
      sourceType: "avoimuus",
      sourceUrl: `https://example.invalid/avoimuus/mock-sak-${encodeURIComponent(heLabel)}`,
      title: `Mock tapaaminen: SAK – hallituksen esitys ${heLabel}`,
      organizationHint: "SAK",
      textContent:
        "ESIMERKKI (mock): SAK on tavannut kansanedustajia ja esittänyt huolta leikkausten vaikutuksista palkansaajiin.",
    },
  ];
}
