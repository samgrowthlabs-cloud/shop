CREATE TABLE IF NOT EXISTS premium_product_insight_cache (
  cache_key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  insight_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_product_insight_user
  ON premium_product_insight_cache(user_id, updated_at DESC);
