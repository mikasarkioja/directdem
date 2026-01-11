import { createClient } from "@supabase/supabase-js";

/**
 * Logic to detect inconsistencies between election promises and actual votes in council.
 */
export async function detectLocalFlips(municipality: string) {
  console.log(`--- Detecting Local Flips for ${municipality} ---`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae valtuutetut ja heidän lupauksensa
  const { data: councilors } = await supabase
    .from("municipal_councilor_profiles")
    .select("id, full_name, raw_promises, dna_fingerprint")
    .eq("municipality", municipality);

  if (!councilors) return [];

  // 2. Hae viimeisimmät äänestykset
  const { data: votes } = await supabase
    .from("municipal_councilor_votes")
    .select(`
      vote_type,
      councilor_id,
      municipal_decisions ( id, title, summary, hotspot_analysis )
    `)
    .eq("municipal_decisions.municipality", municipality);

  if (!votes) return [];

  const flips: LocalFlip[] = [];

  // 3. Analysoi ristiriidat (Simuloitu logiikka - tässä vaiheessa AI-analyysi per äänestys on paras)
  // Todellisessa sovelluksessa vertaisimme päätöksen DNA-vaikutusta valtuutetun DNA-profiiliin.
  
  for (const vote of votes) {
    const councilor = councilors.find(c => c.id === vote.councilor_id);
    if (!councilor) continue;

    const decision = (vote.municipal_decisions as any);
    if (!decision) continue;

    // Esimerkki: Jos päätös on 'talous-investointi' (JAA) ja valtuutetun DNA on vahvasti 'säästö' (+0.8), 
    // se on potentiaalinen flip.
    
    const dna = councilor.dna_fingerprint as any;
    if (!dna) continue;

    const voteType = vote.vote_type; // JAA / EI
    const hotspotAnalysis = decision.hotspot_analysis as any;

    if (!hotspotAnalysis || !hotspotAnalysis.dna_impact) continue;

    // Verrataan äänen tyyppiä ja päätöksen DNA-vaikutusta valtuutetun DNA-profiiliin.
    // Jos valtuutettu on esim. Talous-konservatiivi (+0.8) ja äänestää JAA 
    // päätökselle, joka on erittäin 'investointi/velka' (-0.9), se on ristiriita.
    
    const axes = ["economy", "values", "environment", "regional", "international", "security"];
    let maxInconsistency = 0;

    axes.forEach(axis => {
      const councilorScore = dna[axis] || 0;
      const decisionImpact = hotspotAnalysis.dna_impact[axis] || 0;

      // Jos päätös on merkittävä tällä akselilla (yli 0.3 vaikutus)
      if (Math.abs(decisionImpact) > 0.3) {
        // Jos ääni on JAA, sen pitäisi olla samaa merkkiä kuin valtuutetun DNA
        // Jos se on vastakkainen, lasketaan etäisyys.
        const alignment = voteType === "JAA" ? decisionImpact : -decisionImpact;
        const inconsistency = (councilorScore * alignment < 0) ? Math.abs(councilorScore - alignment) : 0;
        
        if (inconsistency > maxInconsistency) {
          maxInconsistency = inconsistency;
        }
      }
    });

    if (maxInconsistency > 1.0) {
      flips.push({
        councilorId: councilor.id,
        fullName: councilor.full_name,
        decisionId: decision.id,
        decisionTitle: decision.title,
        promiseAnswer: "DNA Profile Match Conflict",
        voteType: voteType,
        inconsistencyScore: Math.round(maxInconsistency * 50) // Scale to 0-100
      });
    }
  }

  return flips;
}

