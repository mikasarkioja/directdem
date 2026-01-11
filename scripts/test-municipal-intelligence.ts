import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fetchEspooDynastyLinks, fetchMeetingItems, fetchDynastyContent } from "../lib/municipal/espoodynasty";
import { performDeepAnalysis } from "../lib/municipal/deep-analyzer";
import { createClient } from "@supabase/supabase-js";

async function testMunicipalIntelligence() {
  console.log("🚀 Alustetaan Municipal Intelligence -testi...");

  try {
    // 1. Hae linkit
    const links = await fetchEspooDynastyLinks();
    if (links.length === 0) {
      console.error("❌ Ei linkkejä löytynyt.");
      return;
    }

    const latestMeeting = links[0];
    console.log(`📂 Valittu kokous: ${latestMeeting.title}`);

    // 2. Hae asiat
    const items = await fetchMeetingItems(latestMeeting.url);
    if (items.length === 0) {
      console.error("❌ Ei asioita löytynyt kokouksesta.");
      return;
    }

    const targetItem = items[0];
    console.log(`📄 Valittu asia: ${targetItem.title}`);

    // 3. Hae sisältö
    const content = await fetchDynastyContent(targetItem);
    if (!content) {
      console.error("❌ Sisällön haku epäonnistui.");
      return;
    }

    console.log("🧠 Generoidaan Municipal Intelligence -profiili (AI)...");

    // 4. Aja syväanalyysi
    const result = await performDeepAnalysis({
      id: "TEST-" + Date.now(),
      title: content.title,
      municipality: "Espoo",
      raw_content: content.description + "\n\n" + content.proposal
    });

    if (result.success) {
      console.log("✅ Municipal Intelligence -profiili luotu onnistuneesti!");
      console.log("-----------------------------------------");
      console.log("KUSTANNUSARVIO:", result.analysis.economic_impact.total_cost_estimate, "€");
      console.log("VOITTAJAT:", result.analysis.social_equity.winners.join(", "));
      console.log("HÄVIÄJÄT:", result.analysis.social_equity.losers.join(", "));
      console.log("KITKA-INDEKSI:", result.analysis.controversy_hotspots[0]?.tension_level || 0);
      console.log("-----------------------------------------");
      console.log("SYVÄANALYYSI (alku):", result.analysis.summary.substring(0, 500) + "...");
    } else {
      console.error("❌ Analyysi epäonnistui:", result.error);
    }

  } catch (err: any) {
    console.error("💥 Kriittinen virhe testissä:", err.message);
  }
}

testMunicipalIntelligence();

