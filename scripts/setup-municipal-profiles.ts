import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "fs";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sql = `
-- 1. Kunnallisvaltuutettujen profiilit ja DNA-sormenjäljet
CREATE TABLE IF NOT EXISTS public.municipal_councilor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    municipality TEXT NOT NULL,
    party TEXT,
    dna_fingerprint JSONB,
    raw_promises JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(full_name, municipality)
);

-- 2. Valtuuston äänestykset
CREATE TABLE IF NOT EXISTS public.municipal_councilor_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    councilor_id UUID REFERENCES municipal_councilor_profiles(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES municipal_decisions(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(councilor_id, decision_id)
);

CREATE INDEX IF NOT EXISTS idx_councilor_name_muni ON public.municipal_councilor_profiles(full_name, municipality);
`;

async function run() {
  console.log("Asetetaan kunnallisvaltuutettujen tauluja...");
  const { error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.error("Virhe SQL-ajossa:", error.message);
    console.log("Ole hyvä ja aja tämä SQL manuaalisesti Supabase Dashboardilla:");
    console.log(sql);
  } else {
    console.log("Taulut luotu onnistuneesti!");
  }
}

run();

