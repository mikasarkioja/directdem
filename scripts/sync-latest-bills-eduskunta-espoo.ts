/**
 * Populate latest:
 *   • Eduskunta HE-list → public.bills (parliament_id upsert)
 *   • Espoo valtuusto RSS → public.municipal_cases (municipality + external_id upsert)
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/sync-latest-bills-eduskunta-espoo.ts
 *   npx tsx scripts/sync-latest-bills-eduskunta-espoo.ts --eduskunta 80 --espoo 40
 *   npx tsx scripts/sync-latest-bills-eduskunta-espoo.ts --espoo-all   # all RSS rows, not only "valtuusto"
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { getLatestBills } from "../lib/eduskunta-api";
import { EspooAPI } from "../lib/municipal-api";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function parseArgs(): {
  eduskunta: number;
  espoo: number;
  espooAllRss: boolean;
} {
  const a = process.argv.slice(2);
  let eduskunta = 50;
  let espoo = 40;
  let espooAllRss = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--eduskunta" && a[i + 1]) {
      eduskunta = Math.max(1, parseInt(a[i + 1], 10) || 50);
      i++;
    } else if (a[i] === "--espoo" && a[i + 1]) {
      espoo = Math.max(1, parseInt(a[i + 1], 10) || 40);
      i++;
    } else if (a[i] === "--espoo-all") {
      espooAllRss = true;
    }
  }
  return { eduskunta, espoo, espooAllRss };
}

async function syncEduskuntaBills(
  supabase: SupabaseClient,
  limit: number,
): Promise<{ upserted: number; errors: string[] }> {
  const issues = await getLatestBills(limit);
  if (issues.length === 0) {
    return { upserted: 0, errors: ["No bills returned from Eduskunta API"] };
  }

  const billsMap = new Map<string, Record<string, unknown>>();
  for (const issue of issues) {
    const cleanParliamentId = issue.parliamentId.split(",")[0].trim();
    if (!cleanParliamentId || billsMap.has(cleanParliamentId)) continue;
    billsMap.set(cleanParliamentId, {
      parliament_id: cleanParliamentId,
      title: issue.title,
      summary: issue.abstract,
      raw_text: issue.abstract,
      status:
        issue.status === "active"
          ? "voting"
          : issue.status === "pending"
            ? "draft"
            : "in_progress",
      category: issue.category || "Hallituksen esitys",
      published_date: issue.publishedDate || new Date().toISOString(),
      url: issue.url,
    });
  }

  const rows = Array.from(billsMap.values());
  const errors: string[] = [];
  let upserted = 0;
  const chunkSize = 25;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("bills")
      .upsert(chunk, { onConflict: "parliament_id", ignoreDuplicates: false })
      .select("id");

    if (error) {
      errors.push(`batch ${i}-${i + chunk.length}: ${error.message}`);
    } else {
      upserted += data?.length ?? chunk.length;
    }
  }

  return { upserted, errors };
}

async function syncEspooMunicipalCases(
  supabase: SupabaseClient,
  limit: number,
  espooAllRss: boolean,
): Promise<{ upserted: number; errors: string[] }> {
  const api = new EspooAPI();
  const items = await api.fetchLatestItems(limit, {
    valtuustoOnly: !espooAllRss,
  });
  if (items.length === 0) {
    return {
      upserted: 0,
      errors: ["No Espoo items from RSS (check filter / feed)"],
    };
  }

  const casesToInsert = items.map((item) => {
    const externalId = (item.url || item.id || "").trim();
    const meetingRaw = item.meetingDate
      ? new Date(item.meetingDate).toISOString()
      : new Date().toISOString();
    return {
      municipality: item.municipality,
      external_id: externalId || `espoo-${item.id}`,
      title: item.title,
      summary: item.summary || item.title,
      raw_text: item.content || "",
      status: item.status || "agenda",
      meeting_date: meetingRaw,
      org_name: item.orgName || "Kaupunginvaltuusto",
      url: item.url || "",
    };
  });

  const { data, error } = await supabase
    .from("municipal_cases")
    .upsert(casesToInsert, {
      onConflict: "municipality,external_id",
      ignoreDuplicates: false,
    })
    .select("id");

  if (error) {
    return { upserted: 0, errors: [error.message] };
  }
  return { upserted: data?.length ?? casesToInsert.length, errors: [] };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const { eduskunta, espoo, espooAllRss } = parseArgs();
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    `[sync-bills] Eduskunta limit=${eduskunta}, Espoo municipal_cases limit=${espoo}, espooAllRss=${espooAllRss}`,
  );

  const ed = await syncEduskuntaBills(supabase, eduskunta);
  console.log("[sync-bills] Eduskunta → bills:", ed);

  const es = await syncEspooMunicipalCases(supabase, espoo, espooAllRss);
  console.log("[sync-bills] Espoo RSS → municipal_cases:", es);

  const failed = ed.errors.length + es.errors.length;
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
