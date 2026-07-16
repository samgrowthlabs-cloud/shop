PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  eyebrow TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  button_text TEXT NOT NULL DEFAULT 'Ver oferta',
  link_url TEXT NOT NULL,
  desktop_storage_key TEXT NOT NULL,
  mobile_storage_key TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasonal_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  holiday TEXT NOT NULL DEFAULT '',
  header_background TEXT NOT NULL DEFAULT '#ffffff',
  header_text_color TEXT NOT NULL DEFAULT '#233330',
  accent_color TEXT NOT NULL DEFAULT '#0a7c71',
  page_text_color TEXT NOT NULL DEFAULT '#233330',
  muted_text_color TEXT NOT NULL DEFAULT '#687773',
  logo_text TEXT NOT NULL DEFAULT 'SHOPLAB',
  logo_storage_key TEXT,
  logo_hover_storage_key TEXT,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_active_period
  ON banners(is_active, starts_at, ends_at, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_active_seasonal_theme
  ON seasonal_themes(is_active) WHERE is_active = 1;
