ALTER TABLE header_spotlights ADD COLUMN spotlight_rotation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE header_spotlights ADD COLUMN spotlight_animation TEXT NOT NULL DEFAULT 'fade';
ALTER TABLE header_spotlights ADD COLUMN spotlight_animation_duration INTEGER NOT NULL DEFAULT 700;
ALTER TABLE header_spotlights ADD COLUMN spotlight_animation_delay INTEGER NOT NULL DEFAULT 0;
