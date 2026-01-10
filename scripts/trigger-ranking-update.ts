import { createClient } from '@supabase/supabase-js';
import { calculateAndStorePartyRankings } from '../lib/analysis/party-ranker';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Starting ranking update...");
  await calculateAndStorePartyRankings(supabase);
  console.log("Ranking update finished.");
}

main().catch(console.error);

