import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type BillLobbyFeedMeta = {
  lobbyInterventionCount: number;
  interestSectorConflict: boolean;
};

type BillMetaInput = {
  id: string;
  parliamentId?: string | null;
  title: string;
  category?: string | null;
};

function detectSectorConflict(
  bill: BillMetaInput,
  interests: {
    interest_organization: string | null;
    interest_organization_normalized: string | null;
  }[],
): boolean {
  const hay = `${bill.title} ${bill.category ?? ""}`.toLowerCase();
  for (const row of interests) {
    const org = (
      row.interest_organization_normalized ||
      row.interest_organization ||
      ""
    ).toLowerCase();
    if (org.length < 4) continue;
    const words = org.split(/[^a-zåäö0-9]+/i).filter((w) => w.length > 4);
    if (words.some((w) => hay.includes(w))) return true;
    if (org.length >= 8 && hay.includes(org.slice(0, Math.min(12, org.length))))
      return true;
  }
  return false;
}

/**
 * Yksi kysely: lobbauksen määrä + kevyt sidonnaisuusristiin (otsikko/kategoria vs. organisaatio).
 */
export async function enrichBillsWithLobbyMetadata(
  bills: BillMetaInput[],
): Promise<Map<string, BillLobbyFeedMeta>> {
  const out = new Map<string, BillLobbyFeedMeta>();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  for (const b of bills) {
    out.set(b.id, { lobbyInterventionCount: 0, interestSectorConflict: false });
  }

  if (!url || !key || bills.length === 0) return out;

  const supabase = createSupabaseClient(url, key);

  const billIds = bills.map((b) => b.id);
  const heList = [
    ...new Set(
      bills.map((b) => b.parliamentId?.trim()).filter(Boolean) as string[],
    ),
  ];

  let lpByBill: { id: string; bill_id: string | null; he_tunnus: string }[] =
    [];
  if (billIds.length) {
    const { data } = await supabase
      .from("legislative_projects")
      .select("id, bill_id, he_tunnus")
      .in("bill_id", billIds);
    lpByBill = data ?? [];
  }

  let lpByHe: { id: string; bill_id: string | null; he_tunnus: string }[] = [];
  if (heList.length) {
    const { data } = await supabase
      .from("legislative_projects")
      .select("id, bill_id, he_tunnus")
      .in("he_tunnus", heList);
    lpByHe = data ?? [];
  }

  const billToLp = new Map<string, string>();
  for (const b of bills) {
    const fromBill = lpByBill.find((lp) => lp.bill_id === b.id);
    if (fromBill) {
      billToLp.set(b.id, fromBill.id);
      continue;
    }
    const he = b.parliamentId?.trim();
    if (he) {
      const fromHe = lpByHe.find((lp) => lp.he_tunnus === he);
      if (fromHe) billToLp.set(b.id, fromHe.id);
    }
  }

  const lpIds = [...new Set(billToLp.values())];
  const countByLp = new Map<string, number>();

  if (lpIds.length) {
    const { data: interventions } = await supabase
      .from("lobbyist_interventions")
      .select("legislative_project_id")
      .in("legislative_project_id", lpIds);

    for (const row of interventions || []) {
      const lid = row.legislative_project_id as string;
      countByLp.set(lid, (countByLp.get(lid) || 0) + 1);
    }
  }

  const { data: interests } = await supabase
    .from("person_interests")
    .select("interest_organization, interest_organization_normalized")
    .limit(900);

  const interestRows = interests ?? [];

  for (const b of bills) {
    const lp = billToLp.get(b.id);
    const count = lp ? countByLp.get(lp) || 0 : 0;
    const interestSectorConflict = detectSectorConflict(b, interestRows);
    out.set(b.id, { lobbyInterventionCount: count, interestSectorConflict });
  }

  return out;
}

/** Päätösnäkymä / syöte: yksi bill-UUID. */
export async function getBillLobbySurfaceSignals(
  billId: string,
): Promise<BillLobbyFeedMeta> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key)
    return { lobbyInterventionCount: 0, interestSectorConflict: false };

  const supabase = createSupabaseClient(url, key);
  const { data: bill, error } = await supabase
    .from("bills")
    .select("id, parliament_id, title, category")
    .eq("id", billId)
    .maybeSingle();

  if (error || !bill) {
    return { lobbyInterventionCount: 0, interestSectorConflict: false };
  }

  const map = await enrichBillsWithLobbyMetadata([
    {
      id: bill.id,
      parliamentId: bill.parliament_id,
      title: bill.title,
      category: bill.category,
    },
  ]);

  return (
    map.get(bill.id) ?? {
      lobbyInterventionCount: 0,
      interestSectorConflict: false,
    }
  );
}
