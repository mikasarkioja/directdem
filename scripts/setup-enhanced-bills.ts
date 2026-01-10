import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sql = `
-- Drop if exists for clean start during development
-- DROP TABLE IF EXISTS public.bill_enhanced_profiles;

CREATE TABLE IF NOT EXISTS public.bill_enhanced_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id TEXT UNIQUE NOT NULL, -- e.g., "HE 123/2024"
    
    -- 1. Structural Identity
    title TEXT NOT NULL,
    category TEXT, -- e.g., Budget, Social, Defense
    complexity_score INT DEFAULT 5, -- 1-10 (How hard is this to explain?)
    
    -- 2. Ideological Vector (The "DNA Impact")
    -- Stores 0.0 to 1.0 impact on your 6 axes: [Economy, Values, Environment, Regional, Int, Security]
    dna_impact_vector JSONB, 
    
    -- 3. AI Analysis Guts
    analysis_data JSONB DEFAULT '{
        "simple_summary": "",
        "hotspots": [],
        "winners": [],
        "losers": [],
        "ideological_tradeoffs": ""
    }',
    
    -- 4. Forecasting & Conflict Data
    forecast_metrics JSONB DEFAULT '{
        "friction_index": 0,
        "party_alignment_prediction": {},
        "voter_sensitivity": "Low",
        "precedent_bill_id": ""
    }',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bill_enhanced_profiles_bill_id ON public.bill_enhanced_profiles(bill_id);
`;

async function setup() {
  console.log("Setting up bill_enhanced_profiles table...");
  // Using RPC if available, or just documenting it
  // Since I can't easily run arbitrary SQL via the standard client without an RPC, 
  // I will check if the 'execute_sql' RPC exists or just tell the user.
  
  // Try to use a common workaround if the user has enabled it, otherwise this will fail gracefully.
  const { error } = await supabase.rpc('execute_sql', { sql });
  
  if (error) {
    console.error("Error creating table via RPC:", error.message);
    console.log("Please run the SQL manually in the Supabase Dashboard SQL Editor:");
    console.log(sql);
  } else {
    console.log("Table created successfully!");
  }
}

setup();

