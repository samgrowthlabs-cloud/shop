ALTER TABLE product_media ADD COLUMN is_hover INTEGER NOT NULL DEFAULT 0 CHECK (is_hover IN (0,1));

CREATE INDEX IF NOT EXISTS idx_product_media_hover
ON product_media(product_id, is_hover);
