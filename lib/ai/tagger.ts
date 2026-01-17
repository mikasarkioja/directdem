import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export interface PoliticalVector {
  economic: number;      // -1.0 (Left/Redistributive) to 1.0 (Right/Market)
  values: number;        // -1.0 (Liberal/Progressive) to 1.0 (Conservative/Traditional)
  environment: number;   // -1.0 (Eco-prioritized) to 1.0 (Growth-prioritized)
  regions: number;       // -1.0 (Urban/Center) to 1.0 (Rural/Periphery)
  globalism: number;     // -1.0 (National/Sovereign) to 1.0 (Global/Integrated)
  security: number;      // -1.0 (Diplomacy/Soft) to 1.0 (Defense/Hard)
}

/**
 * Analyzes text to determine its 6-axis political alignment.
 */
export async function tagPoliticalAlignment(title: string, content: string): Promise<PoliticalVector> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o") as any,
      system: `Olet poliittisen analyysin asiantuntija. Tehtäväsi on sijoittaa uutinen tai päätös 6-akseliselle poliittiselle kartalle.
      
      AKSELIT (arvot välillä -1.0 - 1.0):
      - economic: -1.0 (vasemmisto/julkiset menot) <-> 1.0 (oikeisto/markkinaehtoisuus)
      - values: -1.0 (liberaali/progressiivinen) <-> 1.0 (konservatiivinen/perinteinen)
      - environment: -1.0 (luonto/ilmasto edellä) <-> 1.0 (talouskasvu/teollisuus edellä)
      - regions: -1.0 (kaupungit/keskittäminen) <-> 1.0 (maaseutu/aluepolitiikka)
      - globalism: -1.0 (kansainvälisyys/EU) <-> 1.0 (kansallinen etu/suvereniteetti)
      - security: -1.0 (diplomatia/pehmeä valta) <-> 1.0 (puolustus/kova turvallisuus)
      
      Pysy puolueettomana. Jos aihe ei liity johonkin akseliin, aseta arvoksi 0.0.`,
      prompt: `Analysoi seuraava teksti:
      Otsikko: ${title}
      Sisältö: ${content.substring(0, 3000)}
      
      Vastaa JSON-muodossa:
      {
        "economic": 0.0,
        "values": 0.0,
        "environment": 0.0,
        "regions": 0.0,
        "globalism": 0.0,
        "security": 0.0
      }`,
    });

    const jsonStr = text.includes("```json") 
      ? text.split("```json")[1].split("```")[0].trim()
      : text;

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error tagging political alignment:", error);
    return {
      economic: 0,
      values: 0,
      environment: 0,
      regions: 0,
      globalism: 0,
      security: 0
    };
  }
}


