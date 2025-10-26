-- Create budget_transactions table for daily transaction tracking
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES budget_history(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  transaction_date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('upload', 'manual')) DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_budget_transactions_user_id ON budget_transactions(user_id);
CREATE INDEX idx_budget_transactions_session_id ON budget_transactions(session_id);
CREATE INDEX idx_budget_transactions_date ON budget_transactions(transaction_date);
CREATE INDEX idx_budget_transactions_category ON budget_transactions(category);
CREATE INDEX idx_budget_transactions_type ON budget_transactions(transaction_type);

-- Enable Row Level Security
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own transactions"
  ON budget_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON budget_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON budget_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON budget_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_budget_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_transactions_updated_at
  BEFORE UPDATE ON budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_transactions_updated_at();

-- Add source field to budget_realization table
ALTER TABLE budget_realization 
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('auto', 'manual', 'hybrid')) DEFAULT 'manual';

-- Create index for source field
CREATE INDEX IF NOT EXISTS idx_budget_realization_source ON budget_realization(source);
