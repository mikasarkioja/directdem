-- Puhemiesneuvosto (Speaker's Council) Schema

-- Add trust and organization fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS organization_tag TEXT;

-- Create table for reporting/flagging content
CREATE TABLE IF NOT EXISTS moderation_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_type TEXT CHECK (target_type IN ('amendment', 'task_submission', 'comment')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);

