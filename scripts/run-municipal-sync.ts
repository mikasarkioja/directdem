import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrapeEspooDynasty, import2025Councilors } from "../lib/municipal/scraper";

async function runSync() {
  console.log("🚀 Aloitetaan kunnallisen datan synkronointi...");
  
  try {
    // 1. Tuodaan vaalikonedata ja luodaan pohjaprofiilit
    await import2025Councilors();
    console.log("✅ Valtuutetut tuotu.");

    // 2. Louhitaan uudet päätökset
    await scrapeEspooDynasty();
    console.log("✅ Espoo Dynasty louhittu.");

    console.log("✨ Synkronointi valmis!");
  } catch (err) {
    console.error("❌ Synkronointi epäonnistui:", err);
  }
}

runSync();

