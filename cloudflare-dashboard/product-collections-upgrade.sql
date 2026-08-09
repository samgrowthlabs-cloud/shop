CREATE TABLE IF NOT EXISTS product_collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_collection_items (
  collection_id TEXT NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(collection_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_collection_categories (
  collection_id TEXT NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(collection_id, category_id)
);

ALTER TABLE product_collections ADD COLUMN is_home_featured INTEGER NOT NULL DEFAULT 0 CHECK(is_home_featured IN (0,1));
ALTER TABLE product_collections ADD COLUMN home_sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_collections ADD COLUMN home_title TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_product_collection_categories_order ON product_collection_categories(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_collections_home ON product_collections(is_active, is_home_featured, home_sort_order);
CREATE INDEX IF NOT EXISTS idx_product_collections_active_slug ON product_collections(is_active, slug);
CREATE INDEX IF NOT EXISTS idx_product_collection_items_order ON product_collection_items(collection_id, sort_order);
