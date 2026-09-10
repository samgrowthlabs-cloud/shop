-- Additive and replayable. Requires the existing product-collections upgrade.
PRAGMA foreign_keys = ON;
-- Stop before changing data if the legacy hierarchy needs editorial review.
CREATE TABLE IF NOT EXISTS catalog_hierarchy_requires_review(ok INTEGER CHECK(ok=1));
INSERT INTO catalog_hierarchy_requires_review SELECT 0 FROM categories c JOIN categories p ON p.id=c.parent_id WHERE p.parent_id IS NOT NULL LIMIT 1;
DROP TABLE catalog_hierarchy_requires_review;
CREATE TABLE IF NOT EXISTS catalog_migrations(id TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS category_metadata (
  category_id TEXT PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE,
  seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS collection_metadata (
  collection_id TEXT PRIMARY KEY REFERENCES product_collections(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT,
  collection_type TEXT NOT NULL DEFAULT 'legacy' CHECK(collection_type IN ('manual','dynamic','legacy')),
  discovery_group TEXT NOT NULL DEFAULT 'need' CHECK(discovery_group IN ('need','budget','highlight')),
  rules_json TEXT NOT NULL DEFAULT '{"version":1}',
  image_storage_key TEXT, seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '',
  buying_guide TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product_features (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE RESTRICT,
  PRIMARY KEY(product_id,feature_id)
);
CREATE TABLE IF NOT EXISTS product_classification (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  subcategory_id TEXT REFERENCES categories(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS catalog_aliases (
  path TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('category','collection')),
  entity_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_active_order ON categories(parent_id,is_active,sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id,status);
CREATE INDEX IF NOT EXISTS idx_products_brand_status ON products(brand_id,status);
CREATE INDEX IF NOT EXISTS idx_products_status_price ON products(status,base_price_cents);
CREATE INDEX IF NOT EXISTS idx_features_active_slug ON features(is_active,slug);
CREATE INDEX IF NOT EXISTS idx_product_features_reverse ON product_features(feature_id,product_id);
CREATE INDEX IF NOT EXISTS idx_classification_subcategory ON product_classification(subcategory_id,product_id);
CREATE INDEX IF NOT EXISTS idx_collection_metadata_category ON collection_metadata(category_id,collection_type);
CREATE INDEX IF NOT EXISTS idx_collection_items_product ON product_collection_items(product_id,collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_categories_reverse ON product_collection_categories(category_id,collection_id);
CREATE INDEX IF NOT EXISTS idx_catalog_alias_entity ON catalog_aliases(entity_type,entity_id);
INSERT OR IGNORE INTO category_metadata(category_id) SELECT id FROM categories WHERE NOT EXISTS(SELECT 1 FROM catalog_migrations WHERE id='discovery-v1');
INSERT OR IGNORE INTO collection_metadata(collection_id,collection_type)
 SELECT id,CASE WHEN EXISTS(SELECT 1 FROM product_collection_categories WHERE collection_id=product_collections.id) THEN 'legacy' ELSE 'manual' END FROM product_collections WHERE NOT EXISTS(SELECT 1 FROM catalog_migrations WHERE id='discovery-v1');
-- Preserve every old tag verbatim. Editors can rename the resulting feature slug later.
INSERT OR IGNORE INTO features(id,name,slug)
 SELECT 'tag-'||lower(hex(CAST(trim(j.value) AS BLOB))),trim(j.value),'tag-'||lower(hex(CAST(trim(j.value) AS BLOB)))
 FROM products p,json_each(CASE WHEN json_valid(p.tags_json) THEN p.tags_json ELSE '[]' END) j
 WHERE j.type='text' AND length(trim(j.value)) BETWEEN 1 AND 100 AND NOT EXISTS(SELECT 1 FROM catalog_migrations WHERE id='discovery-v1');
INSERT OR IGNORE INTO product_features(product_id,feature_id)
 SELECT p.id,'tag-'||lower(hex(CAST(trim(j.value) AS BLOB)))
 FROM products p,json_each(CASE WHEN json_valid(p.tags_json) THEN p.tags_json ELSE '[]' END) j
 WHERE j.type='text' AND length(trim(j.value)) BETWEEN 1 AND 100 AND NOT EXISTS(SELECT 1 FROM catalog_migrations WHERE id='discovery-v1');
-- Existing child-category products keep their original classification as a subcategory.
INSERT OR IGNORE INTO product_classification(product_id,subcategory_id)
 SELECT p.id,c.id FROM products p JOIN categories c ON c.id=p.category_id WHERE c.parent_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM catalog_migrations WHERE id='discovery-v1');
UPDATE products SET category_id=(SELECT parent_id FROM categories WHERE id=products.category_id)
 WHERE category_id IN (SELECT id FROM categories WHERE parent_id IS NOT NULL)
 AND EXISTS(SELECT 1 FROM product_classification pc WHERE pc.product_id=products.id AND pc.subcategory_id=products.category_id) AND NOT EXISTS(SELECT 1 FROM catalog_migrations WHERE id='discovery-v1');
-- Capture old slugs even when an older admin client updates the base tables.
CREATE TRIGGER IF NOT EXISTS catalog_category_alias BEFORE UPDATE OF slug,parent_id ON categories
WHEN OLD.slug<>NEW.slug OR OLD.parent_id IS NOT NEW.parent_id
BEGIN
 INSERT OR IGNORE INTO catalog_aliases(path,entity_type,entity_id)
 VALUES('/'||COALESCE((SELECT slug||'/' FROM categories WHERE id=OLD.parent_id),'')||OLD.slug,'category',OLD.id);
 INSERT OR IGNORE INTO catalog_aliases(path,entity_type,entity_id)
 SELECT '/'||OLD.slug||'/'||slug,'category',id FROM categories WHERE parent_id=OLD.id;
 INSERT OR IGNORE INTO catalog_aliases(path,entity_type,entity_id)
 SELECT '/'||OLD.slug||'/'||pc.slug,'collection',pc.id FROM product_collections pc JOIN collection_metadata m ON m.collection_id=pc.id WHERE m.category_id=OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS catalog_collection_alias BEFORE UPDATE OF slug ON product_collections
WHEN OLD.slug<>NEW.slug
BEGIN
 INSERT OR IGNORE INTO catalog_aliases(path,entity_type,entity_id)
 VALUES('/'||COALESCE((SELECT c.slug||'/' FROM collection_metadata m JOIN categories c ON c.id=m.category_id WHERE m.collection_id=OLD.id),'colecoes/')||OLD.slug,'collection',OLD.id);
END;
CREATE TRIGGER IF NOT EXISTS catalog_collection_parent_alias BEFORE UPDATE OF category_id ON collection_metadata
WHEN OLD.category_id IS NOT NEW.category_id
BEGIN
 INSERT OR IGNORE INTO catalog_aliases(path,entity_type,entity_id)
 SELECT '/'||COALESCE((SELECT slug||'/' FROM categories WHERE id=OLD.category_id),'colecoes/')||slug,'collection',id FROM product_collections WHERE id=OLD.collection_id;
END;
-- Keep legacy tags/search clients and normalized features in sync.
CREATE TRIGGER IF NOT EXISTS catalog_product_tags_insert AFTER INSERT ON products
BEGIN
 INSERT OR IGNORE INTO features(id,name,slug)
 SELECT 'tag-'||lower(hex(CAST(trim(j.value) AS BLOB))),trim(j.value),'tag-'||lower(hex(CAST(trim(j.value) AS BLOB)))
 FROM json_each(CASE WHEN json_valid(NEW.tags_json) THEN NEW.tags_json ELSE '[]' END) j
 WHERE j.type='text' AND length(trim(j.value)) BETWEEN 1 AND 100
 AND NOT EXISTS(SELECT 1 FROM features WHERE name=trim(j.value));
 INSERT OR IGNORE INTO product_features(product_id,feature_id)
 SELECT NEW.id,f.id FROM json_each(CASE WHEN json_valid(NEW.tags_json) THEN NEW.tags_json ELSE '[]' END) j
 JOIN features f ON f.name=trim(j.value) WHERE j.type='text';
END;
CREATE TRIGGER IF NOT EXISTS catalog_product_tags_update AFTER UPDATE OF tags_json ON products
WHEN OLD.tags_json IS NOT NEW.tags_json
BEGIN
 DELETE FROM product_features WHERE product_id=NEW.id;
 INSERT OR IGNORE INTO features(id,name,slug)
 SELECT 'tag-'||lower(hex(CAST(trim(j.value) AS BLOB))),trim(j.value),'tag-'||lower(hex(CAST(trim(j.value) AS BLOB)))
 FROM json_each(CASE WHEN json_valid(NEW.tags_json) THEN NEW.tags_json ELSE '[]' END) j
 WHERE j.type='text' AND length(trim(j.value)) BETWEEN 1 AND 100
 AND NOT EXISTS(SELECT 1 FROM features WHERE name=trim(j.value));
 INSERT OR IGNORE INTO product_features(product_id,feature_id)
 SELECT NEW.id,f.id FROM json_each(CASE WHEN json_valid(NEW.tags_json) THEN NEW.tags_json ELSE '[]' END) j
 JOIN features f ON f.name=trim(j.value) WHERE j.type='text';
END;
CREATE TRIGGER IF NOT EXISTS catalog_feature_rename AFTER UPDATE OF name ON features
WHEN OLD.name<>NEW.name
BEGIN
 UPDATE products SET tags_json=(SELECT json_group_array(CASE WHEN j.value=OLD.name THEN NEW.name ELSE j.value END) FROM json_each(products.tags_json) j),updated_at=CURRENT_TIMESTAMP
 WHERE id IN (SELECT product_id FROM product_features WHERE feature_id=NEW.id) AND json_valid(tags_json);
END;
-- Older product clients may still submit a child category ID.
CREATE TRIGGER IF NOT EXISTS catalog_product_category_insert AFTER INSERT ON products
WHEN EXISTS(SELECT 1 FROM categories WHERE id=NEW.category_id AND parent_id IS NOT NULL)
BEGIN
 INSERT OR REPLACE INTO product_classification(product_id,subcategory_id) VALUES(NEW.id,NEW.category_id);
 UPDATE products SET category_id=(SELECT parent_id FROM categories WHERE id=NEW.category_id) WHERE id=NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS catalog_product_category_update AFTER UPDATE OF category_id ON products
BEGIN
 INSERT INTO product_classification(product_id,subcategory_id)
 SELECT NEW.id,NEW.category_id WHERE EXISTS(SELECT 1 FROM categories WHERE id=NEW.category_id AND parent_id IS NOT NULL)
 ON CONFLICT(product_id) DO UPDATE SET subcategory_id=excluded.subcategory_id;
 UPDATE products SET category_id=(SELECT parent_id FROM categories WHERE id=NEW.category_id)
 WHERE id=NEW.id AND EXISTS(SELECT 1 FROM categories WHERE id=NEW.category_id AND parent_id IS NOT NULL);
 UPDATE product_classification SET subcategory_id=NULL WHERE product_id=NEW.id
 AND subcategory_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM categories c JOIN products p ON p.category_id=c.parent_id WHERE c.id=product_classification.subcategory_id AND p.id=NEW.id);
END;

INSERT OR IGNORE INTO catalog_migrations(id) VALUES('discovery-v1');
