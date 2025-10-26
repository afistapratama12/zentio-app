-- Create budget_realization table
CREATE TABLE IF NOT EXISTS budget_realization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES budget_history(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  planned_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  realized_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
  realized_expense DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  realization_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_budget_realization_user_id ON budget_realization(user_id);
CREATE INDEX idx_budget_realization_session_id ON budget_realization(session_id);
CREATE INDEX idx_budget_realization_date ON budget_realization(realization_date);

-- Enable Row Level Security
ALTER TABLE budget_realization ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own realizations
CREATE POLICY "Users can view own realizations"
  ON budget_realization
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own realizations
CREATE POLICY "Users can insert own realizations"
  ON budget_realization
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own realizations
CREATE POLICY "Users can update own realizations"
  ON budget_realization
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own realizations
CREATE POLICY "Users can delete own realizations"
  ON budget_realization
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_budget_realization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_realization_updated_at
  BEFORE UPDATE ON budget_realization
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_realization_updated_at();

-- Create budget_realization_insights table to store AI analysis
CREATE TABLE IF NOT EXISTS budget_realization_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES budget_history(id) ON DELETE CASCADE,
  ai_insight TEXT NOT NULL,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Create indexes for insights table
CREATE INDEX idx_budget_realization_insights_user_id ON budget_realization_insights(user_id);
CREATE INDEX idx_budget_realization_insights_session_id ON budget_realization_insights(session_id);

-- Enable RLS for insights
ALTER TABLE budget_realization_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for insights
CREATE POLICY "Users can view own insights"
  ON budget_realization_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON budget_realization_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON budget_realization_insights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON budget_realization_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger for insights
CREATE TRIGGER budget_realization_insights_updated_at
  BEFORE UPDATE ON budget_realization_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_realization_updated_at();
