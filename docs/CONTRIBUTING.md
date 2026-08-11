# Guia de contribuição

## Antes de alterar

1. Localize o dono da funcionalidade na tabela de estrutura do README.
2. Leia a rota no Worker e o consumidor em `assets/js/api.js` antes de mudar um contrato.
3. Verifique se há CSS posterior sobrescrevendo a regra que você pretende alterar: `main.css` contém camadas históricas de responsividade.
4. Trabalhe em branch e mantenha mudanças pequenas e revisáveis.

## Mudanças de frontend

- Use `data-page` em páginas públicas novas.
- Reutilize funções de `app.js` e `api.js`; não copie lógica de fetch entre páginas.
- Todo texto vindo da API deve passar pelas funções de escape existentes antes de entrar em HTML.
- Teste em largura mobile e desktop. Cards, cabeçalho fixo e navegação inferior têm regras específicas no celular.
- Quando alterar arquivos estáticos cacheados, atualize a versão `?v=` dos HTMLs e revise `sw.js`.

## Mudanças de API e Worker

- Adicione a rota em `route()` antes de rotas genéricas que possam capturá-la.
- Valide método HTTP, autorização, permissão, tipo e tamanho de entrada.
- Responda pelo helper padrão, preservando o envelope da API.
- Para rotas administrativas, inclua o mapeamento de permissão; a checagem deve ser no servidor.
- Não registre token, senha, cartão, código de vale ou conteúdo sensível em logs/auditoria.

## Banco D1

- Para banco novo, atualize `schema.sql`.
- Para banco existente, crie um arquivo `cloudflare-dashboard/<assunto>-upgrade.sql` idempotente quando possível.
- Nunca reescreva uma migração já executada em produção.
- Documente a nova migração em `docs/MIGRATIONS.md` e no setup quando for uma etapa obrigatória.

## Mídia e fontes

- Uploads passam pelo Worker e R2; não grave URLs arbitrárias no frontend como substituto.
- Preserve validação de MIME, tamanho e remoção de arquivo substituído.
- Para fonte externa/comprada, confirme licença webfont antes de enviar.

## Verificação mínima

```powershell
node --check cloudflare-dashboard/worker.js
node --check assets/js/app.js
node --check assets/js/admin-v2.js
git diff --check
```

Depois, navegue nas páginas afetadas, confira console/rede e teste uma conta comum e uma conta administrativa quando a mudança envolver autenticação ou permissões.