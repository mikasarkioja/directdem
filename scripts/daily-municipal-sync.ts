import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrapeEspooDynasty, import2025BaseProfiles, scrapeHelsinkiAhjo, scrapeVantaaRSS } from "../lib/municipal/scraper";

async function runDailySync() {
  console.log("⏰ Aloitetaan kattava kunnallissynkronointi (Helsinki, Espoo, Vantaa)...");
  
  try {
    // 1. Päivitä 2025 vaaliprofiilit (jos uutta dataa)
    await import2025BaseProfiles();
    
    // 2. Louhi uudet pöytäkirjat Espoosta
    await scrapeEspooDynasty();

    // 3. Louhi uudet päätökset Helsingistä
    await scrapeHelsinkiAhjo();

    // 4. Louhi uudet päätökset Vantaalta
    await scrapeVantaaRSS();
    
    console.log("✨ Synkronointi suoritettu onnistuneesti!");
  } catch (err: any) {
    console.error("💥 Synkronointi epäonnistui:", err.message);
  }
}

runDailySync();

