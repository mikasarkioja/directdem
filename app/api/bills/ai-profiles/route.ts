import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the latest 50 bills from the primary bills table (National)
  const { data: latestNationalBills, error: billsError } = await supabase
    .from("bills")
    .select("id, title")
    .order("published_date", { ascending: false })
    .limit(50);

  if (billsError) {
    return new Response(JSON.stringify({ error: billsError.message }), { status: 500 });
  }

  // Fetch the latest 50 municipal decisions (Local)
  const { data: latestMuniDecisions, error: muniError } = await supabase
    .from("municipal_decisions")
    .select("id, title, municipality")
    .order("decision_date", { ascending: false })
    .limit(50);

  if (muniError) {
    console.warn("Muni fetch error:", muniError);
  }

  // Fetch all enhanced profiles to match them
  const { data: enhancedProfiles, error: profilesError } = await supabase
    .from("bill_enhanced_profiles")
    .select("bill_id, analysis_data");

  if (profilesError) {
    console.warn("Profiles fetch error:", profilesError);
  }

  const profileMap = new Map();
  enhancedProfiles?.forEach(p => profileMap.set(p.bill_id, p.analysis_data));

  // Combine National Bills
  const nationalData = (latestNationalBills || []).map(b => ({
    bill_id: b.id,
    title: b.title,
    analysis_data: profileMap.get(b.id) || null
  }));

  // Combine Municipal Decisions
  const municipalData = (latestMuniDecisions || []).map(d => {
    const muniId = `MUNI-${d.municipality.toUpperCase()}-${d.id}`;
    return {
      bill_id: muniId,
      title: `[${d.municipality}] ${d.title}`,
      analysis_data: profileMap.get(muniId) || null
    };
  });

  const data = [...nationalData, ...municipalData];

  if (!data || data.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}

