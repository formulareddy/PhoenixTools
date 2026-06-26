-- Server-side usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, date)
);

-- RLS policies for usage_logs
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage"
  ON usage_logs FOR ALL
  USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_logs_lookup ON usage_logs(user_id, category, date);
