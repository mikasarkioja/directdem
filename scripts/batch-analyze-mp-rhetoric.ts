
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import * as cheerio from "cheerio";
import { analyzeMPRhetoric } from "../lib/ai/rhetoric-analyzer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runBatchAnalysis() {
  console.log("🚀 Starting efficient batch rhetoric analysis...");

  // 1. Get all active MPs
  const { data: mps, error: mpsError } = await supabase
    .from("mps")
    .select("id, first_name, last_name, party")
    .eq("is_active", true);

  if (mpsError || !mps) {
    console.error("❌ Could not fetch MPs:", mpsError?.message);
    return;
  }

  console.log(`📍 Found ${mps.length} active MPs.`);

  // 2. Find latest plenary main pages
  console.log("📂 Searching for latest plenary main pages...");
  
  const mainPageIds = [];
  // Scan recent pages in VaskiData
  for (let page = 3200; page < 3300; page++) {
    const url = `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?perPage=100&page=${page}`;
    try {
      const res = await axios.get(url);
      const rowData = res.data.rowData || [];
      for (const row of rowData) {
        const xml = row[1] || "";
        const tunnus = row[4] || "";
        // Look for main pages (they have no slashes in PTK number usually, or specific status)
        if (tunnus.startsWith("PTK") && !tunnus.includes("/") && xml.includes("PlenarySessionMainPage")) {
          mainPageIds.push({ id: row[0], tunnus });
        } else if (tunnus.startsWith("PTK") && tunnus.split("/").length === 2 && xml.includes("PlenarySessionMainPage")) {
          // Format like "PTK 126/2025 vp"
          mainPageIds.push({ id: row[0], tunnus });
        }
      }
    } catch (err: any) {
      break;
    }
  }

  console.log(`📍 Found ${mainPageIds.length} plenary main pages.`);
  
  const articleTunnukset = new Set<string>();
  
  // 3. Extract article IDs from main pages
  for (const main of mainPageIds.slice(-10)) { // Take latest 10 sessions
    console.log(`   Extracting items from ${main.tunnus}...`);
    try {
      const url = `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?columnName=Id&columnValue=${main.id}`;
      const res = await axios.get(url);
      const xml = res.data.rowData?.[0]?.[1];
      if (xml) {
        const $ = cheerio.load(xml, { xmlMode: true });
        $("[vsk1\\:hyperlinkkiKoodi]").each((i, el) => {
          const code = $(el).attr("vsk1:hyperlinkkiKoodi");
          if (code && code.startsWith("PTK")) {
            articleTunnukset.add(code);
          }
        });
      }
    } catch (err) {}
  }

  console.log(`📍 Found ${articleTunnukset.size} unique session items.`);

  const mpSpeeches = new Map<string, any[]>();

  // 4. Fetch articles and parse speeches
  let processedItems = 0;
  for (const tunnus of Array.from(articleTunnukset)) {
    processedItems++;
    if (processedItems % 10 === 0) console.log(`   Processing item ${processedItems}/${articleTunnukset.size}...`);
    
    try {
      const url = `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?columnName=Eduskuntatunnus&columnValue=${encodeURIComponent(tunnus)}`;
      const res = await axios.get(url);
      const xml = res.data.rowData?.[0]?.[1];
      if (xml) {
        const $ = cheerio.load(xml, { xmlMode: true });
        
        $("vsk\\:PuheenvuoroToimenpide, PuheenvuoroToimenpide").each((i, el) => {
          const speakerInfo = $(el).find("met\\:Toimija, Toimija").first();
          const firstName = speakerInfo.find("org1\\:EtuNimi, EtuNimi").text();
          const lastName = speakerInfo.find("org1\\:SukuNimi, SukuNimi").text();
          const party = speakerInfo.find("org1\\:LisatietoTeksti, LisatietoTeksti").text();
          
          const content = $(el).find("sis\\:KappaleKooste, KappaleKooste").map((i, p) => $(p).text()).get().join("\n").trim();
          
          if (lastName && content) {
            const lowerLast = lastName.toLowerCase();
            const lowerFirst = firstName.toLowerCase();
            
            for (const mp of mps) {
              if (lowerLast.includes(mp.last_name.toLowerCase()) && 
                  (lowerFirst.includes(mp.first_name.toLowerCase()) || (mp.party && party.toLowerCase().includes(mp.party.toLowerCase())))) {
                
                const existing = mpSpeeches.get(mp.id.toString()) || [];
                if (existing.length < 5) {
                  existing.push({ content, subject: tunnus });
                  mpSpeeches.set(mp.id.toString(), existing);
                }
              }
            }
          }
        });
      }
    } catch (err) {}
  }

  // 3. Analyze each MP that has speeches
  console.log("\n🧠 Analyzing MP rhetoric based on gathered speeches...");
  
  let analyzedCount = 0;
  for (const mp of mps) {
    const speeches = mpSpeeches.get(mp.id.toString());
    
    if (speeches && speeches.length > 0) {
      console.log(`\n--- [${analyzedCount + 1}] ${mp.first_name} ${mp.last_name} (${speeches.length} speeches) ---`);
      
      // We'll pass the gathered speeches to analyzeMPRhetoric
      // Need to modify analyzeMPRhetoric to accept pre-fetched speeches
      try {
        await analyzeMPRhetoricWithSpeeches(mp.id, mp.first_name, mp.last_name, mp.party, speeches);
        analyzedCount++;
      } catch (err: any) {
        console.error(`💥 Analysis failed for ${mp.last_name}:`, err.message);
      }
    }
  }

  console.log(`\n✨ Done! Analyzed ${analyzedCount} MPs.`);
}

/**
 * Modified analysis function that uses provided speeches.
 */
async function analyzeMPRhetoricWithSpeeches(mpId: any, firstName: string, lastName: string, party: string, speeches: any[]) {
  const { generateText } = await import("ai");
  const { openai } = await import("@ai-sdk/openai");
  
  // 1. Fetch MP metadata (constituency, hometown)
  const { data: mpData } = await supabase
    .from("mps")
    .select("constituency, hometown")
    .eq("id", mpId)
    .single();

  // 2. Fetch motivations (lobbyist meetings, affiliations, sentiment)
  const { data: aiProfile } = await supabase
    .from("mp_ai_profiles")
    .select("lobbyist_meetings, affiliations, current_sentiment, regional_bias")
    .eq("mp_id", mpId.toString())
    .maybeSingle();

  const lobbyistMeetings = aiProfile?.lobbyist_meetings || [];
  const affiliations = aiProfile?.affiliations || [];
  const currentSentiment = aiProfile?.current_sentiment || "Neutraali";

  const speechesContext = speeches.map((s: any) => `Aihe: ${s.subject}\nSisältö: ${s.content}`).join("\n\n---\n\n");

  const motivationsContext = `
    PIILOMOTIIVIT JA SIDONNAISUUDET:
    - Lobbaustapaamiset: ${JSON.stringify(lobbyistMeetings)}
    - Sidonnaisuudet (Hallituspaikat yms): ${JSON.stringify(affiliations)}
    - Nykyinen mielentila (some): ${currentSentiment}
    - Alueellinen painotus: ${mpData?.constituency || "Valtakunnallinen"}, ${mpData?.hometown || ""}
  `;

  const { text: profileJson } = await generateText({
    model: openai("gpt-4o-mini") as any,
    system: `Olet poliittisen viestinnän ja retoriikan asiantuntija. 
    Tehtäväsi on luoda 'Rhetoric Profile' annettujen puheiden ja motivaatiodatan perusteella.
    
    Analyysin on sisällettävä:
    1. Kielellinen tyyli: Lyhyet/pitkät lauseet, slangi, asiasanat, muodollisuus.
    2. Toistuvat teemat: 3–5 pääaihetta.
    3. Risteilypisteet (Conflict patterns): Mitä tai ketä henkilö tyypillisesti kritisoi.
    4. Tyypilliset aloitukset ja lopetukset.
    5. Piilomotiivien vaikutus: Miten sidonnaisuudet vaikuttavat puheeseen?
    
    Palauta tiedot VAIN JSON-muodossa:
    {
      "linguistic_style": "string",
      "recurring_themes": ["string"],
      "conflict_patterns": "string",
      "openings_closings": "string",
      "motivation_influence": "string"
    }`,
    prompt: `EDUSTAJAN ${firstName.toUpperCase()} ${lastName.toUpperCase()} DATA:\n\nPUHEET:\n${speechesContext}\n\nMOTIVAATIOT:\n${motivationsContext}`
  });

  const rhetoricProfile = JSON.parse(profileJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

  const systemPrompt = `
    Olet kansanedustaja ${firstName} ${lastName}, puolueesi on ${party}.
    Vaalipiirisi on ${mpData?.constituency || "Suomi"} ja kotikuntasi ${mpData?.hometown || "tuntematon"}.
    
    RETORIIKKA-PROFIILISI:
    - TYYLI: ${rhetoricProfile.linguistic_style}
    - TEEMAT: ${rhetoricProfile.recurring_themes.join(", ")}
    - KONFLIKTIT: ${rhetoricProfile.conflict_patterns}
    - PUHETAPA: ${rhetoricProfile.openings_closings}
    - MOTIVAATIO-OHJE: ${rhetoricProfile.motivation_influence}
    
    OHJEET VÄITTELYYN:
    1. Noudata omaa kielellistä tyyliäsi.
    2. Suosi argumentteja, jotka hyödyttävät vaalipiiriäsi tai kotikuntaasi.
    3. Jos väittely koskee aihetta, joka liittyy sidonnaisuuksiisi tai lobbaustapaamisiisi (esim. ${affiliations.map((a:any) => a.org).join(", ")}), käytä itsepuolustus-retoriikkaa: selitä ne asiantuntijuutena, ei korruptiona.
    4. ÄLÄ puhuttele vastustajaa 'puhemiehenä'. Jos väittelet toisen edustajan kanssa, käytä hänen nimeään tai sano 'kuule', 'kansanedustaja [Nimi]'.
    5. Hyödynnä nykyistä mielentilaasi: ${currentSentiment}.
    6. Jos kysymys liippaa läheltä kärkiteemojasi, mainitse että olet pitänyt aiheesta puheita eduskunnassa.
  `;

  await supabase
    .from("mp_ai_profiles")
    .upsert({
      mp_id: mpId.toString(),
      rhetoric_style: rhetoricProfile,
      system_prompt: systemPrompt,
      updated_at: new Date().toISOString()
    }, { onConflict: 'mp_id' });

  console.log(`✅ Rhetoric Profile updated for ${lastName}.`);
}

runBatchAnalysis();
