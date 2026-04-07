import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  lobbyStanceSummarySchema,
  type LobbySourceDocument,
  type LobbyStanceSummary,
} from "@/lib/lobby/types";

const MODEL = "gpt-4o-mini";

export async function summarizeLobbyDocument(
  heTunnus: string,
  doc: LobbySourceDocument,
): Promise<LobbyStanceSummary> {
  const hint = doc.organizationHint
    ? `Mahdollinen organisaatio-vihje: ${doc.organizationHint}\n`
    : "";

  const { text } = await generateText({
    model: openai(MODEL) as any,
    temperature: 0.2,
    maxRetries: 2,
    system: `Olet Suomen lainsäädäntöä, lausuntomenettelyä ja avoimuusrekisteriä ymmärtävä asiantuntija.
Muodosta LUOTETTAVA rakenne lähdetekstin perusteella. Säilytä suomen skandit (ä, ö, å) kuten lähteessä.
Kirjoita plainLanguageSummary selkokielellä – lyhyesti ja ymmärrettävästi kansalaiselle.
Jos lähde on epäselvä tai pelkkä otsikko, merkitse stance "conditional" ja kerro epävarmuus keyArgumentseissa.

Palauta VAIN JSON (ei markdownia), täsmälleen tämä rakenne:
{
  "organizationName": string,
  "organizationCategory": string,
  "coreStance": "support" | "oppose" | "conditional",
  "keyArguments": string[],
  "proposedChanges": string,
  "plainLanguageSummary": string,
  "sentimentScore": number
}`,
    prompt: `HE-tunnus: ${heTunnus}
Lähde: ${doc.sourceType}
URL: ${doc.sourceUrl}
Otsikko: ${doc.title}
${hint}
Teksti:
${doc.textContent.slice(0, 14000)}
`,
  });

  const raw = extractJsonObject(text);
  const parsed = lobbyStanceSummarySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `LLM stance parse failed: ${parsed.error.message}. Raw: ${text.slice(0, 200)}`,
    );
  }
  return parsed.data;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in model output");
  }
  const slice = trimmed.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}
