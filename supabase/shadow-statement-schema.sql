-- Create bill_user_submissions table for shadow MP statements
CREATE TABLE IF NOT EXISTS bill_user_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    vote_type TEXT CHECK (vote_type IN ('jaa', 'ei', 'tyhjaa')),
    justification TEXT NOT NULL,
    focus_area TEXT NOT NULL, -- e.g., 'talous', 'arvot', 'ymp'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bill_user_submissions_bill_id ON bill_user_submissions(bill_id);

