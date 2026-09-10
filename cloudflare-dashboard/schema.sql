PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS catalog_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  novelty_days INTEGER NOT NULL DEFAULT 30 CHECK (novelty_days BETWEEN 1 AND 3650),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO catalog_settings(id) VALUES('default');

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'âŒ¬',
  image_storage_key TEXT,
  image_scale INTEGER NOT NULL DEFAULT 100 CHECK (image_scale BETWEEN 50 AND 250),
  image_position_x INTEGER NOT NULL DEFAULT 0 CHECK (image_position_x BETWEEN -100 AND 100),
  image_position_y INTEGER NOT NULL DEFAULT 0 CHECK (image_position_y BETWEEN -100 AND 100),
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
  cta_code TEXT UNIQUE,
  subtitle TEXT NOT NULL DEFAULT '', product_type TEXT NOT NULL DEFAULT 'affiliate',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  short_description TEXT NOT NULL DEFAULT '', full_description TEXT NOT NULL DEFAULT '',
  editorial_review TEXT NOT NULL DEFAULT '', target_audience TEXT NOT NULL DEFAULT '',
  not_recommended_for TEXT NOT NULL DEFAULT '', editorial_score INTEGER CHECK (editorial_score BETWEEN 0 AND 100),
  base_price_cents INTEGER CHECK (base_price_cents IS NULL OR base_price_cents >= 0),
  compare_at_price_cents INTEGER CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= 0),
  price_source TEXT,
  price_source_item_id TEXT,
  price_source_offer_id TEXT,
  price_source_url TEXT,
  price_sync_enabled INTEGER NOT NULL DEFAULT 0 CHECK (price_sync_enabled IN (0,1)),
  price_synced_at TEXT,
  price_sync_status TEXT,
  price_sync_error TEXT,
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
  is_hover INTEGER NOT NULL DEFAULT 0 CHECK (is_hover IN (0,1)),
  preview_start_seconds REAL NOT NULL DEFAULT 0 CHECK (preview_start_seconds >= 0 AND preview_start_seconds <= 86400),
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

CREATE TABLE IF NOT EXISTS recommendations (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, recommended_product_id, strategy)
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#0b8f7f',
  permissions_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_collaborators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role TEXT NOT NULL CHECK(role IN ('vice_admin','catalog_editor','pricer','marketing','custom')),
  role_id TEXT REFERENCES admin_roles(id) ON DELETE SET NULL,
  permissions_json TEXT NOT NULL DEFAULT '[]',
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_collaborators_active ON admin_collaborators(is_active,email);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, collaborator_id TEXT REFERENCES admin_collaborators(id) ON DELETE CASCADE, expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_collaborator ON admin_sessions(collaborator_id,expires_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name TEXT NOT NULL DEFAULT 'Administrador',
  actor_email TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT 'owner',
  action TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  resource_label TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  request_id TEXT,
  ip_hash TEXT,
  user_agent TEXT NOT NULL DEFAULT '',
  status_code INTEGER NOT NULL DEFAULT 200,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY, email TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','blocked')),
    last_seen_at TEXT, blocked_until TEXT, moderation_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE IF NOT EXISTS user_sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,active_seconds INTEGER NOT NULL DEFAULT 0,ended_at TEXT);
CREATE TABLE IF NOT EXISTS share_links (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,product_slug TEXT NOT NULL,token TEXT NOT NULL UNIQUE,click_count INTEGER NOT NULL DEFAULT 0,unique_click_count INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_clicked_at TEXT,UNIQUE(user_id,product_slug));
CREATE TABLE IF NOT EXISTS share_visits (id TEXT PRIMARY KEY,share_link_id TEXT NOT NULL,visitor_hash TEXT NOT NULL,clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,converted_user_id TEXT,UNIQUE(share_link_id,visitor_hash));
CREATE TABLE IF NOT EXISTS referrals (id TEXT PRIMARY KEY,referrer_user_id TEXT NOT NULL,referred_user_id TEXT NOT NULL UNIQUE,share_link_id TEXT,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','qualified','rejected')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,qualified_at TEXT);
CREATE TABLE IF NOT EXISTS referral_rewards (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,milestone INTEGER NOT NULL CHECK(milestone IN (5,10)),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','redeemed','rejected')),admin_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,milestone));
CREATE TABLE IF NOT EXISTS gift_card_types (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,logo_storage_key TEXT,allowed_values_json TEXT NOT NULL DEFAULT '[]',instructions TEXT NOT NULL DEFAULT '',is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reward_gift_cards (id TEXT PRIMARY KEY,reward_id TEXT NOT NULL UNIQUE,gift_card_type_id TEXT NOT NULL,value_cents INTEGER NOT NULL CHECK(value_cents>0),currency TEXT NOT NULL DEFAULT 'BRL',code_encrypted TEXT NOT NULL,pin_encrypted TEXT,expires_at TEXT,instructions TEXT NOT NULL DEFAULT '',delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(reward_id) REFERENCES referral_rewards(id) ON DELETE CASCADE,FOREIGN KEY(gift_card_type_id) REFERENCES gift_card_types(id));
CREATE INDEX IF NOT EXISTS idx_gift_card_types_active ON gift_card_types(is_active,name);
CREATE INDEX IF NOT EXISTS idx_reward_gift_cards_type ON reward_gift_cards(gift_card_type_id);
CREATE TABLE IF NOT EXISTS manual_user_rewards (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,title TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'delivered' CHECK(status IN ('delivered','redeemed','cancelled')),gift_card_type_id TEXT NOT NULL,value_cents INTEGER NOT NULL CHECK(value_cents>0),currency TEXT NOT NULL DEFAULT 'BRL',code_encrypted TEXT NOT NULL,pin_encrypted TEXT,expires_at TEXT,instructions TEXT NOT NULL DEFAULT '',email_status TEXT NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','sent','failed','skipped')),email_id TEXT,email_error TEXT NOT NULL DEFAULT '',delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,redeemed_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(gift_card_type_id) REFERENCES gift_card_types(id));
CREATE INDEX IF NOT EXISTS idx_manual_user_rewards_user ON manual_user_rewards(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_user_rewards_email ON manual_user_rewards(email_status,created_at);
CREATE TABLE IF NOT EXISTS user_favorites (user_id TEXT NOT NULL,product_slug TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,product_slug));
CREATE TABLE IF NOT EXISTS user_ratings (user_id TEXT NOT NULL,product_slug TEXT NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,product_slug));
CREATE TABLE IF NOT EXISTS user_cart (user_id TEXT NOT NULL,product_slug TEXT NOT NULL,quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 99),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,product_slug));
CREATE TABLE IF NOT EXISTS user_view_history (user_id TEXT NOT NULL,product_slug TEXT NOT NULL,viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,product_slug));

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, event_type TEXT NOT NULL, product_slug TEXT, offer_id TEXT,
  query_text TEXT, metadata_json TEXT NOT NULL DEFAULT '{}', user_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_product ON events(user_id,product_slug,event_type);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, eyebrow TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '', button_text TEXT NOT NULL DEFAULT 'Ver oferta', link_url TEXT NOT NULL,
  desktop_storage_key TEXT NOT NULL, mobile_storage_key TEXT, alt_text TEXT NOT NULL DEFAULT '',
  desktop_position_x INTEGER NOT NULL DEFAULT 50, desktop_position_y INTEGER NOT NULL DEFAULT 50,
  desktop_scale INTEGER NOT NULL DEFAULT 100, mobile_position_x INTEGER NOT NULL DEFAULT 50,
  mobile_position_y INTEGER NOT NULL DEFAULT 50, mobile_scale INTEGER NOT NULL DEFAULT 100,
    targeting_json TEXT NOT NULL DEFAULT '{}', style_json TEXT NOT NULL DEFAULT '{}',
  starts_at TEXT, ends_at TEXT, is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  display_duration_ms INTEGER NOT NULL DEFAULT 6000,
  sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasonal_themes (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, holiday TEXT NOT NULL DEFAULT '',
  header_background TEXT NOT NULL DEFAULT '#ffffff', header_background_end TEXT NOT NULL DEFAULT '#ffffff',
  header_gradient_enabled INTEGER NOT NULL DEFAULT 0 CHECK (header_gradient_enabled IN (0,1)), header_gradient_angle INTEGER NOT NULL DEFAULT 90,
  header_text_color TEXT NOT NULL DEFAULT '#233330',
  accent_color TEXT NOT NULL DEFAULT '#0a7c71', page_text_color TEXT NOT NULL DEFAULT '#233330',
  muted_text_color TEXT NOT NULL DEFAULT '#687773', icon_color TEXT NOT NULL DEFAULT '#0a7c71', logo_text TEXT NOT NULL DEFAULT 'SHOPLAB', logo_text_color TEXT NOT NULL DEFAULT '#0a7c71', logo_height INTEGER NOT NULL DEFAULT 36,
  price_color TEXT NOT NULL DEFAULT '#087c70', old_price_color TEXT NOT NULL DEFAULT '#687773',
  header_hover_color TEXT NOT NULL DEFAULT '#0a7c71', footer_background TEXT NOT NULL DEFAULT '#eef3f1', footer_text_color TEXT NOT NULL DEFAULT '#233330',
  footer_link_color TEXT NOT NULL DEFAULT '#687773', footer_hover_color TEXT NOT NULL DEFAULT '#0a7c71', card_hover_background TEXT NOT NULL DEFAULT '#ffffff', card_hover_border_color TEXT NOT NULL DEFAULT '#0a7c71',
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
  spotlight_position_x INTEGER NOT NULL DEFAULT 50, spotlight_position_y INTEGER NOT NULL DEFAULT 50,
  spotlight_scale INTEGER NOT NULL DEFAULT 100,
  spotlight_rotation INTEGER NOT NULL DEFAULT 0,
  spotlight_animation TEXT NOT NULL DEFAULT 'fade',
  spotlight_animation_duration INTEGER NOT NULL DEFAULT 700,
  spotlight_animation_delay INTEGER NOT NULL DEFAULT 0,
  display_duration_ms INTEGER NOT NULL DEFAULT 5000,
  starts_at TEXT, ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_analysis_cache (
  cache_key TEXT PRIMARY KEY,
  product_slugs TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_product_insight_cache (
  cache_key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  insight_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','authorized','paused','cancelled')),
  payer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  checkout_url TEXT,
  next_payment_at TEXT,
  provider_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_ai_usage (
  user_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  generations INTEGER NOT NULL DEFAULT 0 CHECK(generations >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, period_key)
);

CREATE TABLE IF NOT EXISTS free_ai_credit_usage (
  user_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  feature_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_free_ai_credit_usage_user
  ON free_ai_credit_usage(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS premium_pass_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_preference_id TEXT UNIQUE,
  provider_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled','refunded')),
  payer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  checkout_url TEXT,
  paid_at TEXT,
  access_expires_at TEXT,
  provider_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_notification_log (
  event_key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent','failed','skipped')),
  provider_message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_access_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 3650),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','claimed','expired','cancelled')),
  claim_expires_at TEXT NOT NULL,
  claimed_at TEXT,
  access_expires_at TEXT,
  pass_payment_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_premium_access_grants_user ON premium_access_grants(user_id,status,claim_expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_provider_id ON premium_subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_pass_payments_user ON premium_pass_payments(user_id, status, access_expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_pass_payments_preference ON premium_pass_payments(provider_preference_id);

CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category_id);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_views ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id, is_primary DESC, current_price_cents);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_search_trends ON events(event_type, created_at DESC, query_text);
CREATE INDEX IF NOT EXISTS idx_events_product_activity ON events(product_slug, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_ranking ON products(status, is_featured DESC, editorial_score DESC, view_count DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price_cents);
CREATE INDEX IF NOT EXISTS idx_products_price_sync ON products(price_sync_enabled, price_synced_at);
CREATE INDEX IF NOT EXISTS idx_promotions_active_period ON promotions(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotion_products_product ON promotion_products(product_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_banners_active_period ON banners(is_active, starts_at, ends_at, sort_order);
CREATE INDEX IF NOT EXISTS idx_header_spotlights_active ON header_spotlights(is_active, starts_at, ends_at, sort_order);

CREATE TABLE IF NOT EXISTS header_ad_strips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  storage_key TEXT,
  link_url TEXT NOT NULL,
  alt_text TEXT,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_position_x INTEGER NOT NULL DEFAULT 50,
  image_position_y INTEGER NOT NULL DEFAULT 50,
  image_scale INTEGER NOT NULL DEFAULT 100,
  mobile_position_x INTEGER NOT NULL DEFAULT 50,
  mobile_position_y INTEGER NOT NULL DEFAULT 50,
  mobile_scale INTEGER NOT NULL DEFAULT 100,
  image_rotation INTEGER NOT NULL DEFAULT 0,
  animation_preset TEXT NOT NULL DEFAULT 'fade',
  animation_duration INTEGER NOT NULL DEFAULT 700,
  animation_delay INTEGER NOT NULL DEFAULT 0,
  placement TEXT NOT NULL DEFAULT 'below_menu' CHECK(placement IN ('below_menu','product_after_offer','product_after_analysis','product_before_related')),
  display_duration_ms INTEGER NOT NULL DEFAULT 6000,
  style_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_header_ad_strips_active
  ON header_ad_strips(is_active, starts_at, ends_at, sort_order);
CREATE INDEX IF NOT EXISTS idx_comparison_analysis_cache_updated ON comparison_analysis_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_product_insight_user ON premium_product_insight_cache(user_id,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_active_seasonal_theme ON seasonal_themes(is_active) WHERE is_active=1;

INSERT OR IGNORE INTO categories (id,name,slug,icon,sort_order) VALUES
('cat_books','Livros e e-books','livros','â–¤',1),('cat_tech','Tecnologia','tecnologia','âŒ˜',2),
('cat_audio','Ãudio','audio','â™«',3),('cat_productivity','Produtividade','produtividade','âœ“',4),('cat_courses','Cursos','cursos','â—«',5);
INSERT OR IGNORE INTO brands (id,name,slug) VALUES ('brand_shoplab','SHOPLAB','shoplab'),('brand_nexon','Nexon','nexon'),('brand_orbit','Orbit','orbit'),('brand_foco','Foco','foco');
INSERT OR IGNORE INTO partners (id,name,slug,website_url) VALUES ('partner_demo','Parceiro Demo','parceiro-demo','https://example.com');
INSERT OR IGNORE INTO products (id,name,slug,product_type,status,category_id,brand_id,short_description,editorial_score,is_featured,published_at) VALUES
('prod_habits','HÃ¡bitos AtÃ´micos','habitos-atomicos','book','published','cat_books',NULL,'Guia prÃ¡tico para criar bons hÃ¡bitos.',96,1,CURRENT_TIMESTAMP),
('prod_ssd','SSD NVMe Pulse 1 TB','ssd-nvme-pulse-1tb','affiliate','published','cat_tech','brand_nexon','Armazenamento veloz para trabalho e estudo.',92,1,CURRENT_TIMESTAMP),
('prod_headphone','Fone Orbit ANC','fone-orbit-anc','affiliate','published','cat_audio','brand_orbit','Cancelamento de ruÃ­do e som equilibrado.',88,0,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO offers (id,product_id,partner_id,affiliate_url,current_price_cents,previous_price_cents,is_primary) VALUES
('offer_habits','prod_habits','partner_demo','https://example.com/oferta/habitos',4490,6990,1),
('offer_ssd','prod_ssd','partner_demo','https://example.com/oferta/ssd',36990,44990,1),
('offer_headphone','prod_headphone','partner_demo','https://example.com/oferta/fone',27990,34990,1);
CREATE TABLE IF NOT EXISTS premium_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  plan_name TEXT NOT NULL DEFAULT 'SHOPLAB+',
  monthly_price_cents INTEGER NOT NULL DEFAULT 990,
  pass_price_cents INTEGER NOT NULL DEFAULT 990,
  pass_days INTEGER NOT NULL DEFAULT 30,
  ai_monthly_limit INTEGER NOT NULL DEFAULT 50,
  promotion_enabled INTEGER NOT NULL DEFAULT 0,
  promotion_label TEXT,
  promotion_monthly_price_cents INTEGER,
  promotion_pass_price_cents INTEGER,
  promotion_starts_at TEXT,
  promotion_ends_at TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0,1)),
  comparison_enabled INTEGER NOT NULL DEFAULT 1 CHECK (comparison_enabled IN (0,1)),
  analysis_enabled INTEGER NOT NULL DEFAULT 1 CHECK (analysis_enabled IN (0,1)),
  coming_soon_message TEXT NOT NULL DEFAULT 'Em breve',
  monthly_analysis_limit INTEGER NOT NULL DEFAULT 50,
  monthly_comparison_limit INTEGER NOT NULL DEFAULT 50,
  pass_credit_limit INTEGER NOT NULL DEFAULT 50,
  pass_analysis_limit INTEGER NOT NULL DEFAULT 50,
  pass_comparison_limit INTEGER NOT NULL DEFAULT 50,
  new_user_trial_enabled INTEGER NOT NULL DEFAULT 0 CHECK (new_user_trial_enabled IN (0,1)),
  new_user_trial_days INTEGER NOT NULL DEFAULT 0,
  new_user_trial_credits INTEGER NOT NULL DEFAULT 0,
  new_user_trial_analysis_limit INTEGER NOT NULL DEFAULT 0,
  new_user_trial_comparison_limit INTEGER NOT NULL DEFAULT 0,
  packages_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO premium_settings(id) VALUES('default');

CREATE TABLE IF NOT EXISTS ai_feature_settings (
  feature_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'workers-ai',
  model_id TEXT NOT NULL,
  fallback_model_id TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_feature_settings_updated ON ai_feature_settings(updated_at DESC);
CREATE TABLE IF NOT EXISTS ai_general_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  free_credit_limit INTEGER NOT NULL DEFAULT 5 CHECK (free_credit_limit BETWEEN 0 AND 10000),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO ai_general_settings(id,free_credit_limit) VALUES('default',5);

CREATE TABLE IF NOT EXISTS shoplab_ads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  public_title TEXT,
  ad_label TEXT NOT NULL DEFAULT 'PUBLICIDADE · SHOPLAB ADS',
  show_header INTEGER NOT NULL DEFAULT 1,
  dismissible INTEGER NOT NULL DEFAULT 1,
  dismiss_minutes INTEGER NOT NULL DEFAULT 30,
  cta_text TEXT NOT NULL DEFAULT 'Saiba mais',
  cta_color TEXT NOT NULL DEFAULT '#075fce',
  media_type TEXT NOT NULL DEFAULT 'image' CHECK(media_type IN ('image','video')),
  storage_key TEXT,
  link_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused')),
  priority INTEGER NOT NULL DEFAULT 1,
  distribution_mode TEXT NOT NULL DEFAULT 'manual' CHECK(distribution_mode IN ('manual','weighted')),
  distribution_weight INTEGER NOT NULL DEFAULT 25 CHECK(distribution_weight BETWEEN 1 AND 100),
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shoplab_ad_assignments (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL REFERENCES shoplab_ads(id) ON DELETE CASCADE,
  device TEXT NOT NULL CHECK(device IN ('desktop','mobile')),
  page_kind TEXT NOT NULL CHECK(page_kind IN ('home','products','category','product')),
  position_key TEXT NOT NULL,
  category_slug TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device,page_kind,position_key,category_slug)
);
CREATE INDEX IF NOT EXISTS idx_shoplab_ads_active ON shoplab_ads(status,starts_at,ends_at,priority);
CREATE INDEX IF NOT EXISTS idx_shoplab_ad_assignments_target ON shoplab_ad_assignments(device,page_kind,category_slug,position_key);
CREATE TABLE IF NOT EXISTS shoplab_ad_events (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL REFERENCES shoplab_ads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('impression','click')),
  device TEXT NOT NULL CHECK(device IN ('desktop','mobile')),
  page_kind TEXT NOT NULL CHECK(page_kind IN ('home','products','category','product')),
  position_key TEXT NOT NULL,
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shoplab_ad_events_analytics ON shoplab_ad_events(created_at,event_type,ad_id);
CREATE TABLE IF NOT EXISTS site_typography (
  id TEXT PRIMARY KEY,
  font_family TEXT NOT NULL DEFAULT 'Arial',
  body_weight INTEGER NOT NULL DEFAULT 400,
  heading_weight INTEGER NOT NULL DEFAULT 700,
  price_weight INTEGER NOT NULL DEFAULT 600,
  font_storage_key TEXT,
  font_format TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO site_typography(id,font_family,body_weight,heading_weight,price_weight) VALUES('global','Arial',400,700,600);

CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  instagram TEXT NOT NULL DEFAULT '',
  tiktok TEXT NOT NULL DEFAULT '',
  threads TEXT NOT NULL DEFAULT '',
  youtube TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  x TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO social_links (id) VALUES ('default');

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

-- The additive news schema is maintained in news-upgrade.sql.
