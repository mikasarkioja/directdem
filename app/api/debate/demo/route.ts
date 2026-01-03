import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { topic, challengerParty, history = [], news = [] } = await req.json();

  const challengerPrompts: Record<string, string> = {
    "SDP": "Olet kokenut ja vakaumuksellinen SDP:n edustaja. Puolustat intohimoisesti hyvinvointivaltiota, solidaarisuutta ja heikoimpien turvaa. Olet kriittinen markkinavoimien hallitsematonta valtaa kohtaan ja haastat vastustajasi arvot, jos ne uhkaavat sosiaalista oikeudenmukaisuutta. Puhetyylisi on jämäkkä ja arvopohjainen.",
    "Kokoomus": "Olet terävä ja talousviisas Kokoomuksen edustaja. Uskot yksilön vapauteen, kilpailukykyyn ja vastuulliseen taloudenpitoon. Olet valmis osoittamaan vastustajasi argumenttien taloudelliset epäkohdat ja byrokraattisuuden. Puhetyylisi on faktapohjainen, itsevarma ja ratkaisukeskeinen.",
    "Vihreät": "Olet visionäärinen ja analyyttinen Vihreiden edustaja. Asetat planeetan rajat ja tulevat sukupolvet kaiken edelle. Haastat perinteiset puolueet rohkeasti niiden lyhytnäköisyydestä ja ekologisesta passiivisuudesta. Puhetyylisi on tiedostava, suorasanainen ja globaali.",
    "Perussuomalaiset": "Olet suora ja kansallismielinen Perussuomalaisten edustaja. Puhut asioista niiden oikeilla nimillä ja asetat suomalaisten edun etusijalle. Olet erittäin kriittinen utopistisia ja kalliita hankkeita kohtaan. Puhetyylisi on kansantajuinen, provosoivakin ja realismia korostava.",
    "Keskusta": "Olet sovitteleva mutta tiukka Keskustan edustaja. Puolustat koko Suomen elinvoimaa ja huoltovarmuutta. Haastat kaupunkikeskeiset argumentit ja korostat paikallista päätöksentekoa. Puhetyylisi on perinteitä kunnioittava, mutta tarvittaessa sivaltava."
  };

  const liikeNytPrompt = "Olet dynaaminen ja teknologiaorientoitunut Liike Nyt -edustaja. Haastat perinteisen puoluepolitiikan kankeuden ja vaadit suoraa demokratiaa. Olet taitava osoittamaan, miten vanhanaikaiset rakenteet jarruttavat kehitystä. Puhetyylisi on moderni, haastava ja tulevaisuususkoinen.";

  const currentSpeaker = history.length % 2 === 0 ? "Liike Nyt" : challengerParty;
  const speakerPrompt = currentSpeaker === "Liike Nyt" ? liikeNytPrompt : challengerPrompts[challengerParty];

  const newsContext = news.length > 0 
    ? `AJANKOHTAISET UUTISET:
${news.map((n: any) => `- ${n.source}: ${n.title}`).join("\n")}
Huomioi nämä uutiset puheenvuorossasi ja viittaa niihin sivistyneesti jos ne tukevat argumenttiasi.`
    : "";

  const systemPrompt = `${speakerPrompt}

TOIMIT OSANA 'THE AGORA' -VÄITTELYÄ.
Aihe: ${topic}

${newsContext}

SÄÄNNÖT:
1. Käytä huoliteltua ja terävää suomen kieltä (parlamentaarinen tyyli).
2. OLE KRIITTINEN JA KANTAAOTTAVA. Älä vain toista omaa kantaasi, vaan haasta vastustajasi logiikka ja arvot.
3. Pyri osoittamaan, miksi oma näkemyksesi on kestävämpi ja parempi koko yhteiskunnalle.
4. Kommentoi kollegasi argumentteja kärkkäästi mutta pysy muodollisesti kohteliaana.
5. Vältä ympäripyöreitä ilmauksia – ota selkeä asento ja puolusta sitä.
6. Loukkaukset ja epäasiallinen kieli on kielletty, mutta poliittinen intohimo ja sivaltaminen on sallittua.
7. Puheenvuoron pituus: max 100 sanaa.

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

