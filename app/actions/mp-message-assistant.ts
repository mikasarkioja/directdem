"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUser } from "@/app/actions/auth";

export async function draftMpContactMessage(input: {
  mpFirstName: string;
  mpLastName: string;
  mpParty?: string | null;
  billTitle: string;
  billSummary: string;
  parliamentId?: string | null;
  /** Lyhyt käyttäjän tarkoitus / toive */
  userIntent?: string | null;
  /** Sidonnaisuus- / lobbaushuomiot toimitukselliseen kontekstiin */
  transparencyNotes?: string | null;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user?.id) {
    return {
      ok: false,
      error: "Kirjaudu sisään käyttääksesi viestiavustajaa.",
    };
  }

  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY puuttuu." };
  }

  const modelName =
    process.env.GEMINI_MESSAGE_ASSISTANT_MODEL?.trim() ||
    "gemini-3-flash-preview";

  const system = `Olet viestintäavustaja, joka auttaa kansalaista kirjoittamaan lyhyen, kohteliaan ja asiallisen viestin suomalaiselle kansanedustajalle.

Säännöt:
- Selkokieli (plain language), lyhyet lauseet, neutraali ja kunnioittava sävy.
- Perustele viesti lain/topicin faktoihin annetusta tiivistelmästä; älä keksi lakeja tai äänestystuloksia.
- Älä syytä tai syyttele; pyydä huomioimaan kansalaisen näkökulma tai pyydä selventämään kantaa.
- Päätä kohteliaaseen pyyntöön tai kysymykseen.
- Pituus: enintään noin 1800 merkkiä (n. 220 sanaa).
- Kirjoita vain viestin leipäteksti (ei otsikoita, ei meta).

Jos transparencyNotes mainitsee sidonnaisuuksia tai lobbausta, voit viitata varovasti ("esimerkiksi julkisissa sidonnaisuusilmoituksissa mainittu x"), mutta älä väitä väärinkäytöstä.`;

  const userBlock = [
    `Edustaja: ${input.mpFirstName} ${input.mpLastName}${
      input.mpParty ? ` (${input.mpParty})` : ""
    }`,
    input.parliamentId ? `Lakiviite: ${input.parliamentId}` : null,
    `Lain otsikko: ${input.billTitle}`,
    `Tiivistelmä: ${input.billSummary?.slice(0, 2500) || "(ei tiivistelmää)"}`,
    input.userIntent?.trim()
      ? `Kansalaisen toive / painotus: ${input.userIntent.trim()}`
      : null,
    input.transparencyNotes?.trim()
      ? `Läpinäkyvyys / huomiot (voi mainita varovasti): ${input.transparencyNotes.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.25, maxOutputTokens: 2048 },
    });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${system}\n\n---\n${userBlock}` }],
        },
      ],
    });
    const text = result.response.text().trim();
    if (!text) {
      return { ok: false, error: "Tyhjä vastaus mallilta." };
    }
    return { ok: true, text };
  } catch (e) {
    console.error("[draftMpContactMessage]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Generointi epäonnistui.",
    };
  }
}
