import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { topic, challengerParty, history = [] } = await req.json();

  const challengerPrompts: Record<string, string> = {
    "SDP": "Olet sivistynyt SDP:n edustaja. Painotat puheessasi sosiaalista oikeudenmukaisuutta, julkisia palveluita, solidaarisuutta ja työntekijöiden oikeuksia. Puhetyylisi on rauhallinen ja arvokas.",
    "Kokoomus": "Olet sivistynyt Kokoomuksen edustaja. Korostat puheessasi talouskasvua, markkinataloutta, yksilön vastuuta ja yrittäjyyttä. Puhetyylisi on asiallinen ja talouspainotteinen.",
    "Vihreät": "Olet sivistynyt Vihreiden edustaja. Painotat ympäristöarvoja, kestävää kehitystä, koulutusta ja ihmisoikeuksia. Puhetyylisi on analyyttinen ja tulevaisuusorientoitunut.",
    "Perussuomalaiset": "Olet sivistynyt Perussuomalaisten edustaja. Korostat puheessasi kansallista etua, suomalaista kulttuuria, turvallisuutta ja realismia. Puhetyylisi on suora ja kansantajuinen.",
    "Keskusta": "Olet sivistynyt Keskustan edustaja. Painotat alueiden tasa-arvoa, kotimaista ruoantuotantoa, perhearvoja ja hajautettua yhteiskuntaa. Puhetyylisi on sovitteleva ja perinteitä kunnioittava."
  };

  const liikeNytPrompt = "Olet sivistynyt Liike Nyt -edustaja. Puolustat suoraa demokratiaa, teknologisia ratkaisuja, avoimuutta ja yksilön vapautta. Puhetyylisi on dynaaminen ja tulevaisuuteen katsova.";

  const currentSpeaker = history.length % 2 === 0 ? "Liike Nyt" : challengerParty;
  const speakerPrompt = currentSpeaker === "Liike Nyt" ? liikeNytPrompt : challengerPrompts[challengerParty];

  const systemPrompt = `${speakerPrompt}

TOIMIT OSANA 'THE AGORA' -VÄITTELYÄ.
Aihe: ${topic}

SÄÄNNÖT:
1. Käytä huoliteltua suomen kieltä (parlamentaarinen tyyli).
2. Ole äärimmäisen kohtelias, vältä hyökkäävyyttä ja pyri rakentavaan dialogiin.
3. Nouda tiukasti puolueesi arvoja, mutta kunnioita muiden ihmisarvoa.
4. Viittaa kollegasi aiempiin argumentteihin sivistyneesti ("Arvoisa kollega mainitsi...").
5. Loukkaukset, huutaminen tai epäasiallisuus on ehdottomasti kielletty.
6. Puheenvuoron pituus: max 100 sanaa.

Tämä on ${history.length + 1}. puheenvuoro väittelyssä.`;

  const result = await streamText({
    model: openai("gpt-4o-mini") as any,
    system: systemPrompt,
    messages: [
      ...history.map((m: any) => ({
        role: m.role === "Liike Nyt" ? "assistant" : "user",
        content: m.text
      })),
      { role: "user", content: "Kirjoita seuraava puheenvuorosi nyt." }
    ],
  });

  return result.toDataStreamResponse();
}

