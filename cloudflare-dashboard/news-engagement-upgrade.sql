-- Likes and lifetime unique readership for ShopLab Noticias.
ALTER TABLE news_articles ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE news_articles ADD COLUMN unique_views INTEGER NOT NULL DEFAULT 0;

CREATE TABLE news_article_likes (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(article_id, visitor_id)
);
CREATE INDEX idx_news_article_likes_visitor ON news_article_likes(visitor_id, created_at DESC);

CREATE TABLE news_unique_views (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  first_viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(article_id, visitor_id)
);
CREATE INDEX idx_news_unique_views_visitor ON news_unique_views(visitor_id, first_viewed_at DESC);