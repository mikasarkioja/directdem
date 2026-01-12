"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";

export interface ResearchNote {
  id: string;
  author_name: string;
  category: string;
  content: string;
  related_id?: string;
  created_at: string;
}

export async function getResearchNotes(category?: string, relatedId?: string): Promise<ResearchNote[]> {
  const supabase = await createClient();
  let query = supabase.from("research_notes").select("*").order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (relatedId) query = query.eq("related_id", relatedId);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching research notes:", error);
    return [];
  }

  return data as ResearchNote[];
}

export async function addResearchNote(content: string, category: string, relatedId?: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase.from("research_notes").insert({
    user_id: user.id,
    author_name: user.full_name || user.email || "Unknown Researcher",
    category,
    content,
    related_id: relatedId,
  });

  if (error) throw error;

  revalidatePath("/dashboard");
  return { success: true };
}

