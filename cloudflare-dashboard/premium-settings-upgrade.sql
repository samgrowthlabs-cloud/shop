CREATE TABLE IF NOT EXISTS premium_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  plan_name TEXT NOT NULL DEFAULT 'SHOPLAB+',
  monthly_price_cents INTEGER NOT NULL DEFAULT 990,
  pass_price_cents INTEGER NOT NULL DEFAULT 990,
  pass_days INTEGER NOT NULL DEFAULT 30,
  ai_monthly_limit INTEGER NOT NULL DEFAULT 50,
  promotion_enabled INTEGER NOT NULL DEFAULT 0,
  promotion_label TEXT,
  promotion_monthly_price_cents INTEGER,
  promotion_pass_price_cents INTEGER,
  promotion_starts_at TEXT,
  promotion_ends_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO premium_settings(id) VALUES('default');
