import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const API_BASE = 'https://avoindata.eduskunta.fi/api/v1/tables';

export async function POST() {
  const encoder = new TextEncoder();
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
        log("--- Vaihe 1: Kansanedustajat (MemberOfParliament) ---");
        const mpsRes = await axios.get(`${API_BASE}/MemberOfParliament/rows?perPage=500`);
        const colNames = mpsRes.data.columnNames || [];
        const rows = mpsRes.data.rowData || [];
        
        const mps = rows.map((row: any) => {
          const getVal = (col: string) => row[colNames.indexOf(col)];
          const personId = getVal('personId');
          return {
            id: parseInt(personId),
            first_name: getVal('firstname')?.trim(),
            last_name: getVal('lastname')?.trim(),
            party: getVal('party')?.trim() || 'Tuntematon',
            constituency: '',
            image_url: `https://www.eduskunta.fi/FI/kansanedustajat/Images/${personId}.jpg`,
            is_active: true
          };
        }).filter((m: any) => !isNaN(m.id));

        log(`Löytyi ${mps.length} edustajaa. Tallennetaan...`);
        const { error: mpErr } = await supabase.from('mps').upsert(mps);
        if (mpErr) throw new Error(`MP-virhe: ${mpErr.message}`);
        log("✅ Kansanedustajat tallennettu.");

        // 2. Voting Events
        log("--- Vaihe 2: Äänestystapahtumat (SaliDBAanestys) ---");
        const vRes = await axios.get(`${API_BASE}/SaliDBAanestys/rows?perPage=50`);
        const vCols = vRes.data.columnNames || [];
        const vRows = vRes.data.rowData || [];
        
        const events = vRows.map((row: any) => {
          const getVal = (col: string) => row[vCols.indexOf(col)];
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

        const { error: vErr } = await supabase.from('voting_events').upsert(events);
        if (vErr) throw new Error(`Äänestys-virhe: ${vErr.message}`);
        log(`✅ ${events.length} äänestystä tallennettu.`);

        // 3. MP Votes (Batch 1 for demo)
        log("--- Vaihe 3: Yksittäiset äänet (SaliDBAanestysEdustaja) ---");
        const votesRes = await axios.get(`${API_BASE}/SaliDBAanestysEdustaja/rows?perPage=200`);
        const vCols2 = votesRes.data.columnNames || [];
        const vRows2 = votesRes.data.rowData || [];

        const votes = vRows2.map((row: any) => {
          const getVal = (col: string) => row[vCols2.indexOf(col)];
          const voteVal = getVal('EdustajaAanestys')?.trim().toLowerCase();
          return {
            mp_id: parseInt(getVal('EdustajaHenkiloNumero')),
            event_id: getVal('AanestysId')?.toString(),
            vote_type: voteVal === 'jaa' ? 'jaa' : 
                       voteVal === 'ei' ? 'ei' : 
                       voteVal === 'tyhjää' ? 'tyhjaa' : 'poissa'
          };
        }).filter((v: any) => !isNaN(v.mp_id) && v.event_id);

        log(`Löytyi ${votes.length} ääntä. Tallennetaan...`);
        const { error: voteErr } = await supabase.from('mp_votes').upsert(votes, { onConflict: 'mp_id,event_id' });
        if (voteErr) log(`VAROITUS äänitallennuksessa: ${voteErr.message}`);
        else log(`✅ ${votes.length} ääntä tallennettu.`);

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
