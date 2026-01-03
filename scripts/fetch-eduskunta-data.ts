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

// Logger that works in terminal and potentially browser
const log = (msg: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${msg}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function fetchAndSaveMPs() {
  log('--- Haetaan kansanedustajat ---');
  try {
    const url = `${API_BASE}/Kansanedustaja/rows`;
    log(`Kutsutaan: ${url}`);
    const response = await axios.get(url);
    
    if (!response.data || !response.data.rowData) {
      log('Virhe: Rajapinta ei palauttanut rowData-kenttää');
      return;
    }

    const columnNames = response.data.columnNames || [];
    const rowData = response.data.rowData;
    log(`Löytyi ${rowData.length} riviä sarakkeilla:`, columnNames);

    const formattedMps = rowData.map((row: any, idx: number) => {
      // Helper to get value regardless of if row is array or object
      const getVal = (col: string) => {
        if (Array.isArray(row)) {
          const colIdx = columnNames.indexOf(col);
          return colIdx !== -1 ? row[colIdx] : null;
        }
        return row[col];
      };

      const personId = getVal('personId');
      if (!personId && idx === 0) log('Varoitus: personId puuttuu ensimmäiseltä riviltä', row);

      return {
        id: parseInt(personId),
        first_name: getVal('firstNames'),
        last_name: getVal('surname'),
        party: getVal('party'),
        constituency: getVal('constituency'),
        image_url: `https://www.eduskunta.fi/FI/kansanedustajat/Images/${personId}.jpg`,
        is_active: getVal('currentMp') === 'true'
      };
    }).filter((mp: any) => !isNaN(mp.id));

    log(`Muotoiltu ${formattedMps.length} kansanedustajaa. Tallennetaan Supabaseen...`);
    
    const { error } = await supabase.from('mps').upsert(formattedMps);
    if (error) {
      log('Supabase VIRHE MP-tallennuksessa:', error);
      throw error;
    }
    log(`✅ Tallennettu ${formattedMps.length} kansanedustajaa.`);
  } catch (err: any) {
    log('KRIITTINEN VIRHE MP-haussa:', err.message);
    if (err.response) log('Palvelimen vastaus:', err.response.data);
  }
}

async function fetchAndSaveVotingEvents(limit = 100) {
  log('--- Haetaan äänestystapahtumat ---');
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${API_BASE}/Aanestys/rows`;
      log(`Haetaan äänestyksiä (skip: ${skip}, limit: ${limit})...`);
      const response = await axios.get(url, {
        params: {
          '$top': limit,
          '$skip': skip,
          '$orderby': 'AanestysPvm desc'
        }
      });

      const columnNames = response.data.columnNames || [];
      const rows = response.data.rowData;
      
      if (!rows || rows.length === 0) {
        log('Ei enempää äänestyksiä.');
        hasMore = false;
        break;
      }

      const events = rows.map((row: any) => {
        const getVal = (col: string) => {
          if (Array.isArray(row)) {
            const colIdx = columnNames.indexOf(col);
            return colIdx !== -1 ? row[colIdx] : null;
          }
          return row[col];
        };

        return {
          id: getVal('aanestysId')?.toString(),
          title_fi: getVal('kohtaOtsikko') || 'Ei otsikkoa',
          voting_date: getVal('aanestysPvm'),
          he_id: getVal('heTunnus'),
          ayes: parseInt(getVal('jaa')) || 0,
          noes: parseInt(getVal('ei')) || 0,
          blanks: parseInt(getVal('tyhjaa')) || 0,
          absent: parseInt(getVal('poissa')) || 0
        };
      }).filter((e: any) => e.id);

      const { error } = await supabase.from('voting_events').upsert(events);
      if (error) {
        log('Supabase VIRHE äänestystallennuksessa:', error);
        throw error;
      }

      log(`✅ Tallennettu ${events.length} äänestystä (yhteensä: ${skip + events.length}).`);
      skip += limit;
      
      if (skip >= 500) {
        log('Rajoitus saavutettu (500). Lopetetaan.');
        hasMore = false;
      }
    } catch (err: any) {
      log('VIRHE äänestysten haussa:', err.message);
      hasMore = false;
    }
  }
}

async function fetchAndSaveMPVotes(limit = 1000) {
  log('--- Haetaan yksittäiset äänet ---');
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${API_BASE}/EduskuntaAanestys/rows`;
      log(`Haetaan ääniä (skip: ${skip}, limit: ${limit})...`);
      const response = await axios.get(url, {
        params: {
          '$top': limit,
          '$skip': skip
        }
      });

      const columnNames = response.data.columnNames || [];
      const rows = response.data.rowData;
      
      if (!rows || rows.length === 0) {
        log('Ei enempää ääniä.');
        hasMore = false;
        break;
      }

      const votes = rows.map((row: any) => {
        const getVal = (col: string) => {
          if (Array.isArray(row)) {
            const colIdx = columnNames.indexOf(col);
            return colIdx !== -1 ? row[colIdx] : null;
          }
          return row[col];
        };

        const voteVal = getVal('aanestysArvo');
        return {
          mp_id: parseInt(getVal('personId')),
          event_id: getVal('aanestysId')?.toString(),
          vote_type: voteVal === 'jaa' ? 'jaa' : 
                     voteVal === 'ei' ? 'ei' : 
                     voteVal === 'tyhjaa' ? 'tyhjaa' : 'poissa'
        };
      }).filter((v: any) => !isNaN(v.mp_id) && v.event_id);

      const { error } = await supabase.from('mp_votes').upsert(votes);
      if (error) {
        log('Supabase VAROITUS yksittäisissä äänissä:', error.message);
      } else {
        log(`✅ Tallennettu ${votes.length} ääntä (yhteensä: ${skip + votes.length}).`);
      }

      skip += limit;
      if (skip >= 10000) {
        log('Rajoitus saavutettu (10000). Lopetetaan.');
        hasMore = false;
      }
    } catch (err: any) {
      log('VIRHE yksittäisten äänien haussa:', err.message);
      hasMore = false;
    }
  }
}

async function main() {
  log('🚀 Aloitetaan Eduskunnan massadatan haku...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('VIRHE: Supabase-asetukset puuttuvat .env.local tiedostosta!');
    process.exit(1);
  }

  await fetchAndSaveMPs();
  await fetchAndSaveVotingEvents();
  await fetchAndSaveMPVotes();
  
  log('🏁 Kaikki valmista!');
}

main();
