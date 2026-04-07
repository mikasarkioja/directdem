import {
  GoogleGenerativeAI,
  DynamicRetrievalMode,
} from "@google/generative-ai";
import {
  extractGroundingPayload,
  emptyGroundingPayload,
} from "@/lib/media-watch/grounding";
import {
  weeklyBulletinEditorModelSchema,
  type WeeklyBulletinEditorModel,
} from "@/lib/bulletin/editor-schema";
import type { WeeklyBulletinEditorInput } from "@/lib/bulletin/editor-fetch";

function parseJsonResponse(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function sanitizeModelSources(
  sources: WeeklyBulletinEditorModel["sources"],
): WeeklyBulletinEditorModel["sources"] {
  return sources.filter((s) => {
    try {
      const u = new URL(s.url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  });
}

export async function synthesizeWeeklyBulletinWithGemini(
  input: WeeklyBulletinEditorInput,
  periodLabel: string,
): Promise<{
  model: WeeklyBulletinEditorModel;
  groundingSources: { title: string; url: string }[];
  groundingUsed: boolean;
}> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ei ole asetettu.");
  }

  const modelName =
    process.env.GEMINI_BULLETIN_MODEL?.trim() || "gemini-3-flash-preview";

  const system = `Olet Eduskuntavahti (Omatase) -palvelun päätoimittaja. Kirjoitat viikkobulletiinin: ammattimainen poliittinen yhteenveto selkokielellä ja asiallisella äänellä.
Analysoi kuluneen viikon poliittinen data. Älä listaa asioita kuivasti, vaan rakenna kiinnostava tarina.
Keskity erityisesti lobbauksen voimaan: kuka vaikutti, mihin lakiesitykseen tai teemaan ja millä perusteilla?
Käytä Google Search Groundingia varmistaaksesi, että viittaat todellisiin uutislähteisiin ja julkisiin lausuntoihin.

KRIITTINEN JSON-MUOTO — palauta VAIN yksi JSON-objekti (ei markdown-sulkuja):
{
  "impactScores": [{ "decisionId": string, "score": 1-100, "rationale": string }],
  "mainStory": {
    "headline": string,
    "dek": string,
    "body": string,
    "whyItMatters": string
  },
  "lobbyistWeek": {
    "sectionEyebrow": string (optional),
    "leadOrganization": string,
    "targetBillLabel": string,
    "narrative": string,
    "topLobbyists": [{
      "organization": string,
      "stance": "pro" | "contra" | "mixed",
      "metWith": string (optional, kenelle tavattiin / viranomainen),
      "targetBillOrTopic": string,
      "proposalAdoptedIntoBill": boolean (true jos menettely viittaa tekstin omaksumiseen),
      "summary": string
    }]
  },
  "pulse": {
    "summary": string,
    "highlights": [{ "municipalTitle": string, "nationalTieIn": string }]
  },
  "sources": [{ "title": string, "url": string }]
}

Viitejärjestelmä (pakollinen ammattimaiselle uskottavuudelle):
- Kirjoita body-, whyItMatters-, lobbyistWeek.narrative- ja muihin analyyttisiin tekstikenttiin lähteet muodossa [1], [2] viitaten sources-taulukkoon: [1] = ensimmäinen lähde.
- Älä keksi URL-osoitteita. sources-taulukon url-kentät vain osoitteet, jotka löytyvät Grounding-hausta tai annetun datan source_url-kentistä.
- Jos lähdettä ei ole, käytä varovaista ilmaisua ilman numeroitua viitettä.

impactScores: arvioi taloudellinen merkitys, yleinen mielenkiinto ja lobbyn intensiteetti yhdessä.`;

  const userPayload = {
    reportingPeriod: periodLabel,
    decisions: input.decisions,
    mediaWatchMatches: input.newsMatches,
    lobbyistInterventionsAvoimuusJaLausunnot: input.lobbyInterventions,
    espooMunicipalDecisions: input.municipalEspoo,
  };

  const user = `Alla raakadata JSON-muodossa. Tuota bulletiini.\n\n${JSON.stringify(userPayload).slice(0, 120000)}`;

  const editorialReminder = `
Analysoi kuluneen viikon poliittinen data. Älä listaa asioita, vaan kirjoita ammattimainen viikkokatsaus.
Keskity erityisesti lobbauksen voimaan: kuka vaikutti, mihin ja millä perusteilla?
Käytä Google Search Groundingia varmistaaksesi, että viittaat oikeisiin uutislähteisiin.`;

  const tools = [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalMode.MODE_DYNAMIC,
          dynamicThreshold: 0.35,
        },
      },
    },
  ];

  const genAI = new GoogleGenerativeAI(apiKey);

  const runModel = async (useSearch: boolean) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(useSearch ? { tools } : {}),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.28,
      },
    });
    return model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: system + "\n\n" + editorialReminder + "\n\n" + user },
          ],
        },
      ],
    });
  };

  let usedWebGrounding = false;
  let genResult;
  try {
    genResult = await runModel(true);
    usedWebGrounding = true;
  } catch (e) {
    console.warn("[BulletinEditor] retry without search:", e);
    genResult = await runModel(false);
    usedWebGrounding = false;
  }

  const candidate = genResult.response.candidates?.[0];
  let groundingPayload = extractGroundingPayload(candidate?.groundingMetadata);
  if (!usedWebGrounding) {
    groundingPayload = emptyGroundingPayload();
  }

  const text = genResult.response.text();
  const raw = parseJsonResponse(text) as unknown;
  const parsed = weeklyBulletinEditorModelSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[BulletinEditor] zod", parsed.error);
    throw new Error("Bulletiinin jäsentäminen epäonnistui.");
  }

  const editorPayload = parsed.data;
  editorPayload.sources = sanitizeModelSources(editorPayload.sources);

  const groundingSources = groundingPayload.sources
    .map((s) => ({ title: s.title, url: s.url }))
    .filter((s) => {
      try {
        const u = new URL(s.url);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    });

  return {
    model: editorPayload,
    groundingSources,
    groundingUsed:
      usedWebGrounding &&
      (groundingSources.length > 0 || groundingPayload.groundingUsed),
  };
}
