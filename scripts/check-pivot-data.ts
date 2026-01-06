import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  const { count, error } = await supabase
    .from('mp_candidate_responses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error fetching count:", error);
    return;
  }

  console.log("Count of mp_candidate_responses:", count);

  const { data: samples } = await supabase
    .from('mp_candidate_responses')
    .select('*')
    .limit(5);

  console.log("Sample data:", samples);

  const { data: voteCategories } = await supabase
    .from('voting_events')
    .select('category')
    .limit(100);
  
  const categories = Array.from(new Set(voteCategories?.map(v => v.category)));
  console.log("Unique categories in voting_events:", categories);
}

checkData();

