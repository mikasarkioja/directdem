// lib/analysis/weather-engine.ts
import { createClient } from "@supabase/supabase-js";
import { formatParty } from "@/lib/utils/party-utils";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export interface PredictionResult {
  jaa: number;
  ei: number;
  abstain: number;
  weather: 'sunny' | 'stormy' | 'cloudy';
  potentialRebels: { mpId: number; name: string; party: string; probability: number }[];
  summary: string;
}

/**
 * Predicts the outcome of a bill based on AI categories and MP DNA.
 */
export async function predictVoteOutcome(billId: string): Promise<PredictionResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get Bill Info
  const { data: bill } = await supabase
    .from('bills')
    .select('id, title, category, summary')
    .eq('id', billId)
    .single();

  if (!bill) throw new Error("Bill not found");

  // AI Categorization if category is generic or missing
  let category = bill.category;
  if (!category || category === 'Hallituksen esitys' || category === 'Muu') {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini') as any,
        system: `Olet poliittinen analyytikko. Luokittele lakiesityksen otsikko kuuteen kategoriaan: 
          Talous, Arvot, Ympäristö, Aluepolitiikka, Kansainvälisyys, Turvallisuus.
          Vastaa vain kategorian nimellä.`,
        prompt: bill.title,
      });
      category = text.trim();
      // Update bill category in DB for future
      await supabase.from('bills').update({ category }).eq('id', billId);
    } catch (e) {
      console.warn("AI categorization failed, using default axis");
    }
  }

  // Map category to DNA axis
  const catToAxis: Record<string, string> = {
    'Talous': 'economic_score',
    'Arvot': 'liberal_conservative_score',
    'Ympäristö': 'environmental_score',
    'Aluepolitiikka': 'urban_rural_score',
    'Kansainvälisyys': 'international_national_score',
    'Turvallisuus': 'security_score'
  };

  const axis = catToAxis[category || ''] || 'economic_score';

  // 2. Get All Active MPs and their DNA
  const { data: mps } = await supabase
    .from('mps')
    .select(`
      id, first_name, last_name, party,
      mp_profiles (*)
    `)
    .eq('is_active', true);

  if (!mps) return { jaa: 0, ei: 0, abstain: 0, weather: 'cloudy', potentialRebels: [], summary: "Ei dataa saatavilla." };

  // 3. Get Party Rice Indices (Cohesion)
  // For demo, we assume high cohesion (90%) for government, slightly lower for others
  const partyCohesion: Record<string, number> = {
    'KOK': 0.95, 'PS': 0.92, 'RKP': 0.88, 'KD': 0.90, // Government
    'SDP': 0.85, 'KESK': 0.75, 'VIHR': 0.80, 'VAS': 0.82, 'LIIK': 0.70 // Opposition/Independent
  };

  let jaa = 0, ei = 0, abstain = 0;
  const rebels: any[] = [];

  mps.forEach(mp => {
    // Handle both array and object formats from Supabase
    const profile = Array.isArray(mp.mp_profiles) ? mp.mp_profiles[0] : mp.mp_profiles;
    
    if (!profile) {
      abstain++;
      return;
    }

    const party = formatParty(mp.party);
    const score = (profile as any)[axis] || 0;
    const cohesion = partyCohesion[party] || 0.8;

    // Simulation logic:
    // DNA score > 0 means tends to JAA (depending on axis definition)
    // For now, let's assume axis > 0 means the proposal's intent (e.g. if it's a right-wing bill and MP is right-wing)
    // We'll use a simplified model: score > 0.2 -> tend JAA, score < -0.2 -> tend EI, middle -> abstain
    
    let probJaa = 0.5 + (score * 0.4); // Base probability from DNA
    
    // Adjust by party line (assuming majority of party votes one way)
    // This is a simplification: in reality we'd check party's official stance
    const partyLine = party === 'KOK' || party === 'PS' ? 1 : -1; // Mock: Gov bills pass
    const correctedProb = (probJaa * (1 - cohesion)) + (partyLine === 1 ? cohesion : 0);

    if (correctedProb > 0.55) jaa++;
    else if (correctedProb < 0.45) ei++;
    else abstain++;

    // Rebel Detection: DNA is opposite to Party Line
    const isOppositeToParty = (score > 0.3 && partyLine === -1) || (score < -0.3 && partyLine === 1);
    if (isOppositeToParty && cohesion < 0.9) {
      rebels.push({
        mpId: mp.id,
        name: `${mp.first_name} ${mp.last_name}`,
        party: party,
        probability: Math.round(Math.abs(score) * 80)
      });
    }
  });

  // 4. Final Analysis
  const total = jaa + ei;
  const diff = Math.abs(jaa - ei);
  let weather: 'sunny' | 'stormy' | 'cloudy' = 'cloudy';
  let summary = "";

  if (jaa > ei && diff > 20) {
    weather = 'sunny';
    summary = "Hallitusrintama näyttää sääennusteen mukaan kestävän. Esitys on menossa läpi selvin lukemin.";
  } else if (diff < 10) {
    weather = 'stormy';
    summary = "Myrskyvaroitus! Äänestyksestä on tulossa erittäin tiukka. Muutama kapinaääni voi kääntää tuloksen.";
  } else {
    weather = 'cloudy';
    summary = "Epävakaata korkeapainetta. Esitys hyväksyttäneen, mutta soraääniä kuuluu useasta leiristä.";
  }

  const result = {
    jaa, ei, abstain,
    weather,
    potentialRebels: rebels.sort((a, b) => b.probability - a.probability).slice(0, 5),
    summary
  };

  // 5. Cache result in DB
  await supabase.from('bill_forecasts').upsert({
    bill_id: billId,
    predicted_jaa: jaa,
    predicted_ei: ei,
    predicted_abstain: abstain,
    weather_type: weather,
    rebel_ids: rebels.slice(0, 5),
    analysis_summary: summary
  });

  return result;
}

