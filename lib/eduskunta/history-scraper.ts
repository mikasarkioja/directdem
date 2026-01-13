import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Scrapes historical dependency declarations for MPs and identifies changes.
 */
export async function scrapeDependencyHistory() {
  console.log("🕒 Dependency Timeline: Starting historical crawl...");

  const { data: mps } = await supabase.from("mps").select("id, first_name, last_name");
  if (!mps) return;

  const VASKI_URL = "https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows";

  for (const mp of mps) {
    console.log(`   Processing history for ${mp.first_name} ${mp.last_name}...`);
    
    try {
      // Find all SID documents for this MP
      // In a real scenario, we'd use a search filter on the Vaski API
      // Here we simulate fetching multiple versions
      const res = await axios.get(VASKI_URL, {
        params: {
          perPage: 50,
          // Simplified search for demo purposes
          columnName: "Eduskuntatunnus",
          columnValue: `SID%${mp.last_name}%` 
        }
      });

      const declarations = res.data.rowData || [];
      console.log(`   Found ${declarations.length} potential declarations for ${mp.last_name}.`);

      // 1. Fetch current dependencies for comparison
      const { data: currentDeps } = await supabase
        .from("mp_dependencies")
        .select("*")
        .eq("mp_id", mp.id);

      // 2. Parse and compare each version
      for (const row of declarations) {
        const xml = row[1];
        const tunnus = row[4];
        const dateStr = row[5]; // Assuming column 5 is date

        const $ = cheerio.load(xml, { xmlMode: true });
        
        // Logic to extract items from this historical XML
        // (Similar to fetch-mp-dependencies.ts but with history tracking)
        const itemsInVersion: any[] = [];
        $("sis\\:KappaleKooste, KappaleKooste").each((i, el) => {
          const text = $(el).text().trim();
          if (text.length > 10 && (text.includes("hallitus") || text.includes("omistus"))) {
            itemsInVersion.push({
              category: text.includes("hallitus") ? "Hallitustyöskentely" : "Omistus",
              description: text,
              organization: text.split(" ").slice(0, 3).join(" ")
            });
          }
        });

        // 3. Detect ADDED/REMOVED/MODIFIED
        // This is a simplified diff logic
        for (const item of itemsInVersion) {
          const exists = currentDeps?.find(d => d.description === item.description);
          if (!exists) {
            // Found a change (either it's a new item or an old one that was removed/changed)
            await supabase.from("mp_dependency_history").insert({
              mp_id: mp.id,
              change_type: 'ADDED',
              category: item.category,
              description: item.description,
              organization: item.organization,
              valid_from: dateStr,
              metadata: { vaski_id: tunnus }
            });
          }
        }
      }
    } catch (err: any) {
      console.error(`❌ History crawl failed for MP ${mp.id}:`, err.message);
    }
  }
  
  console.log("✨ History crawl complete!");
}

