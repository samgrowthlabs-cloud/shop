ALTER TABLE events ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_product ON events(user_id,product_slug,event_type);
