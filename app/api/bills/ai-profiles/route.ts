import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("bill_ai_profiles")
    .select(`
      bill_id,
      bills ( title )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Flatten the response
  const flattened = data.map((d: any) => ({
    bill_id: d.bill_id,
    title: d.bills?.title || "Nimetön lakiesitys"
  }));

  return new Response(JSON.stringify(flattened), {
    headers: { "Content-Type": "application/json" }
  });
}

