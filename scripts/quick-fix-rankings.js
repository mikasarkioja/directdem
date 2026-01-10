// scripts/quick-fix-rankings.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  console.log("Starting quick fix for rankings...");
  
  // 1. Reset TOP 100 'Muu' events to null so they get re-categorized if we run the main script
  // But for this quick fix, let's manually assign some categories to common titles to see if UI updates
  
  console.log("Assigning categories to common patterns...");
  
  const patterns = [
    { pattern: '%Kommunikationsministeriets%', category: 'Aluepolitiikka' },
    { pattern: '%Valtiovarainministeriö%', category: 'Talous' },
    { pattern: '%oppisopimuskoulutus%', category: 'Arvot' },
    { pattern: '%ympäristönsuojelulaki%', category: 'Ympäristö' },
    { pattern: '%försvarsmakt%', category: 'Turvallisuus' },
    { pattern: '%Nato%', category: 'Turvallisuus' },
    { pattern: '%EU%', category: 'Kansainvälisyys' },
    { pattern: '%utrikes%', category: 'Kansainvälisyys' },
    { pattern: '%Social- och hälsovårdsministeriets%', category: 'Arvot' },
    { pattern: '%Sosiaali- ja terveysministeriö%', category: 'Arvot' },
    { pattern: '%Finansministeriets%', category: 'Talous' },
    { pattern: '%Jord- och skogsbruksministeriets%', category: 'Aluepolitiikka' },
    { pattern: '%Miljöministeriets%', category: 'Ympäristö' },
    { pattern: '%Försvarsministeriets%', category: 'Turvallisuus' },
    { pattern: '%Arbetspensionslag%', category: 'Arvot' },
    { pattern: '%Työeläkelaki%', category: 'Arvot' }
  ];

  for (const p of patterns) {
    const { count } = await supabase
      .from('voting_events')
      .update({ category: p.category })
      .ilike('title_fi', p.pattern)
      .select('*', { count: 'exact', head: true });
    console.log(`Updated ${count || 0} events for pattern: ${p.pattern} -> ${p.category}`);
  }

  // 2. Run the ranking calculation
  console.log("Running ranking calculation...");
  const { calculateAndStorePartyRankings } = require('../dist/lib/analysis/party-ranker');
  // We need to use the compiled version or ts-node. 
  // Easier to just run the main script with a flag if it supported it.
  
  // For now, let's just trigger the main script for a short bit
}

// Instead of the above, let's just run the main script. 
// It will now pick up the "Muu" ones because I changed the code.
fix();

