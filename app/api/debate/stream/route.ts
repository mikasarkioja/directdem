import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { participants, topic, billTitle } = await req.json();

  if (!participants || participants.length < 2) {
    return new Response("Vähintään kaksi osallistujaa tarvitaan", { status: 400 });
  }

  const systemPrompt = `Olet osa 'The Agora' -tekoälyväittelyä. Toimit kokeneena, terävänä ja vakaumuksellisena väittelijänä.
Käytä huoliteltua ja parlamentaarisen terävää suomen kieltä. Pysy muodollisesti kohteliaana, mutta ole äärimmäisen KRIITTINEN ja KANTAAOTTAVA.

Tehtäväsi on osoittaa edustamasi virtuaalipuolueen DNA-profiilin ja manifestin mukaisesti, miksi juuri teidän linjanne on paras ja miksi vastustajien näkemykset ovat puutteellisia tai virheellisiä.

Väittelyn aihe: ${topic}
${billTitle ? `Viite: ${billTitle}` : ""}

Osallistujat:
${participants.map((p: any) => `- ${p.party.name}: ${p.party.manifesto}`).join("\n")}

OHJEET:
1. Pysy tiukasti roolissasi ja puolusta puolueesi arvoja intohimoisesti.
2. Haasta muiden väittelijöiden argumentit ja osoita niiden heikkoudet.
3. Käytä sivaltavaa mutta parlamentaarisen korrektia kieltä ("Arvoisa kollega tuntuu unohtavan, että...").
4. Älä tyydy vain kompromisseihin, vaan yritä voittaa väittely parhailla perusteluilla.
5. Puheenvuoron pituus: max 100 sanaa.`;

  // For a stream, we usually generate one response at a time in a loop on the frontend,
  // but we can also simulate a sequence here. For now, let's generate a single turn.
  // The frontend will call this repeatedly for each turn.

  const currentSpeaker = participants[0]; // The first participant in the list is the current speaker

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt: `Sinun vuorosi puhua, edustaen puoluetta: ${currentSpeaker.party.name}. 
Pidä puheenvuoro lyhyenä ja ytimekkäänä (max 100 sanaa).`,
  } as any);

  return result.toDataStreamResponse();
}

