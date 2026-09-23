CREATE TABLE IF NOT EXISTS admin_trusted_device_requests (
  id TEXT PRIMARY KEY,
  collaborator_id TEXT NOT NULL REFERENCES admin_collaborators(id) ON DELETE CASCADE,
  collaborator_email TEXT NOT NULL,
  challenge_hash TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  request_ip TEXT NOT NULL,
  request_country TEXT,
  browser_label TEXT,
  os_label TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','DENIED','EXPIRED','CONSUMED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT,
  consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_device_requests_pending ON admin_trusted_device_requests(status,expires_at,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_device_requests_collaborator ON admin_trusted_device_requests(collaborator_id,created_at DESC);
