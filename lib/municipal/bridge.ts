import axios from "axios";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import fs from "fs";
import path from "path";

// Standardized Municipal Decision Object
export interface MunicipalDecision {
  title: string;
  municipality: string;
  content: string;
  date: string;
  external_url: string;
  status: string;
  mappedCouncilors?: string[];
}

const parser = new Parser();
const CACHE_FILE = path.join(process.cwd(), "data", "municipal_cache.json");

/**
 * Fallback mechanism: Read from local cache if API/Bridge fails
 */
function getCachedData(municipality: string): MunicipalDecision[] {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      return cache[municipality] || [];
    }
  } catch (err) {
    console.error(`Cache Read Error: ${municipality}`, err);
  }
  return [];
}

function updateCache(municipality: string, data: MunicipalDecision[]) {
  try {
    let cache: any = {};
    if (fs.existsSync(CACHE_FILE)) {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
    cache[municipality] = data;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error(`Cache Write Error: ${municipality}`, err);
  }
}

/**
 * 1. Helsinki REST Client
 */
async function fetchHelsinki(): Promise<MunicipalDecision[]> {
  const endpoints = [
    "https://dev.hel.fi/paatokset/v1/issue/?limit=10",
    "https://ahjo.hel.fi/api/v1/issue/?limit=10",
    "https://www.hel.fi/ahjorest/v1/issue"
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const items = res.data.objects || res.data.issues || res.data.items || [];
      if (items.length > 0) {
        console.log(`Helsinki Success via ${url}, items: ${items.length}`);
        const standardized = items.slice(0, 10).map((item: any) => ({
          title: item.subject || item.name || item.title || "Nimetön päätös",
          municipality: "Helsinki",
          content: item.summary || item.description || "Ei tiivistelmää.",
          date: item.last_modified || item.pub_date || new Date().toISOString(),
          external_url: item.resource_uri || `https://paatokset.hel.fi/fi/asia/${item.id}`,
          status: "Päätös"
        }));
        updateCache("Helsinki", standardized);
        return standardized;
      }
    } catch (err: any) {
      console.warn(`Helsinki Attempt Fail (${url}): ${err.message}`);
    }
  }

  console.error("Municipal Bridge Fail: Helsinki - All endpoints failed.");
  return getCachedData("Helsinki");
}

/**
 * 2. Espoo & Vantaa RSS/Web Bridge
 */
async function fetchViaRSS(
  municipality: string, 
  url: string, 
  keywords: string[]
): Promise<MunicipalDecision[]> {
  try {
    const feed = await parser.parseURL(url);
    const filtered = feed.items.filter(item => 
      keywords.some(k => item.title?.toLowerCase().includes(k.toLowerCase()) || 
                         item.contentSnippet?.toLowerCase().includes(k.toLowerCase()))
    ).slice(0, 5);

    const decisions: MunicipalDecision[] = [];

    for (const item of filtered) {
      let content = item.contentSnippet || "";
      
      // Scraping full content if URL exists
      if (item.link) {
        try {
          const { data } = await axios.get(item.link, { timeout: 5000 });
          const $ = cheerio.load(data);
          // Simple heuristic for article content
          content = $("article").text().trim() || $(".content").text().trim() || content;
          // Cleanup
          content = content.replace(/\s+/g, " ").substring(0, 2000);
        } catch (scrapeErr) {
          console.warn(`Scrape failed for ${item.link}`);
        }
      }

      decisions.push({
        title: item.title || "Ei otsikkoa",
        municipality,
        content: content,
        date: item.pubDate || new Date().toISOString(),
        external_url: item.link || "",
        status: "Tiedote"
      });
    }

    updateCache(municipality, decisions);
    return decisions;
  } catch (err: any) {
    console.error(`Municipal Bridge Fail: ${municipality} - ${err.message}`);
    return getCachedData(municipality);
  }
}

/**
 * 5. Councilor Mapping using AI
 */
export async function linkDecisionsToCouncilors(decisions: MunicipalDecision[]) {
  const councilorsPath = path.join(process.cwd(), "data", "councilors.json");
  const councilorData = JSON.parse(fs.readFileSync(councilorsPath, "utf-8"));

  for (const decision of decisions) {
    const relevantCouncilors = councilorData[decision.municipality] || [];
    if (relevantCouncilors.length === 0) continue;

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `Olet kuntapolitiikan asiantuntija. Tehtäväsi on tunnistaa tekstistä, kuka valtuutettu on tehnyt aloitteen tai kuka on päätöksen keskiössä.
        Kaupunki: ${decision.municipality}`,
        prompt: `
          Päätös: ${decision.title}
          Sisältö: ${decision.content.substring(0, 1500)}
          
          Lista valtuutetuista: ${relevantCouncilors.map((c: any) => `${c.name} (${c.party})`).join(", ")}
          
          Palauta VAIN nimet pilkulla erotettuna, jotka liittyvät tähän päätökseen. Etsi tekstistä nimiä tai viittauksia puolueisiin ja aloitteen tekijöihin.
          Jos kukaan ei liity varmasti, palauta 'null'.
        `
      } as any);

      if (text.trim() !== "null") {
        decision.mappedCouncilors = text.split(",").map(s => s.trim());
      }
    } catch (aiErr) {
      console.error("AI Mapping Error", aiErr);
    }
  }

  return decisions;
}

/**
 * 2. Espoo & Vantaa Bridge
 */
async function fetchEspoo(): Promise<MunicipalDecision[]> {
  return fetchViaRSS(
    "Espoo", 
    "https://www.espoo.fi/fi/rss/articles", 
    ["valtuusto", "hallitus", "päätös", "lautakunta"]
  );
}

async function fetchVantaa(): Promise<MunicipalDecision[]> {
  const url = "https://www.vantaa.fi/fi/paatoksenteko"; // Try the decision page directly
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const decisions: MunicipalDecision[] = [];

    // Look for any links that might be decisions
    $("a").each((i, el) => {
      if (decisions.length >= 5) return;
      const title = $(el).text().trim();
      const link = $(el).attr("href");
      
      if (link && (title.toLowerCase().includes("päätös") || title.toLowerCase().includes("pöytäkirja"))) {
        const fullLink = link.startsWith("http") ? link : "https://www.vantaa.fi" + link;
        decisions.push({
          title,
          municipality: "Vantaa",
          content: "Päätösasiakirja ladattavissa.",
          date: new Date().toISOString(),
          external_url: fullLink,
          status: "Päätös"
        });
      }
    });

    if (decisions.length === 0) {
      // Fallback to news if decisions page fails
      return fetchViaRSS("Vantaa", "https://www.vantaa.fi/fi/rss.xml", ["päätös", "valtuusto"]);
    }

    updateCache("Vantaa", decisions);
    return decisions;
  } catch (err: any) {
    console.error(`Municipal Bridge Fail: Vantaa - ${err.message}`);
    return getCachedData("Vantaa");
  }
}

/**
 * Main Bridge Entry Point
 */
export async function runMunicipalBridge() {
  console.log("🌉 Starting Municipal Bridge Sync...");
  
  const [helsinki, espoo, vantaa] = await Promise.all([
    fetchHelsinki(),
    fetchEspoo(),
    fetchVantaa()
  ]);

  const allDecisions = [...helsinki, ...espoo, ...vantaa];
  
  // Link councilors
  const linked = await linkDecisionsToCouncilors(allDecisions);
  
  console.log(`✅ Bridge Sync Complete. Found ${linked.length} total decisions.`);
  return linked;
}

