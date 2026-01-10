const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function profileInitialBills() {
  console.log("Profiling initial bills for Arena...");
  
  // Need to import the profiler function. Since it's a TS file, I'll use ts-node or similar.
  // For now, let's just assume we'll run it via a manual script if needed.
  // But wait, I can just write a quick script that calls OpenAI directly here.
  
  const { data: bills } = await supabase
    .from('bills')
    .select('id, title, summary')
    .limit(3);

  if (!bills) return;

  console.log(`Found ${bills.length} bills to profile.`);
  // In a real scenario, we'd loop and profile.
}

profileInitialBills();

