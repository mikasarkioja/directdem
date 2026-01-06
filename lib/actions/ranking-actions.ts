// lib/actions/ranking-actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { formatParty } from "@/lib/utils/party-utils";
import { calculatePivotScore } from "@/lib/analysis/pivot-engine";

export interface RankingResult {
  parties: {
    name: string;
    cohesion: number;
    polarization: number;
    polarizationVector: {
      economic: number;
      liberal: number;
      env: number;
      urban: number;
      global: number;
      security: number;
    };
    pivotScore: number;
    topCategory: string;
    mpCount: number;
  }[];
  leaderboards: {
    disciplined: { name: string; score: number }[];
    flipFlops: { name: string; score: number }[];
    owners: { category: string; party: string; score: number }[];
    activity: { name: string; score: number }[];
  };
  error?: string;
}

export async function getPoliticalRanking(): Promise<RankingResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch pre-calculated rankings from the database
    const { data: rankings, error } = await supabase
      .from("party_rankings")
      .select("*")
      .order("cohesion_score", { ascending: false });

    if (error) throw new Error(`Rankings haku epäonnistui: ${error.message}`);
    if (!rankings || rankings.length === 0) {
      throw new Error("Ranking-dataa ei löytynyt. Ole hyvä ja aja analyysi-skripti.");
    }

    const parties = rankings.map(r => ({
      name: r.party_name,
      cohesion: Math.round(r.cohesion_score),
      polarization: Math.round(r.polarization_score),
      polarizationVector: r.polarization_vector,
      pivotScore: Math.round(r.pivot_score),
      topCategory: r.top_category,
      mpCount: r.mp_count
    }));

    // Re-calculate leaderboards from the pre-calculated party data
    const disciplined = [...parties].sort((a, b) => b.cohesion - a.cohesion).map(p => ({ name: p.name, score: p.cohesion }));
    const flipFlops = [...parties].sort((a, b) => b.pivotScore - a.pivotScore).map(p => ({ name: p.name, score: p.pivotScore }));
    const activity = rankings.map(r => ({
      name: r.party_name,
      score: Math.round(r.activity_score)
    })).sort((a, b) => b.score - a.score);

    // Topic Ownership: Collect categories from DB or use core categories as fallback
    const allCategories = new Set<string>(["Talous", "Arvot", "Ympäristö", "Aluepolitiikka", "Kansainvälisyys", "Turvallisuus"]);
    rankings.forEach(r => {
      if (r.topic_ownership) {
        Object.keys(r.topic_ownership).forEach(cat => {
          if (cat && cat !== 'Muu' && cat !== 'Yleinen') allCategories.add(cat.trim());
        });
      }
    });

    // Map category keys to Finnish display names
    const displayNames: Record<string, string> = {
      "Talous": "Talous",
      "Arvot": "Arvot",
      "Ympäristö": "Ympäristö",
      "Aluepolitiikka": "Alueet",
      "Kansainvälisyys": "Globalismi",
      "Turvallisuus": "Turvallisuus"
    };

    const categories = Array.from(allCategories);
    const owners = categories
      .sort((a, b) => (displayNames[a] || a).localeCompare(displayNames[b] || b))
      .map(cat => {
        const partyOwnership = rankings.map(r => ({
          party: r.party_name,
          intensity: r.topic_ownership?.[cat] || r.topic_ownership?.[cat + " "] || 0
        })).sort((a, b) => b.intensity - a.intensity);

        const best = partyOwnership[0];
        
        return {
          category: displayNames[cat] || cat,
          party: (best && best.intensity > 0) ? best.party : "Ei dataa",
          score: best ? Math.round(best.intensity * 10) / 10 : 0
        };
      });

    return { 
      parties, 
      leaderboards: { disciplined, flipFlops, owners, activity } 
    };

  } catch (error: any) {
    console.error("Critical error in getPoliticalRanking:", error);
    return {
      parties: [],
      leaderboards: { disciplined: [], flipFlops: [], owners: [], activity: [] },
      error: error.message || "Tuntematon virhe ladattaessa ranking-dataa."
    };
  }
}
