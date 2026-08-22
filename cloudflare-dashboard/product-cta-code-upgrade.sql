-- Execute uma vez em bancos D1 existentes, antes de publicar o Worker atualizado.
-- Produtos atuais permanecem com cta_code NULL e continuam funcionando normalmente.
ALTER TABLE products ADD COLUMN cta_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_cta_code_unique ON products(cta_code) WHERE cta_code IS NOT NULL;

-- Recria o ?ndice de busca para que c?digos como SL-A17 sejam encontrados.
-- Execute tamb?m o conte?do atualizado de search-upgrade.sql ap?s esta migra??o.
