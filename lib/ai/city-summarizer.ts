import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { PoliticalVector } from "./tagger";

export interface CityDecisionAnalysis {
  summary: string;
  category: "SÄÄSTÖ" | "INVESTOINTI" | "KAAVAMUUTOS" | "MUU";
  whoDecided: string;
  whatDecided: string;
  impactOnResident: string;
  neighborhoods: string[];
  political_vector?: PoliticalVector;
}

/**
 * Analyzes a municipal decision using AI.
 */
export async function analyzeCityDecision(
  title: string,
  content: string,
  orgName: string = "Espoon kaupunki"
): Promise<CityDecisionAnalysis> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o") as any,
      system: `Olet kuntapäätöksenteon asiantuntija. Tehtäväsi on analysoida kaupungin päätöksiä ja tiivistää ne selkokielellä asukkaille.
      
      Käytä seuraavaa formaattia:
      - Tiivistä selkokielellä: kuka päätti, mitä päätettiin ja mitä se tarkoittaa asukkaalle.
      - Valitse kategoria: SÄÄSTÖ, INVESTOINTI, KAAVAMUUTOS tai MUU.
      - Tunnista tekstistä kaikki mainitut kaupunginosat tai alueet.`,
      prompt: `Analysoi seuraava päätös:
      Organisaatio: ${orgName}
      Otsikko: ${title}
      Sisältö: ${content.substring(0, 4000)}
      
      Vastaa JSON-muodossa:
      {
        "summary": "Lyhyt selkokielinen tiivistys (max 3 lausetta)",
        "category": "SÄÄSTÖ/INVESTOINTI/KAAVAMUUTOS/MUU",
        "whoDecided": "Kuka tai mikä taho teki päätöksen",
        "whatDecided": "Mitä päätettiin",
        "impactOnResident": "Miten tämä vaikuttaa tavalliseen asukkaaseen",
        "neighborhoods": ["lista", "kaupunginosista"],
        "political_vector": {
          "economic": -1.0..1.0,
          "values": -1.0..1.0,
          "environment": -1.0..1.0,
          "regions": -1.0..1.0,
          "globalism": -1.0..1.0,
          "security": -1.0..1.0
        }
      }`,
    });

    // Extract JSON from response (sometimes AI adds markdown)
    const jsonStr = text.includes("```json") 
      ? text.split("```json")[1].split("```")[0].trim()
      : text;

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing city decision:", error);
    return {
      summary: "Päätöksen analysointi epäonnistui.",
      category: "MUU",
      whoDecided: orgName,
      whatDecided: title,
      impactOnResident: "Tietoa ei saatavilla.",
      neighborhoods: []
    };
  }
}

/**
 * Checks if a decision is relevant to a user based on their neighborhood.
 */
export function isRelevantToUser(analysis: CityDecisionAnalysis, userNeighborhood: string): boolean {
  if (!userNeighborhood) return false;
  return analysis.neighborhoods.some(n => 
    n.toLowerCase().includes(userNeighborhood.toLowerCase()) || 
    userNeighborhood.toLowerCase().includes(n.toLowerCase())
  );
}

