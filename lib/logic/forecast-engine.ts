import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DnaVector {
  economy: number;
  values: number;
  environment: number;
  regional: number;
  international: number;
  security: number;
}

export async function generateWeatherForecast(billId: string) {
  console.log(`--- Lasketaan sääennustetta laille: ${billId} ---`);

  // 1. Hae laajennettu profiili
  const { data: billProfile, error: billError } = await supabase
    .from("bill_enhanced_profiles")
    .select("*")
    .eq("bill_id", billId)
    .single();

  if (billError || !billProfile) throw new Error("Laajennettua profiilia ei löydy");

  // 2. Hae kaikkien kansanedustajien DNA-sormenjäljet
  const { data: mpProfiles, error: mpError } = await supabase
    .from("mp_profiles")
    .select(`
      mp_id,
      economic_score,
      liberal_conservative_score,
      environmental_score,
      urban_rural_score,
      international_national_score,
      security_score,
      mps ( party )
    `);

  if (mpError || !mpProfiles) throw new Error("MP-profiileja ei saatu ladattua");

  const billDna = billProfile.dna_impact_vector as DnaVector;
  
  // 3. Ryhmittele MP:t puolueittain ja laske hajonta (friction)
  const partyStats: Record<string, { 
    scores: DnaVector[], 
    avg: DnaVector, 
    friction: number 
  }> = {};

  mpProfiles.forEach((p: any) => {
    const party = p.mps?.[0]?.party || "Muut";
    if (!partyStats[party]) {
      partyStats[party] = { scores: [], avg: {} as DnaVector, friction: 0 };
    }
    partyStats[party].scores.push({
      economy: p.economic_score,
      values: p.liberal_conservative_score,
      environment: p.environmental_score,
      regional: p.urban_rural_score,
      international: p.international_national_score,
      security: p.security_score
    });
  });

  let globalFriction = 0;
  const alignmentPrediction: Record<string, string> = {};

  // Laske puoluekohtaiset tilastot
  Object.entries(partyStats).forEach(([party, stats]) => {
    const count = stats.scores.length;
    
    // Keskiarvo
    const avg: DnaVector = {
      economy: stats.scores.reduce((sum, s) => sum + s.economy, 0) / count,
      values: stats.scores.reduce((sum, s) => sum + s.values, 0) / count,
      environment: stats.scores.reduce((sum, s) => sum + s.environment, 0) / count,
      regional: stats.scores.reduce((sum, s) => sum + s.regional, 0) / count,
      international: stats.scores.reduce((sum, s) => sum + s.international, 0) / count,
      security: stats.scores.reduce((sum, s) => sum + s.security, 0) / count,
    };
    stats.avg = avg;

    // Hajonta (Standardipoikkeama tai vastaava "sisäinen kitka")
    // Jos puolueen jäsenet ovat kaukana toisistaan akseleilla joihin laki vaikuttaa
    let partyInternalFriction = 0;
    const axes = Object.keys(billDna) as (keyof DnaVector)[];
    
    axes.forEach(axis => {
      const impact = billDna[axis] || 0;
      if (impact > 0.2) {
        const values = stats.scores.map(s => s[axis]);
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg[axis], 2), 0) / count;
        partyInternalFriction += (variance * impact * 100);
      }
    });

    stats.friction = partyInternalFriction;
    globalFriction += partyInternalFriction;

    // Yksinkertainen tuki-ennuste (jos avg on samalla puolella kuin yleinen puoluelinja, etc.)
    // Tässä vaiheessa hyvin karkea
    alignmentPrediction[party] = partyInternalFriction > 40 ? "Sisäistä vääntöä" : (avg.economy > 0 ? "Tukee" : "Vastustaa");
  });

  // 4. Lopullinen kitka-indeksi (0-100)
  const finalFrictionIndex = Math.min(100, Math.round(globalFriction / Object.keys(partyStats).length * 2));

  // 5. Tallenna tulokset
  const updatedForecast = {
    friction_index: finalFrictionIndex,
    party_alignment_prediction: alignmentPrediction,
    voter_sensitivity: billProfile.forecast_metrics.voter_sensitivity,
    precedent_bill_id: ""
  };

  await supabase
    .from("bill_enhanced_profiles")
    .update({ forecast_metrics: updatedForecast })
    .eq("bill_id", billId);

  return updatedForecast;
}

