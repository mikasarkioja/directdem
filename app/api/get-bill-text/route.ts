import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get("billId");

    if (!billId) {
      return NextResponse.json(
        { error: "billId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: bill, error } = await supabase
      .from("bills")
      .select("raw_text, summary, parliament_id")
      .eq("id", billId)
      .single();

    if (error || !bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    // Return raw_text if available, otherwise summary
    const text = bill.raw_text || bill.summary || null;

    return NextResponse.json({
      text,
      hasRawText: !!bill.raw_text,
      parliamentId: bill.parliament_id,
    });
  } catch (error: any) {
    console.error("Failed to get bill text:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

