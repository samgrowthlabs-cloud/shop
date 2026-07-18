ALTER TABLE user_profiles ADD COLUMN last_seen_at TEXT;
ALTER TABLE user_profiles ADD COLUMN blocked_until TEXT;
ALTER TABLE user_profiles ADD COLUMN moderation_note TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  unique_click_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_clicked_at TEXT,
  UNIQUE(user_id, product_slug)
);

CREATE TABLE IF NOT EXISTS share_visits (
  id TEXT PRIMARY KEY,
  share_link_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  converted_user_id TEXT,
  UNIQUE(share_link_id, visitor_hash)
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL UNIQUE,
  share_link_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','qualified','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  qualified_at TEXT
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  milestone INTEGER NOT NULL CHECK(milestone IN (5,10)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','redeemed','rejected')),
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_seen ON user_profiles(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_seen ON user_sessions(user_id,last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_links_user ON share_links(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_visits_link ON share_visits(share_link_id,clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON referral_rewards(status,created_at DESC);
