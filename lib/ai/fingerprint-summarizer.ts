import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Synthesizes collected MP data into a deep political analysis.
 */
export async function summarizeMPFingerprint(data: any) {
  const { mp, aiProfile, dependencies, lobbyistMeetings, correlations } = data;

  const prompt = `
    POLIITTINEN SORMENJÄLKI - SYVÄANALYYSI
    
    KOHDE: ${mp.first_name} ${mp.last_name} (${mp.party})
    VAALIPIIRI: ${mp.constituency || 'Tuntematon'}
    
    DATA-SYÖTE:
    - Retoriikka: ${JSON.stringify(aiProfile.rhetoric_style)}
    - Sidonnaisuudet: ${JSON.stringify(dependencies)}
    - Lobbaustapaamiset: ${JSON.stringify(lobbyistMeetings)}
    - AI-Korrelaatiot: ${JSON.stringify(correlations)}
    
    TEHTÄVÄ:
    Luo ammattimainen, objektiivinen ja dataan perustuva poliittinen syväanalyysi.
    Analyysin on oltava 5-osaan jaettu:
    
    1. YHTEENVETO: Edustajan yleinen profiili ja toimintatapa.
    2. RETORIIKKA JA VIESTINTÄ: Miten hän puhuu ja ketä hän puhuttelee?
    3. VALTA JA KYTKÖKSET: Analyysi sidonnaisuuksista ja niiden mahdollisesta vaikutuksesta.
    4. KORRELAATIOIDEN SYY-YHTEYDET: Merkittävimmät havaitut yhteydet rahan ja puheiden välillä.
    5. POIKKEAVAT HAVAINNOT: Tunnista 'Poliittisen sormenjäljen' keskeisimmät poikkeamat (esim. poikkeuksellinen kytkös tiettyyn toimialaan).
    
    Sävyn on oltava akateeminen ja tutkiva. Älä ota kantaa poliittisesti, vaan analysoi mekanismeja.
  `;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: "Olet poliittisen analytiikan ja korruptiontutkimuksen johtava asiantuntija.",
      prompt: prompt
    });

    return text;
  } catch (error: any) {
    console.error("❌ Fingerprint summarization failed:", error.message);
    return "Analyysin generointi epäonnistui.";
  }
}

