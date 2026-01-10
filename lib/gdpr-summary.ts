import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Generates a plain language (selkokieli) summary of GDPR/privacy policy
 * for first-time users
 */
export async function generateGDPRSummary(): Promise<string> {
  const privacyPolicyText = `
Tietosuojaseloste ja käyttöehdot

1. Henkilötietojen käsittely
Eduskuntavahti käsittelee henkilötietojasi EU:n yleisen tietosuoja-asetuksen (GDPR) mukaisesti. 
Keräämme seuraavia tietoja: sähköpostiosoite (kirjautumista varten), nimi (valinnainen, profiilissa), 
vaalipiiri (valinnainen, profiilissa), äänestykset lakiesityksistä, ja kirjautumisaikaleimat.

2. Tietojen käyttötarkoitus
Henkilötietojasi käytetään seuraaviin tarkoituksiin: käyttäjätunnuksen luominen ja kirjautumisen hallinta, 
äänestyksesi tallentaminen ja näyttäminen, yksilöllisten tilastojen ja raporttien luominen, 
ja palvelun parantaminen ja kehittäminen.

3. Tietojen jakaminen
Emme jaa henkilötietojasi kolmansien osapuolien kanssa. Äänestyksesi näytetään vain aggregoituna 
muiden käyttäjien äänestysten kanssa. Yksittäisiä äänestyksiäsi ei näytetä muille käyttäjille.

4. Oikeutesi
Sinulla on oikeus: saada tietoja käsiteltävistä henkilötiedoistasi, oikaista virheellisiä henkilötietoja, 
poistaa henkilötietosi, vastustaa henkilötietojesi käsittelyä, ja siirtää henkilötietosi toiseen palveluun.

5. Evästeet
Käytämme evästeitä kirjautumisen ylläpitämiseen. Emme käytä seurantaevästeitä tai mainosevästeitä.

6. Yhteydenotto
Jos sinulla on kysymyksiä tietosuojasta, ota yhteyttä: tietosuoja@eduskuntavahti.fi

7. Hyväksyntä
Käyttämällä Eduskuntavahti-palvelua hyväksyt tämän tietosuojaselosteen ja käyttöehdot. 
Voit peruuttaa suostumuksesi milloin tahansa poistamalla tilisi.
  `;

  const systemPrompt = `Olet selkokielen asiantuntija. Tehtäväsi on selittää tietosuojaseloste yksinkertaisella ja ymmärrettävällä suomeksi.

Säännöt:
- Käytä selkokieltä: lyhyet lauseet, selkeät sanat, ei juridista jargonia
- Selitä mitä tietoja keräämme ja miksi
- Selitä mitä oikeuksia käyttäjällä on
- Ole ystävällinen ja rauhallinen sävy
- Pituus: noin 200-300 sanaa

Rakenne:
1. Lyhyt johdanto: Mitä tämä on?
2. Mitä tietoja keräämme ja miksi?
3. Mitä oikeuksia sinulla on?
4. Miten voit poistaa tietosi?`;

  try {
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to simple summary if AI not available
      return `Tietosuojaseloste selkokielellä:

Mitä tietoja keräämme?
Keräämme sähköpostiosoitteesi kirjautumista varten. Voit myös antaa nimesi ja vaalipiirisi, jos haluat. 
Tallennamme myös äänestyksesi lakiesityksistä.

Miksi tarvitsemme näitä tietoja?
Tietoja tarvitaan, jotta voimme luoda sinulle käyttäjätunnuksen ja tallentaa äänestyksesi. 
Äänestyksesi näytetään muille käyttäjille vain yhdessä muiden äänestysten kanssa. 
Yksittäisiä äänestyksiäsi ei näytetä muille.

Mitä oikeuksia sinulla on?
Voit milloin tahansa pyytää tietojesi poistamista. Voit myös pyytää näkemään, mitä tietoja meillä on sinusta.

Miten voin poistaa tietoni?
Voit poistaa tilisi asetuksista. Tämä poistaa kaikki tietosi järjestelmästä.`;
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: `Selitä tämä tietosuojaseloste selkokielellä:\n\n${privacyPolicyText}`,
      temperature: 0.7,
      maxTokens: 500,
    } as any);

    return text || "Tietosuojaseloste saatavilla /privacy-policy -sivulla.";
  } catch (error: any) {
    console.error("[generateGDPRSummary] Failed:", error);
    // Return fallback
    return `Tietosuojaseloste selkokielellä:

Keräämme sähköpostiosoitteesi ja äänestyksesi. Emme jaa tietojasi muille. 
Voit poistaa tilisi milloin tahansa asetuksista.`;
  }
}


