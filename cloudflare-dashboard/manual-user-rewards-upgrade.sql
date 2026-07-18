CREATE TABLE IF NOT EXISTS manual_user_rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'delivered'
    CHECK(status IN ('delivered','redeemed','cancelled')),
  gift_card_type_id TEXT NOT NULL,
  value_cents INTEGER NOT NULL CHECK(value_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  code_encrypted TEXT NOT NULL,
  pin_encrypted TEXT,
  expires_at TEXT,
  instructions TEXT NOT NULL DEFAULT '',
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(email_status IN ('pending','sent','failed','skipped')),
  email_id TEXT,
  email_error TEXT NOT NULL DEFAULT '',
  delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(gift_card_type_id) REFERENCES gift_card_types(id)
);

CREATE INDEX IF NOT EXISTS idx_manual_user_rewards_user
  ON manual_user_rewards(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_user_rewards_email
  ON manual_user_rewards(email_status,created_at);
