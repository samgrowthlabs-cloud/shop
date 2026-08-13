-- Use only model IDs callable through the native Workers AI binding.
UPDATE ai_feature_settings
SET model_id='@cf/qwen/qwen3-30b-a3b-fp8',
    fallback_model_id='@cf/mistralai/mistral-small-3.1-24b-instruct',
    updated_at=CURRENT_TIMESTAMP
WHERE feature_key IN ('search_intent','premium_search')
  AND model_id IN ('deepseek/deepseek-v4-flash','@cf/mistralai/mistral-small-3.1-24b-instruct','@cf/qwen/qwen3-30b-a3b-fp8');

UPDATE ai_feature_settings
SET model_id='@cf/mistralai/mistral-small-3.1-24b-instruct',
    fallback_model_id='@cf/qwen/qwen3-30b-a3b-fp8',
    updated_at=CURRENT_TIMESTAMP
WHERE feature_key IN ('product_insight','product_draft')
  AND model_id IN ('deepseek/deepseek-v4-flash','deepseek/deepseek-v4-pro','@cf/mistralai/mistral-small-3.1-24b-instruct','@cf/openai/gpt-oss-120b');

UPDATE ai_feature_settings
SET model_id='@cf/openai/gpt-oss-120b',
    fallback_model_id='@cf/qwen/qwen3-30b-a3b-fp8',
    updated_at=CURRENT_TIMESTAMP
WHERE feature_key='premium_related'
  AND model_id IN ('deepseek/deepseek-v4-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/openai/gpt-oss-120b');