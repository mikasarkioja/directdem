import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fetchEspooDynastyLinks, scrapeEspooWithThrottle, DynastyDocType } from "../lib/municipal/espoodynasty";

async function testEspooDynasty() {
  console.log("🚀 Aloitetaan Espoo Dynasty -testi...");
  
  try {
    // 1. Hae linkit
    const links = await fetchEspooDynastyLinks("https://www.espoo.fi/fi/kaupunki-ja-paatoksenteko/paatoksenteko/esityslistat-poytakirjat-ja-paatokset");
    
    if (links.length === 0) {
      console.log("⚠️ Ei löytynyt linkkejä. Sivu saattaa olla muuttunut tai vaatia VPN:n/erityisen pääsyn.");
      return;
    }

    // Rajataan testissä vain pariin linkkiin ajan säästämiseksi
    const testLinks = links.filter(l => l.type === DynastyDocType.MEETING_ITEM).slice(0, 2);
    
    if (testLinks.length === 0) {
      console.log("ℹ️ Ei löytynyt MEETING_ITEM -tyyppisiä linkkejä, testataan MEETING_MINUTES.");
      testLinks.push(...links.slice(0, 1));
    }

    console.log(`🧪 Testataan ${testLinks.length} linkillä...`);

    // 2. Hae sisällöt viiveellä
    const results = await scrapeEspooWithThrottle(testLinks);

    console.log("\n--- TULOKSET ---");
    results.forEach((res, i) => {
      console.log(`${i + 1}. OTSIKKO: ${res.title}`);
      console.log(`   URL: ${res.url}`);
      console.log(`   SELOSTUS (alku): ${res.description.substring(0, 100)}...`);
      if (res.proposal) {
        console.log(`   EHDOTUS (alku): ${res.proposal.substring(0, 100)}...`);
      }
      console.log("----------------\n");
    });

  } catch (err: any) {
    console.error("💥 Testi epäonnistui:", err.message);
  }
}

testEspooDynasty();
