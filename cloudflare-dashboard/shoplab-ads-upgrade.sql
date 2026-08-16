CREATE TABLE IF NOT EXISTS shoplab_ads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  public_title TEXT,
  ad_label TEXT NOT NULL DEFAULT 'PUBLICIDADE · SHOPLAB ADS',
  show_header INTEGER NOT NULL DEFAULT 1,
  dismissible INTEGER NOT NULL DEFAULT 1,
  dismiss_minutes INTEGER NOT NULL DEFAULT 30,
  cta_text TEXT NOT NULL DEFAULT 'Saiba mais',
  cta_color TEXT NOT NULL DEFAULT '#075fce',
  media_type TEXT NOT NULL DEFAULT 'image' CHECK(media_type IN ('image','video')),
  storage_key TEXT,
  link_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused')),
  priority INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shoplab_ad_assignments (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL REFERENCES shoplab_ads(id) ON DELETE CASCADE,
  device TEXT NOT NULL CHECK(device IN ('desktop','mobile')),
  page_kind TEXT NOT NULL CHECK(page_kind IN ('home','products','category','product')),
  position_key TEXT NOT NULL,
  category_slug TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device,page_kind,position_key,category_slug)
);
CREATE INDEX IF NOT EXISTS idx_shoplab_ads_active ON shoplab_ads(status,starts_at,ends_at,priority);
CREATE INDEX IF NOT EXISTS idx_shoplab_ad_assignments_target ON shoplab_ad_assignments(device,page_kind,category_slug,position_key);