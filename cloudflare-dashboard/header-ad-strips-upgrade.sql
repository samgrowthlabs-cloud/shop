CREATE TABLE IF NOT EXISTS header_ad_strips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  storage_key TEXT,
  link_url TEXT NOT NULL,
  alt_text TEXT,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_position_x INTEGER NOT NULL DEFAULT 50,
  image_position_y INTEGER NOT NULL DEFAULT 50,
  image_scale INTEGER NOT NULL DEFAULT 100,
  mobile_position_x INTEGER NOT NULL DEFAULT 50,
  mobile_position_y INTEGER NOT NULL DEFAULT 50,
  mobile_scale INTEGER NOT NULL DEFAULT 100,
  image_rotation INTEGER NOT NULL DEFAULT 0,
  animation_preset TEXT NOT NULL DEFAULT 'fade',
  animation_duration INTEGER NOT NULL DEFAULT 700,
  animation_delay INTEGER NOT NULL DEFAULT 0,
  style_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_header_ad_strips_active
  ON header_ad_strips(is_active, starts_at, ends_at, sort_order);
