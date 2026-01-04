// scripts/analyze-mp-dna.ts - Build trigger
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

  for (const event of events) {
    console.log(`Analysoidaan: ${event.title_fi}`);
    
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini') as any,
        system: `Olet poliittinen analyytikko. Tehtäväsi on luokitella Suomen eduskunnan äänestysotsikko kolmeen kategoriaan: 
          1. Talous (weight: -1=Vasen, 1=Oikeisto)
          2. Arvot (weight: -1=Liberaali, 1=Konservatiivi)
          3. Ympäristö (weight: -1=Hyödyntäminen, 1=Suojelu)
          
          Määritä 'weight' (painotus) välillä -1.0 ... 1.0. 
          Esimerkki: "Yhteisöveron alennus" -> category: "Talous", weight: 1.0
          Esimerkki: "Säästöt koulutukseen" -> category: "Talous", weight: 0.8
          Esimerkki: "Luonnonsuojelulain tiukennus" -> category: "Ympäristö", weight: 1.0
          
          Palauta VAIN JSON-muodossa: {"category": "Talous|Arvot|Ympäristö|Muu", "weight": -1...1}`,
        prompt: event.title_fi,
      });

      const analysis = JSON.parse(text || '{}');

      const { error: updateError } = await supabase
        .from('voting_events')
        .update({ 
          category: analysis.category,
          summary_ai: `AI-painotus: ${analysis.weight}` 
        })
        .eq('id', event.id);

      if (updateError) {
        console.error(`Virhe päivitettäessä äänestystä ${event.id}:`, updateError.message);
      } else {
        console.log(`✅ Luokiteltu: ${analysis.category} (${analysis.weight})`);
      }
    } catch (err: any) {
      console.error(`Virhe analysoitaessa äänestystä ${event.id}:`, err.message);
    }
  }
}

async function calculateMPProfiles() {
  console.log('--- Lasketaan kansanedustajien DNA-pisteet ---');
  
  const { data: mps, error: mpsError } = await supabase.from('mps').select('id, first_name, last_name, party');
  if (mpsError || !mps) {
    console.error('Virhe haettaessa kansanedustajia:', mpsError?.message);
    return;
  }

  console.log(`Lasketaan raakapisteet ${mps.length} edustajalle...`);
  const rawProfiles: any[] = [];

  for (const mp of mps) {
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

    if (votesError || !votes || votes.length === 0) continue;

    let economic = 0, liberal = 0, env = 0;
    let counts = { economic: 0, liberal: 0, env: 0 };

    votes.forEach((v: any) => {
      if (!v.voting_events.summary_ai || !v.voting_events.category) return;
      
      const parts = v.voting_events.summary_ai.split(': ');
      if (parts.length < 2) return;
      
      const aiWeight = parseFloat(parts[1]);
      const jaa = v.voting_events.ayes || 0;
      const ei = v.voting_events.noes || 0;
      const total = jaa + ei;
      
      if (total === 0) return;

      // Controversy score: higher when vote is closer to 50/50
      const controversy = 1 - Math.abs(jaa - ei) / total;
      
      // Filter out low controversy (consensus) votes
      if (controversy < 0.15) return;

      const voteVal = v.vote_type === 'jaa' ? 1 : v.vote_type === 'ei' ? -1 : 0;
      const score = voteVal * aiWeight * Math.pow(controversy, 2); // Squared controversy for more impact

      if (v.voting_events.category === 'Talous') {
        economic += score; counts.economic++;
      } else if (v.voting_events.category === 'Arvot') {
        liberal += score; counts.liberal++;
      } else if (v.voting_events.category === 'Ympäristö') {
        env += score; counts.env++;
      }
    });

    rawProfiles.push({
      mp_id: mp.id,
      full_name: `${mp.first_name} ${mp.last_name}`,
      party: mp.party,
      scores: {
        economic: counts.economic ? economic / counts.economic : 0,
        liberal: counts.liberal ? liberal / counts.liberal : 0,
        env: counts.env ? env / counts.env : 0
      },
      vote_count: votes.length
    });
  }

  // --- AXIS STRETCHING ---
  console.log('Venytetään akselit maksimikontrastin saavuttamiseksi...');
  
  const findMinMax = (key: string) => {
    const vals = rawProfiles.map(p => p.scores[key]);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  const econBounds = findMinMax('economic');
  const libBounds = findMinMax('liberal');
  const envBounds = findMinMax('env');

  const stretch = (val: number, bounds: { min: number, max: number }) => {
    if (bounds.max === bounds.min) return 0;
    // Map current range [min, max] to [-1, 1]
    return ((val - bounds.min) / (bounds.max - bounds.min)) * 2 - 1;
  };

  for (const p of rawProfiles) {
    const stretchedEcon = stretch(p.scores.economic, econBounds);
    const stretchedLib = stretch(p.scores.liberal, libBounds);
    const stretchedEnv = stretch(p.scores.env, envBounds);

    const { error: upsertError } = await supabase.from('mp_profiles').upsert({
      mp_id: p.mp_id,
      economic_score: stretchedEcon,
      liberal_conservative_score: stretchedLib,
      environmental_score: stretchedEnv,
      total_votes_analyzed: p.vote_count,
      last_updated: new Date().toISOString()
    }, { onConflict: 'mp_id' });

    if (upsertError) console.error(`Virhe MP ${p.mp_id}:`, upsertError.message);
  }

  console.log('DNA-pisteet päivitetty kontrastivahvistuksella.');
}

async function main() {
  try {
    await categorizeVotes();
    await calculateMPProfiles();
    console.log('--- Prosessi valmis! ---');
  } catch (err: any) {
    console.error('KRIITTINEN VIRHE:', err.message);
  }
}

main();
