const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: rankings } = await supabase
    .from('party_rankings')
    .select('party_name, topic_ownership');

  console.log("Party | Talous | Arvot | Kansainvälisyys");
  console.log("-----------------------------------------");
  rankings.forEach(r => {
    const t = r.topic_ownership?.Talous || 0;
    const a = r.topic_ownership?.Arvot || 0;
    const k = r.topic_ownership?.Kansainvälisyys || 0;
    console.log(`${r.party_name.padEnd(8)} | ${t.toFixed(2).padEnd(6)} | ${a.toFixed(2).padEnd(6)} | ${k.toFixed(2)}`);
  });
}

check();

