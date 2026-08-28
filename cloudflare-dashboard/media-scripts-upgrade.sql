CREATE TABLE IF NOT EXISTS admin_media_scripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready')),
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  updated_by_id TEXT NOT NULL,
  updated_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_media_scripts_updated ON admin_media_scripts(updated_at, title);
CREATE TABLE IF NOT EXISTS admin_media_script_comments (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL REFERENCES admin_media_scripts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_script_comments_script ON admin_media_script_comments(script_id, created_at);

CREATE TABLE IF NOT EXISTS admin_media_script_annotations (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL REFERENCES admin_media_scripts(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  note TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'custom',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_script_annotations_script ON admin_media_script_annotations(script_id, start_offset);