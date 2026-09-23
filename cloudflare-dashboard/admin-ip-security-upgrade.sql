CREATE TABLE IF NOT EXISTS admin_ip_allowlist (
  id TEXT PRIMARY KEY, network TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', access_type TEXT NOT NULL DEFAULT 'network' CHECK(access_type IN ('device','network','office','home','temporary','other')),
  collaborator_id TEXT REFERENCES admin_collaborators(id) ON DELETE SET NULL, expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)), created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_access_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_ip_allowlist_active ON admin_ip_allowlist(is_active,expires_at);
CREATE TABLE IF NOT EXISTS admin_security_events (
  id TEXT PRIMARY KEY, action TEXT NOT NULL, actor_id TEXT, actor_name TEXT, source_ip TEXT,
  affected_network TEXT, result TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', request_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_security_events_created ON admin_security_events(created_at DESC);
