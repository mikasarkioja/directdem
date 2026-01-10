-- Create user_impact_citations table to track when user arguments appear in parliament
CREATE TABLE IF NOT EXISTS user_impact_citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES bill_user_submissions(id) ON DELETE CASCADE,
    mp_name TEXT NOT NULL,
    speech_snippet TEXT NOT NULL,
    speech_date TIMESTAMP WITH TIME ZONE NOT NULL,
    impact_explanation TEXT NOT NULL, -- AI generated explanation of the impact
    impact_score INTEGER DEFAULT 10, -- XP/Points gained
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_impact_citations_user_id ON user_impact_citations(user_id);


