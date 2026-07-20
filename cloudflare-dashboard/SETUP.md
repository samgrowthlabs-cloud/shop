# Instalação no dashboard da Cloudflare

## 1. Banco D1

1. Cloudflare Dashboard → Storage & Databases → D1 → Create database.
2. Abra o banco → Console.
3. Cole e execute todo o conteúdo de `schema.sql`.
4. Em seguida, cole e execute todo o conteúdo de `search-upgrade.sql` para criar ou atualizar o FTS5, os gatilhos de sincronização e os índices dos algoritmos. Ele pode ser executado novamente em um banco existente.
5. Para ativar campanhas promocionais em um banco existente, execute também `promotion-upgrade.sql`. Ele apenas cria índices e preserva as promoções já cadastradas.
6. Para adicionar preço normal ao cadastro de produtos, execute uma única vez `product-pricing-upgrade.sql`.
7. Em bancos existentes, execute uma única vez `brand-store-logo-upgrade.sql` para permitir logos de marcas e lojas. Bancos novos já recebem essas colunas pelo `schema.sql`.
8. Para permitir imagem ou GIF clicável e independente dos temas no destaque direito do cabeçalho, execute uma única vez `header-spotlight-upgrade.sql`. Bancos novos já recebem essa configuração pelo `schema.sql`.

9. Para manter preços importados do Mercado Livre atualizados, execute uma única vez `mercadolivre-price-sync-upgrade.sql`.

O SQL cria tabelas, índices e três produtos demonstrativos. Os valores monetários são armazenados em centavos.

## 2. Worker

1. Workers & Pages → Create → Worker.
2. Abra o editor, substitua o código pelo conteúdo de `worker.js` e publique.
3. Settings → Bindings → Add → D1 Database. Use exatamente o nome `DB` e selecione o banco criado.
4. Para imagens: crie um bucket R2 e adicione ao Worker o binding `MEDIA`. O editor de produtos usa esse binding para enviar, servir e remover imagens reais.
5. Para a busca inteligente: adicione um binding **Workers AI** com o nome exato `AI`. Sem esse binding, ou se a inferência falhar, a busca continua funcionando automaticamente com FTS5, correção e sinônimos.

6. Em **Settings → Triggers → Cron Triggers**, adicione `*/30 * * * *`. O Worker atualizará até 40 produtos do Mercado Livre por execução, começando pelos mais antigos.

## 3. Variáveis e secrets

Em Settings → Variables and Secrets, cadastre:

- `ALLOWED_ORIGINS` como variável: domínio exato do frontend, sem barra final. Para mais de um, separe por vírgula.
- `ADMIN_PASSWORD` como **secret**: senha longa e exclusiva do painel.
- `TURNSTILE_SECRET_KEY` como **secret**: chave secreta do widget Turnstile.

- `MERCADOLIVRE_CLIENT_ID` como **secret**: identificador da aplicação do Mercado Livre.
- `MERCADOLIVRE_CLIENT_SECRET` como **secret**: segredo da aplicação do Mercado Livre.

Nunca coloque esses valores em `worker.js` ou no frontend.

No frontend, coloque somente a **sitekey pública** do mesmo widget em `assets/js/config.js`, no campo `TURNSTILE_SITE_KEY`. A sitekey pode aparecer no navegador; a secret key nunca pode.

Para a sessão administrativa funcionar com maior confiabilidade, associe um domínio personalizado ao Worker, por exemplo `api.shoplab.bidjory.com.br`, e use essa URL em `API_BASE_URL`. Isso mantém frontend e API sob `bidjory.com.br` e evita bloqueios de cookies entre sites.

## 4. Conectar o frontend

Antes de `assets/js/config.js`, inclua na página:

```html
<script>
window.SHOPLAB_CONFIG = {
  API_BASE_URL: 'https://api.shoplab.bidjory.com.br',
  MEDIA_BASE_URL: '',
  ENVIRONMENT: 'production',
  USE_MOCK_DATA: false
};
</script>
```

Como alternativa, altere os valores padrão somente em `assets/js/config.js`. Não repita a URL em outros módulos.

## 5. Rotas incluídas

- `GET /api/v1/health`
- `GET /api/v1/categories`
- `GET /api/v1/products`
- `GET /api/v1/products/trending`
- `GET /api/v1/products/:slug`
- `GET /api/v1/products/:slug/related`
- `GET /api/v1/promotions`
- `GET /api/v1/promotions/:slug`
- `GET /api/v1/search?q=`
- `GET /api/v1/search/suggestions?q=`
- `GET /api/v1/search/trending`
- `GET /go/:produtoSlug/:ofertaId`
- `POST /api/v1/events`
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/auth/session`
- `POST /api/v1/admin/ai/product-draft`
- `GET|POST /api/v1/admin/brands`
- `PUT|DELETE /api/v1/admin/brands/:id`
- `GET|POST /api/v1/admin/partners`
- `PUT|DELETE /api/v1/admin/partners/:id`
- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/:id`

O login exige um token Turnstile válido e cria uma sessão opaca em D1 com cookie `HttpOnly`, `Secure` e `SameSite=None` para o frontend e a API em origens diferentes.

## Observações importantes

- Troque os links `example.com` das ofertas antes da produção.
- O frontend administrativo atual ainda é demonstrativo; os endpoints estão prontos para a integração dos formulários.
- Cadastre a sitekey pública do Turnstile apenas no HTML. A chave secreta fica exclusivamente no Worker.
- Restrinja `ALLOWED_ORIGINS` ao domínio real. Não use `*` com cookies.

## 6. SHOPLAB Premium com Mercado Pago

1. Em um banco D1 existente, execute uma vez `premium-subscriptions-upgrade.sql`.
2. No Mercado Pago, crie uma aplicação em **Suas integrações** e use primeiro as credenciais de teste.
3. Abra **Webhooks** na aplicação para obter a assinatura secreta. O Worker envia `https://SEU-WORKER/api/v1/payments/mercadopago/webhook` como `notification_url` ao criar cada assinatura, como exigido pelo fluxo de Assinaturas. A notificação principal é `subscription_preapproval`.
4. Copie a assinatura secreta gerada para o secret `MERCADOPAGO_WEBHOOK_SECRET` do Worker.
5. Cadastre o Access Token como secret `MERCADOPAGO_ACCESS_TOKEN`.
6. Configure `PUBLIC_SITE_URL` com a origem HTTPS do site, sem barra final.

Variáveis opcionais do plano:

- `PREMIUM_PLAN_NAME`: padrão `SHOPLAB Premium`.
- `PREMIUM_MONTHLY_PRICE_CENTS`: padrão `990` (R$ 9,90).
- `PREMIUM_AI_MONTHLY_LIMIT`: padrão `50` novas análises por mês.

Nunca coloque o Access Token nem a assinatura do webhook no frontend. O status Premium somente é atualizado depois que o Worker valida o webhook e consulta a assinatura diretamente na API do Mercado Pago.
