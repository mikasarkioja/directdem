/**
 * Data Health Check — Eduskuntavahti / Omatase (MVP)
 *
 * Tarkistaa kriittisten taulujen rivimäärät service role -avaimella (RLV ohitetaan).
 *
 * Usage: npx tsx scripts/verify-data.ts
 *    or: npm run verify-data
 *
 * Env: .env.local → NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type TableSpec = {
  name: string;
  fallbacks?: string[];
};

/** Dokumentoidut taulut; municipal_records → municipal_cases tässä repossa */
const DATA_TABLES: TableSpec[] = [
  { name: "legislative_projects" },
  { name: "lobbyist_interventions" },
  { name: "person_interests" },
  { name: "municipal_records", fallbacks: ["municipal_cases"] },
  { name: "mp_ai_profiles" },
];

const SYNC_TIME_COLUMNS = [
  "last_sync",
  "synced_at",
  "updated_at",
  "created_at",
] as const;

type ResolveResult = {
  label: string;
  count: number;
  error?: string;
  usedFallbackFrom?: string;
};

async function countTable(
  supabase: SupabaseClient,
  spec: TableSpec,
): Promise<ResolveResult> {
  const tryNames = [spec.name, ...(spec.fallbacks ?? [])];
  let lastError = "";
  let sawMissingOnly = true;

  for (const table of tryNames) {
    const { error, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      const missing = /relation|does not exist|42P01|schema cache/i.test(
        error.message,
      );
      if (missing) {
        lastError = error.message;
        continue;
      }
      return { label: table, count: 0, error: error.message };
    }

    sawMissingOnly = false;
    const c = count ?? 0;
    if (c > 0) {
      return {
        label: table,
        count: c,
        usedFallbackFrom: table !== spec.name ? spec.name : undefined,
      };
    }
  }

  if (sawMissingOnly && lastError) {
    return {
      label: spec.name,
      count: 0,
      error: lastError || "Taulua ei löytynyt",
    };
  }

  const label =
    tryNames.length > 1
      ? `${spec.name} (${tryNames.slice(1).join(", ")})`
      : spec.name;
  return { label, count: 0 };
}

async function evaluateSyncLogs(supabase: SupabaseClient): Promise<{
  count: number;
  statusText: string;
  icon: string;
  tableMissing: boolean;
  empty: boolean;
  stale: boolean;
}> {
  const { count, error } = await supabase
    .from("sync_logs")
    .select("*", { count: "exact", head: true });

  if (error) {
    const missing = /relation|does not exist|schema cache|42P01/i.test(
      error.message,
    );
    return {
      count: 0,
      statusText: missing
        ? "Taulu puuttuu — ohitetaan aikaleima"
        : error.message,
      icon: "○",
      tableMissing: true,
      empty: false,
      stale: false,
    };
  }

  const n = count ?? 0;
  if (n === 0) {
    return {
      count: 0,
      statusText: "Tyhjä — ei synkronointilokia",
      icon: "⚠️",
      tableMissing: false,
      empty: true,
      stale: false,
    };
  }

  for (const col of SYNC_TIME_COLUMNS) {
    const { data, error: qErr } = await supabase
      .from("sync_logs")
      .select(col)
      .order(col, { ascending: false })
      .limit(1)
      .maybeSingle();

    if (qErr || !data || !(col in data)) continue;

    const raw = (data as Record<string, unknown>)[col];
    const t =
      typeof raw === "string"
        ? Date.parse(raw)
        : raw instanceof Date
          ? raw.getTime()
          : NaN;
    if (!Number.isFinite(t)) continue;

    const ageMs = Date.now() - t;
    const hoursMax = 24;
    const stale = ageMs > hoursMax * 60 * 60 * 1000;
    const when = new Date(t).toISOString();

    return {
      count: n,
      statusText: stale
        ? `Viimeisin ${col} ${when} (> ${hoursMax} h)`
        : `Viimeisin ${col} ${when} (OK)`,
      icon: stale ? "⚠️" : "✅",
      tableMissing: false,
      empty: false,
      stale,
    };
  }

  return {
    count: n,
    statusText: "Rivejä OK, aikaleimasaraketta ei tunnistettu",
    icon: "✅",
    tableMissing: false,
    empty: false,
    stale: false,
  };
}

function printCheck(title: string, count: number | string, statusLine: string) {
  const countStr = typeof count === "number" ? String(count) : count;
  console.log(`  ${title}`);
  console.log(`    Rivit   : ${countStr}`);
  console.log(`    Tilanne : ${statusLine}`);
  console.log("");
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    console.error(
      "Puuttuu NEXT_PUBLIC_SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY (.env.local).",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rule = "=".repeat(Math.min(72, process.stdout.columns || 72));
  console.log(`\n${rule}`);
  console.log("  Eduskuntavahti / Omatase — Data Health Check");
  console.log(`${rule}\n`);

  let anyDataError = false;
  let anyDataEmpty = false;

  for (const spec of DATA_TABLES) {
    const r = await countTable(supabase, spec);
    const display =
      r.usedFallbackFrom != null
        ? `${r.usedFallbackFrom} -> ${r.label}`
        : r.label;

    if (r.error) {
      anyDataError = true;
      printCheck(display, "—", `⚠️ ${r.error}`);
      continue;
    }

    const ok = r.count > 0;
    if (!ok) anyDataEmpty = true;

    if (ok) {
      printCheck(
        display,
        r.count,
        `✅ ${r.count.toLocaleString("fi-FI")} riviä`,
      );
    } else {
      printCheck(display, r.count, "⚠️ Tyhjä — mock / ei ingestia");
    }
  }

  const sync = await evaluateSyncLogs(supabase);
  const syncStatus = `${sync.icon} ${sync.statusText}`;
  printCheck("sync_logs", sync.count, syncStatus);

  console.log(rule);

  const dataLayerOk = !anyDataError && !anyDataEmpty;
  const syncOk = sync.tableMissing || (!sync.empty && !sync.stale);

  if (dataLayerOk && syncOk) {
    console.log("\n  Yhteenveto:");
    if (sync.tableMissing) {
      console.log("  Kansalaisosio valmis tuotantoon (datalayer).");
      console.log(
        "  Huom: sync_logs puuttuu — harkitse synkronoinnin lokitaulua.",
      );
    } else {
      console.log("  Kansalaisosio valmis tuotantoon.");
    }
    console.log("");
    process.exit(0);
  }

  console.log("\n  Yhteenveto:");
  console.log(
    "  Varoitus: Käytetään edelleen mock-dataa tai data on puutteellista.",
  );
  console.log("");
  process.exit(anyDataError ? 2 : 1);
}

main().catch((e) => {
  console.error("[verify-data]", e);
  process.exit(2);
});
