CREATE TABLE IF NOT EXISTS admin_shared_files (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_shared_files_expiry ON admin_shared_files(expires_at, created_at);
CREATE TABLE IF NOT EXISTS admin_shared_file_downloads (
  file_id TEXT NOT NULL REFERENCES admin_shared_files(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  downloaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (file_id, actor_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_shared_file_downloads_file ON admin_shared_file_downloads(file_id, downloaded_at);