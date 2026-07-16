ALTER TABLE seasonal_themes ADD COLUMN header_background_end TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE seasonal_themes ADD COLUMN header_gradient_enabled INTEGER NOT NULL DEFAULT 0 CHECK (header_gradient_enabled IN (0,1));
ALTER TABLE seasonal_themes ADD COLUMN header_gradient_angle INTEGER NOT NULL DEFAULT 90;
ALTER TABLE seasonal_themes ADD COLUMN header_media_storage_key TEXT;
ALTER TABLE seasonal_themes ADD COLUMN header_media_opacity REAL NOT NULL DEFAULT 0.35;
ALTER TABLE seasonal_themes ADD COLUMN header_media_position TEXT NOT NULL DEFAULT 'center';
ALTER TABLE seasonal_themes ADD COLUMN header_media_size TEXT NOT NULL DEFAULT 'cover';
