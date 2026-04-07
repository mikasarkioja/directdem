import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const analysisSchema = z.object({
  accuracyScore: z.number().min(0).max(100),
  keyDiscrepancy: z.string(),
  politicalContext: z.string(),
  badge: z.enum(["fact_check", "context"]),
});

export type MediaWatchAiSummary = z.infer<typeof analysisSchema>;

function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function analyzeNewsVsCorpusWithGemini(input: {
  newsTitle: string;
  newsSummary: string;
  corpusLabel: string;
  corpusTitle: string;
  corpusSummary: string;
  legalExcerpt?: string;
}): Promise<MediaWatchAiSummary> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return {
      accuracyScore: 0,
      keyDiscrepancy:
        "GEMINI_API_KEY puuttuu: tarkistusanalyysiä ei ajettu palvelimella.",
      politicalContext: "",
      badge: "context",
    };
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MEDIA_WATCH_MODEL?.trim() || "gemini-2.0-flash",
  });

  const prompt = `Olet lainsäädännön ja median kehystyksen arvioija suomalaisessa kontekstissa.

Vertaa uutista viralliseen / laintason tekstin kuvaukseen. Vastaa VAIN kelvollisena JSON-objektina, avaimet:
- "accuracyScore": luku 0–100 (kuinka hyvin uutisointi vastaa oikeudellista todellisuutta / päätöksen sisältöä)
- "keyDiscrepancy": lyhyt suomenkielinen teksti (tärkein puuttuva tai vääristävä yksityiskohta, tai tyhjä merkkijono jos ei havaittu)
- "politicalContext": lyhyt suomenkielinen teksti (jos uutinen korostaa yhden puolueen näkemystä päätöksen sijaan, kerro; muuten neutraali kuvaus)
- "badge": joko "fact_check" (selvä tarkistus-/faktapainotteinen kehys) tai "context" (enemmän taustaa/kontekstia)

Uutisen otsikko: ${input.newsTitle}
Uutisen tiivistelmä: ${input.newsSummary}

Kohteen tyyppi: ${input.corpusLabel}
Kohteen otsikko: ${input.corpusTitle}
Kohteen kuvaus/tiivistelmä: ${input.corpusSummary}
${input.legalExcerpt ? `Laintason ote (katkaistu): ${input.legalExcerpt}` : ""}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const parsed = parseJsonLoose(text);
    return analysisSchema.parse(parsed);
  } catch (e) {
    console.warn("[MediaWatch] Gemini JSON -parsinta epäonnistui:", e);
    return {
      accuracyScore: 50,
      keyDiscrepancy:
        "Automaattisen analyysin tulos jäi epäselväksi (JSON-virhe).",
      politicalContext: "",
      badge: "context",
    };
  }
}
