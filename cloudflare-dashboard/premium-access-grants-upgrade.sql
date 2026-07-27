CREATE TABLE IF NOT EXISTS premium_access_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 3650),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','claimed','expired','cancelled')),
  claim_expires_at TEXT NOT NULL,
  claimed_at TEXT,
  access_expires_at TEXT,
  pass_payment_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_access_grants_user
  ON premium_access_grants(user_id,status,claim_expires_at DESC);
