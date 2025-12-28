import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { billId, summary } = await request.json();

    if (!billId || !summary) {
      return NextResponse.json(
        { error: "billId and summary are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("bills")
      .update({
        summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", billId);

    if (error) {
      console.error("Failed to save summary:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save summary:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

