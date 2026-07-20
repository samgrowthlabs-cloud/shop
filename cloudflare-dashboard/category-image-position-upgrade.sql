ALTER TABLE categories ADD COLUMN image_position_x INTEGER NOT NULL DEFAULT 0 CHECK (image_position_x BETWEEN -100 AND 100);
ALTER TABLE categories ADD COLUMN image_position_y INTEGER NOT NULL DEFAULT 0 CHECK (image_position_y BETWEEN -100 AND 100);
