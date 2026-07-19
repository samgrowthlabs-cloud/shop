ALTER TABLE products ADD COLUMN price_source TEXT;
ALTER TABLE products ADD COLUMN price_source_item_id TEXT;
ALTER TABLE products ADD COLUMN price_source_offer_id TEXT;
ALTER TABLE products ADD COLUMN price_source_url TEXT;
ALTER TABLE products ADD COLUMN price_sync_enabled INTEGER NOT NULL DEFAULT 0 CHECK (price_sync_enabled IN (0,1));
ALTER TABLE products ADD COLUMN price_synced_at TEXT;
ALTER TABLE products ADD COLUMN price_sync_status TEXT;
ALTER TABLE products ADD COLUMN price_sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_products_price_sync
ON products(price_sync_enabled, price_synced_at);
