# Setup de infraestrutura — SHOPLAB

Este guia configura o ambiente de produção usando o Cloudflare Dashboard. O mapa completo de arquivos está no [README principal](../README.md) e as migrações estão em [docs/MIGRATIONS.md](../docs/MIGRATIONS.md).

## 1. Criar o banco D1

1. Cloudflare Dashboard → **Storage & Databases** → **D1** → crie o banco.
2. Abra o Console SQL do banco.
3. Em instalação nova, execute todo o conteúdo de `schema.sql`.
4. Em banco existente, aplique apenas as migrações relevantes descritas em `../docs/MIGRATIONS.md`.
5. Para o recurso de tipografia criado recentemente, execute `site-typography-upgrade.sql` em bancos já existentes.

## 2. Criar o bucket R2

1. Em **R2**, crie um bucket privado para os arquivos do site.
2. No Worker, crie o binding R2 com o nome exato `MEDIA`.
3. O bucket guarda fotos, banners, logos e fontes enviadas pelo painel. Não precisa expor um domínio público para ele: o Worker serve os arquivos.

## 3. Criar e configurar o Worker

1. Em **Workers & Pages**, crie ou abra o Worker de API.
2. Publique o conteúdo de `worker.js`.
3. Em **Settings → Bindings**, crie os bindings:

| Tipo | Nome exato | Necessário |
| --- | --- | --- |
| D1 Database | `DB` | Sim |
| R2 Bucket | `MEDIA` | Sim para uploads |
| Images | `IMAGES` | Não; otimização de imagens |
| Workers AI | `AI` | Não; IA e busca inteligente |

4. Em **Settings → Variables and Secrets**, configure ao menos:

| Nome | Tipo |
| --- | --- |
| `ALLOWED_ORIGINS` | Variável: uma ou mais origens do frontend, separadas por vírgula |
| `ADMIN_PASSWORD` | Secret |
| `TURNSTILE_SECRET_KEY` | Secret, se login administrativo usar Turnstile |
| `PUBLIC_SITE_URL` | Variável, se pagamentos estiverem ativos |

Os secrets opcionais são documentados na tabela do README: Stripe, Mercado Pago, Mercado Livre, Resend, vales-presente e indicações.

5. É recomendado adicionar um domínio próprio ao Worker, por exemplo `api.seudominio.com`.

## 4. Configurar Supabase Auth

1. Crie/abra o projeto Supabase.
2. Em Auth, configure as URLs de redirecionamento para `auth-callback.html` e `redefinir-senha.html` do domínio do site.
3. Copie os templates de `../supabase-email-templates/` para os modelos de e-mail correspondentes no dashboard Supabase.
4. Coloque no frontend apenas `SUPABASE_URL` e a chave publicável. Nunca use uma service role key no navegador.

## 5. Conectar o site à API

Antes de carregar `assets/js/config.js`, injete uma configuração como esta nas páginas públicas, ou ajuste os valores padrão no próprio arquivo:

```html
<script>
window.SHOPLAB_CONFIG = {
  API_BASE_URL: 'https://api.seudominio.com',
  MEDIA_BASE_URL: '',
  SUPABASE_URL: 'https://seu-projeto.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'chave-publica',
  TURNSTILE_SITE_KEY: 'sitekey-publica',
  ENVIRONMENT: 'production',
  USE_MOCK_DATA: false
};
</script>
```

## 6. Publicar o site estático

Publique a raiz deste repositório em Cloudflare Pages ou outro host estático. O diretório de saída é a própria raiz: não há build de framework.

Depois da publicação, teste:

- `GET /api/v1/health` na API;
- home, busca, produto e redirecionamento de oferta;
- login de usuário e perfil;
- login administrativo e upload de imagem;
- CORS com o domínio final;
- layout em celular;
- cache/PWA em janela anônima.

## 7. Pagamentos e cron

### Stripe

Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `PUBLIC_SITE_URL`. Aponte o webhook para `/api/v1/payments/stripe/webhook` e habilite os eventos de checkout, assinatura e fatura usados pelo negócio. Nunca processe pagamento somente pelo retorno do navegador: o Worker valida o webhook.

### Mercado Pago

Configure as chaves `MERCADOPAGO_*` necessárias ao método ativo e a rota de webhook correspondente. Faça testes no ambiente sandbox antes de produção.

### Cron

O Worker pode usar cron para rotinas de conta. O agendamento sugerido é `*/30 * * * *`; confirme a necessidade no código antes de habilitá-lo. Ele não deve ser tratado como atualizador automático de preços.

## Checklist de segurança

- Use HTTPS e domínios reais em `ALLOWED_ORIGINS`.
- Não use `*` em CORS com cookies.
- Mantenha `ADMIN_PASSWORD` longo, exclusivo e em secret.
- Rotacione qualquer secret exposto.
- Faça backup do D1 antes de migrar.
- Mantenha staging separado de produção quando houver mudança de banco, pagamento ou autenticação.