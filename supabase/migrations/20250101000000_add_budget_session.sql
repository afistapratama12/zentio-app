-- Add new columns to budget_history for new flow
ALTER TABLE budget_history 
ADD COLUMN IF NOT EXISTS budget_type TEXT, -- '1-month', '1-year', 'custom'
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS estimated_expense NUMERIC,
ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft', -- 'draft', 'saved', 'exported'
ADD COLUMN IF NOT EXISTS last_ai_feedback TEXT;
AdD COLUMN IF NOT EXISTS first_prompt JSONB;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_history_status ON budget_history(status);
CREATE INDEX IF NOT EXISTS idx_budget_history_dates ON budget_history(start_date, end_date);

-- Add comment for documentation
COMMENT ON COLUMN budget_history.budget_type IS 'Type of budget: 1-month, 1-year, or custom period';
COMMENT ON COLUMN budget_history.chat_history IS 'JSON array of chat messages between user and AI';
COMMENT ON COLUMN budget_history.uploaded_files IS 'JSON array of uploaded file metadata (name, type, storage_path)';
COMMENT ON COLUMN budget_history.edit_count IS 'Number of times user edited the budget table';
COMMENT ON COLUMN budget_history.last_ai_feedback IS 'Last feedback from AI after user edit';
