# Catálogo por categorias, subcategorias e coleções

## Arquitetura e reaproveitamento

A ShopLab continua usando HTML/CSS, módulos JavaScript nativos, o mesmo Worker e o binding D1 `DB`. Marcas, produtos, ofertas, mídia R2, cards, comparador, busca FTS, autenticação e auditoria existentes foram reaproveitados.

- `products.category_id`: categoria principal. `categories.parent_id`: no máximo um nível de subcategoria no painel.
- `product_classification.subcategory_id`: classificação específica, sem duplicar o produto.
- `product_collections` e `product_collection_items`: coleções e associação many-to-many já existentes.
- `collection_type=manual`: produtos escolhidos pelo administrador; `dynamic`: consulta pelas regras; `legacy`: preserva a união de produtos e categorias das vitrines antigas.
- `features` e `product_features`: características normalizadas. Triggers sincronizam os nomes com `products.tags_json`, mantendo a busca e clientes antigos compatíveis.
- `brands` e `products.brand_id`: permanecem sendo a fonte de marcas.

A implementação não recategoriza automaticamente itens de categorias amplas como Tecnologia. As categorias iniciais continuam sendo os registros existentes; novas categorias e subcategorias podem ser cadastradas no painel, sem alterar código. As listas de exemplos do pedido não são uma enumeração fixa do frontend.

## Tabelas adicionadas

| Tabela | Finalidade |
| --- | --- |
| `category_metadata` | Título e descrição SEO, ligados à categoria existente |
| `collection_metadata` | Categoria relacionada, tipo, grupo de descoberta, regras JSON versionadas, banner, SEO e guia de compra |
| `features` | Nome, slug, status e datas das características |
| `product_features` | Relação many-to-many produto/característica |
| `product_classification` | Subcategoria de cada produto |
| `catalog_aliases` | Caminhos anteriores, vinculados ao ID estável do registro |
| `catalog_migrations` | Registro da execução do backfill, evitando reaplicá-lo sobre edições posteriores |

Nome, descrição, status, ordem, imagens e datas das categorias continuam nas tabelas originais. As coleções reutilizam `is_home_featured`, `home_sort_order` e `home_title` para destaque, ordem e título da vitrine. Instalações novas também recebem esses campos e `product_collection_categories`, ausentes no schema-base anterior.

## Migração

1. Faça export/backup do D1 e valide primeiro em uma cópia do banco.
2. Em banco existente, confirme que `product-collections-upgrade.sql` e as migrações de imagem de categoria já foram aplicados. Não reaplique os `ALTER TABLE` de migrações antigas já executadas.
3. Execute `cloudflare-dashboard/catalog-discovery-upgrade.sql` antes de publicar este Worker e os arquivos estáticos. Em banco novo, use `schema.sql`, que já inclui a nova estrutura.
4. Mantenha a migração de busca existente (`search-upgrade.sql`) instalada para os endpoints de busca FTS.
5. Publique Worker, assets e a configuração atualizada de `wrangler.jsonc` juntos. As URLs limpas precisam do binding `ASSETS` no Worker que atende o domínio público; publicar somente a API em outro domínio não cria essas rotas no servidor de arquivos.

A migração mantém IDs, produtos, marcas, ofertas e relações existentes. Produtos anteriormente vinculados a uma categoria-filha passam a ter a categoria-pai como principal e mantêm a filha em `product_classification`. Vitrines antigas que incluem categorias inteiras conservam esse comportamento, inclusive quando incluíam subcategorias.

O backfill é registrado uma vez e pode ser reexecutado sem restaurar associações removidas posteriormente pelo editor. A verificação inicial interrompe a execução antes do backfill se encontrar hierarquia com mais de dois níveis ou ciclos. Nesse caso, revise a hierarquia antes de continuar; a tabela auxiliar `catalog_hierarchy_requires_review` pode permanecer vazia após a falha e será reutilizada/removida na próxima execução bem-sucedida.

A migração não foi aplicada ao D1 de produção durante este trabalho. Para rollback de dados, use o backup revisado; não remova as tabelas novas nem reverta associações às cegas.

## Endpoints

Todos usam o envelope atual `{success,data,meta,error}`.

| Método e caminho | Comportamento |
| --- | --- |
| `GET /api/v1/discovery?path=/celulares` | Metadados, subcategorias, coleções relacionadas, facetas e produtos paginados |
| `GET /api/v1/admin/taxonomy` | Dados dos seletores administrativos; `view=categories`, `features` ou `product` reduz as leituras |
| `POST /api/v1/admin/taxonomy/categories` | Criar categoria/subcategoria |
| `POST /api/v1/admin/taxonomy/collections` | Criar coleção manual/dinâmica |
| `POST /api/v1/admin/taxonomy/features` | Criar característica |
| `PUT /api/v1/admin/taxonomy/{recurso}/{id}` | Editar registro |
| `DELETE /api/v1/admin/taxonomy/{recurso}/{id}` | Desativar, mantendo dados e associações |
| `POST /api/v1/admin/taxonomy/{categories ou collections}/{id}/image` | Upload multipart `image`, pelo helper R2 existente |
| `POST /api/v1/admin/taxonomy/preview` | Prévia da seleção manual ou das regras antes de salvar |
| `GET/PUT /api/v1/admin/products/{id}/classification` | Categoria, subcategoria, marca, características e coleções manuais do produto |

As rotas administrativas continuam atrás da sessão e da autorização no servidor. Gestão de taxonomia usa `categories.manage`; edição da classificação usa `products.edit`; leitura para o editor usa `products.view`. Marcas mantêm suas permissões e telas anteriores.

`GET /api/v1/categories` recebe os campos adicionais `parentId` e `path`. Os endpoints públicos existentes de coleções continuam disponíveis e passam a usar o mesmo compilador de regras. O detalhe de coleção inclui `total`, `page` e `limit`; clientes devem paginar, em vez de pressupor a coleção inteira em uma resposta.

## Regras dinâmicas

Exemplo: celulares até R$ 2.000 (IDs reais do banco, preço em centavos):

```json
{"version":1,"categoryId":"id-da-categoria","maxPriceCents":200000,"featureIds":["id-da-caracteristica"]}
```

Campos suportados: `categoryId`, `subcategoryId`, `brandId`, `minPriceCents`, `maxPriceCents`, `minScore`, `featured` e `featureIds`. Todas as condições são combinadas por AND; todas as características selecionadas são obrigatórias. Somente produtos `published` entram em páginas públicas. `status=active` ou `published` é aceito por compatibilidade e não libera rascunhos.

Valores e identificadores são vinculados como parâmetros SQL. Campos desconhecidos, tipos inválidos, intervalos invertidos e referências inexistentes são rejeitados. O preço segue a fonte atual do catálogo: oferta principal, com fallback para `base_price_cents`. Os resultados acompanham mudanças de preço/status, respeitando o cache.

O compilador versionado é o ponto de extensão para futuras regras de especificações, avaliações ou popularidade. Nenhuma geração por IA foi adicionada.

## Páginas, navegação e SEO

- Categoria: `/{slug}`; subcategoria: `/{categoria}/{slug}`.
- Coleção relacionada: `/{categoria}/{slug}`; coleção transversal: `/colecoes/{slug}`.
- `categoria[.html]?slug=...` e `colecao[.html]?slug=...` redirecionam com 301 para o caminho atual. Slugs antigos são resolvidos por aliases, incluindo mudanças do slug da categoria-pai.
- As páginas são geradas pelo Worker com title, description, canonical, H1, breadcrumbs, JSON-LD e links de produtos antes de executar JavaScript. O sitemap inclui categorias e coleções ativas com URLs canônicas.
- Filtros mantêm a canonical da categoria/coleção e recebem `noindex,follow`.
- A descoberta agrupa coleções por necessidade, orçamento e destaque. O cabeçalho usa categorias do banco.
- Os cards existentes ganham opção de comparação nas páginas de descoberta. O controlador do comparador foi tornado idempotente para suportar atualizações dos resultados.
- Ads recebem o contexto da categoria nas novas rotas; links de produto, afiliados e eventos existentes são reutilizados.

## Componentes e limites

`assets/js/admin-taxonomy.js` integra categorias, subcategorias, coleções e características ao roteador administrativo. Marcas seguem no módulo anterior. O painel de classificação é montado no editor de produtos e atualizado após seu salvamento, inclusive após criar um produto.

`assets/js/catalog-discovery.js` usa a camada `api.js`, os cards e o comparador existentes. Filtros e paginação fazem consultas ao servidor. A seleção manual mantém os checkboxes ao filtrar por nome e preserva vínculos de produtos fora da lista carregada.

A paginação pública usa 24 itens, com máximo de 48 por requisição. O seletor de coleções carrega até 1.000 produtos; outros podem ser associados pelo editor individual. A lista pública de características disponíveis tem limite de 500. Metadados administrativos usam consultas agrupadas; as vitrines da home conservam o limite de oito coleções e carregamento em batch. Índices cobrem slugs, categorias, subcategorias, status, preço e ambos os sentidos dos vínculos many-to-many.

O HTML de descoberta tem cache de 60 segundos e o cliente limita seu cache de resultados a 60 segundos. A home mantém sua política anterior. Os HTMLs receberam atualização de versão de JS/CSS. `sw.js` já desregistra o service worker antigo e limpa seus caches, por isso não foi reativado nem modificado.

## Validação

Execute com Node 24 ou superior (SQLite nativo):

```powershell
node --test tests/catalog-discovery.test.mjs
node --check cloudflare-dashboard/worker.js
node --check assets/js/app.js
node --check assets/js/admin-v2.js
node --check assets/js/admin-app.js
node --check assets/js/admin-taxonomy.js
node --check assets/js/catalog-discovery.js
node --check assets/js/api.js
node --check assets/js/compare.js
node --check assets/js/shoplab-ads-public.js
git diff --check
```

20 testes passaram: schema novo, replay da migração, backfill legado, hierarquia, regras e intervalos, preço-limite, rascunhos, paginação, múltiplas coleções, características, sincronização de tags, busca FTS, filtros de subcategoria, aliases/301, SEO HTML, autorização, ofertas principais duplicadas, controles de imagem e upload R2 com doubles locais.

No navegador, com servidor local e SQLite em memória: criação de categoria pelo painel, edição e prévia de coleção dinâmica, gravação de classificação/subcategoria/características, filtros públicos, canonical/noindex, seleção de dois produtos no comparador, navegação por categorias e larguras de desktop e 390 px. O excesso de largura do painel móvel foi corrigido. Não houve erros de console nas páginas públicas e administrativas verificadas.

O repositório não possui `package.json`, configuração TypeScript ou tarefas de lint/build; o frontend utiliza módulos ES sem build. Não foram executadas integrações reais de pagamentos, afiliados, IA, analytics remoto ou escrita no catálogo de produção. Os testes locais não substituem a validação de implantação em uma cópia do D1 com a configuração real de domínio/assets.