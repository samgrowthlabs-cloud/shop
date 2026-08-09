ALTER TABLE banners ADD COLUMN display_duration_ms INTEGER NOT NULL DEFAULT 6000;
ALTER TABLE header_spotlights ADD COLUMN display_duration_ms INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE header_ad_strips ADD COLUMN placement TEXT NOT NULL DEFAULT 'below_menu';
ALTER TABLE header_ad_strips ADD COLUMN display_duration_ms INTEGER NOT NULL DEFAULT 6000;

CREATE INDEX IF NOT EXISTS idx_header_ad_strips_placement_period
ON header_ad_strips(placement,is_active,starts_at,ends_at,sort_order);
