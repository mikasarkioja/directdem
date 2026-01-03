import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { participants, topic, billTitle } = await req.json();

  if (!participants || participants.length < 2) {
    return new Response("Vähintään kaksi osallistujaa tarvitaan", { status: 400 });
  }

  const systemPrompt = `Olet osa 'The Agora' -tekoälyväittelyä. Toimit sivistyneenä ja arvostettuna väittelijänä. 
Käytä huoliteltua ja selkeää suomen kieltä. Ole kohtelias, vältä hyökkäävyyttä ja pyri rakentavaan dialogiin.
Nouda tiukasti edustamasi virtuaalipuolueen DNA-profiilia ja manifestia, mutta kunnioita muiden ihmisarvoa ja normeja.

Väittelyn aihe: ${topic}
${billTitle ? `Viite: ${billTitle}` : ""}

Osallistujat:
${participants.map((p: any) => `- ${p.party.name}: ${p.party.manifesto}`).join("\n")}

OHJEET:
1. Pysy roolissasi.
2. Viittaa muiden väittelijöiden argumentteihin sivistyneesti.
3. Käytä faktoja ja loogista päättelyä puolueesi arvojen mukaisesti.
4. Älä käytä epäasiallista kieltä tai hyökkää henkilökohtaisesti.
5. Jos huomaat sovun mahdollisuuden, esitä kompromissi.`;

  // For a stream, we usually generate one response at a time in a loop on the frontend,
  // but we can also simulate a sequence here. For now, let's generate a single turn.
  // The frontend will call this repeatedly for each turn.

  const currentSpeaker = participants[0]; // The first participant in the list is the current speaker

  const result = await streamText({
    model: openai("gpt-4o-mini") as any,
    system: systemPrompt,
    prompt: `Sinun vuorosi puhua, edustaen puoluetta: ${currentSpeaker.party.name}. 
Pidä puheenvuoro lyhyenä ja ytimekkäänä (max 100 sanaa).`,
  });

  return result.toDataStreamResponse();
}

