import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const billId = searchParams.get("billId");
  const mpsStr = searchParams.get("mps");

  if (!billId || !mpsStr) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const mpIds = mpsStr.split(",").map(id => parseInt(id)).filter(id => !isNaN(id));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrity_alerts")
    .select("*")
    .eq("event_id", billId)
    .in("mp_id", mpIds);

  if (error) {
    console.error("Error fetching arena alerts:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data || []);
}

