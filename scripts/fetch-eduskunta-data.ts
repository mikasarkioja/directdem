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

async function fetchAndSaveMPs() {
  console.log('--- Haetaan kansanedustajat ---');
  try {
    const response = await axios.get(`${API_BASE}/Kansanedustaja/rows`);
    const mps = response.data.rowData.map((row: any) => ({
      id: row[0], // personId is typically the first column
      first_name: row[1], // firstNames
      last_name: row[2], // surname
      party: row[4], // party
      constituency: row[5], // constituency
      image_url: `https://www.eduskunta.fi/FI/kansanedustajat/Images/${row[0]}.jpg`,
      is_active: row[10] === 'true' // currentMp
    }));

    // For Eduskunta table API, rowData is often an array of arrays. 
    // If it's objects, we use keys. Let's adjust to be robust.
    const columnNames = response.data.columnNames || [];
    const formattedMps = response.data.rowData.map((row: any) => {
      const getVal = (col: string) => row[columnNames.indexOf(col)];
      return {
        id: parseInt(getVal('personId')),
        first_name: getVal('firstNames'),
        last_name: getVal('surname'),
        party: getVal('party'),
        constituency: getVal('constituency'),
        image_url: `https://www.eduskunta.fi/FI/kansanedustajat/Images/${getVal('personId')}.jpg`,
        is_active: getVal('currentMp') === 'true'
      };
    });

    const { error } = await supabase.from('mps').upsert(formattedMps);
    if (error) throw error;
    console.log(`Tallennettu ${formattedMps.length} kansanedustajaa.`);
  } catch (err) {
    console.error('Virhe MP-haussa:', err);
  }
}

async function fetchAndSaveVotingEvents(limit = 100) {
  console.log('--- Haetaan äänestystapahtumat ---');
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(`${API_BASE}/Aanestys/rows`, {
        params: {
          '$top': limit,
          '$skip': skip,
          '$orderby': 'AanestysPvm desc'
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
        return {
          id: getVal('aanestysId').toString(),
          title_fi: getVal('kohtaOtsikko') || 'Ei otsikkoa',
          voting_date: getVal('aanestysPvm'),
          he_id: getVal('heTunnus'),
          ayes: parseInt(getVal('jaa')) || 0,
          noes: parseInt(getVal('ei')) || 0,
          blanks: parseInt(getVal('tyhjaa')) || 0,
          absent: parseInt(getVal('poissa')) || 0
        };
      });

      const { error } = await supabase.from('voting_events').upsert(events);
      if (error) throw error;

      console.log(`Tallennettu ${events.length} äänestystä (yhteensä haettu: ${skip + events.length})...`);
      skip += limit;
      
      if (skip >= 500) hasMore = false;
    } catch (err) {
      console.error('Virhe äänestysten haussa:', err);
      hasMore = false;
    }
  }
}

async function fetchAndSaveMPVotes(limit = 1000) {
  console.log('--- Haetaan yksittäiset äänet (tämä voi kestää) ---');
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(`${API_BASE}/EduskuntaAanestys/rows`, {
        params: {
          '$top': limit,
          '$skip': skip
        }
      });

      const columnNames = response.data.columnNames || [];
      const rows = response.data.rowData;
      
      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      const votes = rows.map((row: any) => {
        const getVal = (col: string) => row[columnNames.indexOf(col)];
        const voteVal = getVal('aanestysArvo');
        return {
          mp_id: parseInt(getVal('personId')),
          event_id: getVal('aanestysId').toString(),
          vote_type: voteVal === 'jaa' ? 'jaa' : 
                     voteVal === 'ei' ? 'ei' : 
                     voteVal === 'tyhjaa' ? 'tyhjaa' : 'poissa'
        };
      });

      const { error } = await supabase.from('mp_votes').upsert(votes);
      if (error) {
        console.warn('Huom: Kaikkia ääniä ei voitu tallentaa (ehkä puuttuva MP/Event ID).');
      }

      console.log(`Tallennettu ${votes.length} ääntä (yhteensä haettu: ${skip + votes.length})...`);
      skip += limit;

      if (skip >= 10000) hasMore = false;
    } catch (err) {
      console.error('Virhe yksittäisten äänien haussa:', err);
      hasMore = false;
    }
  }
}

async function main() {
  await fetchAndSaveMPs();
  await fetchAndSaveVotingEvents();
  await fetchAndSaveMPVotes();
  console.log('--- Haku valmis! ---');
}

main();
