-- Distribuicao manual ou automatica por peso para o SHOPLAB Ads.
ALTER TABLE shoplab_ads ADD COLUMN distribution_mode TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE shoplab_ads ADD COLUMN distribution_weight INTEGER NOT NULL DEFAULT 25;
