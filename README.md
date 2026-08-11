# SHOPLAB

Plataforma de descoberta, comparação e indicação de produtos. O repositório contém o site público estático, o painel administrativo, o Worker que expõe a API e os scripts SQL do banco Cloudflare D1.

> Para começar: leia este arquivo, execute as migrações em [docs/MIGRATIONS.md](docs/MIGRATIONS.md) e siga [cloudflare-dashboard/SETUP.md](cloudflare-dashboard/SETUP.md) para configurar os serviços na Cloudflare.

## Visão geral da arquitetura

```text
Navegador
├─ Site público: HTML + CSS + módulos JavaScript
├─ Painel /admin: HTML + CSS + módulos JavaScript
└─ Supabase Auth: login e sessão do usuário final
          │
          ▼
Cloudflare Worker (cloudflare-dashboard/worker.js)
├─ API pública, API administrativa e redirecionamento de afiliados
├─ autorização e auditoria administrativa
├─ integrações de pagamento, IA, e-mail e Mercado Livre
├─ D1 / DB: catálogo, ofertas, configurações, usuários e registros
├─ R2 / MEDIA: imagens, banners, fontes e outros arquivos enviados
├─ Images / IMAGES: variações responsivas de imagem (opcional)
└─ Workers AI / AI: busca e recursos inteligentes (opcional)
```

## Estrutura do repositório

| Local | Responsabilidade | Quando alterar |
| --- | --- | --- |
| `index.html`, `produto.html`, `produtos.html` e outras páginas raiz | Páginas públicas e metadados SEO | Criar ou ajustar uma tela pública |
| `admin/` | Páginas do painel | Criar ou ajustar uma tela administrativa |
| `assets/css/tokens.css` | Tokens de cor, espaçamento e tema | Ajuste global de identidade visual |
| `assets/css/main.css` | Visual do site público e responsividade | Componentes e páginas públicas |
| `assets/css/admin.css` | Visual do painel | Componentes administrativos |
| `assets/js/app.js` | Casca do site, cabeçalho, cards e renderização de páginas | Componentes públicos compartilhados |
| `assets/js/api.js` | Única camada de acesso à API do Worker | Novo endpoint público ou administrativo |
| `assets/js/auth.js` | Cliente Supabase Auth e chamadas autenticadas do usuário | Login, perfil e recuperação de senha |
| `assets/js/admin-v2.js` | Funcionalidades do painel moderno | Recursos administrativos |
| `assets/js/config.js` | URLs e chaves públicas do navegador | Trocar ambiente ou domínio de API |
| `assets/js/mobile-enhancements.js` | Comportamentos específicos de celular | Cabeçalho, navegação e UX mobile |
| `assets/js/pwa.js`, `sw.js`, `manifest.webmanifest` | PWA e cache offline | Alterar comportamento de instalação/cache |
| `assets/mock/` | Dados de demonstração para desenvolvimento sem API | Protótipos e testes visuais |
| `cloudflare-dashboard/worker.js` | Backend inteiro: rotas, regras de negócio e integrações | API, validação e persistência |
| `cloudflare-dashboard/schema.sql` | Esquema completo para um banco D1 novo | Nova tabela ou coluna em instalação nova |
| `cloudflare-dashboard/*-upgrade.sql` | Migrações incrementais de banco existente | Mudança compatível no D1 já em uso |
| `supabase-email-templates/` | Templates de e-mail para configurar no Supabase | Alterar e-mails de autenticação |
| `_headers`, `robots.txt`, `sitemap.xml` | Cabeçalhos, rastreamento e SEO | Publicação e indexação |

## Frontend

O frontend não usa framework nem etapa de build: é servido como arquivos estáticos com módulos ES nativos. Isso torna a publicação simples, mas exige disciplina:

1. Não coloque dados de produto diretamente no HTML; obtenha-os por `assets/js/api.js`.
2. Não repita `API_BASE_URL` em módulos. A fonte única é `assets/js/config.js` ou `window.SHOPLAB_CONFIG` antes desse módulo ser carregado.
3. Toda página pública deve ter `data-page` no `body`. O `app.js` usa esse valor para montar a tela e aplicar regras específicas.
4. Após alterar CSS ou JS público, atualize a versão `?v=` referenciada nos HTMLs e, quando aplicável, a versão em `sw.js`. Isso evita que o PWA mantenha arquivos antigos.
5. Para editar o visual global, prefira tokens e regras finais bem identificadas em `main.css`; evite criar regras duplicadas para o mesmo seletor.

### Páginas públicas principais

- `index.html`: home e vitrines.
- `produtos.html`, `categoria.html`, `busca.html`, `marca.html`, `colecao.html`: descoberta de catálogo.
- `produto.html`: detalhe, galeria, oferta, avaliações e recomendados.
- `comparar.html`: comparação de produtos.
- `conta.html`: biblioteca e dados do usuário autenticado.
- `entrar.html`, `cadastro.html`, `recuperar-senha.html`, `redefinir-senha.html`, `auth-callback.html`: autenticação Supabase.
- `premium-checkout.html`: fluxo visual do SHOPLAB+.

### Configuração do navegador

`assets/js/config.js` aceita valores injetados antes da carga do módulo:

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

Chaves públicas podem estar no frontend. Secrets nunca podem estar nele.

## Backend: Cloudflare Worker

O Worker em `cloudflare-dashboard/worker.js` é o backend. Ele não depende de Node, Express ou servidor próprio. O roteador fica no início do arquivo, e as funções de domínio aparecem abaixo dele.

### Domínios funcionais do Worker

| Área | Exemplos de rotas | Onde procurar |
| --- | --- | --- |
| Saúde e configuração | `/api/v1/health`, `/api/v1/site-config` | função `route` e configuração do site |
| Catálogo e busca | categorias, produtos, ofertas, promoções, coleções, busca | funções de catálogo e FTS |
| Mídia | `/media/...` e upload no admin | funções de R2/Images |
| Usuário final | `/api/v1/user/...` | perfil, biblioteca, avaliações, histórico e indicações |
| Pagamentos | `/api/v1/payments/...` | Stripe e Mercado Pago |
| Administração | `/api/v1/admin/...` | autenticação, permissões, CRUD e auditoria |
| Afiliados | `/go/:produtoSlug/:ofertaId` | redirecionamento e evento de clique |

As rotas são implementadas no próprio `route()`. Ao criar uma rota, mantenha a ordem: rotas exatas antes de rotas dinâmicas, valide método HTTP, valide entrada, confira permissão quando for admin e use `respond()` para preservar o formato de resposta.

### Contrato da API

A API devolve JSON no formato `success`, `data`, `meta` e `error`. O frontend já extrai `data` em `api.js`. Não altere esse envelope sem atualizar todos os consumidores.

## Dados e serviços externos

### Cloudflare D1 — binding obrigatório `DB`

Banco SQLite gerenciado usado para catálogo, ofertas, promoções, usuários, sessões administrativas, configurações do site, temas, tipografia, auditoria, pagamentos e caches de análise. Valores monetários são armazenados em centavos.

Crie um banco novo com `schema.sql`. Em banco existente, aplique também as migrações correspondentes; veja [docs/MIGRATIONS.md](docs/MIGRATIONS.md).

Para executar a API sobre AWS RDS/Aurora, PostgreSQL, MySQL ou outro provedor, consulte o [guia de portabilidade de banco](docs/DATABASE-PORTABILITY.md).

### Cloudflare R2 — binding obrigatório `MEDIA`

Armazena imagens de produtos, banners, logos, fontes enviadas pelo painel e demais arquivos de mídia. O Worker é responsável por validar upload, construir URLs e remover arquivos substituídos. Não exponha um bucket privado diretamente sem passar pelas rotas e políticas do Worker.

### Cloudflare Images — binding opcional `IMAGES`

Gera versões responsivas para mídia. Se estiver ausente, o Worker continua entregando o arquivo original do R2.

### Workers AI — binding opcional `AI`

Usado em interpretação de busca, rascunhos de produto, análise, recomendações e recursos SHOPLAB+. Há fallback para busca convencional quando a IA não está disponível.

### Supabase Auth

O Supabase autentica usuários finais. O navegador mantém o token em `localStorage` via `assets/js/auth.js`; o Worker recebe o token Bearer nas rotas de usuário e valida o contexto. Os templates em `supabase-email-templates/` são para colar no painel de e-mails do Supabase.

O login administrativo é separado: sessão opaca em D1, cookie seguro e permissões por função/colaborador. Não misture usuários Supabase com colaboradores administrativos.

### Pagamentos e e-mail

- Stripe: assinatura e passe SHOPLAB+, com webhook validado pelo Worker.
- Mercado Pago: checkout/webhooks e integrações relacionadas.
- Resend: envio de e-mails de recompensas/Premium quando configurado.
- Mercado Livre: importação e atualização manual de informações/preços quando configurado.

## Bindings, variáveis e secrets do Worker

Configure isto no dashboard do Worker. O projeto não possui `wrangler.toml` versionado, portanto nomes de bindings e secrets precisam ser mantidos exatamente como abaixo.

| Nome | Tipo | Obrigatório | Uso |
| --- | --- | --- | --- |
| `DB` | D1 binding | Sim | Banco principal |
| `MEDIA` | R2 binding | Sim para uploads | Arquivos enviados |
| `IMAGES` | Images binding | Não | Variações responsivas |
| `AI` | Workers AI binding | Não | IA e busca inteligente |
| `ALLOWED_ORIGINS` | Variável | Sim em produção | Origens CORS, separadas por vírgula |
| `PUBLIC_SITE_URL` | Variável | Pagamentos | URL HTTPS do site, sem barra final |
| `ADMIN_PASSWORD` | Secret | Sim | Acesso administrativo inicial |
| `TURNSTILE_SECRET_KEY` | Secret | Sim para login admin | Validação Turnstile |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Secrets | Se Stripe ativo | Cobrança e webhook |
| `MERCADOPAGO_*` | Secrets/variáveis | Se Mercado Pago ativo | Cobrança e webhook |
| `MERCADOLIVRE_CLIENT_ID`, `MERCADOLIVRE_CLIENT_SECRET` | Secrets | Se importação ativa | API Mercado Livre |
| `RESEND_API_KEY` | Secret | Se e-mail ativo | Disparo de e-mails |
| `GIFT_CARD_ENCRYPTION_KEY` | Secret | Se vale-presente ativo | Criptografia de códigos |
| `REFERRAL_HASH_SECRET` | Secret | Se indicações ativas | Proteção de identificadores |
| `PREMIUM_*`, `AI_GATEWAY_ID`, `REWARD_EMAIL_FROM`, `STRIPE_BRAND_LOGO_URL` | Variáveis | Opcionais | Regras de negócio e apresentação |

Nunca salve secrets em `worker.js`, HTML, CSS, arquivos `.env` commitados ou documentação com valores reais.

## Administração e permissões

As telas administrativas estão em `admin/`; a lógica está principalmente em `assets/js/admin-v2.js`; a API correspondente começa em `/api/v1/admin/`.

O Worker tem permissões granulares para catálogo, preços, categorias, parceiros, promoções, banners, anúncios de cabeçalho, aparência, IA, Premium, usuários e colaboradores. Toda mutação administrativa bem-sucedida registra uma entrada de auditoria. Ao acrescentar uma tela administrativa, crie a permissão correspondente e aplique a verificação no Worker — esconder um botão no frontend não é controle de acesso.

A tela `admin/temas.html` administra tema e tipografia global. Fontes personalizadas são armazenadas no R2; use apenas arquivos que a empresa esteja licenciada a utilizar.

## Desenvolvimento local

### Site estático

Sirva a raiz com um servidor estático, por exemplo Live Server do VS Code. Não abra via `file://`, porque o navegador pode bloquear módulos e JSON.

Para trabalhar sem backend:

```js
window.SHOPLAB_CONFIG = { USE_MOCK_DATA: true };
```

Nesse modo, `assets/mock/products.json` e `assets/mock/categories.json` alimentam a interface. Recursos autenticados, upload e funções administrativas não terão persistência real.

### Worker

A configuração de Wrangler não está versionada neste repositório. Para desenvolvimento local do Worker, crie uma configuração local não versionada com bindings `DB`, `MEDIA`, `IMAGES` e `AI` conforme o ambiente; não comite IDs de produção nem secrets. Antes de publicar, valide a sintaxe:

```powershell
node --check cloudflare-dashboard/worker.js
node --check assets/js/app.js
node --check assets/js/admin-v2.js
```

## Publicação

1. Aplique `schema.sql` ou as migrações necessárias no D1.
2. Confirme bindings, variáveis e secrets no Worker.
3. Publique `cloudflare-dashboard/worker.js` no Worker configurado.
4. Publique a raiz do repositório como site estático (por exemplo, Cloudflare Pages).
5. Defina `API_BASE_URL` com o domínio do Worker e `USE_MOCK_DATA: false`.
6. Confira CORS, login, upload, página de produto, `/api/v1/health`, redirecionamento de oferta e os webhooks de pagamento.
7. Em alterações de CSS/JS, atualize cache/PWA e teste em uma janela anônima e em celular.

É recomendado usar domínio próprio para a API sob o mesmo domínio principal do site, como `api.exemplo.com`; isso reduz problemas de cookie e CORS.

## Segurança e operação

- Restrinja `ALLOWED_ORIGINS`; não use `*` junto com cookies.
- Mantenha Turnstile e webhooks em HTTPS.
- Revogue ou altere um secret se ele vazar. Não basta apagar o arquivo.
- Teste alterações de banco em cópia/staging antes da produção.
- Nunca edite uma migração já aplicada em produção: crie uma nova migração incremental.
- Faça backup/export do D1 antes de migrações grandes.
- Monitore erros do Worker no dashboard e use o `requestId` retornado pela API para rastrear falhas.

## Como contribuir

Leia [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). Em resumo: preserve o contrato da API, não introduza segredos, evite duplicação de CSS, adicione migração para mudanças de banco e valide as páginas afetadas em desktop e celular.

## Documentos relacionados

- [Guia de setup Cloudflare](cloudflare-dashboard/SETUP.md)
- [Mapa de migrações](docs/MIGRATIONS.md)
- [Guia de contribuição](docs/CONTRIBUTING.md)
- [Templates de e-mail Supabase](supabase-email-templates/README.md)