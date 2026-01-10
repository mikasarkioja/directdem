"use server";

import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";

/**
 * Checks for impact by comparing user submissions with recent parliamentary speeches.
 * This is a simulation/AI-driven matching logic for the digital twin experience.
 */
export async function checkUserImpact(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get user's latest submissions
  const { data: submissions } = await supabase
    .from("bill_user_submissions")
    .select("*, bills(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!submissions || submissions.length === 0) return { success: false, message: "Ei lausuntoja tarkistettavaksi." };

  // 2. Fetch "recent speeches" (Mocking this for the twin experience)
  // In a real app, this would query an Eduskunta Speech API
  const recentSpeeches = [
    {
      mp: "Petteri Orpo",
      text: "Meidän on katsottava talousvaikutuksia pitkällä aikavälillä, erityisesti miten tämä vaikuttaa seuraavan sukupolven ostovoimaan.",
      date: new Date().toISOString()
    },
    {
      mp: "Li Andersson",
      text: "Tämä lakiesitys jättää huomioimatta heikoimmassa asemassa olevien peruspalvelut, mikä on kestämätöntä arvojemme kannalta.",
      date: new Date().toISOString()
    },
    {
      mp: "Riikka Purra",
      text: "Suomen kansallinen turvallisuus vaatii tiukempaa rajavalvontaa ja resursseja viranomaisille tässä muuttuneessa tilanteessa.",
      date: new Date().toISOString()
    }
  ];

  for (const submission of submissions) {
    for (const speech of recentSpeeches) {
      // 3. Use AI to find matching arguments
      const prompt = `Vertaa kansalaisen lausuntoa ja kansanedustajan puhetta.
      
      Kansalaisen lausunto (${submission.focus_area}): "${submission.justification}"
      Kansanedustajan puhe: "${speech.text}"
      
      Jos puheessa on samoja teemoja, huolia tai argumentteja, kirjoita lyhyt (max 2 lausetta) selitys siitä, miten kansalaisen kanta heijastuu puheessa. Jos ei ole osumaa, vastaa "EI_OSUMAA".`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o") as any,
          prompt: prompt,
        });

        if (text.trim() !== "EI_OSUMAA") {
          // 4. Save impact citation if not already exists
          const { data: existing } = await supabase
            .from("user_impact_citations")
            .select("id")
            .eq("user_id", userId)
            .eq("submission_id", submission.id)
            .eq("mp_name", speech.mp)
            .single();

          if (!existing) {
            await supabase.from("user_impact_citations").insert({
              user_id: userId,
              submission_id: submission.id,
              mp_name: speech.mp,
              speech_snippet: speech.text,
              speech_date: speech.date,
              impact_explanation: text.trim(),
              impact_score: 25 // High reward for actual impact!
            });

            // Update user XP/Points
            const { data: profile } = await supabase.from("profiles").select("xp, impact_points").eq("id", userId).single();
            if (profile) {
              await supabase.from("profiles").update({
                xp: (profile.xp || 0) + 50,
                impact_points: (profile.impact_points || 0) + 25
              }).eq("id", userId);
            }
          }
        }
      } catch (e) {
        console.error("Impact check AI failed:", e);
      }
    }
  }

  revalidatePath("/?view=workspace");
  return { success: true };
}

/**
 * Fetches impact citations for a user.
 */
export async function getUserImpactCitations(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("user_impact_citations")
    .select("*, submission:bill_user_submissions(bills(title))")
    .eq("user_id", userId)
    .order("speech_date", { ascending: false });

  if (error) throw error;
  return data;
}


