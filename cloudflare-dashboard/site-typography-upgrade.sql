CREATE TABLE IF NOT EXISTS site_typography (
  id TEXT PRIMARY KEY,
  font_family TEXT NOT NULL DEFAULT 'Arial',
  body_weight INTEGER NOT NULL DEFAULT 400,
  heading_weight INTEGER NOT NULL DEFAULT 700,
  price_weight INTEGER NOT NULL DEFAULT 600,
  font_storage_key TEXT,
  font_format TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO site_typography(id,font_family,body_weight,heading_weight,price_weight) VALUES('global','Arial',400,700,600);