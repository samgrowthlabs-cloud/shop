CREATE TABLE IF NOT EXISTS gift_card_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_storage_key TEXT,
  allowed_values_json TEXT NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_gift_cards (
  id TEXT PRIMARY KEY,
  reward_id TEXT NOT NULL UNIQUE,
  gift_card_type_id TEXT NOT NULL,
  value_cents INTEGER NOT NULL CHECK(value_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  code_encrypted TEXT NOT NULL,
  pin_encrypted TEXT,
  expires_at TEXT,
  instructions TEXT NOT NULL DEFAULT '',
  delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reward_id) REFERENCES referral_rewards(id) ON DELETE CASCADE,
  FOREIGN KEY(gift_card_type_id) REFERENCES gift_card_types(id)
);

CREATE INDEX IF NOT EXISTS idx_gift_card_types_active
  ON gift_card_types(is_active,name);
CREATE INDEX IF NOT EXISTS idx_reward_gift_cards_type
  ON reward_gift_cards(gift_card_type_id);
