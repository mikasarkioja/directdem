import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const API_BASE = 'https://avoindata.eduskunta.fi/api/v1/tables';

export async function POST() {
  const encoder = new TextDecoder();
  const stream = new ReadableStream({
    async start(controller) {
      const log = (msg: string) => {
        controller.enqueue(new TextEncoder().encode(`[${new Date().toLocaleTimeString()}] ${msg}\n`));
      };

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        log("🚀 Käynnistetään Admin-synkronointi...");

        // 1. MPs
        log("--- Vaihe 1: Kansanedustajat ---");
        const mpsRes = await axios.get(`${API_BASE}/Kansanedustaja/rows`);
        const colNames = mpsRes.data.columnNames || [];
        const rows = mpsRes.data.rowData || [];
        
        const mps = rows.map((row: any) => {
          const getVal = (col: string) => Array.isArray(row) ? row[colNames.indexOf(col)] : row[col];
          const personId = getVal('personId');
          return {
            id: parseInt(personId),
            first_name: getVal('firstNames'),
            last_name: getVal('surname'),
            party: getVal('party'),
            constituency: getVal('constituency'),
            image_url: `https://www.eduskunta.fi/FI/kansanedustajat/Images/${personId}.jpg`,
            is_active: getVal('currentMp') === 'true'
          };
        }).filter((m: any) => !isNaN(m.id));

        log(`Löytyi ${mps.length} edustajaa. Tallennetaan...`);
        const { error: mpErr } = await supabase.from('mps').upsert(mps);
        if (mpErr) throw new Error(`MP-virhe: ${mpErr.message}`);
        log("✅ Kansanedustajat tallennettu.");

        // 2. Voting Events (Limited for test)
        log("--- Vaihe 2: Äänestystapahtumat (100 kpl) ---");
        const vRes = await axios.get(`${API_BASE}/Aanestys/rows`, { params: { '$top': 100, '$orderby': 'AanestysPvm desc' } });
        const vCols = vRes.data.columnNames || [];
        const vRows = vRes.data.rowData || [];
        
        const events = vRows.map((row: any) => {
          const getVal = (col: string) => Array.isArray(row) ? row[vCols.indexOf(col)] : row[col];
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

        const { error: vErr } = await supabase.from('voting_events').upsert(events);
        if (vErr) throw new Error(`Äänestys-virhe: ${vErr.message}`);
        log(`✅ ${events.length} äänestystä tallennettu.`);

        log("🏁 Synkronointi valmis!");
      } catch (error: any) {
        log(`❌ KRIITTINEN VIRHE: ${error.message}`);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

