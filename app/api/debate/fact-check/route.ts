import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { topic, message, contextNews = [] } = await req.json();

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Olet 'The Agora' -väittelyn puolueeton tuomari ja faktantarkistaja (Judge AI).
      
      TEHTÄVÄSI:
      1. Analysoi väittelijän esittämä väite suhteessa aiheeseen: ${topic}.
      2. Jos viestissä on selkeä faktaväite (tilasto, historiallinen fakta, lakiviittaus), tarkista se.
      3. Jos väite on tosi, vahvista se lyhyesti.
      4. Jos väite on virheellinen tai harhaanjohtava, korjaa se neutraalisti.
      5. Jos kyseessä on vain mielipide, älä reagoi.
      
      SÄÄNNÖT:
      - Vastaa VAIN jos löydät tarkistettavaa.
      - Pidä vastaus erittäin lyhyenä (max 20 sanaa).
      - Aloita vastaus joko "Vahvistettu:" tai "Korjaus:".
      - Jos et löydä tarkistettavaa, palauta tyhjä merkkijono.`,
      prompt: `Analysoi tämä viesti: "${message}"
      
      Käytä apuna näitä uutisia jos ne liittyvät asiaan: ${JSON.stringify(contextNews)}`,
    } as any);

    return Response.json({ factCheck: text.trim() });
  } catch (error) {
    console.error("[FactCheck API] Error:", error);
    return Response.json({ factCheck: "" });
  }
}


