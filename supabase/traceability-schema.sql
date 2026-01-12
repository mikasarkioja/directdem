-- Table for expert statements related to bills
CREATE TABLE IF NOT EXISTS public.expert_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    statement_text TEXT NOT NULL,
    external_url TEXT,
    document_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for tracking lobbyist impact fingerprints
CREATE TABLE IF NOT EXISTS public.lobbyist_impact_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    statement_id UUID REFERENCES public.expert_statements(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    impact_score FLOAT NOT NULL, -- 0-100%
    matched_segments JSONB, -- Array of { original_text, statement_text, matched_text, similarity }
    analysis_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_expert_bill ON public.expert_statements(bill_id);
CREATE INDEX IF NOT EXISTS idx_impact_bill ON public.lobbyist_impact_analysis(bill_id);

