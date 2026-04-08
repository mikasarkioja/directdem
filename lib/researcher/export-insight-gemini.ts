import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL =
  process.env.GEMINI_RESEARCHER_EXPORT_MODEL?.trim() ||
  "gemini-3-flash-preview";

/**
 * Tiivistää vientiaineistoa varten mahdolliset poikkeavuudet (akateeminen sävy, suomi).
 */
export async function generateExportDatasetInsight(input: {
  datasetLabelFi: string;
  rowCount: number;
  sampleRows: Record<string, unknown>[];
}): Promise<string> {
  const key =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    return "AI-yhteenveto ei ole käytettävissä (API-avain puuttuu palvelimelta).";
  }

  const sample = JSON.stringify(input.sampleRows, null, 0).slice(0, 14_000);
  const prompt = `Olet talous- ja poliittisen datan analyytikko. Käyttäjä vie aineistoa: "${input.datasetLabelFi}" (${input.rowCount} riviä).

Alla otos riveistä (JSON). Kirjoita 2–4 kappaletta suomea, asiallista yleiskieltä:
1) Mitä aineisto pääosin kuvaa.
2) Mahdolliset kiinnostavat poikkeamat tai epätavalliset joukot (jos otos on liian pieni, kerro se).
3) Varoitus: otos ei välttämättä edusta koko joukkoa.

Älä keksi tietoja, joita otoksessa ei esiinny.

Otos:
${sample}`;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text?.trim() || "";
}
