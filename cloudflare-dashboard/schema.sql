PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '⌬',
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '', website_url TEXT, logo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  bio TEXT NOT NULL DEFAULT '', website_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  website_url TEXT, logo_url TEXT, is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  subtitle TEXT NOT NULL DEFAULT '', product_type TEXT NOT NULL DEFAULT 'affiliate',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  short_description TEXT NOT NULL DEFAULT '', full_description TEXT NOT NULL DEFAULT '',
  editorial_review TEXT NOT NULL DEFAULT '', target_audience TEXT NOT NULL DEFAULT '',
  not_recommended_for TEXT NOT NULL DEFAULT '', editorial_score INTEGER CHECK (editorial_score BETWEEN 0 AND 100),
  base_price_cents INTEGER CHECK (base_price_cents IS NULL OR base_price_cents >= 0),
  compare_at_price_cents INTEGER CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= 0),
  pros_json TEXT NOT NULL DEFAULT '[]', cons_json TEXT NOT NULL DEFAULT '[]', tags_json TEXT NOT NULL DEFAULT '[]',
  specifications_json TEXT NOT NULL DEFAULT '[]', book_details_json TEXT NOT NULL DEFAULT '{}',
  faqs_json TEXT NOT NULL DEFAULT '[]', seo_json TEXT NOT NULL DEFAULT '{}',
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  view_count INTEGER NOT NULL DEFAULT 0, published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_authors (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'author', PRIMARY KEY (product_id, author_id, role)
);

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image','video')), storage_key TEXT, external_url TEXT,
  alt_text TEXT NOT NULL DEFAULT '', caption TEXT NOT NULL DEFAULT '', credits TEXT NOT NULL DEFAULT '',
  mime_type TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  affiliate_url TEXT NOT NULL, current_price_cents INTEGER NOT NULL CHECK (current_price_cents >= 0),
  previous_price_cents INTEGER CHECK (previous_price_cents IS NULL OR previous_price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL', coupon_code TEXT, installment_text TEXT, shipping_text TEXT,
  availability TEXT NOT NULL DEFAULT 'available', button_text TEXT NOT NULL DEFAULT 'Ver oferta',
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)), priority INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT, ends_at TEXT, last_checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '',
  coupon_code TEXT, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, rules_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id TEXT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, recommended_product_id, strategy)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, event_type TEXT NOT NULL, product_slug TEXT, offer_id TEXT,
  query_text TEXT, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, eyebrow TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '', button_text TEXT NOT NULL DEFAULT 'Ver oferta', link_url TEXT NOT NULL,
  desktop_storage_key TEXT NOT NULL, mobile_storage_key TEXT, alt_text TEXT NOT NULL DEFAULT '',
  starts_at TEXT, ends_at TEXT, is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasonal_themes (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, holiday TEXT NOT NULL DEFAULT '',
  header_background TEXT NOT NULL DEFAULT '#ffffff', header_background_end TEXT NOT NULL DEFAULT '#ffffff',
  header_gradient_enabled INTEGER NOT NULL DEFAULT 0 CHECK (header_gradient_enabled IN (0,1)), header_gradient_angle INTEGER NOT NULL DEFAULT 90,
  header_text_color TEXT NOT NULL DEFAULT '#233330',
  accent_color TEXT NOT NULL DEFAULT '#0a7c71', page_text_color TEXT NOT NULL DEFAULT '#233330',
  muted_text_color TEXT NOT NULL DEFAULT '#687773', logo_text TEXT NOT NULL DEFAULT 'SHOPLAB', logo_text_color TEXT NOT NULL DEFAULT '#0a7c71', logo_height INTEGER NOT NULL DEFAULT 36,
  logo_storage_key TEXT, logo_hover_storage_key TEXT, header_media_storage_key TEXT,
  header_media_opacity REAL NOT NULL DEFAULT 0.35, header_media_position TEXT NOT NULL DEFAULT 'center', header_media_size TEXT NOT NULL DEFAULT 'cover',
  header_media_scale INTEGER NOT NULL DEFAULT 100, header_media_repeat INTEGER NOT NULL DEFAULT 0 CHECK (header_media_repeat IN (0,1)),
  starts_at TEXT, ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS header_spotlights (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, storage_key TEXT,
  link_url TEXT NOT NULL DEFAULT 'promocoes.html', alt_text TEXT NOT NULL DEFAULT '',
  starts_at TEXT, ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category_id);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_views ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id, is_primary DESC, current_price_cents);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_search_trends ON events(event_type, created_at DESC, query_text);
CREATE INDEX IF NOT EXISTS idx_events_product_activity ON events(product_slug, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_ranking ON products(status, is_featured DESC, editorial_score DESC, view_count DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price_cents);
CREATE INDEX IF NOT EXISTS idx_promotions_active_period ON promotions(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotion_products_product ON promotion_products(product_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_banners_active_period ON banners(is_active, starts_at, ends_at, sort_order);
CREATE INDEX IF NOT EXISTS idx_header_spotlights_active ON header_spotlights(is_active, starts_at, ends_at, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_active_seasonal_theme ON seasonal_themes(is_active) WHERE is_active=1;

INSERT OR IGNORE INTO categories (id,name,slug,icon,sort_order) VALUES
('cat_books','Livros e e-books','livros','▤',1),('cat_tech','Tecnologia','tecnologia','⌘',2),
('cat_audio','Áudio','audio','♫',3),('cat_productivity','Produtividade','produtividade','✓',4),('cat_courses','Cursos','cursos','◫',5);
INSERT OR IGNORE INTO brands (id,name,slug) VALUES ('brand_shoplab','SHOPLAB','shoplab'),('brand_nexon','Nexon','nexon'),('brand_orbit','Orbit','orbit'),('brand_foco','Foco','foco');
INSERT OR IGNORE INTO partners (id,name,slug,website_url) VALUES ('partner_demo','Parceiro Demo','parceiro-demo','https://example.com');
INSERT OR IGNORE INTO products (id,name,slug,product_type,status,category_id,brand_id,short_description,editorial_score,is_featured,published_at) VALUES
('prod_habits','Hábitos Atômicos','habitos-atomicos','book','published','cat_books',NULL,'Guia prático para criar bons hábitos.',96,1,CURRENT_TIMESTAMP),
('prod_ssd','SSD NVMe Pulse 1 TB','ssd-nvme-pulse-1tb','affiliate','published','cat_tech','brand_nexon','Armazenamento veloz para trabalho e estudo.',92,1,CURRENT_TIMESTAMP),
('prod_headphone','Fone Orbit ANC','fone-orbit-anc','affiliate','published','cat_audio','brand_orbit','Cancelamento de ruído e som equilibrado.',88,0,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO offers (id,product_id,partner_id,affiliate_url,current_price_cents,previous_price_cents,is_primary) VALUES
('offer_habits','prod_habits','partner_demo','https://example.com/oferta/habitos',4490,6990,1),
('offer_ssd','prod_ssd','partner_demo','https://example.com/oferta/ssd',36990,44990,1),
('offer_headphone','prod_headphone','partner_demo','https://example.com/oferta/fone',27990,34990,1);
