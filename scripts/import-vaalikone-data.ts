// scripts/import-vaalikone-data.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Lataa ympäristömuuttujat
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Yle 2023 Vaalikone mapping.
 * Painotus: -1.0 ... 1.0
 * Talous: -1=Vasen, 1=Oikeisto
 * Arvot: -1=Liberaali, 1=Konservatiivi
 * Ympäristö: -1=Hyödyntäminen, 1=Suojelu
 * Alue: -1=Urbaani, 1=Maaseutu
 * Kansainvälisyys: -1=Kansallinen, 1=Globalisti
 * Turvallisuus: -1=Pehmeä, 1=Kova
 */
const AXIS_QUESTIONS = [
  // TALOUS
  { q: "Kun valtion menoja ja tuloja tasapainotetaan, se on tehtävä mieluummin menoja vähentämällä kuin veroja korottamalla.", axis: "economic", weight: 1.0 },
  { q: "Valtion on mieluummin otettava lisää velkaa kuin vähennettävä palveluita.", axis: "economic", weight: -1.0 },
  { q: "Suomessa on liikaa sosiaalitukia", axis: "economic", weight: 1.0 },
  { q: "Palkoista pitäisi sopia ensisijaisesti työpaikoilla.", axis: "economic", weight: 0.8 },
  { q: "Ansiosidonnaisen työttömyysturvan kestoa pitää lyhentää.", axis: "economic", weight: 0.8 },
  { q: "Sosiaali- ja terveyspalvelut on tuotettava ensisijaisesti julkisina palveluina.", axis: "economic", weight: -1.0 },
  
  // ARVOT
  { q: "Suomen pitää ottaa käyttöön kolmas virallinen sukupuoli.", axis: "liberal", weight: -1.0 },
  { q: "Suomen pitää vastaanottaa nykyistä vähemmän kiintiöpakolaisia", axis: "liberal", weight: 1.0 },
  { q: "Kannabiksen käyttö pitää laillistaa.", axis: "liberal", weight: -0.8 },
  { q: "Suomeen ei pidä avata huumeiden käyttöhuoneita.", axis: "liberal", weight: 0.8 },
  
  // YMPÄRISTÖ
  { q: "Lihantuotannon tukea tulee vähentää ilmastosyistä.", axis: "env", weight: 1.0 },
  { q: "Metsähakkuita pitää rajoittaa", axis: "env", weight: 1.0 },
  { q: "Valtion pitää ympäristösyistä ohjata ihmisiä kuluttamaan vähemmän.", axis: "env", weight: 1.0 },
  { q: "Suomen pitää suojella kaikki luonnontilaiset metsät", axis: "env", weight: 1.0 },
  { q: "Suomen pitää olla edelläkävijä ilmastonmuutoksen hidastamisessa", axis: "env", weight: 1.0 },
  { q: "Yksityisomistuksessa olevien maiden luonnonsuojelun pitää perustua vapaaehtoisuuteen.", axis: "env", weight: -1.0 },

  // ALUEPOLITIIKKA
  { q: "On hyväksyttävää, että julkisia palveluja on vähemmän syrjäseuduilla.", axis: "urban", weight: -1.0 },
  { q: "Koko Suomi on pidettävä asuttuna", axis: "urban", weight: 1.0 },

  // KANSAINVÄLISYYS
  { q: "Päätösvaltaa pitäisi siirtää EU:lta jäsenvaltioille.", axis: "global", weight: -1.0 },
  { q: "Ukraina pitää hyväksyä pikimmiten EU:n jäseneksi", axis: "global", weight: 1.0 },

  // TURVALLISUUS
  { q: "Suomen on liityttävä Natoon.", axis: "security", weight: 1.0 },
  { q: "Suomeen tulisi sijoittaa pysyvä Naton tukikohta.", axis: "security", weight: 1.0 },
  { q: "Puolustusmenoja on leikattava", axis: "security", weight: -1.0 }
];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const csvPath = process.argv[2] || 'data/vaalikone-2023.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Virhe: Tiedostoa '${csvPath}' ei löydy.`);
    console.log('\nOHJE:');
    console.log('1. Lataa Ylen 2023 vaalikoneaineisto (JULKINEN versio, jossa on nimet).');
    console.log('2. Tallenna se nimellä data/vaalikone-2023.csv');
    console.log('3. Aja tämä skripti uudestaan.');
    return;
  }

  console.log(`--- Luetaan vaalikoneaineistoa: ${csvPath} ---`);
  // Käytetään latin1 (Windows-1252) jos utf-8 epäonnistuu, Ylen datat ovat usein siinä
  let content = fs.readFileSync(csvPath, 'utf-8');
  if (content.includes('')) {
    content = fs.readFileSync(csvPath, 'latin1');
  }
  
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) {
    console.error('❌ Virhe: CSV-tiedosto on tyhjä tai viallinen.');
    return;
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1);

  // Etsi sarakkeiden indeksit (Yle 2023 julkisessa versiossa on yleensä 'Etunimi' ja 'Sukunimi')
  const firstNameIdx = headers.findIndex(h => h.toLowerCase() === 'etunimi' || h.toLowerCase() === 'first name');
  const lastNameIdx = headers.findIndex(h => h.toLowerCase() === 'sukunimi' || h.toLowerCase() === 'last name');
  const partyIdx = headers.findIndex(h => h.toLowerCase() === 'puolue' || h.toLowerCase() === 'party');
  
  if (firstNameIdx === -1 || lastNameIdx === -1) {
    console.error('❌ Virhe: Nimi-sarakkeita ei löytynyt. CSV on todennäköisesti anonyymi versio.');
    console.log('Tarvitset version, jossa on ehdokkaiden nimet, jotta mäppäys onnistuu.');
    console.log('Nykyiset sarakkeet:', headers.slice(0, 5).join(', '));
    return;
  }

  // Etsi kysymysindeksit
  const questionMappings = AXIS_QUESTIONS.map(aq => {
    // Käytetään osittaista hakua koska kysymykset voivat olla pitkiä
    const idx = headers.findIndex(h => h.includes(aq.q));
    return { ...aq, idx };
  }).filter(m => m.idx !== -1);

  console.log(`Löytyi ${questionMappings.length}/${AXIS_QUESTIONS.length} seurattavaa kysymystä.`);
  if (questionMappings.length === 0) {
    console.log('Esimerkki sarakkeesta:', headers[5]);
  }

  // Hae kaikki MP:t tietokannasta mäppäystä varten
  const { data: mps } = await supabase.from('mps').select('id, first_name, last_name, party');
  if (!mps) return;

  console.log(`Yhdistetään ${rows.length} ehdokasta ${mps.length} kansanedustajaan...`);

  let matchCount = 0;
  for (const row of rows) {
    const values = parseCSVLine(row);
    const fname = values[firstNameIdx];
    const lname = values[lastNameIdx];
    
    if (!fname || !lname) continue;

    // Yritä yhdistää nimen perusteella
    const mp = mps.find(m => 
      m.last_name.toLowerCase() === lname.toLowerCase() && 
      (m.first_name.toLowerCase().includes(fname.toLowerCase()) || fname.toLowerCase().includes(m.first_name.toLowerCase()))
    );

    if (mp) {
      matchCount++;
      
      const scores = { economic: 0, liberal: 0, env: 0, urban: 0, global: 0, security: 0 };
      const counts = { economic: 0, liberal: 0, env: 0, urban: 0, global: 0, security: 0 };
      const responsesToInsert: any[] = [];

      questionMappings.forEach(m => {
        const valStr = values[m.idx];
        const val = parseInt(valStr);
        
        if (!isNaN(val) && val >= 1 && val <= 5) {
          // Store raw response
          responsesToInsert.push({
            mp_id: mp.id,
            question: m.q,
            response_value: val,
            category: m.axis === 'economic' ? 'Talous' : 
                      m.axis === 'liberal' ? 'Arvot' : 
                      m.axis === 'env' ? 'Ympäristö' : 
                      m.axis === 'urban' ? 'Aluepolitiikka' : 
                      m.axis === 'global' ? 'Kansainvälisyys' : 'Turvallisuus',
            weight: m.weight
          });

          // Normalize: 1 -> 1.0, 3 -> 0.0, 5 -> -1.0
          const normalized = (3 - val) / 2;
          const finalScore = normalized * m.weight;
          
          (scores as any)[m.axis] += finalScore;
          (counts as any)[m.axis]++;
        }
      });

      // Batch insert responses
      if (responsesToInsert.length > 0) {
        await supabase.from('mp_candidate_responses').upsert(responsesToInsert, { onConflict: 'mp_id,question' });
      }

      // Päivitä mp_profiles jos saatiin vastauksia
      if (counts.economic > 0 || counts.liberal > 0 || counts.env > 0 || 
          counts.urban > 0 || counts.global > 0 || counts.security > 0) {
        const avgScores = {
          economic: counts.economic > 0 ? scores.economic / counts.economic : 0,
          liberal: counts.liberal > 0 ? scores.liberal / counts.liberal : 0,
          env: counts.env > 0 ? scores.env / counts.env : 0,
          urban: counts.urban > 0 ? scores.urban / counts.urban : 0,
          global: counts.global > 0 ? scores.global / counts.global : 0,
          security: counts.security > 0 ? scores.security / counts.security : 0
        };

        // Hae nykyinen profiili
        const { data: currentProfile } = await supabase
          .from('mp_profiles')
          .select('*')
          .eq('mp_id', mp.id)
          .single();

        if (currentProfile) {
          const hasVotingData = currentProfile.total_votes_analyzed > 0;
          const weightVaalikone = 0.4;
          const weightVoting = 0.6;

          const blend = (oldVal: number | null, newVal: number) => {
            const currentVal = oldVal || 0;
            return hasVotingData 
              ? (currentVal * weightVoting) + (newVal * weightVaalikone)
              : newVal;
          };

          await supabase.from('mp_profiles').update({
            economic_score: blend(currentProfile.economic_score, avgScores.economic),
            liberal_conservative_score: blend(currentProfile.liberal_conservative_score, avgScores.liberal),
            environmental_score: blend(currentProfile.environmental_score, avgScores.env),
            urban_rural_score: blend(currentProfile.urban_rural_score, avgScores.urban),
            international_national_score: blend(currentProfile.international_national_score, avgScores.global),
            security_score: blend(currentProfile.security_score, avgScores.security),
            last_updated: new Date().toISOString()
          }).eq('mp_id', mp.id);
        } else {
          // Luo uusi profiili vaalikone-datan perusteella
          await supabase.from('mp_profiles').insert({
            mp_id: mp.id,
            economic_score: avgScores.economic,
            liberal_conservative_score: avgScores.liberal,
            environmental_score: avgScores.env,
            urban_rural_score: avgScores.urban,
            international_national_score: avgScores.global,
            security_score: avgScores.security,
            total_votes_analyzed: 0,
            last_updated: new Date().toISOString()
          });
        }
      }
    }
  }

  console.log(`✅ Valmis! Yhdistettiin ${matchCount} kansanedustajaa vaalikonevastauksiin.`);
}

main().catch(console.error);

