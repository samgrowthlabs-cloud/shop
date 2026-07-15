-- Execute uma vez no console do mesmo banco D1 da SHOPLAB.
-- Não apaga campanhas nem relações existentes.
CREATE INDEX IF NOT EXISTS idx_promotions_active_period
ON promotions(is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promotion_products_product
ON promotion_products(product_id, promotion_id);
