/**
 * Sidonnaisuudet → person_interests Eduskunnan avoimen datan MemberOfParliament / XmlDataFi -XML:stä.
 * Lähde: https://avoindata.eduskunta.fi/api/v1/tables/MemberOfParliament/rows
 *
 * Kirjaa vain rivit, joille löytyy public.mps.id = personId (viite-eheys).
 *
 * Aja: npx tsx scripts/import-initial-interests.ts
 * Rajoitu testiin: npx tsx scripts/import-initial-interests.ts --max-pages=2
 */

import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import {
  ingestPersonInterests,
  OFFICIAL_INTEREST_SOURCE_LABELS,
  type PersonInterestInsert,
} from "@/lib/lobby/person-interests-ingest";
import { recordSyncSuccess } from "@/lib/ops/sync-logs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const API =
  "https://avoindata.eduskunta.fi/api/v1/tables/MemberOfParliament/rows";

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function norm(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/\s+/g, " ").trim();
}

function extractBlocks(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function extractInner(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return norm(m?.[1] ?? "");
}

/** Etsi konkreettiset sidonnaisuusrivit (ei pelkkä kategoriaotsikko). */
function parseInterestLines(xml: string): { text: string; group?: string }[] {
  const sidBlocks = extractBlocks(xml, "Sidonnaisuus");
  const out: { text: string; group?: string }[] = [];
  for (const b of sidBlocks) {
    const sidonta = extractInner(b, "Sidonta");
    const otsikko = extractInner(b, "Otsikko");
    const ryhma = extractInner(b, "RyhmaOtsikko");
    const text = sidonta || otsikko;
    if (!text || text.length < 4) continue;
    if (/^-+$/.test(text)) continue;
    if (text.includes("----")) continue;
    if (text === ryhma) continue;
    out.push({
      text: text.slice(0, 800),
      group: ryhma || undefined,
    });
  }
  return out;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Puuttuvat NEXT_PUBLIC_SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }

  const maxPagesArg = process.argv.find((a) => a.startsWith("--max-pages="));
  const maxPages = maxPagesArg
    ? Math.max(1, parseInt(maxPagesArg.split("=")[1], 10) || 40)
    : 40;

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: mpsRows, error: mpErr } = await admin.from("mps").select("id");
  if (mpErr || !mpsRows?.length) {
    console.error("Ei mps-rivejä tai virhe:", mpErr?.message);
    process.exit(1);
  }
  const mpIds = new Set((mpsRows as { id: number }[]).map((r) => r.id));

  let totalParsed = 0;
  let totalInserted = 0;
  const batch: PersonInterestInsert[] = [];

  const flush = async () => {
    if (!batch.length) return;
    const r = await ingestPersonInterests(admin, [...batch]);
    if (r.error) console.warn("[ingest]", r.error);
    else totalInserted += r.inserted;
    batch.length = 0;
  };

  for (let page = 0; page < maxPages; page++) {
    const { data } = await axios.get(API, {
      params: { perPage: 100, page },
      timeout: 60000,
      headers: { "User-Agent": "Omatase-DataImport/1.0" },
    });

    const columnNames: string[] = data.columnNames ?? [];
    const rowData: unknown[][] = data.rowData ?? [];
    if (!rowData.length) break;

    const idx = {
      personId: columnNames.indexOf("personId"),
      firstname: columnNames.indexOf("firstname"),
      lastname: columnNames.indexOf("lastname"),
      xmlFi: columnNames.indexOf("XmlDataFi"),
    };

    for (const row of rowData) {
      const personId = parseInt(String(row[idx.personId]), 10);
      if (!Number.isFinite(personId) || !mpIds.has(personId)) continue;

      const xml = String(row[idx.xmlFi] ?? "");
      if (!xml.includes("<Sidonnaisuudet")) continue;

      const lines = parseInterestLines(xml);
      if (!lines.length) continue;

      const fn = norm(String(row[idx.firstname] ?? ""));
      const ln = norm(String(row[idx.lastname] ?? ""));
      const display = `${fn} ${ln}`.trim() || `MP ${personId}`;
      const baseUrl = `https://www.eduskunta.fi/FI/kansanedustajat/Pages/${personId}.aspx`;

      for (const line of lines) {
        const frag = shortHash(`${personId}|${line.text}|${line.group ?? ""}`);
        totalParsed++;
        batch.push({
          subject_type: "mp",
          mp_id: personId,
          person_display_name: display,
          interest_organization: line.text.slice(0, 500),
          role_or_relation: line.group ?? null,
          declaration_url: `${baseUrl}#sid-${frag}`,
          source_register_label: OFFICIAL_INTEREST_SOURCE_LABELS.eduskuntaFi,
          raw_excerpt: line.text.slice(0, 2000),
        });
        if (batch.length >= 80) await flush();
      }
    }
  }

  await flush();

  console.log(
    JSON.stringify(
      { parsedEntries: totalParsed, upsertedRowsReported: totalInserted },
      null,
      2,
    ),
  );

  await recordSyncSuccess(admin, "import-initial-interests");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
