/** Normalisoi asiakirjatunnuksesta HE xx/yyyy -muodon legislative_projects.he_tunnus -avaimena. */
export function heFromFinnishDocId(tunnus: string | null): string | null {
  if (!tunnus) return null;
  const m = tunnus.match(/\b(HE\s*\d+\/\d{4})\b/i);
  if (!m) return null;
  return m[1]
    .replace(/\s+/g, " ")
    .replace(/^HE\s*/i, "HE ")
    .trim();
}
