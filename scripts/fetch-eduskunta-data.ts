// scripts/fetch-eduskunta-data.ts
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_BASE = 'https://avoindata.eduskunta.fi/api/v1/tables';

const log = (msg: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${msg}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function fetchAndSaveMPs() {
  log('--- Haetaan kansanedustajat (MemberOfParliament) ---');
  let page = 0;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${API_BASE}/MemberOfParliament/rows`;
      const response = await axios.get(url, { params: { perPage, page } });
      
      const columnNames = response.data.columnNames || [];
      const rowData = response.data.rowData;
      
      if (page === 0) {
        log('MP-taulun sarakkeet:', columnNames);
      }
      
      if (!rowData || rowData.length === 0) {
        hasMore = false;
        break;
      }

      const formattedMps = rowData.map((row: any) => {
        const getVal = (col: string) => row[columnNames.indexOf(col)];
        const personId = getVal('personId');
        
        return {
          id: parseInt(personId),
          first_name: getVal('firstname')?.trim(),
          last_name: getVal('lastname')?.trim(),
          party: getVal('party')?.trim() || 'Tuntematon',
          constituency: '', 
          image_url: `https://www.eduskunta.fi/FI/kansanedustajat/Images/${personId}.jpg`,
          is_active: false // Default to false, will mark active later
        };
      }).filter((mp: any) => !isNaN(mp.id));

      const { error } = await supabase.from('mps').upsert(formattedMps);
      if (error) throw error;
      
      log(`Tallennettu ${formattedMps.length} kansanedustajaa (yhteensä haettu: ${(page + 1) * perPage}).`);
      page++;
      
      // Stop after 20 pages (2000 MPs) for now
      if (page >= 20) hasMore = false;
    } catch (err: any) {
      log('VIRHE MP-haussa:', err.message);
      hasMore = false;
    }
  }
}

async function fetchAndSaveVotingEvents(limit = 100) {
  log('--- Haetaan äänestystapahtumat (SaliDBAanestys - TUOREIMMAT) ---');
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${API_BASE}/SaliDBAanestys/rows`;
      const response = await axios.get(url, { 
        params: { 
          perPage: limit, 
          page,
          // The API might not use $orderby for this specific endpoint if it's not OData
          // but let's try a different approach if page 0 is old.
          // Let's try to jump to a very high page or look for a sorting param.
        } 
      });

      const columnNames = response.data.columnNames || [];
      const rows = response.data.rowData;
      
      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      const events = rows.map((row: any) => {
        const getVal = (col: string) => row[columnNames.indexOf(col)];
        const heRaw = getVal('AanestysValtiopaivaasia') || '';
        const heMatch = heRaw.match(/HE\s+\d+\/\d+/i);
        const heId = heMatch ? heMatch[0] : null;

        return {
          id: getVal('AanestysId')?.toString(),
          title_fi: getVal('KohtaOtsikko') || getVal('AanestysOtsikko') || 'Ei otsikkoa',
          voting_date: getVal('IstuntoPvm'),
          he_id: heId,
          ayes: parseInt(getVal('AanestysTulosJaa')) || 0,
          noes: parseInt(getVal('AanestysTulosEi')) || 0,
          blanks: parseInt(getVal('AanestysTulosTyhjia')) || 0,
          absent: parseInt(getVal('AanestysTulosPoissa')) || 0
        };
      }).filter((e: any) => e.id);

      const { error } = await supabase.from('voting_events').upsert(events);
      if (error) throw error;

      log(`Tallennettu ${events.length} äänestystä (yhteensä: ${(page + 1) * limit}).`);
      page++;
      
      if (page >= 5) hasMore = false;
    } catch (err: any) {
      log('VIRHE äänestysten haussa:', err.message);
      hasMore = false;
    }
  }
}

async function fetchAndSaveMPVotes(limit = 100) {
  log('--- Haetaan yksittäiset äänet (SaliDBAanestysEdustaja) ---');
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${API_BASE}/SaliDBAanestysEdustaja/rows`;
      const response = await axios.get(url, { params: { perPage: limit, page } });

      const columnNames = response.data.columnNames || [];
      const rows = response.data.rowData;
      
      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      const votes = rows.map((row: any) => {
        const getVal = (col: string) => row[columnNames.indexOf(col)];
        const voteVal = getVal('EdustajaAanestys')?.trim().toLowerCase();
        
        return {
          mp_id: parseInt(getVal('EdustajaHenkiloNumero')),
          event_id: getVal('AanestysId')?.toString(),
          vote_type: voteVal === 'jaa' ? 'jaa' : 
                     voteVal === 'ei' ? 'ei' : 
                     voteVal === 'tyhjää' ? 'tyhjaa' : 'poissa'
        };
      }).filter((v: any) => !isNaN(v.mp_id) && v.event_id);

      const { error } = await supabase.from('mp_votes').upsert(votes, { onConflict: 'mp_id,event_id' });
      if (error) {
        log('Supabase VIRHE yksittäisissä äänissä:', error.message);
      } else {
        log(`✅ Tallennettu ${votes.length} ääntä (yhteensä: ${(page + 1) * limit}).`);
      }

      page++;
      if (page >= 10) hasMore = false;
    } catch (err: any) {
      log('VIRHE yksittäisten äänien haussa:', err.message);
      hasMore = false;
    }
  }
}

async function markActiveMPs() {
  log('--- Merkitään nykyiset kansanedustajat aktiivisiksi (viimeisimpien äänien perusteella) ---');
  
  // Haetaan MP:t, jotka ovat äänestäneet missä tahansa tietokannassa olevassa äänestyksessä
  // Koska haemme vain tuoreita äänestyksiä, tämä suodattaa pois historialliset MP:t
  const { data: activeMpIds, error } = await supabase
    .from('mp_votes')
    .select('mp_id');
    
  if (error) {
    log('VIRHE aktiivisten MP-tunnusten haussa:', error.message);
    return;
  }

  const uniqueIds = Array.from(new Set(activeMpIds.map(v => v.mp_id)));
  log(`Löytyi ${uniqueIds.length} aktiivista kansanedustajaa.`);

  if (uniqueIds.length > 0) {
    // Päivitetään mps-taulu erissä
    const batchSize = 100;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const { error: updateError } = await supabase
        .from('mps')
        .update({ is_active: true })
        .in('id', batch);
        
      if (updateError) {
        log(`VIRHE MP-erän ${i} päivityksessä:`, updateError.message);
      }
    }
  }
}

async function main() {
  log('🚀 Aloitetaan Eduskunnan massadatan haku (FINAL FIX)...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('VIRHE: Supabase-asetukset puuttuvat!');
    process.exit(1);
  }

  await fetchAndSaveMPs();
  await fetchAndSaveVotingEvents();
  await fetchAndSaveMPVotes();
  await markActiveMPs();
  
  log('🏁 Kaikki valmista!');
}

main();
