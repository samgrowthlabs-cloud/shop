-- Execute uma vez no console do mesmo banco D1 da SHOPLAB.
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  product_id UNINDEXED,
  name,
  brand,
  category,
  content,
  tokenize = "unicode61 remove_diacritics 2"
);

DROP TRIGGER IF EXISTS products_fts_insert;
CREATE TRIGGER products_fts_insert AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(product_id,name,brand,category,content)
  VALUES(
    new.id,
    new.name,
    COALESCE((SELECT name FROM brands WHERE id=new.brand_id),''),
    COALESCE((SELECT name FROM categories WHERE id=new.category_id),''),
    COALESCE(new.subtitle,'') || ' ' || COALESCE(new.short_description,'') || ' ' || COALESCE(new.full_description,'') || ' ' || COALESCE(new.tags_json,'[]')
  );
END;

DROP TRIGGER IF EXISTS products_fts_update;
CREATE TRIGGER products_fts_update AFTER UPDATE ON products BEGIN
  DELETE FROM products_fts WHERE product_id=old.id;
  INSERT INTO products_fts(product_id,name,brand,category,content)
  VALUES(
    new.id,
    new.name,
    COALESCE((SELECT name FROM brands WHERE id=new.brand_id),''),
    COALESCE((SELECT name FROM categories WHERE id=new.category_id),''),
    COALESCE(new.subtitle,'') || ' ' || COALESCE(new.short_description,'') || ' ' || COALESCE(new.full_description,'') || ' ' || COALESCE(new.tags_json,'[]')
  );
END;

DROP TRIGGER IF EXISTS products_fts_delete;
CREATE TRIGGER products_fts_delete AFTER DELETE ON products BEGIN
  DELETE FROM products_fts WHERE product_id=old.id;
END;

DELETE FROM products_fts;
INSERT INTO products_fts(product_id,name,brand,category,content)
SELECT
  p.id,
  p.name,
  COALESCE(b.name,''),
  COALESCE(c.name,''),
  COALESCE(p.subtitle,'') || ' ' || COALESCE(p.short_description,'') || ' ' || COALESCE(p.full_description,'') || ' ' || COALESCE(p.tags_json,'[]')
FROM products p
LEFT JOIN brands b ON b.id=p.brand_id
LEFT JOIN categories c ON c.id=p.category_id;

CREATE INDEX IF NOT EXISTS idx_events_search_trends
ON events(event_type, created_at DESC, query_text);

CREATE INDEX IF NOT EXISTS idx_events_product_activity
ON events(product_slug, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_ranking
ON products(status, is_featured DESC, editorial_score DESC, view_count DESC, updated_at DESC);
