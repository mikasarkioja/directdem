import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { logAiCost } from "@/lib/analytics/tracker";

/**
 * Generates a citizen-friendly summary in plain Finnish (selkokieli)
 * from complex parliamentary or municipal legal text.
 */
export async function generateCitizenSummary(rawText: string, context: "parliament" | "municipal" = "parliament", userId?: string): Promise<string> {
  const isMunicipal = context === "municipal";
  
  const systemPrompt = isMunicipal 
    ? `Olet puolueeton kunnallishallinnon ja talouden huippuanalyytikko (Kuntavahti). Tehtäväsi on kääntää kaupungin monimutkaiset esityslistat ja päätökset (Dynasty/Ahjo) selkeäksi suomeksi (selkokieli) ja analysoida niiden paikallisia vaikutuksia äärimmäisen syvällisesti.

TÄRKEÄÄ: Generoi ÄÄRIMMÄISEN YKSITYISKOHTAINEN, LAAJA ja RAKENTEELLINEN raportti (vähintään 15 000 merkkiä). 

Käytä runsaasti väliotsikoita ja jaa teksti selkeisiin kappaleisiin.

Analysoi erityisesti:
1. "Mitä tämä tarkoittaa kuntalaiselle?" (Vaikutus arkeen, palveluihin, asumiseen jne.)
2. "Maantieteellinen vaikutus": Mihin kaupunginosiin tai katuosoitteisiin päätös liittyy?
3. "Talousarvio ja eurot": Pura auki investoinnit, säästöt, lainat ja rahoituslähteet. Paljonko tämä maksaa per asukas?
4. "Strateginen linjaus": Miten tämä osuma kaupungin strategiaan?
5. "Poliittinen kitka": Mitkä asiat jakavat mielipiteitä?

Rakenne:

### 1. Perusteellinen Tiivistelmä (Ydinasiat)
(Selitä esityksen päätavoite, historia ja miksi se on tehty.)

### 2. Taloudelliset Vaikutukset ja Kustannusanalyysi
(Eurosummat, budjetti-osuma, rahoitusmalli.)

### 3. Vaikutus Arkeen ja Kaupunginosiin
(Konkreettiset muutokset kuntalaisen näkökulmasta.)

### 4. Strateginen ja Sosiaalinen Analyysi
(Strategia-yhteensopivuus, voittajat ja häviäjät.)

### 5. Poliittinen Jännite ja "Hotspotit"
(Mitkä kohdat herättävät eniten keskustelua?)

### 6. Tekniset Muutokset ja Aikataulu
(Yksityiskohtainen listaus muutoksista.)`
    : `Olet puolueeton poliittinen ja taloudellinen huippuanalyytikko. Tehtäväsi on kääntää eduskunnan monimutkaiset lakitekstit selkeäksi suomeksi (selkokieli) ja analysoida niiden taloudellisia ja yhteiskunnallisia vaikutuksia äärimmäisen syvällisesti.

TÄRKEÄÄ: Generoi ÄÄRIMMÄISEN YKSITYISKOHTAINEN, LAAJA ja RAKENTEELLINEN raportti (vähintään 15 000 merkkiä).

Käytä runsaasti väliotsikoita ja jaa teksti selkeisiin kappaleisiin.

Säännöt:
- Käytä selkeitä väliotsikoita (Markdown ### Otsikko).
- Pura auki monimutkaiset käsitteet.
- Puolueettomuus on välttämätöntä.

Rakenne:

### 1. Laaja Tiivistelmä ja Taustat
(Esityksen päämäärä, tarve ja poliittinen historia.)

### 2. Syvällinen Talousanalyysi ja "Lompakkomittari"
(Vaikutus valtiontalouteen, kuntatalouteen ja kansalaisten lompakkoon.)

### 3. Vaikutukset Eri Kansanryhmiin
- **Pienituloiset ja eläkeläiset**
- **Keskituloiset ja työssäkäyvät**
- **Yrittäjät ja yritykset**

### 4. Yhteiskunnallinen ja Oikeudellinen Vaikutus
(Muutokset perusoikeuksiin, palveluihin tai hallintoon.)

### 5. Konkreettiset Muutokset (Pykälätasolla)
(Pura auki tärkeimmät juridiset ja tekniset muutokset.)

### 6. Aikataulu ja Voimaantulo
(Milloin laki astuu voimaan ja mitä siirtymäaikoja on?)

---
### Loppuarvio ja Tulevaisuuden Näkymät
(Miten tämä muuttaa Suomea pitkällä aikavälillä?)`;

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[generateCitizenSummary] OPENAI_API_KEY not configured, using mock summary");
      return generateMockSummary(rawText);
    }

    console.log(`[generateCitizenSummary] Generating summary for ${rawText.length} characters of text`);
    
    // Use OpenAI API to generate summary
    const result = await generateText({
      model: openai("gpt-4o") as any, // Upgraded to gpt-4o for deep analysis
      system: systemPrompt,
      prompt: `Tiivistä tämä lakiteksti selkokielelle virallisena KONSULTIN SELONTEKONA. 
      
      OHJEET RAKENTEELLE:
      - Ole ÄÄRIMMÄISEN YKSITYISKOHTAINEN, LAAJA ja RAKENTEELLINEN. Generoi vähintään 15 000 merkkiä tekstiä. 
      - JAA TEKSTI SELKEISIIN KAPPALEISIIN (3-5 virkettä per kappale).
      - Käytä Markdown-väliotsikoita (### Otsikko) erottamaan eri analyysiosiot.
      - Pura auki kaikki talousluvut, eurosummat ja rahoituslähteet.
      - Tunnista kuka voittaa ja kuka häviää tässä esityksessä.
      - Järjestä tieto loogisesti kronologiseen tai teemalliseen järjestykseen.
      
      Lähdemateriaali:\n\n${rawText.substring(0, 50000)}`,
      temperature: 0.7,
      maxTokens: 8000, 
    } as any);

    const { text, usage } = result;

    // Log AI Cost
    await logAiCost(
      `Bill Summary (${context})`,
      "gpt-4o",
      usage.promptTokens,
      usage.completionTokens,
      userId
    );

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

