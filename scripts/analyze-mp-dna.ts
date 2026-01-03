// scripts/analyze-mp-dna.ts
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
        model: openai('gpt-4o-mini'),
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
  
  const { data: mps, error: mpsError } = await supabase.from('mps').select('id');
  if (mpsError || !mps) {
    console.error('Virhe haettaessa kansanedustajia:', mpsError?.message);
    return;
  }

  console.log(`Lasketaan profiilit ${mps.length} edustajalle...`);

  for (const mp of mps) {
    const { data: votes, error: votesError } = await supabase
      .from('mp_votes')
      .select(`
        vote_type,
        voting_events!inner (
          category,
          summary_ai
        )
      `)
      .eq('mp_id', mp.id);

    if (votesError) {
      console.error(`Virhe haettaessa ääniä edustajalle ${mp.id}:`, votesError.message);
      continue;
    }

    if (!votes || votes.length === 0) continue;

    let economic = 0, liberal = 0, env = 0;
    let counts = { economic: 0, liberal: 0, env: 0 };

    votes.forEach((v: any) => {
      if (!v.voting_events.summary_ai || !v.voting_events.category) return;
      
      const parts = v.voting_events.summary_ai.split(': ');
      if (parts.length < 2) return;
      
      const weight = parseFloat(parts[1]);
      if (isNaN(weight)) return;

      const voteVal = v.vote_type === 'jaa' ? 1 : v.vote_type === 'ei' ? -1 : 0;
      const score = voteVal * weight;

      if (v.voting_events.category === 'Talous') {
        economic += score;
        counts.economic++;
      } else if (v.voting_events.category === 'Arvot') {
        liberal += score;
        counts.liberal++;
      } else if (v.voting_events.category === 'Ympäristö') {
        env += score;
        counts.env++;
      }
    });

    const { error: upsertError } = await supabase.from('mp_profiles').upsert({
      mp_id: mp.id,
      economic_score: counts.economic ? economic / counts.economic : 0,
      liberal_conservative_score: counts.liberal ? liberal / counts.liberal : 0,
      environmental_score: counts.env ? env / counts.env : 0,
      total_votes_analyzed: votes.length,
      last_updated: new Date().toISOString()
    }, { onConflict: 'mp_id' });

    if (upsertError) {
      console.error(`Virhe päivitettäessä profiilia edustajalle ${mp.id}:`, upsertError.message);
    }
  }
  console.log('DNA-pisteet päivitetty kaikille edustajille.');
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
