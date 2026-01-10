import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("bill_ai_profiles")
    .select("*")
    .eq("bill_id", id)
    .single();

  if (error || !data) {
    // Jos profiilia ei ole, voimme joko palauttaa tyhjää tai yrittää generoida sen livenä
    // Demossa palautetaan vain 404
    return new Response(JSON.stringify({ error: "Bill AI Profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}

