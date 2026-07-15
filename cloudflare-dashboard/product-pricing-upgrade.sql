-- Execute UMA VEZ no console do D1 existente.
ALTER TABLE products ADD COLUMN base_price_cents INTEGER CHECK (base_price_cents IS NULL OR base_price_cents >= 0);
ALTER TABLE products ADD COLUMN compare_at_price_cents INTEGER CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= 0);

UPDATE products
SET base_price_cents=(SELECT current_price_cents FROM offers WHERE offers.product_id=products.id ORDER BY is_primary DESC,priority DESC LIMIT 1)
WHERE base_price_cents IS NULL;

UPDATE products
SET compare_at_price_cents=(SELECT previous_price_cents FROM offers WHERE offers.product_id=products.id ORDER BY is_primary DESC,priority DESC LIMIT 1)
WHERE compare_at_price_cents IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price_cents);
