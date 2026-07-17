CREATE TABLE IF NOT EXISTS header_spotlight (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  storage_key TEXT,
  link_url TEXT NOT NULL DEFAULT 'promocoes.html',
  alt_text TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO header_spotlight (id) VALUES ('main');

CREATE TABLE IF NOT EXISTS header_spotlights (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  storage_key TEXT,
  link_url TEXT NOT NULL DEFAULT 'promocoes.html',
  alt_text TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO header_spotlights (
  id,name,storage_key,link_url,alt_text,starts_at,ends_at,is_active,sort_order,updated_at
)
SELECT 'legacy-main','Destaque principal',storage_key,link_url,alt_text,starts_at,ends_at,is_active,0,updated_at
FROM header_spotlight
WHERE id='main' AND storage_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_header_spotlights_active
ON header_spotlights(is_active,starts_at,ends_at,sort_order);
