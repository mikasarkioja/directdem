import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL =
  process.env.GEMINI_LOBBY_STANCE_MODEL?.trim() || "gemini-3-flash-preview";

/**
 * Tiivistää tallennettujen listeiden perusteella kaksi johtolausetta (suomi).
 */
export async function synthesizeStanceMatrixLeads(input: {
  billTitle: string;
  proArgs: string[];
  conArgs: string[];
}): Promise<{ proLead: string; conLead: string } | null> {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!key) return null;

  const proList = input.proArgs.slice(0, 12).join("\n- ");
  const conList = input.conArgs.slice(0, 12).join("\n- ");

  const prompt = `Olet politiikan toimitussihteeri. Laki: "${input.billTitle}".

Alla poimittuja perusteluja julkisista lausunnoista (ei uusia faktoja).

Puoltavat perusteet:
- ${proList || "(ei listattu)"}

Vastustavat perusteet:
- ${conList || "(ei listattu)"}

Vastaa täsmälleen kahdella rivillä, muoto:
PUOLTAVAT: <enintään 3 lausetta>
VASTUSTAVAT: <enintään 3 lausetta>

Älä käytä muuta tekstiä. Älä väitä äänestystuloksia. Jos lista on tyhjä, kirjoita että aineisto on yksipuolinen.`;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) return null;

    let proLead = "";
    let conLead = "";
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (t.toUpperCase().startsWith("PUOLTAVAT:")) {
        proLead = t.replace(/^PUOLTAVAT:\s*/i, "").trim();
      } else if (t.toUpperCase().startsWith("VASTUSTAVAT:")) {
        conLead = t.replace(/^VASTUSTAVAT:\s*/i, "").trim();
      }
    }
    if (!proLead) proLead = text.slice(0, 400);
    if (!conLead)
      conLead =
        "Vastustavia perusteluja ei erotettu tai aineisto on yksipuolinen.";
    return { proLead, conLead };
  } catch (e) {
    console.error("[synthesizeStanceMatrixLeads]", e);
    return null;
  }
}
