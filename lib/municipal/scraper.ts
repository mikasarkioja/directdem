import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetchEspooDynastyLinks, scrapeEspooWithThrottle, DynastyDocType, DynastyContent, fetchMeetingItems, fetchDynastyContent } from "./espoodynasty";
import { fetchLatestHelsinkiIssues, fetchHelsinkiIssueDetails } from "./helsinki-client";
import { fetchLatestVantaaIssues } from "./vantaa-client";
import { generateMunicipalAiSummary } from "@/app/actions/municipal-ai";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 1. Päivitetty Espoo Dynasty Scraper
 * Louhii KAIKKI valtuuston päätökset tältä kaudelta (2025-2026).
 */
export async function scrapeEspooDynasty() {
  console.log("🕵️ Käynnistetään kattava Espoo Dynasty -louhinta (Full Season)...");
  
  try {
    const meetingLinks = await fetchEspooDynastyLinks();
    const currentSeasonMeetings = meetingLinks.filter(l => 
      l.url.includes("2025") || l.url.includes("2026") || l.title.includes("2025") || l.title.includes("2026")
    );

    console.log(`📅 Löydetty ${currentSeasonMeetings.length} kokousta kaudelta 2025-2026.`);

    for (const meeting of currentSeasonMeetings) {
      console.log(`📂 Käsitellään kokous: ${meeting.title}`);
      const items = await fetchMeetingItems(meeting.url);
      console.log(`   - Löydetty ${items.length} päätösasiaa.`);

      for (const item of items) {
        const supabase = getSupabase();
        const { data: existing } = await supabase
          .from("meeting_analysis")
          .select("id")
          .eq("external_url", item.url)
          .maybeSingle();

        if (existing) {
          console.log(`   - Ohitetaan jo käsitelty: ${item.title}`);
          continue;
        }

        const content = await fetchDynastyContent(item);
        if (content) {
          await processAndStoreMeetingItem("Espoo", content);
          
          // Triggeri automaattiselle tausta-analyysille
          const { data: newEntry } = await supabase
            .from("meeting_analysis")
            .select("id")
            .eq("external_url", item.url)
            .single();
          
          if (newEntry) {
            console.log(`   - Käynnistetään automaattinen analyysi: ${item.title}`);
            await generateMunicipalAiSummary(newEntry.id).catch(e => console.error("Auto-analysis failed:", e));
          }

          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    console.log(`✅ Espoo louhinta suoritettu.`);
  } catch (err: any) {
    console.error("❌ Espoo Scraper Fail:", err.message);
  }
}

/**
 * 2. Helsinki Ahjo Scraper - PARANNETTU
 * Louhii Helsingin päätökset, niiden asialistat ja liitetiedot.
 */
export async function scrapeHelsinkiAhjo() {
  console.log("🕵️ Käynnistetään syvä Helsinki Ahjo -integraatio...");
  
  try {
    const issues = await fetchLatestHelsinkiIssues(15);
    
    for (const issue of issues) {
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("meeting_analysis")
        .select("id")
        .eq("external_url", issue.id)
        .maybeSingle();

      if (existing) {
        console.log(`   - Ohitetaan jo käsitelty: ${issue.subject}`);
        continue;
      }

      // HAETAAN SYVÄMMÄT TIEDOT (Asialistat ja liitteet)
      const detailedIssue = await fetchHelsinkiIssueDetails(issue);

      const content: DynastyContent = {
        title: detailedIssue.subject,
        description: detailedIssue.full_text || detailedIssue.summary,
        proposal: detailedIssue.attachments && detailedIssue.attachments.length > 0 
          ? `Liitteet: ${detailedIssue.attachments.map(a => a.title).join(", ")}` 
          : "Päätösehdotus Ahjo-järjestelmässä.",
        url: detailedIssue.id,
        date: detailedIssue.last_modified
      };

      await processAndStoreMeetingItem("Helsinki", content);

      // Triggeri automaattiselle tausta-analyysille
      const { data: newEntry } = await supabase
        .from("meeting_analysis")
        .select("id")
        .eq("external_url", detailedIssue.id)
        .single();
      
      if (newEntry) {
        console.log(`   - Käynnistetään automaattinen analyysi: ${issue.subject}`);
        await generateMunicipalAiSummary(newEntry.id).catch(e => console.error("Auto-analysis failed:", e));
      }

      // Pieni viive ettei API kuormitu liikaa
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`✅ Helsinki syvälouhinta suoritettu.`);
  } catch (err: any) {
    console.error("❌ Helsinki Scraper Fail:", err.message);
  }
}

/**
 * 3. Vantaa RSS Scraper
 * Louhii Vantaan päätökset RSS-virrasta.
 */
export async function scrapeVantaaRSS() {
  console.log("🕵️ Käynnistetään Vantaa RSS -integraatio...");
  
  try {
    const issues = await fetchLatestVantaaIssues(15);
    
    for (const issue of issues) {
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("meeting_analysis")
        .select("id")
        .eq("external_url", issue.id)
        .maybeSingle();

      if (existing) continue;

      const content: DynastyContent = {
        title: issue.subject,
        description: issue.summary,
        proposal: `Kategoria: ${issue.category}`,
        url: issue.id,
        date: issue.last_modified
      };

      await processAndStoreMeetingItem("Vantaa", content);

      // Triggeri automaattiselle tausta-analyysille
      const { data: newEntry } = await supabase
        .from("meeting_analysis")
        .select("id")
        .eq("external_url", issue.id)
        .single();
      
      if (newEntry) {
        console.log(`   - Käynnistetään automaattinen analyysi: ${issue.subject}`);
        await generateMunicipalAiSummary(newEntry.id).catch(e => console.error("Auto-analysis failed:", e));
      }
    }
    
    console.log(`✅ Vantaa louhinta suoritettu.`);
  } catch (err: any) {
    console.error("❌ Vantaa Scraper Fail:", err.message);
  }
}

/**
 * Prosessoi yksittäisen kokouskohteen: analysoi sisällön AI:lla ja linkittää valtuutettuihin.
 */
async function processAndStoreMeetingItem(municipality: string, item: DynastyContent) {
  console.log(`🧠 Analysoidaan: ${item.title}`);
  const supabase = getSupabase();

  try {
    // 1. Hae valtuutetut kannasta linkitystä varten
    const { data: councilors } = await supabase
      .from("councilors")
      .select("id, full_name, party")
      .eq("municipality", municipality);

    const councilorList = councilors?.map(c => `${c.full_name} (${c.party})`).join(", ") || "";

    // 2. AI-analyysi: Tunnista mainitut valtuutetut ja määritä päätöksen DNA-vaikutus
    const { text: analysisJson } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Olet kunnallispolitiikan analyytikko. Tehtäväsi on analysoida pöytäkirjan kohta ja tunnistaa:
      1. Ketkä valtuutetut mainitaan tekstissä (aloitteen tekijät tai puheenvuorot).
      2. Mikä on asian poliittinen painotus (DNA-vaikutus) 6-akselisella mallilla (-1.0 ... 1.0).
      3. Jos tekstissä mainitaan liitteitä, huomioi niiden merkitys kuvauksessa.
      
      Palauta VAIN JSON tässä muodossa:
      {
        "mentioned_councilors": ["Nimi 1", "Nimi 2"],
        "dna_impact": {
          "economy": 0.0,
          "values": 0.0,
          "environment": 0.0,
          "regional": 0.0,
          "international": 0.0,
          "security": 0.0
        },
        "summary": "Lyhyt tiivistelmä asiasta suomeksi.",
        "attachment_notes": "Huomioita liitteistä, jos oleellista.",
        "pro_arguments": ["Argumentti 1", "Argumentti 2"],
        "con_arguments": ["Kriittinen huomio 1", "Kriittinen huomio 2"],
        "friction_index": 45
      }
      
      'friction_index' on luku 0-100, joka kuvaa kuinka paljon asia todennäköisesti jakaa mielipiteitä valtuustossa.
      `,
      prompt: `
        Otsikko: ${item.title}
        Selostus/Pöytäkirja: ${item.description.substring(0, 5000)}
        Ehdotus/Liitetiedot: ${item.proposal.substring(0, 2000)}
        
        Mahdolliset valtuutetut tässä kaupungissa: ${councilorList}
      `
    } as any);

    const cleanedJson = analysisJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
    const analysis = JSON.parse(cleanedJson);

    // 3. Tallenna kantaan
    const { error } = await supabase
      .from("meeting_analysis")
      .upsert({
        municipality: municipality,
        meeting_title: item.title,
        meeting_date: item.date || new Date().toISOString(),
        raw_content: (item.description + "\n\n" + item.proposal).substring(0, 100000),
        external_url: item.url,
        ai_summary: analysis,
        created_at: new Date().toISOString()
      }, { onConflict: 'external_url' });

    if (error) throw error;
    console.log(`✅ Analyysi tallennettu kohteelle: ${item.title}`);

    // 4. Tarkista takinkäännöt (Flip-Watch)
    if (analysis.mentioned_councilors && analysis.mentioned_councilors.length > 0) {
      await detectFlipsForMeeting(municipality, item.title, analysis);
    }

  } catch (err: any) {
    console.error(`❌ Virhe kohteen ${item.title} prosessoinnissa:`, err.message);
  }
}

/**
 * Vertailee kokouksen DNA-vaikutusta mainittujen valtuutettujen omiin DNA-profiileihin.
 */
async function detectFlipsForMeeting(municipality: string, meetingTitle: string, analysis: any) {
  const supabase = getSupabase();
  console.log(`🔍 Etsitään ristiriitoja kokoukselle: ${meetingTitle}`);

  // 1. Hae kokousID
  const { data: meeting } = await supabase
    .from("meeting_analysis")
    .select("id")
    .eq("meeting_title", meetingTitle)
    .single();

  if (!meeting) return;

  for (const name of analysis.mentioned_councilors) {
    // 2. Hae valtuutetun DNA
    const { data: councilor } = await supabase
      .from("councilors")
      .select("id, full_name, dna_fingerprint")
      .eq("municipality", municipality)
      .ilike("full_name", `%${name}%`)
      .single();

    if (!councilor || !councilor.dna_fingerprint) continue;

    const userDna = councilor.dna_fingerprint as any;
    const actionDna = analysis.dna_impact;

    // 3. Vertaile akseleita (kynnysarvo 1.0 erolle)
    const axes = ["economy", "values", "environment", "regional", "international", "security"];
    
    for (const axis of axes) {
      const diff = Math.abs(userDna[axis] - actionDna[axis]);
      
      // Jos valtuutettu on esim. vahvasti 'ympäristö' (+0.8) ja päätös on erittäin 'anti-ympäristö' (-0.7), 
      // ero on 1.5, mikä ylittää kynnyksen.
      if (diff > 1.2) {
        console.log(`⚠️ Ristiriita havaittu! ${councilor.full_name} / ${axis}: ero ${diff.toFixed(2)}`);
        
        await supabase.from("local_flips").insert({
          councilor_id: councilor.id,
          meeting_id: meeting.id,
          axis: axis,
          promise_score: userDna[axis],
          action_impact: actionDna[axis],
          discrepancy: diff,
          description: `Valtuutetun vaalilupaukset akselilla '${axis}' ovat ristiriidassa tämän päätöksen vaikutuksen kanssa.`
        });
      }
    }
  }
}

/**
 * 2. Base Profile Importer (2025 Vaalit)
 */
export async function import2025BaseProfiles() {
  console.log("📥 Maahantuodaan 2025 vaaliprofiileja...");
  const filePath = path.join(process.cwd(), "data", "vaalikone_2025.json");
  
  const supabase = getSupabase();

  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ Tiedostoa data/vaalikone_2025.json ei löydy. Luodaan mock-dataa.");
    // Jos tiedostoa ei ole, luodaan tyhjä mock-lista testausta varten
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const candidates = JSON.parse(rawData);

  for (const candidate of candidates) {
    // Suodatetaan vain Espoo, Helsinki, Vantaa
    if (!["Espoo", "Helsinki", "Vantaa"].includes(candidate.municipality)) continue;

    console.log(`👤 Käsitellään: ${candidate.full_name} (${candidate.municipality})`);

    try {
      // Luodaan alkutilan DNA-sormenjälki tekoälyllä lupausten perusteella
      const { text: dnaText } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `Olet poliittinen analyytikko. Luo 6-akselinen DNA-profiili (-1.0 ... 1.0) perustuen vaalikonevastauksiin.
        Palauta VAIN JSON-objekti tässä muodossa:
        {
          "economy": 0.0,
          "values": 0.0,
          "environment": 0.0,
          "regional": 0.0,
          "international": 0.0,
          "security": 0.0
        }`,
        prompt: `Ehdokas: ${candidate.full_name}, Vastaukset: ${JSON.stringify(candidate.promises)}`
      } as any);

      // Siivotaan mahdolliset markdown-koodiblokit
      const cleanedJson = dnaText.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
      const dna = JSON.parse(cleanedJson);

      const { error } = await supabase
        .from("councilors")
        .upsert({
          full_name: candidate.full_name,
          municipality: candidate.municipality,
          party: candidate.party,
          election_promises: candidate.promises,
          dna_fingerprint: dna,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'full_name,municipality' });

      if (error) console.error(`❌ Virhe tallennettaessa valtuutettua ${candidate.full_name}:`, error.message);
    } catch (err: any) {
      console.error(`⚠️ Virhe ehdokkaan ${candidate.full_name} prosessoinnissa:`, err.message);
    }
  }
}
