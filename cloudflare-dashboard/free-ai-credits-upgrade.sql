CREATE TABLE IF NOT EXISTS free_ai_credit_usage (
  user_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  feature_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_free_ai_credit_usage_user
  ON free_ai_credit_usage(user_id, created_at DESC);
