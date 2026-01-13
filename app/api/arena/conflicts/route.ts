import { createClient } from "@/lib/supabase/server";
import { analyzeConflicts } from "@/lib/ai/dependency-radar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const billId = searchParams.get("billId");
  const mpId = searchParams.get("mpId");

  if (!billId || !mpId) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
  }

  try {
    const supabase = await createClient();
    let finalMpId = mpId;

    // Jos ID on UUID (kuntapäättäjä), yritetään etsiä vastaava kansanedustaja
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mpId);
    
    if (isUuid) {
      const { data: councilor } = await supabase
        .from("councilors")
        .select("full_name")
        .eq("id", mpId)
        .single();

      if (councilor) {
        const { data: mpMatch } = await supabase
          .from("mps")
          .select("id")
          .ilike("first_name", councilor.full_name.split(" ")[0])
          .ilike("last_name", councilor.full_name.split(" ").slice(1).join(" "))
          .maybeSingle();

        if (mpMatch) {
          finalMpId = mpMatch.id.toString();
        }
      }
    }

    const analysis = await analyzeConflicts(billId, finalMpId);
    return new Response(JSON.stringify(analysis), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

