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
    const analysis = await analyzeConflicts(billId, mpId);
    return new Response(JSON.stringify(analysis), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

