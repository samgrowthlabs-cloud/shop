ALTER TABLE product_media ADD COLUMN preview_start_seconds REAL NOT NULL DEFAULT 0 CHECK (preview_start_seconds >= 0 AND preview_start_seconds <= 86400);
