-- Clause Editor Schema

-- Individual sections/clauses of a bill
CREATE TABLE IF NOT EXISTS bill_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    section_number TEXT, -- e.g., "1 §", "2 §"
    title TEXT, -- e.g., "Soveltamisala"
    content TEXT NOT NULL, -- Original text
    current_shadow_text TEXT, -- The accepted "shadow" version
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update bill_amendments to link to bill_sections
ALTER TABLE bill_amendments ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES bill_sections(id) ON DELETE CASCADE;
ALTER TABLE bill_amendments ADD COLUMN IF NOT EXISTS justification TEXT;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bill_sections;

