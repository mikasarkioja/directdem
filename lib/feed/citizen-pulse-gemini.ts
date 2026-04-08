import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FeedItem } from "@/lib/feed/feed-service";

export type CitizenPulseResult = {
  summary: string;
  model: string;
};

/**
 * Lyhyt suomenkielinen "Mitä tapahtui tänään" -yhteenveto yhdistetystä syötteestä
 * (eduskunta, Espoo, mediaosuudet, Yle-uutiset). Tuottaa vain annettuun listaan
 * nojaavan tekstin; ei hae verkosta.
 */
export async function generateCitizenPulseTodaySummary(
  items: FeedItem[],
): Promise<CitizenPulseResult | null> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const modelName =
    process.env.GEMINI_CITIZEN_PULSE_MODEL?.trim() || "gemini-3-flash-preview";

  const lines = items.slice(0, 40).map((i) => {
    const d = i.date?.slice(0, 10) || "?";
    return `- [${i.type}] ${d} | ${i.source}: ${i.title}`;
  });

  const prompt = `Olet Eduskuntavahti-palvelun toimitussihteeri. Kirjoita yksi lyhyt suomenkielinen kappale (enintään 110 sanaa) otsikolla tarkoitukseen sopivasti — älä käytä markdown-otsikoita, vain leipäteksti.

Tehtävä: tiivistä, mitä kansalaiselle on merkityksellistä tästä yhdistetystä tapahtumajoukosta: eduskunnan lait, Espoon päätökset, mediaosuudet ja muut merkinnät.

Säännöt:
- Käytä vain alla listattuja rivejä; älä keksi uusia lakimerkintöjä, päivämääriä tai medioita.
- Jos lista on ohut, sano se hillitysti ("näkyvissä on vähän tuoreita merkintöjä").
- Älä väitä oikeudellista lopputulosta tai äänestystulosta, ellei se ole nimenomaan rivissä.

Syöte:
${lines.join("\n")}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    if (!summary) return null;
    return { summary, model: modelName };
  } catch (e) {
    console.error("[generateCitizenPulseTodaySummary]", e);
    return null;
  }
}
