/**
 * Standalone script to fetch latest bills from Eduskunta and sync to Supabase
 * Run with: npm run fetch-eduskunta-data
 */

import { createClient } from "@supabase/supabase-js";
import { getLatestBills } from "../lib/eduskunta-api";
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

  console.log("🚀 Starting Eduskunta Bill Sync...");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const limit = 50;
    console.log(`📡 Fetching latest ${limit} bills from Eduskunta API...`);
    const eduskuntaIssues = await getLatestBills(limit);
    
    if (eduskuntaIssues.length === 0) {
      console.log("⚠️ No bills found from API.");
      return;
    }

    console.log(`✅ Found ${eduskuntaIssues.length} bills. Syncing to Supabase...`);

    const billsToInsert = eduskuntaIssues.map((issue) => ({
      parliament_id: issue.parliamentId,
      title: issue.title,
      summary: issue.abstract,
      raw_text: issue.abstract,
      status: issue.status === "active" ? "voting" : issue.status === "pending" ? "draft" : "in_progress",
      category: issue.category,
      published_date: issue.publishedDate || new Date().toISOString(),
      url: issue.url,
    }));

    const { data, error } = await supabase
      .from("bills")
      .upsert(billsToInsert, {
        onConflict: "parliament_id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw error;
    }

    console.log(`✨ Successfully synced ${data?.length || 0} bills to Supabase.`);
  } catch (error) {
    console.error("❌ Critical error during bill sync:", error);
    process.exit(1);
  }
}

main();
