// scripts/analyze-mp-dna.ts - Build trigger
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { checkVoteIntegrity } from '../lib/analysis/promise-monitor';
import { predictVoteOutcome } from '../lib/analysis/weather-engine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function categorizeVotes() {
  console.log('--- Luokitellaan äänestykset AI:n avulla ---');
  
  const { data: events, error } = await supabase
    .from('voting_events')
    .select('id, title_fi')
    .is('category', null);

  if (error) {
    console.error('Virhe haettaessa äänestyksiä:', error.message);
    return;
  }
  
  if (!events || events.length === 0) {
    console.log('Ei uusia luokiteltavia äänestyksiä.');
    return;
  }

  console.log(`Löytyi ${events.length} luokiteltavaa äänestystä.`);

  let count = 0;
  for (const event of events) {
    count++;
    if (count % 50 === 0) {
      console.log(`Prosessoidaan: ${count}/${events.length}...`);
      // Välitallennus: lasketaan profiilit säännöllisesti jotta sivu päivittyy
      if (count % 200 === 0) {
        console.log('--- Välipäivitys: Päivitetään MP-profiilit... ---');
        await calculateMPProfiles();
      }
    }
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini') as any,
        system: `Olet poliittinen analyytikko. Tehtäväsi on luokitella Suomen eduskunnan äänestysotsikko kuuteen kategoriaan: 
          1. Talous (weight: -1=Vasen/Julkinen, 1=Oikeisto/Yksityinen)
          2. Arvot (weight: -1=Liberaali/Uudistava, 1=Konservatiivi/Säilyttävä)
          3. Ympäristö (weight: -1=Talous edellä/Hyödyntäminen, 1=Luonto edellä/Suojelu)
          4. Aluepolitiikka (weight: -1=Keskittävä/Urbaani, 1=Hajauttava/Maaseutu)
          5. Kansainvälisyys (weight: -1=Kansallinen etu, 1=Kansainvälinen/EU)
          6. Turvallisuus (weight: -1=Pehmeä/Rauhanomainen, 1=Kova/Sotilaallinen/Nato)
          
          VINKKEJÄ:
          - Valtiovarainministeriö, Vero, Talousarvio -> Talous
          - Sosiaali- ja terveys, Koulutus, Kulttuuri, Oikeus -> Arvot
          - Ympäristö, Maa- ja metsätalous (suojelu) -> Ympäristö
          - Maa- ja metsätalous (tuet), Aluekehitys, Liikenne (tieverkko) -> Aluepolitiikka
          - EU, Ulkoministeriö, Kehitysyhteistyö, Maahanmuutto -> Kansainvälisyys
          - Puolustus, NATO, Rajavartiolaitos, Poliisi -> Turvallisuus
          
          Määritä 'weight' (painotus) välillä -1.0 ... 1.0. 
          VÄLTÄ NOLLAA (0). Jos aihe yhtään liippaa kategoriaa, anna sille vähintään 0.2 tai -0.2.
          Lähes jokainen poliittinen päätös on joko Talous, Arvot, Ympäristö, Alue, Kansainvälisyys tai Turvallisuus.
          
          Vastaa VAIN JSON-muodossa: {"category": "Talous|Arvot|Ympäristö|Aluepolitiikka|Kansainvälisyys|Turvallisuus|Muu", "weight": -1...1}`,
        prompt: event.title_fi,
      });

      const analysis = JSON.parse(text || '{}');

      await supabase
        .from('voting_events')
        .update({ 
          category: analysis.category,
          summary_ai: `AI-painotus: ${analysis.weight}` 
        })
        .eq('id', event.id);

      // Vaalilupaus-vahti: Tarkista poikkeamat
      await checkVoteIntegrity(event.id);

    } catch (err: any) {
      // Hiljainen virhe, jatketaan seuraavaan
    }
  }
  console.log('Kaikki äänestykset luokiteltu.');
}

async function calculateMPProfiles() {
  console.log('--- Lasketaan kansanedustajien DNA-pisteet ---');
  
  const { data: mps, error: mpsError } = await supabase.from('mps').select('id, first_name, last_name, party').eq('is_active', true);
  if (mpsError || !mps) {
    console.error('Virhe haettaessa kansanedustajia:', mpsError?.message);
    return;
  }

  console.log(`Lasketaan raakapisteet ${mps.length} aktiiviselle edustajalle...`);
  const rawProfiles: any[] = [];
  let processedCount = 0;

  for (const mp of mps) {
    processedCount++;
    if (processedCount % 100 === 0) console.log(`DNA-laskenta: ${processedCount}/${mps.length}...`);

    const { data: votes, error: votesError } = await supabase
      .from('mp_votes')
      .select(`
        vote_type,
        voting_events!inner (
          category,
          summary_ai,
          ayes,
          noes
        )
      `)
      .eq('mp_id', mp.id);

    if (votesError) {
      console.error(`Virhe haettaessa ääniä MP ${mp.id}:`, votesError.message);
      continue;
    }

    if (!votes || votes.length === 0) continue;

    let economic = 0, liberal = 0, env = 0, urban = 0, global = 0, security = 0;
    let counts = { economic: 0, liberal: 0, env: 0, urban: 0, global: 0, security: 0 };

    votes.forEach((v: any) => {
      if (!v.voting_events.summary_ai || !v.voting_events.category || v.voting_events.category === 'Muu') return;
      
      const parts = v.voting_events.summary_ai.split(': ');
      if (parts.length < 2) return;
      
      const aiWeight = parseFloat(parts[1]);
      const jaa = v.voting_events.ayes || 0;
      const ei = v.voting_events.noes || 0;
      const total = jaa + ei;
      
      if (total === 0) return;

      // Controversy score: higher when vote is closer to 50/50
      const controversy = 1 - Math.abs(jaa - ei) / total;
      
      // Filter out only near-unanimous votes (ignore if controversy < 0.05)
      if (controversy < 0.05) return;

      const voteVal = v.vote_type === 'jaa' ? 1 : v.vote_type === 'ei' ? -1 : 0;
      // Linear weight for controversy to avoid penalizing moderately clear votes too much
      const score = voteVal * aiWeight * (0.5 + controversy); 

      if (v.voting_events.category === 'Talous') {
        economic += score; counts.economic++;
      } else if (v.voting_events.category === 'Arvot') {
        liberal += score; counts.liberal++;
      } else if (v.voting_events.category === 'Ympäristö') {
        env += score; counts.env++;
      } else if (v.voting_events.category === 'Aluepolitiikka') {
        urban += score; counts.urban++;
      } else if (v.voting_events.category === 'Kansainvälisyys') {
        global += score; counts.global++;
      } else if (v.voting_events.category === 'Turvallisuus') {
        security += score; counts.security++;
      }
    });

    if (counts.economic === 0 && counts.liberal === 0 && counts.env === 0 && 
        counts.urban === 0 && counts.global === 0 && counts.security === 0) {
      // Ei tarpeeksi dataa profiiliin
      continue;
    }

    rawProfiles.push({
      mp_id: mp.id,
      scores: {
        economic: counts.economic ? economic / counts.economic : 0,
        liberal: counts.liberal ? liberal / counts.liberal : 0,
        env: counts.env ? env / counts.env : 0,
        urban: counts.urban ? urban / counts.urban : 0,
        global: counts.global ? global / counts.global : 0,
        security: counts.security ? security / counts.security : 0
      },
      vote_count: counts.economic + counts.liberal + counts.env + counts.urban + counts.global + counts.security
    });
  }

  console.log(`Löytyi ${rawProfiles.length} edustajaa joilla tarpeeksi dataa.`);

  // --- AXIS STRETCHING ---
  console.log('Venytetään akselit maksimikontrastin saavuttamiseksi...');
  
  const findMinMax = (key: string) => {
    const vals = rawProfiles.map(p => p.scores[key]);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  const econBounds = findMinMax('economic');
  const libBounds = findMinMax('liberal');
  const envBounds = findMinMax('env');
  const urbanBounds = findMinMax('urban');
  const globalBounds = findMinMax('global');
  const securityBounds = findMinMax('security');

  const stretch = (val: number, bounds: { min: number, max: number }) => {
    if (bounds.max === bounds.min) return 0;
    // Map current range [min, max] to [-1, 1]
    return ((val - bounds.min) / (bounds.max - bounds.min)) * 2 - 1;
  };

  const profilesToUpsert = rawProfiles.map(p => ({
    mp_id: p.mp_id,
    economic_score: stretch(p.scores.economic, econBounds),
    liberal_conservative_score: stretch(p.scores.liberal, libBounds),
    environmental_score: stretch(p.scores.env, envBounds),
    urban_rural_score: stretch(p.scores.urban, urbanBounds),
    international_national_score: stretch(p.scores.global, globalBounds),
    security_score: stretch(p.scores.security, securityBounds),
    total_votes_analyzed: p.vote_count,
    last_updated: new Date().toISOString()
  }));

  const { error: upsertError } = await supabase
    .from('mp_profiles')
    .upsert(profilesToUpsert, { onConflict: 'mp_id' });

  if (upsertError) {
    console.error(`Virhe päivitettäessä profiileja:`, upsertError.message);
  } else {
    console.log('Kaikki DNA-pisteet päivitetty kontrastivahvistuksella (Batch update).');
  }
}

async function main() {
  try {
    // Lasketaan ensin profiilit sille datalle mitä on jo luokiteltu
    await calculateMPProfiles();
    
    // Sitten jatketaan luokittelua
    await categorizeVotes();
    
    // Lopuksi vielä kerran päivitys jos uusia luokitteluja tuli
    await calculateMPProfiles();

    // Sääennusteet tuleville äänestyksille
    console.log('--- Generoidaan sääennusteet tuleville äänestyksille ---');
    const { data: bills } = await supabase.from('bills').select('id').eq('status', 'voting');
    if (bills) {
      for (const bill of bills) {
        try {
          await predictVoteOutcome(bill.id);
        } catch (e) {
          // Ignore forecast errors for now
        }
      }
    }
    
    console.log('--- Prosessi valmis! ---');
  } catch (err: any) {
    console.error('KRIITTINEN VIRHE:', err.message);
  }
}

main();
