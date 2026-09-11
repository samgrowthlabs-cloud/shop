-- ShopLab Noticias: additive D1 migration. Safe to run more than once.
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  author TEXT NOT NULL DEFAULT 'Equipe ShopLab',
  cover_image_id TEXT,
  image_url TEXT,
  image_alt TEXT,
  image_width INTEGER,
  image_height INTEGER,
  image_placeholder TEXT,
  stream_uid TEXT,
  stream_status TEXT,
  video_aspect_ratio TEXT CHECK (video_aspect_ratio IS NULL OR video_aspect_ratio IN ('16:9','9:16')),
  video_duration REAL,
  video_thumbnail_url TEXT,
  published_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reading_time INTEGER NOT NULL DEFAULT 1,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  read_50 INTEGER NOT NULL DEFAULT 0,
  read_90 INTEGER NOT NULL DEFAULT 0,
  product_clicks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  quality_score REAL NOT NULL DEFAULT 0.5,
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_news_articles_feed ON news_articles(status, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(status, category, published_at DESC);

CREATE TABLE IF NOT EXISTS news_article_products (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(article_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_news_article_products_position ON news_article_products(article_id, position);

CREATE TABLE IF NOT EXISTS news_article_stats_daily (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  read_25 INTEGER NOT NULL DEFAULT 0,
  read_50 INTEGER NOT NULL DEFAULT 0,
  read_75 INTEGER NOT NULL DEFAULT 0,
  read_90 INTEGER NOT NULL DEFAULT 0,
  completes INTEGER NOT NULL DEFAULT 0,
  product_clicks INTEGER NOT NULL DEFAULT 0,
  compare_clicks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(article_id, date)
);

CREATE TABLE IF NOT EXISTS news_user_interests (
  anonymous_or_user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(anonymous_or_user_id, category)
);
CREATE INDEX IF NOT EXISTS idx_news_user_interests_updated ON news_user_interests(updated_at);
CREATE TABLE IF NOT EXISTS news_article_authorship (
  article_id TEXT PRIMARY KEY REFERENCES news_articles(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_article_likes (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(article_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS idx_news_article_likes_visitor ON news_article_likes(visitor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS news_unique_views (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  first_viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(article_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS idx_news_unique_views_visitor ON news_unique_views(visitor_id, first_viewed_at DESC);