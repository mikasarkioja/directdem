import { findBestMatch } from "@/lib/eduskunta-scraper";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // Get specific match for a tribe/party DNA
  // Expected query: ?economy=0.5&values=-0.2&environment=0.8
  const economy = parseFloat(searchParams.get("economy") || "0");
  const values = parseFloat(searchParams.get("values") || "0");
  const environment = parseFloat(searchParams.get("environment") || "0");

  const matches = await findBestMatch({ economy, values, environment });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    query: { economy, values, environment },
    matches: matches?.slice(0, 5) || [] // Return top 5 matches
  });
}

