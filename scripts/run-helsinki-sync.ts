import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { syncHelsinkiDecisions } from "../lib/municipal/helsinki-sync";

async function run() {
  console.log("🚀 Starting manual Helsinki decision sync...");
  const result = await syncHelsinkiDecisions();
  
  if (result.success) {
    console.log(`✅ Success! Synced ${result.count} decisions.`);
  } else {
    console.error("❌ Sync failed:", result.error);
  }
}

run();

