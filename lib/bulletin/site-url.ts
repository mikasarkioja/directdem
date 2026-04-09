/**
 * Viikkolehden ja muiden sähköposti-CTA-linkkien kanoninen alkuperä (https, ei traavia /).
 *
 * `WEEKLY_BULLETIN_SITE_URL` tai `NEXT_PUBLIC_SITE_URL` ohittaa oletuksen. `omatase.fi`
 * korvataan viikkolehden linkeissä → `directdem.vercel.app`.
 */
const BULLETIN_PUBLIC_ORIGIN = "https://directdem.vercel.app";

function bulletinOriginFromCandidates(): string {
  const candidates = [
    process.env.WEEKLY_BULLETIN_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const t = raw?.trim().replace(/[\r\n]/g, "");
    if (!t) continue;
    if (t.startsWith("http://") || t.startsWith("https://")) {
      return t.replace(/\/+$/, "");
    }
    return `https://${t.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  }
  return BULLETIN_PUBLIC_ORIGIN;
}

/** Vanha brändi-URL: korvataan DirectDem-julkisella hostilla viikkolehden CTA:ssa. */
function rewriteLegacyOmataseForBulletin(origin: string): string {
  const base = origin.replace(/\/+$/, "");
  try {
    const u = new URL(base);
    if (u.hostname === "omatase.fi" || u.hostname === "www.omatase.fi") {
      return BULLETIN_PUBLIC_ORIGIN;
    }
  } catch {
    /* keep base */
  }
  return base;
}

export function resolveWeeklyBulletinBaseUrl(): string {
  return rewriteLegacyOmataseForBulletin(bulletinOriginFromCandidates());
}

/** Käytä sähköpostin propina tullutta baseUrl:ia; täydenä varalla resolveWeeklyBulletinBaseUrl. */
export function normalizeBulletinBaseUrl(raw?: string | null): string {
  const t = raw?.trim().replace(/[\r\n]/g, "");
  if (!t) return resolveWeeklyBulletinBaseUrl();
  let base: string;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    base = t.replace(/\/+$/, "");
  } else {
    base = `https://${t.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  }
  return rewriteLegacyOmataseForBulletin(base);
}

/** Absoluuttinen URL sähköposteja varten (sähköpostiohjelmat eivät yleensä seuraa suhteellisia href:eja). */
export function bulletinAbsoluteUrl(
  origin: string,
  pathWithQuery: string,
): string {
  const base = origin.replace(/\/+$/, "");
  const path = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;
  try {
    return new URL(path, `${base}/`).href;
  } catch {
    return `${base}${path}`;
  }
}
