
-- Update usage_logs to store proposal history
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS proposal_text text,
ADD COLUMN IF NOT EXISTS proposal_value numeric,
ADD COLUMN IF NOT EXISTS proposal_deadline integer,
ADD COLUMN IF NOT EXISTS project_url text;

-- Create index for faster valid history retrieval
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, created_at DESC);
