CREATE TABLE IF NOT EXISTS catalog_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  novelty_days INTEGER NOT NULL DEFAULT 30 CHECK (novelty_days BETWEEN 1 AND 3650),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO catalog_settings(id) VALUES('default');
