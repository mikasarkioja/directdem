"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MunicipalQuestion {
  id: string;
  municipality: string;
  title: string;
  summary: string;
  date: string;
  ai_summary: any;
}

export async function getDailyMunicipalQuestion() {
  const supabase = await createClient();

  // Hae satunnainen tai tuorein merkittävä päätös tältä kaudelta
  const { data, error } = await supabase
    .from("meeting_analysis")
    .select("id, municipality, meeting_title, meeting_date, ai_summary")
    .order("meeting_date", { ascending: false })
    .limit(10);

  if (error || !data || data.length === 0) return null;

  // Valitaan satunnainen näistä kymmenestä
  const randomIdx = Math.floor(Math.random() * data.length);
  const item = data[randomIdx];

  return {
    id: item.id,
    municipality: item.municipality,
    title: item.meeting_title,
    summary: item.ai_summary.summary,
    date: item.meeting_date,
    ai_summary: item.ai_summary
  } as MunicipalQuestion;
}

export async function voteOnMunicipalQuestion(
  meetingId: string,
  stance: "FOR" | "AGAINST" | "NEUTRAL"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Kirjaudu sisään äänestääksesi." };

  // Käytetään user_profiles-taulua tai vastaavaa tallentamaan ääni
  // Tässä tapauksessa voidaan tallentaa se uuteen tauluun 'meeting_votes'
  const { error } = await supabase
    .from("meeting_votes")
    .upsert({
      meeting_id: meetingId,
      user_id: user.id,
      stance: stance,
      created_at: new Date().toISOString()
    }, { onConflict: "meeting_id,user_id" });

  if (error) {
    console.error("Error voting on municipal question:", error);
    return { success: false, error: "Äänestys epäonnistui." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

