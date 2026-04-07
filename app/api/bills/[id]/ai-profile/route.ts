import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Shape returned to BillDetail (subset of bill_ai_profiles + fallbacks). */
function json(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profile, error: profileError } = await supabase
    .from("bill_ai_profiles")
    .select("*")
    .eq("bill_id", id)
    .maybeSingle();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("id, title, summary")
    .eq("id", id)
    .maybeSingle();

  if (billError || !bill) {
    return new Response(JSON.stringify({ error: "Bill not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (profileError && !/No rows|JSON/i.test(profileError.message)) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expertFromProfile = profile?.expert_impact_assessment as
    | string
    | null
    | undefined;
  const summary = (bill.summary ?? "").trim();
  const title = (bill.title ?? "").trim();
  const expertFromBill =
    summary.length > 300 && summary !== title ? summary : null;

  const expert =
    expertFromProfile?.trim() ||
    expertFromBill ||
    (summary.length > 0 && summary !== title ? summary : null);

  const deep =
    (profile?.deep_analysis as string | null | undefined)?.trim() || null;

  return json({
    bill_id: id,
    expert_impact_assessment: expert,
    deep_analysis: deep,
    hotspots: profile?.hotspots ?? null,
    audience_hook: profile?.audience_hook ?? null,
    controversy_score: profile?.controversy_score ?? null,
    _fallback:
      !profile && expertFromBill ? "bill_summary" : !profile ? "none" : null,
  });
}
