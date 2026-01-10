/**
 * Standalone script to fetch and profile MPs
 * Run with: npm run fetch-mps
 */

import { createClient } from "@supabase/supabase-js";
import { scrapeAndProfileMPs } from "../lib/eduskunta-scraper";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Missing Supabase environment variables in .env.local");
    process.exit(1);
  }

  console.log("🚀 Starting standalone MP Profiler...");
  console.log(`📍 Using Supabase: ${supabaseUrl}`);

  // Use service role if available for full access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const profiles = await scrapeAndProfileMPs(200, supabase);
    console.log("✅ Analysis complete!");
    console.log(`📊 Processed ${profiles.length} MPs.`);
  } catch (error) {
    console.error("❌ Critical error during profiling:", error);
    process.exit(1);
  }
}

main();


