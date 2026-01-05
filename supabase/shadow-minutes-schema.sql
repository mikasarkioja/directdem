-- Add real_final_text to bill_sections
ALTER TABLE bill_sections ADD COLUMN IF NOT EXISTS real_final_text TEXT;

-- Create table for shadow minutes analysis cache
CREATE TABLE IF NOT EXISTS bill_minutes_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE UNIQUE,
    democracy_gap_score INTEGER, -- 0-100
    ideological_divergence TEXT, -- AI analysis text
    summary_memo TEXT, -- AI summary of justifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

