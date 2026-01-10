import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { prepareBillTextForAI } from "@/lib/text-cleaner";

export const maxDuration = 60; // 60 seconds for longer summaries

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle both formats:
    // 1. { text, billId } from our custom call
    // 2. { prompt } from useCompletion hook (which sends the prompt directly)
    const text = body.text || body.prompt;
    const billId = body.billId;
    const context = body.context || "parliament";

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare text for AI (clean, extract sections, truncate if needed)
    const preparedText = prepareBillTextForAI(text);

    if (preparedText.length < 100) {
      return new Response(
        JSON.stringify({ error: "Text is too short after processing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // System prompt based on context
    const isMunicipal = context === "municipal";
    const systemPrompt = isMunicipal
      ? `Olet puolueeton kunnallishallinnon analyytikko. Tehtäväsi on kääntää kunnan (esim. Espoo) monimutkaiset esityslistat ja päätökset selkeäksi ja ymmärrettäväksi suomeksi (selkokieli).

Säännöt:
- Vältä jargonia.
- Vaikutus edellä: Kerro heti, miten tämä muuttaa asukkaiden arkea.
- Rakenne:
  1. Mistä on kyse?
  2. Mitä tämä tarkoittaa kuntalaisille?
  3. Mihin kaupunginosaan tämä vaikuttaa?
  4. Paljonko tämä maksaa veronmaksajille?
  5. Mitä konkreettisesti muuttuu? (ranskalaiset viivat)
  6. Aikataulu`
      : `Olet puolueeton poliittinen analyytikko. Tehtäväsi on kääntää eduskunnan monimutkaiset lakitekstit selkeäksi ja ymmärrettäväksi suomeksi (selkokieli).

Säännöt:
- Vältä jargonia: Älä käytä termejä kuten 'momentti', 'lainvalmisteluasiakirja' tai 'asetuksenantovaltuutus' ilman selitystä.
- Vaikutus edellä: Kerro heti ensimmäisenä, miten tämä laki muuttaa tavallisen suomalaisen arkea.
- Puolueettomuus: Älä ota kantaa. Esitä faktat neutraalisti.
- Rakenne: Käytä aina tätä rakennetta:
  1. Mistä on kyse? (2-3 virkettä - selitä lyhyesti mutta selkeästi)
  2. Mikä muuttuu? (5-8 ranskaista viivaa - listaa tärkeimmät muutokset yksityiskohtaisesti)
  3. Kenelle tämä koskee? (2-3 virkettä - kerro kuka tätä koskee)
  4. Vaikutus lompakkoon/arkeen: (2-3 virkettä - selitä konkreettiset vaikutukset)
  5. Milloin tämä tulee voimaan? (1-2 virkettä jos tiedossa)

Tavoite: Yksityiskohtainen mutta ymmärrettävä selitys. Vähintään 500-800 sanaa.`;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock response if no API key
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the AI response
    const result = await streamText({
      model: openai("gpt-4o-mini"), // Type workaround for version conflict
      system: systemPrompt,
      prompt: `Tiivistä tämä ${isMunicipal ? "päätös" : "lakiteksti"} selkokielelle. Ole yksityiskohtainen ja selitä kaikki tärkeät asiat:\n\n${preparedText}`,
      maxTokens: 2000, // Increased from 1500 to allow longer summaries
      temperature: 0.7,
    } as any);

    // Return the stream
    return result.toDataStreamResponse({
      headers: {
        "X-Bill-Id": billId || "",
      },
    });
  } catch (error: any) {
    console.error("Streaming error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate summary" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

