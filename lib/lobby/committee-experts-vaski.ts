/**
 * Valiokuntien asiantuntijakuulemiset: Eduskunnan Vaski, asiakirjatyyppi "Asiantuntijalausunto".
 * Lähde: https://avoindata.eduskunta.fi/ (virallinen avoin rajapinta).
 */

import * as cheerio from "cheerio";
import { normalizeOrganization } from "@/lib/lobby/org-normalize";

const API_LIST =
  "https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi";

export type VaskiExpertRow = {
  vaskiRowId: string;
  eduskuntaTunnus: string | null;
  titlePlain: string;
  pdfUrl: string | null;
  committeeCode: string | null;
  sessionDateRaw: string | null;
  expertName: string | null;
  expertOrganization: string | null;
  expertOrganizationNormalized: string | null;
};

type ApiListResponse = {
  page?: number;
  perPage?: number;
  hasMore?: boolean;
  columnNames?: string[];
  rowData?: unknown[][];
};

function stripXmlish(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHref(cellHtml: string): string | null {
  const $ = cheerio.load(`<wrap>${cellHtml}</wrap>`);
  const href = $("a").attr("href");
  if (!href) return null;
  if (href.startsWith("http")) return href;
  return null;
}

/**
 * Parsii Vaski-nimekkeestä valiokunnan lyhenteen, päivän, asiantuntijan ja organisaation (heuristiikka).
 * Esim. "U 1/2026 vp SuV 04.03.2026 rajaturvallisuusasiantuntija, everstiluutnantti X, Rajavartiolaitos"
 */
export function parseExpertTitlePlain(titlePlain: string): {
  committeeCode: string | null;
  sessionDateRaw: string | null;
  expertName: string | null;
  expertOrganization: string | null;
} {
  const t = titlePlain.replace(/\s+Asiantuntijalausunto\s*$/i, "").trim();

  const committeeMatch = t.match(/\b([A-ZÄÖÅ]{2,4}V)\b/);
  const committeeCode = committeeMatch ? committeeMatch[1] : null;

  const dateMatch = t.match(/\b(\d{2}\.\d{2}\.\d{4})\b/);
  const sessionDateRaw = dateMatch ? dateMatch[1] : null;

  let rest = t;
  if (committeeCode) rest = rest.replace(committeeCode, " ");
  if (sessionDateRaw) rest = rest.replace(sessionDateRaw, " ");
  rest = rest.replace(/^(?:[A-Z]\s+)?[\d/]+(?:\s+vp)?\s+/i, "");
  rest = rest.replace(/\s+/g, " ").trim();

  let expertName: string | null = null;
  let expertOrganization: string | null = null;

  const commaIdx = rest.lastIndexOf(",");
  if (commaIdx !== -1) {
    const left = rest.slice(0, commaIdx).trim();
    const right = rest.slice(commaIdx + 1).trim();
    expertOrganization = right || null;
    const parts = left.split(/\s*,\s*/);
    expertName = parts.length ? parts[parts.length - 1].trim() || null : left;
  } else {
    expertName = rest || null;
  }

  return { committeeCode, sessionDateRaw, expertName, expertOrganization };
}

export async function fetchVaskiExpertStatementPage(
  page: number,
  perPage: number = 50,
): Promise<{ rows: VaskiExpertRow[]; hasMore: boolean }> {
  const url = `${API_LIST}?perPage=${perPage}&page=${page}&languageCode=fi&filter=${encodeURIComponent("Asiantuntijalausunto")}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "DirectDem-LobbyTrace/1.0 (+https://avoindata.eduskunta.fi/)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Vaski Asiantuntijalausunto list: HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiListResponse;
  const cols = data.columnNames ?? [];
  const idx = (name: string) => cols.indexOf(name);
  const pick = (name: string, fallback: number) => {
    const i = idx(name);
    return i >= 0 ? i : fallback;
  };
  const idI = pick("Id", 0);
  const tunI = pick("EduskuntaTunnus", 1);
  const titleI = pick("NimekeTeksti", 3);
  const urlI = pick("Url", 5);

  const rows: VaskiExpertRow[] = [];
  for (const r of data.rowData ?? []) {
    if (!Array.isArray(r) || idI < 0) continue;
    const rawTitle = stripXmlish(String(r[titleI] ?? ""));
    const pdfUrl = r[urlI] != null ? extractHref(String(r[urlI])) : null;
    const parsed = parseExpertTitlePlain(rawTitle);
    const orgNorm = parsed.expertOrganization
      ? normalizeOrganization(parsed.expertOrganization)
      : null;
    rows.push({
      vaskiRowId: String(r[idI]),
      eduskuntaTunnus: r[tunI] != null ? stripXmlish(String(r[tunI])) : null,
      titlePlain: rawTitle,
      pdfUrl,
      committeeCode: parsed.committeeCode,
      sessionDateRaw: parsed.sessionDateRaw,
      expertName: parsed.expertName,
      expertOrganization: parsed.expertOrganization,
      expertOrganizationNormalized: orgNorm,
    });
  }

  return { rows, hasMore: !!data.hasMore };
}

export async function fetchRecentVaskiExpertStatements(
  maxPages: number = 3,
): Promise<VaskiExpertRow[]> {
  const out: VaskiExpertRow[] = [];
  for (let p = 0; p < maxPages; p++) {
    const batch = await fetchVaskiExpertStatementPage(p, 40);
    out.push(...batch.rows);
    if (!batch.hasMore) break;
  }
  return out;
}
