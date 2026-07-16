ALTER TABLE seasonal_themes ADD COLUMN header_media_scale INTEGER NOT NULL DEFAULT 100;
ALTER TABLE seasonal_themes ADD COLUMN header_media_repeat INTEGER NOT NULL DEFAULT 0 CHECK (header_media_repeat IN (0,1));
