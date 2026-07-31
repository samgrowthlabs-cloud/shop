CREATE TABLE IF NOT EXISTS ai_feature_settings (
  feature_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'workers-ai',
  model_id TEXT NOT NULL,
  fallback_model_id TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feature_settings_updated
  ON ai_feature_settings(updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_general_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  free_credit_limit INTEGER NOT NULL DEFAULT 5 CHECK (free_credit_limit BETWEEN 0 AND 10000),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO ai_general_settings(id, free_credit_limit)
VALUES('default', 5);
