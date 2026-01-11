"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchMunicipalCouncilors(municipality: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("councilors")
    .select("id, full_name, party")
    .eq("municipality", municipality)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching municipal councilors:", error);
    return [];
  }

  return data.map(c => ({
    id: c.id.toString(),
    first_name: c.full_name.split(" ")[0],
    last_name: c.full_name.split(" ").slice(1).join(" "),
    party: c.party
  }));
}

