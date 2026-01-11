-- 1. Kunnallisvaltuutettujen profiilit ja DNA-sormenjäljet
CREATE TABLE IF NOT EXISTS public.municipal_councilor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    municipality TEXT NOT NULL,
    party TEXT,
    dna_fingerprint JSONB DEFAULT '{
        "economy": 0,
        "values": 0,
        "environment": 0,
        "regional": 0,
        "international": 0,
        "security": 0
    }',
    raw_promises JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(full_name, municipality)
);

-- 2. Valtuuston äänestykset (Kuka äänesti ja mitä)
CREATE TABLE IF NOT EXISTS public.municipal_councilor_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    councilor_id UUID REFERENCES municipal_councilor_profiles(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES municipal_decisions(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL, -- JAA, EI, TYHJÄ, POISSA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(councilor_id, decision_id)
);

-- Indeksit nopeaan hakuun
CREATE INDEX IF NOT EXISTS idx_councilor_name_muni ON public.municipal_councilor_profiles(full_name, municipality);
CREATE INDEX IF NOT EXISTS idx_councilor_votes_decision ON public.municipal_councilor_votes(decision_id);

