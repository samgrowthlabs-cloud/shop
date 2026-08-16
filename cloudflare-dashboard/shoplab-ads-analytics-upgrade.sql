CREATE TABLE IF NOT EXISTS shoplab_ad_events (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL REFERENCES shoplab_ads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('impression','click')),
  device TEXT NOT NULL CHECK(device IN ('desktop','mobile')),
  page_kind TEXT NOT NULL CHECK(page_kind IN ('home','products','category','product')),
  position_key TEXT NOT NULL,
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shoplab_ad_events_analytics ON shoplab_ad_events(created_at,event_type,ad_id);
