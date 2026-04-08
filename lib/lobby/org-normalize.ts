/**
 * Yhteinen organisaationimen normalisointi sidonnaisuus- ja lobbariristiinviittauksille.
 */

export function normalizeOrganization(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[.,\-–—/]+/g, " ")
    .replace(/\s+(oy|oyj|ab|ltd|ry|sr)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Osittaista osumaorganisaatiota varten: pitää sisältää normalisoidun osajonon tai päinvastoin. */
export function organizationsLikelyMatch(a: string, b: string): boolean {
  const na = normalizeOrganization(a);
  const nb = normalizeOrganization(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 6 && nb.includes(na)) return true;
  if (nb.length >= 6 && na.includes(nb)) return true;
  const ta = new Set(na.split(" ").filter((w) => w.length > 2));
  const tb = new Set(nb.split(" ").filter((w) => w.length > 2));
  let overlap = 0;
  for (const w of ta) {
    if (tb.has(w)) overlap++;
  }
  return overlap >= 2;
}
