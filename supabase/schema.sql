-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profile table
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  gender TEXT,
  marital_status TEXT,
  job TEXT,
  location TEXT,
  investment_level TEXT,
  financial_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_file TEXT,
  extracted_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create budget_history table
CREATE TABLE IF NOT EXISTS budget_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  ai_generated_budget JSONB NOT NULL,
  manual_adjustments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_history_user_id ON budget_history(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_created_at ON budget_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profile
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profile
CREATE POLICY "Users can view their own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for budget_history
CREATE POLICY "Users can view their own budget history"
  ON budget_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget history"
  ON budget_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget history"
  ON budget_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for rewards
CREATE POLICY "Users can view their own rewards"
  ON rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
