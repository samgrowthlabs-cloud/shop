-- Remove dados que o bug antigo de syncAccountLibrary copiou automaticamente
-- no primeiro acesso de uma conta. A janela curta evita apagar interações feitas
-- posteriormente pelo próprio usuário.
--
-- Antes de executar, revise os registros que serão afetados com os SELECTs.

SELECT 'favorites' kind, f.user_id, f.product_slug, f.created_at
FROM user_favorites f
JOIN user_profiles p ON p.user_id = f.user_id
WHERE datetime(f.created_at) BETWEEN datetime(p.created_at, '-5 seconds')
                                 AND datetime(p.created_at, '+2 minutes');

SELECT 'ratings' kind, r.user_id, r.product_slug, r.created_at
FROM user_ratings r
JOIN user_profiles p ON p.user_id = r.user_id
WHERE datetime(r.created_at) BETWEEN datetime(p.created_at, '-5 seconds')
                                 AND datetime(p.created_at, '+2 minutes');

SELECT 'cart' kind, c.user_id, c.product_slug, c.created_at
FROM user_cart c
JOIN user_profiles p ON p.user_id = c.user_id
WHERE datetime(c.created_at) BETWEEN datetime(p.created_at, '-5 seconds')
                                 AND datetime(p.created_at, '+2 minutes');

-- Execute os DELETEs abaixo somente depois de confirmar a listagem acima.
DELETE FROM user_favorites
WHERE rowid IN (
  SELECT f.rowid
  FROM user_favorites f
  JOIN user_profiles p ON p.user_id = f.user_id
  WHERE datetime(f.created_at) BETWEEN datetime(p.created_at, '-5 seconds')
                                   AND datetime(p.created_at, '+2 minutes')
);

DELETE FROM user_ratings
WHERE rowid IN (
  SELECT r.rowid
  FROM user_ratings r
  JOIN user_profiles p ON p.user_id = r.user_id
  WHERE datetime(r.created_at) BETWEEN datetime(p.created_at, '-5 seconds')
                                   AND datetime(p.created_at, '+2 minutes')
);

DELETE FROM user_cart
WHERE rowid IN (
  SELECT c.rowid
  FROM user_cart c
  JOIN user_profiles p ON p.user_id = c.user_id
  WHERE datetime(c.created_at) BETWEEN datetime(p.created_at, '-5 seconds')
                                   AND datetime(p.created_at, '+2 minutes')
);
