CREATE TABLE IF NOT EXISTS user_saved_news (
  user_id TEXT NOT NULL,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,article_id)
);
CREATE INDEX IF NOT EXISTS idx_user_saved_news_user_created ON user_saved_news(user_id,created_at DESC);
