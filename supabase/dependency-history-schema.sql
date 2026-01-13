-- Dependency History and Correlation Schema

-- History of changes in MP dependencies
CREATE TABLE IF NOT EXISTS public.mp_dependency_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id INTEGER REFERENCES public.mps(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL, -- 'ADDED', 'REMOVED', 'MODIFIED'
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    organization TEXT,
    valid_from DATE,
    valid_to DATE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Cache for AI-detected correlations
CREATE TABLE IF NOT EXISTS public.mp_interest_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id INTEGER REFERENCES public.mps(id) ON DELETE CASCADE,
    dependency_id UUID REFERENCES public.mp_dependencies(id) ON DELETE SET NULL,
    speech_id TEXT, -- ID or reference to the speech
    significance_score INTEGER DEFAULT 0,
    correlation_reasoning TEXT,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.mp_dependency_history IS 'Historical log of changes in MP financial interests.';
COMMENT ON TABLE public.mp_interest_correlations IS 'AI-detected links between financial interests and political actions.';

