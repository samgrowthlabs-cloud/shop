-- O SHOPLAB+ passa a oferecer 100 créditos de IA por ciclo.
-- A análise individual de produto usa 0,25 crédito; a comparação usa 1 crédito.
UPDATE premium_settings
SET ai_monthly_limit = 100,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'default';
