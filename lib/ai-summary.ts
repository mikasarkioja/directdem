import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Generates a citizen-friendly summary in plain Finnish (selkokieli)
 * from complex parliamentary or municipal legal text.
 */
export async function generateCitizenSummary(rawText: string, context: "parliament" | "municipal" = "parliament"): Promise<string> {
  const isMunicipal = context === "municipal";
  
  const systemPrompt = isMunicipal 
    ? `Olet puolueeton Espoon kaupungin kunnallishallinnon ja talouden analyytikko (Kuntavahti). Tehtäväsi on kääntää Espoon kaupungin monimutkaiset esityslistat ja päätökset (Dynasty) selkeäksi suomeksi (selkokieli) ja analysoida niiden paikallisia vaikutuksia.

TÄRKEÄÄ: Generoi erittäin YKSITYISKOHTAINEN ja pitkä tiivistelmä.

Analysoi erityisesti:
1. "Mitä tämä tarkoittaa espoolaiselle?" (Vaikutus arkeen, palveluihin jne.)
2. "Mihin kaupunginosaan päätös liittyy?" (Etsi mainintoja kuten Leppävaara, Tapiola, Espoonlahti, Matinkylä, Kauklahti, Kalajärvi jne.)
3. "Taloudellinen vaikutus": Onko kyseessä investointi, säästö vai uusi palvelu? Paljonko tämä maksaa veronmaksajille?

Rakenne:

### 1. Tiivistelmä (Mistä on kyse?)
(Selitä esityksen päätavoite ja miksi se on tehty kunnan näkökulmasta.)

### 2. Paikallinen vaikutus ja "Lompakkoanalyysi"
Vastaa erityisesti näihin:
- **Mitä tämä tarkoittaa kuntalaisille?** (Vaikutus arkeen, palveluihin jne.)
- **Mihin kaupunginosaan tämä vaikuttaa?** (Yksilöi alueet jos mahdollista.)
- **Paljonko tämä maksaa veronmaksajille?** (Arvioi kokonaiskustannus tai vaikutus kuntaveroon/maksuihin.)

### 3. Vaikutus arkeen (Yhteenveto)
Kirjoita tähän KAKSI SELKEÄÄ LAUSETTA:
1. Yhteiskunnallinen vaikutus: Miten päätös muuttaa kuntaa tai asukkaiden oikeuksia.
2. Taloudellinen vaikutus: Miten päätös vaikuttaa kuntalaisen lompakkoon tai kunnan talouteen.

### 4. Mitä konkreettisesti muuttuu?
(Listaa tekniset muutokset yksityiskohtaisesti.)

### 5. Aikataulu
(Milloin päätös pannaan täytäntöön?)`
    : `Olet puolueeton poliittinen ja taloudellinen analyytikko. Tehtäväsi on kääntää eduskunnan monimutkaiset lakitekstit selkeäksi ja ymmärrettäväksi suomeksi (selkokieli) ja analysoida niiden taloudellisia vaikutuksia.

TÄRKEÄÄ: Generoi erittäin YKSITYISKOHTAINEN ja pitkä tiivistelmä. Vähintään 800-1200 sanaa.

Säännöt:
- Käytä selkeitä väliotsikoita (Markdown ### Otsikko).
- Vältä jargonia.
- Puolueettomuus on välttämätöntä.

Rakenne:

### 1. Tiivistelmä (Ydinasiat)
(3-5 virkettä - selitä esityksen päätavoite ja miksi se on tehty.)

### 2. Taloudelliset vaikutukset ja "Lompakkoanalyysi"
Tämä on tärkein osio. Analysoi vaikutukset eri kansanryhmiin:
- **Suurimmat hyötyjät:** Listaa ketkä voittavat eniten ja miksi (arvioi euroissa jos mahdollista).
- **Suurimmat menettäjät:** Listaa ketkä häviävät eniten ja miksi.
- **Vaikutus keskituloiseen:** Miten laki näkyy tavallisen työssäkäyvän arjessa.
- **Vaikutus pienituloiseen/eläkeläiseen:** Analysoi vaikutus heikoimmassa asemassa oleviin.

### 3. Vaikutus arkeen (Yhteenveto)
Kirjoita tähän KAKSI SELKEÄÄ LAUSETTA:
1. Yhteiskunnallinen vaikutus: Miten laki muuttaa yhteiskuntaa tai kansalaisten oikeuksia.
2. Taloudellinen vaikutus: Miten laki vaikuttaa rahallisesti tai lompakkoon.

### 4. Mitä konkreettisesti muuttuu?
(10-15 ranskaista viivaa - listaa tekniset ja juridiset muutokset yksityiskohtaisesti.)

### 4. Kenelle tämä koskee?
(Tarkka listaus ammattiryhmistä, yrityksistä tai kansalaisryhmistä, joita laki koskettaa.)

### 5. Aikataulu
(Milloin laki astuu voimaan ja onko siirtymäaikoja?)

---
### Loppuyhteenveto
(Tiivistä koko esityksen ydin ja sen merkitys Suomen tulevaisuudelle 2-3 virkkeellä.)

Tavoite: Erittäin perusteellinen analyysi, erityisesti talouden ja oikeudenmukaisuuden näkökulmasta.`;

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[generateCitizenSummary] OPENAI_API_KEY not configured, using mock summary");
      return generateMockSummary(rawText);
    }

    console.log(`[generateCitizenSummary] Generating summary for ${rawText.length} characters of text`);
    
    // Use OpenAI API to generate summary
    const { text } = await generateText({
      model: openai("gpt-4o-mini"), // Type workaround for version conflict
      system: systemPrompt,
      prompt: `Tiivistä tämä lakiteksti selkokielelle. Ole YKSITYISKOHTAINEN ja PIDEMPI. Generoi vähintään 500-800 sanaa (3000-5000 merkkiä). Selitä kaikki tärkeät asiat perusteellisesti:\n\n${rawText.substring(0, 20000)}`, // Limit to 20k chars
      temperature: 0.7,
      maxTokens: 3000, // Increased to 3000 to allow much longer summaries (500-800 words)
    } as any);

    console.log(`[generateCitizenSummary] Generated summary: ${text.length} characters`);
    
    if (!text || text.length < 500) {
      console.warn(`[generateCitizenSummary] AI returned very short summary (${text?.length || 0} chars), expected at least 500 chars. This might indicate an issue with the AI response.`);
      // Don't use fallback if we got some text, just warn
      if (!text || text.length < 50) {
        console.warn("[generateCitizenSummary] Summary too short, using fallback");
        return generateMockSummary(rawText);
      }
      // If we got some text but it's short, return it anyway (might be a valid short summary)
      console.warn(`[generateCitizenSummary] Returning short summary (${text.length} chars) - consider checking the prompt or input text`);
    }

    return text;
  } catch (error: any) {
    console.error("[generateCitizenSummary] AI Summary failed:", error);
    console.error("[generateCitizenSummary] Error details:", error.message, error.stack);
    
    // Check if it's a quota error
    if (error.message?.includes("quota") || error.message?.includes("insufficient_quota") || error.statusCode === 429) {
      console.error("[generateCitizenSummary] OpenAI API quota exceeded. Please check your OpenAI account billing and quota.");
      // Re-throw quota errors so they can be handled properly
      throw new Error("OpenAI API quota exceeded. Please check your OpenAI account billing and quota at https://platform.openai.com/account/billing. The error was: " + error.message);
    }
    
    // For other errors, fallback to mock summary
    console.warn("[generateCitizenSummary] Falling back to mock summary due to error");
    return generateMockSummary(rawText);
  }
}

/**
 * Mock summary generator based on bill title/content
 * In production, this would be replaced by actual AI
 */
function generateMockSummary(rawText: string): string {
  const lowerText = rawText.toLowerCase();
  
  // Generate summaries based on content keywords
  if (lowerText.includes("alcohol") || lowerText.includes("alkoholi")) {
    return `### 1. Tiivistelmä (Ydinasiat)
Tämä lakiesitys muuttaisi merkittävästi alkoholijuomien myyntiä Suomessa. Tavoitteena on vapauttaa kilpailua ja tuoda vahvemmat juomat ruokakauppoihin.

### 2. Taloudelliset vaikutukset ja "Lompakkoanalyysi"
- **Suurimmat hyötyjät:** Päivittäistavarakaupan ketjut (S-ryhmä, Kesko), jotka saavat uusia tuoteryhmiä hyllyilleen. Arvioitu liikevaihdon kasvu miljoonia euroja.
- **Suurimmat menettäjät:** Alko, jonka monopoliasema murtuu entisestään.
- **Vaikutus keskituloiseen:** Helpottaa asiointia, kun viiniostot voi tehdä ruokaostosten yhteydessä.
- **Vaikutus pienituloiseen/eläkeläiseen:** Hintataso saattaa nousta veronkorotusten myötä, mutta saatavuus paranee.

### 3. Vaikutus arkeen (Yhteenveto)
1. Yhteiskunnallinen vaikutus: Suomi siirtyy kohti eurooppalaisempaa alkoholikulttuuria, mutta kansanterveysriskit kasvavat.
2. Taloudellinen vaikutus: Päivittäistavarakaupan voitot kasvavat, kun taas valtion Alko-osingot saattavat pienentyä.

### 4. Mitä konkreettisesti muuttuu?
- Jopa 8 % vahvuiset viinit ruokakauppoihin.
- Myyntiajat pitenevät iltaisin.
- Alkon monopolia rajataan.`;
  }
  
  if (lowerText.includes("vero") || lowerText.includes("tax")) {
    return `### 1. Tiivistelmä (Ydinasiat)
Esitys koskee verotuksen kiristämistä/keventämistä talouden tasapainottamiseksi. Tavoitteena on valtion velkaantumisen taittaminen.

### 2. Taloudelliset vaikutukset ja "Lompakkoanalyysi"
- **Suurimmat hyötyjät:** Hyvätuloiset, jos kyseessä on työn verotuksen kevennys (arvio +50€/kk).
- **Suurimmat menettäjät:** Kuluttajat, jos ALV nousee (arvio -20€/kk ostovoimassa).
- **Vaikutus keskituloiseen:** Käteen jäävän tulon muutos riippuu lopullisista vähennyksistä.
- **Vaikutus pienituloiseen/eläkeläiseen:** Hyödykkeiden hintojen nousu tuntuu suhteellisesti eniten.

### 3. Vaikutus arkeen (Yhteenveto)
1. Yhteiskunnallinen vaikutus: Valtion palveluiden rahoituspohja vahvistuu, mutta tuloerot saattavat kasvaa.
2. Taloudellinen vaikutus: Kuluttajien ostovoima muuttuu ja yritysten investointikykyyn vaikutetaan.

### 4. Mitä konkreettisesti muuttuu?
- Veroprosentit muuttuvat.
- Verovähennyksiin tulee muutoksia.
- Verotuloja ohjataan uusiin kohteisiin.`;
  }
  
  if (lowerText.includes("nato") || lowerText.includes("infrastructure")) {
    return `### 1. Tiivistelmä (Ydinasiat)
Laki rahoittaa Suomen NATO-jäsenyyden edellyttämää puolustusinfrastruktuuria. Panostukset kohdistuvat erityisesti huoltovarmuuteen ja tukikohtiin.

### 2. Taloudelliset vaikutukset ja "Lompakkoanalyysi"
- **Suurimmat hyötyjät:** Rakennus- ja puolustusteollisuus (arvioidut tilaukset satoja miljoonia).
- **Suurimmat menettäjät:** Veronmaksajat, sillä panostukset kasvattavat valtion menoryhmää.
- **Vaikutus keskituloiseen:** Turvallisuuden tunne kasvaa, mutta julkiset varat ovat pois muista kohteista.
- **Vaikutus pienituloiseen/eläkeläiseen:** Ei välitöntä lompakkovaikutusta, mutta epäsuora paine säästöille muualta.

### 3. Vaikutus arkeen (Yhteenveto)
1. Yhteiskunnallinen vaikutus: Suomen turvallisuusympäristö vakiintuu osaksi läntistä liittokuntaa.
2. Taloudellinen vaikutus: Valtionvelka kasvaa ja investoinnit painottuvat maanpuolustukseen.

### 4. Mitä konkreettisesti muuttuu?
- 2,3 miljardia euroa lentotukikohtiin.
- Uusia varastoja rakennetaan.
- Puolustusvoimien budjetti kasvaa.`;
  }
  
  if (lowerText.includes("climate") || lowerText.includes("klimaatti") || lowerText.includes("carbon")) {
    return `Mistä on kyse? Laki asettaa teollisuudelle hiilidioksidimaksun ja ohjaa rahat vihreään teknologiaan.

Mikä muuttuu?
- Tehtaat maksavat päästöistään, mikä nostaa tuotteiden hintoja
- Saadut rahat käytetään uusiutuviin energiamuotoihin ja puhtaaseen teknologiaan
- Yritykset kannustetaan vähentämään päästöjään

Vaikutus lompakkoon/arkeen: Tuotteet voivat kallistua, mutta ilmasto hyötyy ja uusia työpaikkoja syntyy.`;
  }
  
  if (lowerText.includes("healthcare") || lowerText.includes("terveydenhuolto") || lowerText.includes("nurse")) {
    return `Mistä on kyse? Laki korottaa sairaanhoitajien ja terveydenhuollon työntekijöiden palkkoja 12 prosentilla.

Mikä muuttuu?
- Palkat nousevat kahdessa vuodessa
- Tämä koskee julkisen terveydenhuollon työntekijöitä
- Tarkoituksena on houkutella lisää työntekijöitä alalle

Vaikutus lompakkoon/arkeen: Verot voivat nousta, mutta terveydenhuolto parantuu ja hoitajat saavat paremman palkan.`;
  }
  
  if (lowerText.includes("digital") || lowerText.includes("identity") || lowerText.includes("tunnistus")) {
    return `Mistä on kyse? Laki luo kansallisen digitaalisen henkilöllisyysjärjestelmän verkkopalveluihin.

Mikä muuttuu?
- Kaikille suomalaisille luotaisiin digitaalinen henkilöllisyys
- Voitaisiin tunnistautua verkossa ilman erillisiä korteja
- Järjestelmään voi kuitenkin kieltäytyä osallistumasta

Vaikutus lompakkoon/arkeen: Verkkopalvelut helpottuvat, mutta henkilötietojen käyttö lisääntyy.`;
  }
  
  // Default fallback
  return `Mistä on kyse? Tämä laki muuttaa nykyistä lainsäädäntöä.

Mikä muuttuu?
- Lain sisältö muuttuu edellä mainituilla tavoilla
- Käytännön vaikutukset riippuvat lain yksityiskohdista

Vaikutus lompakkoon/arkeen: Vaikutukset riippuvat lain sisällöstä ja toteutuksesta.`;
}

