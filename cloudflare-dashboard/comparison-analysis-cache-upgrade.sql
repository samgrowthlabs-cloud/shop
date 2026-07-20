-- Execute uma única vez no banco D1 antes de publicar o Worker atualizado.
-- O resultado permanece salvo sem expiração. Uma nova versão é criada somente
-- quando um dos produtos ou sua ficha técnica for alterado.
CREATE TABLE IF NOT EXISTS comparison_analysis_cache (
  cache_key TEXT PRIMARY KEY,
  product_slugs TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparison_analysis_cache_updated
  ON comparison_analysis_cache(updated_at DESC);
