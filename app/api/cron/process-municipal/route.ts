import { NextRequest, NextResponse } from "next/server";
import { getMunicipalDecisions } from "@/app/actions/espoo-actions";
import { createAdminClient } from "@/lib/supabase/server";

export const maxDuration = 300; // 5 minutes

/**
 * Cron job endpoint that runs daily to scan municipal decisions
 * for Espoo, Helsinki, and Vantaa.
 *
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase = await createAdminClient();
    const cities = ["Espoo", "Helsinki", "Vantaa"];
    const results: any = {};

    console.log(
      `[Cron] Starting daily municipal scan for: ${cities.join(", ")}`,
    );

    for (const city of cities) {
      try {
        console.log(`[Cron] Scanning ${city}...`);
        const decisions = await getMunicipalDecisions(city, supabase);
        results[city] = {
          success: true,
          count: decisions.length,
        };
      } catch (cityError: any) {
        console.error(`[Cron] Error scanning ${city}:`, cityError);
        results[city] = {
          success: false,
          error: cityError.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Municipal scan completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron] Fatal error in municipal scan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
