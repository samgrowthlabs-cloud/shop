CREATE TABLE IF NOT EXISTS admin_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#0b8f7f',
  permissions_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_collaborators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role TEXT NOT NULL CHECK(role IN ('vice_admin','catalog_editor','pricer','marketing','custom')),
  role_id TEXT REFERENCES admin_roles(id) ON DELETE SET NULL,
  permissions_json TEXT NOT NULL DEFAULT '[]',
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_collaborators_active
  ON admin_collaborators(is_active, email);

-- Execute apenas em bancos criados antes da coluna role_id.
-- ALTER TABLE admin_collaborators ADD COLUMN role_id TEXT REFERENCES admin_roles(id) ON DELETE SET NULL;

ALTER TABLE admin_sessions ADD COLUMN collaborator_id TEXT REFERENCES admin_collaborators(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_collaborator
  ON admin_sessions(collaborator_id, expires_at);
