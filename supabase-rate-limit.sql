-- Rate limiting table for serverless-compatible rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON rate_limits (key, created_at);

-- Account lockout table
CREATE TABLE IF NOT EXISTS account_lockouts (
  email TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  locked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup: delete rate limit entries older than 2 minutes
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup: delete lockout entries older than 15 minutes
CREATE OR REPLACE FUNCTION cleanup_lockouts()
RETURNS void AS $$
BEGIN
  DELETE FROM account_lockouts WHERE locked_at < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;

-- RLS policies (service role bypasses RLS, but these are for safety)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON rate_limits FOR ALL USING (true);
CREATE POLICY "Service role full access" ON account_lockouts FOR ALL USING (true);
