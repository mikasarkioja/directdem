const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking detailed data status...");
  
  const { data: categories } = await supabase
    .from('voting_events')
    .select('category');

  const counts = {};
  categories.forEach(c => {
    const cat = c.category || 'null';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  console.log("Category counts:", counts);

  const { data: rankings } = await supabase
    .from('party_rankings')
    .select('party_name, topic_ownership')
    .eq('party_name', 'Kok');

  console.log("Kokoomus topic ownership details:");
  console.log(JSON.stringify(rankings[0]?.topic_ownership, null, 2));
}

check();
