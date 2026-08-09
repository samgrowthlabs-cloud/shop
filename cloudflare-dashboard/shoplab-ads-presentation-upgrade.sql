
-- Configuração visual e fechamento temporário dos anúncios existentes.
ALTER TABLE shoplab_ads ADD COLUMN public_title TEXT;
ALTER TABLE shoplab_ads ADD COLUMN ad_label TEXT NOT NULL DEFAULT 'PUBLICIDADE · SHOPLAB ADSENSE';
ALTER TABLE shoplab_ads ADD COLUMN show_header INTEGER NOT NULL DEFAULT 1;
ALTER TABLE shoplab_ads ADD COLUMN dismissible INTEGER NOT NULL DEFAULT 1;
ALTER TABLE shoplab_ads ADD COLUMN dismiss_minutes INTEGER NOT NULL DEFAULT 30;
ALTER TABLE shoplab_ads ADD COLUMN cta_text TEXT NOT NULL DEFAULT 'Saiba mais';
ALTER TABLE shoplab_ads ADD COLUMN cta_color TEXT NOT NULL DEFAULT '#075fce';
