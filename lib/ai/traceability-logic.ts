import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * lib/ai/traceability-logic.ts
 * AI-driven analysis of lobbyist influence on legislation.
 */

export async function analyzeLobbyistImpact(
  billId: string,
  originalBillText: string,
  expertStatementId: string,
  expertStatementText: string,
  finalReportText: string
) {
  const supabase = await createAdminClient();

  const systemPrompt = `
    Olet edistynyt poliittinen analyytikko ja tekstilingvisti. Tehtäväsi on tunnistaa 'lobbaus-sormenjälkiä'.
    
    VERTAA KOLMEA TEKSTIÄ:
    1. ALKUPERÄINEN ESITYS (HE): Hallituksen ensimmäinen versio.
    2. ASIANTUNTIJALAUSUNTO: Etujärjestön vaatimukset ja muutosehdotukset.
    3. LOPULLINEN MIETINTÖ: Valiokunnan lopullinen versio, josta eduskunta päättää.
    
    ETSI:
    - Virkkeitä tai vaatimuksia lausunnosta, jotka puuttuivat alkuperäisestä HE:stä, mutta ilmestyivät lopulliseen mietintöön.
    - Arvioi tekstin samankaltaisuus (similarity %) näiden välillä.
    
    PALAUTA JSON:
    {
      "impact_score": number (0-100),
      "analysis_summary": "Lyhyt yhteenveto vaikutuksesta",
      "matched_segments": [
        {
          "statement_text": "Lause lausunnosta",
          "matched_text": "Lause lopullisesta laista",
          "similarity": number
        }
      ]
    }
  `;

  const prompt = `
    ALKUPERÄINEN (HE): ${originalBillText.substring(0, 3000)}
    LAUSUNTO: ${expertStatementText.substring(0, 3000)}
    LOPULLINEN MIETINTÖ: ${finalReportText.substring(0, 3000)}
  `;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    } as any);

    const analysis = JSON.parse(text.replace(/```json|```/g, ""));

    // Get organization name
    const { data: stmt } = await supabase
      .from("expert_statements")
      .select("organization_name")
      .eq("id", expertStatementId)
      .single();

    // Store analysis
    await supabase.from("lobbyist_impact_analysis").upsert({
      bill_id: billId,
      statement_id: expertStatementId,
      organization_name: stmt?.organization_name || "Unknown",
      impact_score: analysis.impact_score,
      matched_segments: analysis.matched_segments,
      analysis_summary: analysis.analysis_summary
    });

    return { success: true, analysis };
  } catch (error) {
    console.error("Lobbyist analysis failed:", error);
    return { success: false, error };
  }
}

