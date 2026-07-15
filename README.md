# SHOPLAB frontend

Frontend estático em HTML, CSS e JavaScript com módulos ES. Não contém Worker, banco, servidor, segredo ou autenticação local.

## Como abrir

Sirva a pasta com qualquer servidor estático (por exemplo, a extensão Live Server do VS Code). Abrir diretamente por `file://` pode bloquear os mocks JSON por política do navegador.

## Dados e futura API

`assets/js/config.js` centraliza `API_BASE_URL`, `MEDIA_BASE_URL` e `USE_MOCK_DATA`. Com mocks ativos, `assets/js/api.js` lê `assets/mock/`. Para conectar o Worker, configure a URL, desligue `USE_MOCK_DATA` e implemente os endpoints `/api/v1/products`, `/api/v1/categories`, `/api/v1/search`, rotas administrativas e de eventos. Todas as chamadas passam pela camada de API.

## Estrutura

- `assets/css`: tokens, temas e componentes responsivos.
- `assets/js`: configuração, API e renderização reutilizável.
- `assets/mock`: 12 produtos e 5 categorias demonstrativas.
- `admin/`: login, dashboard, listagem e formulário, apenas interface.
- arquivos HTML públicos: home, catálogo, produto, busca, promoções e páginas institucionais.

## Tema e páginas

O tema respeita o sistema na primeira visita, é alternado no cabeçalho e salvo no `localStorage`. Novas páginas devem definir `data-page` no `body` e reutilizar `assets/js/app.js`; componentes e dados não devem ser duplicados no HTML.

## Hospedagem

Publique a pasta como site estático no Cloudflare Pages. Recursos reais de login, upload, preço, redirecionamento afiliado, analytics e persistência dependem do backend Cloudflare separado.
