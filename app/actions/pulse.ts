"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, unstable_cache } from "next/cache";
import { PulseQuestion } from "@/lib/types";
import { getUser } from "./auth";
import { saveGhostDNA } from "@/lib/auth/ghost-actions";

/**
 * Fetches a daily pulse question for the user.
 * Priority: 1. Curated questions (not yet in DB), 2. Random bill-based, 3. Fallback
 */
export async function getDailyPulse(lens: string = "national"): Promise<PulseQuestion | null> {
  return unstable_cache(
    async () => {
      const user = await getUser();
      const supabase = await createClient();

      // Check if user already answered a question today
      // (Simplified: we'll just fetch questions and let UI handle "already answered" state if needed)

      // Try to find a dynamic question from meeting_analysis or bills
      if (lens !== "national") {
        const { data: meeting } = await supabase
          .from("meeting_analysis")
          .select("id, meeting_title, municipality, ai_summary")
          .eq("municipality", lens)
          .order("meeting_date", { ascending: false })
          .limit(10);

        if (meeting && meeting.length > 0) {
          const randomMeeting = meeting[Math.floor(Math.random() * meeting.length)];
          if (randomMeeting.ai_summary) {
            return {
              id: `MUNI-${randomMeeting.id}`,
              question: `Pitäisikö tämä hanke toteuttaa: "${randomMeeting.meeting_title}"?`,
              municipality: randomMeeting.municipality,
              category: "Aluepolitiikka",
              context: "municipal",
              impact_vector: randomMeeting.ai_summary.dna_impact || { urban_rural_score: 0.1 }
            } as PulseQuestion;
          }
        }
      }

      // Fallback / Default National Questions
      const defaultQuestions: PulseQuestion[] = [
        {
          id: "PULSE-001",
          question: "Pitäisikö sähköpotkulaudat kieltää keskustoissa viikonloppuöisin?",
          category: "Turvallisuus",
          context: "national",
          impact_vector: { security_score: 0.1, liberal_conservative_score: -0.05 }
        },
        {
          id: "PULSE-002",
          question: "Tulisiko julkisen liikenteen olla täysin maksutonta kaikille kansalaisille?",
          category: "Talous",
          context: "national",
          impact_vector: { economic_score: -0.1, environmental_score: 0.1 }
        },
        {
          id: "PULSE-003",
          question: "Pitäisikö Suomen lisätä merkittävästi panostuksia kotimaiseen ruoantuotantoon omavaraisuuden nimissä?",
          category: "Aluepolitiikka",
          context: "national",
          impact_vector: { urban_rural_score: 0.1, security_score: 0.05 }
        }
      ];

      return defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];
    },
    [`daily-pulse-${lens}`],
    { revalidate: 300, tags: ["pulse"] }
  )();
}

export async function submitPulseVote(question: PulseQuestion, stance: "YES" | "NO") {
  const user = await getUser();
  if (!user) return { success: false, error: "Kirjaudu sisään osallistuaksesi." };

  const direction = stance === "YES" ? 1 : -1;
  const updates: any = {};
  
  // Calculate updates based on impact_vector
  Object.entries(question.impact_vector).forEach(([axis, impact]) => {
    updates[axis] = impact * direction;
  });

  if (user.is_guest) {
    // For Ghost users, update their cookie-based DNA
    const currentDNA = user.economic_score !== undefined ? {
      economic_score: user.economic_score || 0,
      liberal_conservative_score: user.liberal_conservative_score || 0,
      environmental_score: user.environmental_score || 0,
      urban_rural_score: user.urban_rural_score || 0,
      international_national_score: user.international_national_score || 0,
      security_score: user.security_score || 0
    } : {
      economic_score: 0,
      liberal_conservative_score: 0,
      environmental_score: 0,
      urban_rural_score: 0,
      international_national_score: 0,
      security_score: 0
    };

    const newDNA = { ...currentDNA };
    Object.entries(updates).forEach(([axis, change]: [string, any]) => {
      if (axis in newDNA) {
        (newDNA as any)[axis] = Math.max(-1, Math.min(1, (newDNA as any)[axis] + change));
      }
    });

    await saveGhostDNA(newDNA);
  } else {
    // For registered users, update DB
    const supabase = await createClient();
    
    // Get current scores first
    const { data: profile } = await supabase
      .from("profiles")
      .select("economic_score, liberal_conservative_score, environmental_score, urban_rural_score, international_national_score, security_score")
      .eq("id", user.id)
      .single();

    if (profile) {
      const finalUpdates: any = {};
      Object.entries(updates).forEach(([axis, change]: [string, any]) => {
        finalUpdates[axis] = Math.max(-1, Math.min(1, (profile as any)[axis] + change));
      });

      await supabase.from("profiles").update(finalUpdates).eq("id", user.id);
    }

    // Record the pulse vote specifically
    await supabase.from("user_pulse_votes").upsert({
      user_id: user.id,
      question_id: question.id,
      stance: stance,
      created_at: new Date().toISOString()
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

