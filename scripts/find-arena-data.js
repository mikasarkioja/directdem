const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findHjallis() {
  const { data: hjallis } = await supabase
    .from('mps')
    .select('id, first_name, last_name')
    .ilike('last_name', 'Harkimo')
    .single();
  
  const { data: bills } = await supabase
    .from('bill_ai_profiles')
    .select('bill_id, bills(title)')
    .limit(5);

  const { data: mps } = await supabase
    .from('mps')
    .select('id, first_name, last_name, party')
    .eq('is_active', true)
    .limit(10);

  console.log("Hjallis ID:", hjallis?.id);
  console.log("Available Bills:", JSON.stringify(bills, null, 2));
  console.log("Sample MPs:", JSON.stringify(mps, null, 2));
}

findHjallis();

