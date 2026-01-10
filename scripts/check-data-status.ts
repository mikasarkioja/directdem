// scripts/check-data-status.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log("Checking data status...");
  
  const { count: categorizedCount } = await supabase
    .from('voting_events')
    .select('*', { count: 'exact', head: true })
    .not('category', 'is', null);
    
  const { count: totalEvents } = await supabase
    .from('voting_events')
    .select('*', { count: 'exact', head: true });

  const { data: rankings } = await supabase
    .from('party_rankings')
    .select('party_name, topic_ownership')
    .limit(5);

  console.log(`Categorized events: ${categorizedCount} / ${totalEvents}`);
  console.log("Sample rankings topic ownership:");
  console.log(JSON.stringify(rankings, null, 2));
}

check();

