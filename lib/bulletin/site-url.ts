/**
 * Viikkolehden ja muiden sähköposti-CTA-linkkien kanoninen alkuperä (https, ei traavia /).
 *
 * Aseta tuotannossa `WEEKLY_BULLETIN_SITE_URL` (tai `NEXT_PUBLIC_SITE_URL`) julkiseen
 * domainiin — muuten `VERCEL_URL` voi olla tilapäinen *.vercel.app -osoite, jolloin
 * linkit vanhenevat tai osoittavat väärään ympäristöön.
 */
export function resolveWeeklyBulletinBaseUrl(): string {
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
  return "https://omatase.fi";
}

/** Käytä sähköpostin propina tullutta baseUrl:ia; täydenä varalla resolveWeeklyBulletinBaseUrl. */
export function normalizeBulletinBaseUrl(raw?: string | null): string {
  const t = raw?.trim().replace(/[\r\n]/g, "");
  if (t) {
    if (t.startsWith("http://") || t.startsWith("https://")) {
      return t.replace(/\/+$/, "");
    }
    return `https://${t.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  }
  return resolveWeeklyBulletinBaseUrl();
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
