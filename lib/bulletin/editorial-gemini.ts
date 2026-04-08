import {
  GoogleGenerativeAI,
  DynamicRetrievalMode,
} from "@google/generative-ai";
import {
  extractGroundingPayload,
  emptyGroundingPayload,
} from "@/lib/media-watch/grounding";
import {
  editorialBulletinModelSchema,
  type EditorialBulletinModel,
} from "@/lib/bulletin/editorial-schema";
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
  sources: EditorialBulletinModel["sources"],
): EditorialBulletinModel["sources"] {
  return sources.filter((s) => {
    try {
      const u = new URL(s.url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  });
}

function mergeCitationSources(
  modelSources: EditorialBulletinModel["sources"],
  grounding: { title: string; url: string }[],
): { title: string; url: string }[] {
  const out = [...sanitizeModelSources(modelSources)];
  const seen = new Set(out.map((s) => s.url));
  for (const g of grounding) {
    if (seen.has(g.url)) continue;
    try {
      const u = new URL(g.url);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
    } catch {
      continue;
    }
    out.push(g);
    seen.add(g.url);
  }
  return out;
}

export async function synthesizeEditorialBulletinWithGemini(
  input: WeeklyBulletinEditorInput,
  periodLabel: string,
): Promise<{
  model: EditorialBulletinModel;
  citationSources: { title: string; url: string }[];
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

  const system = `Olet Eduskuntavahti/Omatase-palvelun päätoimittaja. Julkaiset käännettyä "uutislehteä" — ammattimaista, lukijaa kunnioittavaa poliittista journalismia selkokielellä.
Toimitusohje: Kirjoita tämän viikon lehti ammattitoimittajan tavoin. Älä vain luettele tapahtumia. Selitä selvästi lobbaustoiminnan ja lopullisen lainsäädännön (tai menettelyn lopputuloksen) väliset yhteydet. Pyri nopeaan luettavuuteen ja selkeyteen.
Tyyli: narratiivi, ei luettelomerkit-öisyyttä. Kolme pääosiota tulee erottua ääneltään toisistaan.

KRIITTINEN JSON-MUOTO — palauta VAIN yksi JSON-objekti:
{
  "eventScores": [{
    "eventRef": string (id tai lyhyt tunniste, esim. decision id tai lobby id),
    "eventType": "parliament_decision" | "espoo_decision" | "lobby_intervention" | "committee_expert" | "media_match",
    "impactScore": integer 1–100,
    "label": string
  }],
  "leadStory": {
    "headline": string,
    "dek": string,
    "body": string (2–4 kappaletta juoksevaa tekstiä),
    "aggregateImpactScore": integer 1–100 (pääjutun painoarvo)
  },
  "lobbySpotlight": {
    "headline": string,
    "body": string (analyyttinen narratiivi),
    "topLobbyists": [{
      "organization": string,
      "stance": "pro" | "contra" | "mixed",
      "alignmentWithOutcome": "aligned" | "partially" | "opposed" | "unclear",
      "conflictIndicator": boolean (true jos annetuissa potentialInterestConflicts tai authormismatch-signaaleissa on yhteys),
      "conflictNote": string (optional, varovainen muotoilus),
      "summary": string
    }]
  },
  "nutshell": {
    "headline": string,
    "body": string (selkokielinen tiivis katsaus pienempiin tapahtumiin)
  },
  "sources": [{ "title": string, "url": string }]
}

VAATIMUKSET:
1) Impact scoring: Arvioi jokainen merkittävä päätös (parliament/Espoo), mediaosuus, lobbyist_intervention ja committee_expert_invite asteikolla 1–100. Kirjoita eventScores-taulukko ennen kuin kirjoitat tekstiosiot.
2) Lead story ("Viikon polttopiste" -henki): Käytä **vain** tapahtumia joiden impactScoree on **vähintään 71**. Jos sellaisia ei ole, tee varovainen pääjuttu joka selittää hiljaisen viikon (ei keksi uutisia) ja pidä aggregateImpactScore maltillisena (<71).
3) Lobby-analyysi ("Vaikuttajien jälki"): Ristiinviittaa lobbyistInterventions + committeeExpertInvites ja päätösten summary-kenttiin. Kerro, oliko organisaatioiden linja linjassa lopputuloksen tai menettelyn etenemisen kanssa. Käytä potentialInterestConflicts-tietoja conflictIndicator-kentässä — vain "mahdollinen eturistiriita / sidonnaisuus", ei korruptioväitteitä.
   Jos molemmat listat (lobbyistInterventions ja committeeExpertInvites) ovat tyhjiä tältä raportointijaksolta: kirjoita lobbySpotlight.body tähän tarkkaan muotoon (tai lähes): "Ei raportoituja asiantuntijakuulemisia tällä viikolla." Aseta topLobbyists: []. Älä keksi organisaatioita tai kuulemisia. Jos toinen lista on epätyhjä, älä käytä tuota lausetta sellaisenaan.
   Huom: person_interests tulee vain potentialInterestConflicts-kentän kautta (sidonnaisuus vs. lausunto); jos lobbyistInterventions on tyhjä, ristiinviittaus MPs:ään jää tyhjäksi.
4) Pähkinänkuori: Pienemmät mutta relevantit tapahtumat (tyypillisesti impactScore 40–70 tai vähäisempiä), selkokielellä.
5) Lähteet: Jokainen faktaviittaus tekstissä muodossa [1], [2] ... viitaten sources-taulukkoon. Älä keksi URL:eja. Hyväksy vain http/https-URL:t joita löytyy annetusta JSON-datasta tai Google Grounding -hausta (malli lisää grounding-lähteet sources-listaan loppuun samassa järjestyksessä kuin niitä käytät).
6) Kirjoita suomeksi. Vältä liikaa anglismiä; selitä lyhyesti vierasperäiset käsitteet.`;

  const userPayload = {
    reportingPeriod: periodLabel,
    scoringInstructions:
      "Score events 1-100; only >=71 featured in lead narrative substance.",
    decisions: input.decisions,
    espooMunicipalDecisions: input.municipalEspoo,
    mediaWatchMatches: input.newsMatches,
    lobbyistInterventions: input.lobbyInterventions,
    committeeExpertInvites: input.committeeExpertInvites,
    potentialInterestConflicts: input.potentialInterestConflicts,
    lobbyStatementMetadataFlags: input.lobbyStatementMetadataFlags,
  };

  const user = `Tuota toimituksellinen viikkolehti annetusta datasta.\n\n${JSON.stringify(userPayload).slice(0, 115000)}`;

  const tools = [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalMode.MODE_DYNAMIC,
          dynamicThreshold: 0.32,
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
        temperature: 0.22,
      },
    });
    return model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: system + "\n\n" + user }],
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
    console.warn("[EditorialBulletin] retry without search:", e);
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
  const parsed = editorialBulletinModelSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[EditorialBulletin] zod", parsed.error);
    throw new Error("Toimituksellisen bulletiinin jäsentäminen epäonnistui.");
  }

  const editorPayload = parsed.data;
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

  const citationSources = mergeCitationSources(
    editorPayload.sources,
    groundingSources,
  );

  return {
    model: editorPayload,
    citationSources,
    groundingSources,
    groundingUsed:
      usedWebGrounding &&
      (groundingSources.length > 0 || groundingPayload.groundingUsed),
  };
}
