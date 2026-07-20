CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','authorized','paused','cancelled')),
  payer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  checkout_url TEXT,
  next_payment_at TEXT,
  provider_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_ai_usage (
  user_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  generations INTEGER NOT NULL DEFAULT 0 CHECK(generations >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_provider_id
  ON premium_subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status
  ON premium_subscriptions(status, updated_at DESC);
