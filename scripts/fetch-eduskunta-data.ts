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
const TERM_START_DATE = '2023-04-01'; // Nykyinen vaalikausi alkoi huhtikuussa 2023

const log = (msg: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${msg}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function cleanupOldData() {
  log('--- TYHJENNETÄÄN VANHA DATA JA ALUSTETAAN VAALIKAUSI 2023-2027 ---');
  
  // Tyhjennetään kaikki taulut jotta saamme puhtaan alun
  await supabase.from('mp_profiles').delete().neq('parliament_id', 0);
  await supabase.from('mp_votes').delete().neq('mp_id', 0);
  await supabase.from('voting_events').delete().neq('id', '0');
  await supabase.from('mps').delete().neq('id', 0);
  
  log('Tietokanta tyhjennetty.');
}

async function fetchAndSaveMPs() {
  log('--- Haetaan kansanedustajat ---');
  let page = 0;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${API_BASE}/MemberOfParliament/rows`;
      const response = await axios.get(url, { params: { perPage, page } });
      
      const columnNames = response.data.columnNames || [];
      const rowData = response.data.rowData;
      
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
          is_active: false // Merkitään aktiiviseksi vain jos löytyy ääniä tältä kaudelta
        };
      }).filter((mp: any) => !isNaN(mp.id));

      const { error } = await supabase.from('mps').upsert(formattedMps);
      if (error) throw error;
      
      log(`Haettu ${formattedMps.length} kansanedustajaa profiilikirjastoon.`);
      page++;
      
      if (page >= 30) hasMore = false; 
    } catch (err: any) {
      log('VIRHE MP-haussa:', err.message);
      hasMore = false;
    }
  }
}

async function fetchAndSaveVotingEvents(limit = 100) {
  log(`--- Haetaan äänestystapahtumat (Alkaen ${TERM_START_DATE}) ---`);
  
  let page = 360; 
  let hasMore = true;
  let foundNewData = false;

  while (hasMore) {
    try {
      const url = `${API_BASE}/SaliDBAanestys/rows`;
      const response = await axios.get(url, { params: { perPage: limit, page } });

      const columnNames = response.data.columnNames || [];
      const rows = response.data.rowData;
      
      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      const events = rows.map((row: any) => {
        const getVal = (col: string) => row[columnNames.indexOf(col)];
        const date = getVal('IstuntoPvm');
        
        if (!date || date < TERM_START_DATE) return null;

        const heRaw = getVal('AanestysValtiopaivaasia') || '';
        const heMatch = heRaw.match(/HE\s+\d+\/\d+/i);
        const heId = heMatch ? heMatch[0] : null;

        return {
          id: getVal('AanestysId')?.toString(),
          title_fi: getVal('KohtaOtsikko') || getVal('AanestysOtsikko') || 'Ei otsikkoa',
          voting_date: date,
          he_id: heId,
          ayes: parseInt(getVal('AanestysTulosJaa')) || 0,
          noes: parseInt(getVal('AanestysTulosEi')) || 0,
          blanks: parseInt(getVal('AanestysTulosTyhjia')) || 0,
          absent: parseInt(getVal('AanestysTulosPoissa')) || 0
        };
      }).filter((e: any) => e !== null && e.id);

      if (events.length > 0) {
        foundNewData = true;
        const { error } = await supabase.from('voting_events').upsert(events);
        if (error) throw error;
        log(`Sivu ${page}: Tallennettu ${events.length} äänestystä.`);
      }
      
      page++;
      if (page >= 450) hasMore = false; 
    } catch (err: any) {
      log('VIRHE äänestysten haussa:', err.message);
      hasMore = false;
    }
  }
}

async function fetchAndSaveMPVotes(limit = 100) {
  log('--- Haetaan yksittäiset äänet (Nykyinen vaalikausi) ---');
  
  const { data: existingEvents } = await supabase.from('voting_events').select('id');
  const eventIdSet = new Set(existingEvents?.map(e => e.id));
  
  if (eventIdSet.size === 0) {
    log('Ei äänestystapahtumia, ohitetaan yksittäiset äänet.');
    return;
  }

  // Nykyinen vaalikausi 2023- alkaa karkeasti sivulta 74000
  // Haetaan useammalta sivulta varmuuden vuoksi
  let page = 74000; 
  let hasMore = true;
  let matchesFound = 0;
  let emptyStrike = 0;
  const maxPages = 100000; 

  log(`Aloitetaan haku sivulta ${page}. Kohde-äänestyksiä tiedossa: ${eventIdSet.size}`);

  while (hasMore && page < maxPages) {
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
        const eventId = getVal('AanestysId')?.toString();
        
        if (!eventIdSet.has(eventId)) return null;

        const voteVal = getVal('EdustajaAanestys')?.trim().toLowerCase();
        return {
          mp_id: parseInt(getVal('EdustajaHenkiloNumero')),
          event_id: eventId,
          vote_type: voteVal === 'jaa' ? 'jaa' : 
                     voteVal === 'ei' ? 'ei' : 
                     voteVal === 'tyhjää' ? 'tyhjaa' : 'poissa'
        };
      }).filter((v: any) => v !== null && !isNaN(v.mp_id));

      if (votes.length > 0) {
        matchesFound += votes.length;
        emptyStrike = 0;
        const { error } = await supabase.from('mp_votes').upsert(votes, { onConflict: 'mp_id,event_id' });
        if (!error) {
          if (page % 10 === 0) log(`Sivu ${page}: Tallennettu yhteensä ${matchesFound} osumaa.`);
        }
      } else {
        emptyStrike++;
        // Sallitaan enemmän tyhjiä sivuja alussa, koska äänet eivät ole täydellisessä järjestyksessä
        if (matchesFound > 0 && emptyStrike > 100) {
          log(`Lopetetaan: 100 tyhjää sivua putkeen kohdedatalla.`);
          hasMore = false;
        }
      }
      
      page++;
    } catch (err: any) {
      log('VIRHE äänien haussa:', err.message);
      hasMore = false;
    }
  }
}

async function markActiveMPs() {
  log('--- Merkitään nykyiset kansanedustajat aktiivisiksi ---');
  
  const { data: activeMpIds, error } = await supabase
    .from('mp_votes')
    .select('mp_id');
    
  if (error) {
    log('VIRHE aktiivisten MP-tunnusten haussa:', error.message);
    return;
  }

  const uniqueIds = Array.from(new Set(activeMpIds.map(v => v.mp_id)));
  log(`Löytyi ${uniqueIds.length} aktiivista kansanedustajaa tältä vaalikaudelta.`);

  if (uniqueIds.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      await supabase.from('mps').update({ is_active: true }).in('id', batch);
    }
  }
}

async function main() {
  log('🚀 Aloitetaan Eduskunnan äänidatan päivitys...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('VIRHE: Supabase-asetukset puuttuvat!');
    process.exit(1);
  }

  // Jätetään MP:t ja tapahtumat rauhaan, haetaan vain puuttuvat äänet
  await fetchAndSaveMPVotes(200); // Suurempi limit nopeuttaa
  await markActiveMPs();
  
  log('🏁 Äänidata päivitetty.');
}

main();
