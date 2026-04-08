import { createClient } from "@/lib/supabase/server";

/**
 * Rajaa käyttäjän vaalipiiristä yhden aktiivisen kansanedustajan (yhteystiedot / areena).
 */
export async function resolveConstituencyMpId(
  vaalipiiri: string | null | undefined,
): Promise<number | null> {
  if (!vaalipiiri?.trim()) return null;
  const supabase = await createClient();
  const q = vaalipiiri.trim();

  const exact = await supabase
    .from("mps")
    .select("id")
    .eq("is_active", true)
    .ilike("vaalipiiri", q)
    .limit(1)
    .maybeSingle();

  if (exact.data?.id != null) return exact.data.id as number;

  const loose = await supabase
    .from("mps")
    .select("id")
    .eq("is_active", true)
    .ilike("vaalipiiri", `%${q}%`)
    .limit(1)
    .maybeSingle();

  return loose.data?.id ?? null;
}
