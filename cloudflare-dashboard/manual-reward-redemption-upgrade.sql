-- Execute uma única vez no banco D1 antes de publicar o Worker atualizado.
ALTER TABLE manual_user_rewards ADD COLUMN redeemed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_manual_user_rewards_redemption
  ON manual_user_rewards(status, redeemed_at DESC);
