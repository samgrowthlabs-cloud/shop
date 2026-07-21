CREATE TABLE IF NOT EXISTS premium_pass_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_preference_id TEXT UNIQUE,
  provider_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled','refunded')),
  payer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  checkout_url TEXT,
  paid_at TEXT,
  access_expires_at TEXT,
  provider_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_pass_payments_user
  ON premium_pass_payments(user_id, status, access_expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_pass_payments_preference
  ON premium_pass_payments(provider_preference_id);

CREATE TABLE IF NOT EXISTS premium_notification_log (
  event_key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent','failed','skipped')),
  provider_message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
