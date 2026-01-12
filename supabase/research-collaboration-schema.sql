-- Table for shared research notes and collaboration
CREATE TABLE IF NOT EXISTS public.research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. 'Lobbying', 'Discipline', 'General'
    content TEXT NOT NULL,
    related_id TEXT, -- e.g. bill_id or organization_name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for research notes
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (for now, or restricted to researchers in app logic)
CREATE POLICY "Researchers can read all notes" 
ON public.research_notes FOR SELECT 
USING (true);

-- Users can insert their own notes
CREATE POLICY "Users can insert their own notes" 
ON public.research_notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_research_notes_cat ON public.research_notes(category);
CREATE INDEX IF NOT EXISTS idx_research_notes_related ON public.research_notes(related_id);

