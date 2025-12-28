"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Generates a citizen-friendly summary in plain Finnish (selkokieli)
 * from complex parliamentary legal text.
 */
export async function generateCitizenSummary(rawText: string): Promise<string> {
  const systemPrompt = `Olet puolueeton poliittinen analyytikko. Tehtäväsi on kääntää eduskunnan monimutkaiset lakitekstit selkeäksi ja ymmärrettäväksi suomeksi (selkokieli).

TÄRKEÄÄ: Generoi YKSITYISKOHTAINEN ja PIDEMPI tiivistelmä. Vähintään 500-800 sanaa (noin 3000-5000 merkkiä). Älä tee lyhyttä tiivistelmää.

Säännöt:
- Vältä jargonia: Älä käytä termejä kuten 'momentti', 'lainvalmisteluasiakirja' tai 'asetuksenantovaltuutus' ilman selitystä.
- Vaikutus edellä: Kerro heti ensimmäisenä, miten tämä laki muuttaa tavallisen suomalaisen arkea.
- Puolueettomuus: Älä ota kantaa. Esitä faktat neutraalisti.
- Rakenne: Käytä aina tätä rakennetta ja ole YKSITYISKOHTAINEN:
  1. Mistä on kyse? (3-5 virkettä - selitä perusteellisesti)
  2. Mikä muuttuu? (10-15 ranskaista viivaa - listaa KAIKKI tärkeät muutokset yksityiskohtaisesti)
  3. Kenelle tämä koskee? (3-5 virkettä - kerro tarkasti kuka tätä koskee ja miten)
  4. Vaikutus lompakkoon/arkeen: (4-6 virkettä - selitä konkreettiset vaikutukset yksityiskohtaisesti)
  5. Milloin tämä tulee voimaan? (2-3 virkettä jos tiedossa)

Tavoite: YKSITYISKOHTAINEN ja PIDEMPI selitys. Vähintään 500-800 sanaa (3000-5000 merkkiä). Älä tee lyhyttä tiivistelmää.`;

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[generateCitizenSummary] OPENAI_API_KEY not configured, using mock summary");
      return generateMockSummary(rawText);
    }

    console.log(`[generateCitizenSummary] Generating summary for ${rawText.length} characters of text`);
    
    // Use OpenAI API to generate summary
    const { text } = await generateText({
      model: openai("gpt-4o-mini") as any, // Type workaround for version conflict
      system: systemPrompt,
      prompt: `Tiivistä tämä lakiteksti selkokielelle. Ole YKSITYISKOHTAINEN ja PIDEMPI. Generoi vähintään 500-800 sanaa (3000-5000 merkkiä). Selitä kaikki tärkeät asiat perusteellisesti:\n\n${rawText.substring(0, 20000)}`, // Limit to 20k chars
      temperature: 0.7,
      maxTokens: 3000, // Increased to 3000 to allow much longer summaries (500-800 words)
    });

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
    return `Mistä on kyse? Tämä laki muuttaisi alkoholijuomien myyntiä ruokakaupoissa.

Mikä muuttuu?
- Vahvemmat viinit (yli 5,5 %) tulisivat ruokakauppojen hyllyille
- Myyntiajat pitenisivät, voitaisiin ostaa alkoholia pidempään päivässä
- Alkon monopoliasema heikkenisi osittain

Vaikutus lompakkoon/arkeen: Ostaminen helpottuisi, mutta terveydenhuollon kustannukset voivat nousta.`;
  }
  
  if (lowerText.includes("nato") || lowerText.includes("infrastructure")) {
    return `Mistä on kyse? Laki rahoittaa Suomen NATO-jäsenyyden edellyttämää puolustusinfrastruktuuria.

Mikä muuttuu?
- 2,3 miljardia euroa kohdennetaan lentotukikohtien ja laivastotukikohtien parannuksiin
- Uusia varastoja ja huolto-olosuhteita rakennetaan eri puolille Suomea
- Puolustusvoimien kustannukset kasvavat merkittävästi

Vaikutus lompakkoon/arkeen: Verot nousevat, mutta turvallisuus paranee.`;
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

