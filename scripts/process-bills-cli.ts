/**
 * Paikallinen ajo: sama kuin GET /api/cron/process-bills (Vercel cron).
 *
 * Vaatii käynnissä olevan Next-palvelimen:
 *   nvm use (jos tarvitsee) && npm run dev
 *   toisessa terminaalissa: npm run process-bills
 *
 * Vaihtoehto tuotannossa: curl + CRON_SECRET (Authorization: Bearer …).
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_SITE_URL — oletus http://localhost:3000
 *   CRON_SECRET — lähetetään Authorization-headerissa jos asetettu
 *
 * Dry-run (5 esitystä, ei bills/AI-kirjoituksia):
 *   npm run process-bills -- --dry-run [--debug]
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function baseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run") || args.has("--dryRun");
  const debug = args.has("--debug");

  let routePath = "/api/cron/process-bills";
  const qs = new URLSearchParams();
  if (dryRun) qs.set("dryRun", "1");
  if (debug) qs.set("debug", "1");
  const q = qs.toString();
  if (q) routePath += `?${q}`;

  const url = `${baseUrl().replace(/\/$/, "")}${routePath}`;
  const secret = process.env.CRON_SECRET?.trim();

  const headers: Record<string, string> = {};
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  console.log("[process-bills] GET", url);

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch (e) {
    console.error(
      "[process-bills] Yhteys epäonnistui. Käynnistäkö dev-palvelin (npm run dev)?",
      e instanceof Error ? e.message : e,
    );
    process.exit(1);
    return;
  }

  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* plain text */
  }

  console.log(typeof body === "string" ? body : JSON.stringify(body, null, 2));

  if (!res.ok) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[process-bills]", e);
  process.exit(1);
});
