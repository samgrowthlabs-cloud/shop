CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  instagram TEXT NOT NULL DEFAULT '',
  tiktok TEXT NOT NULL DEFAULT '',
  threads TEXT NOT NULL DEFAULT '',
  youtube TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  x TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO social_links (id) VALUES ('default');