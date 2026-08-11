# Portabilidade de banco de dados

O Worker depende de uma interface pequena de banco, e n?o de D1 nas regras de neg?cio:
`prepare(sql)`, `bind(...valores)`, `first()`, `all()`, `run()` e `batch()`.

## Provedores suportados

| Configura??o | Uso |
| --- | --- |
| `DB_PROVIDER=d1` (padr?o) | Cloudflare D1 pelo binding `DB`. N?o muda nada na instala??o atual. |
| `DB_PROVIDER=http-gateway` | Um gateway privado executa consultas no banco escolhido. Indicado para AWS RDS/Aurora, Neon, Supabase Postgres ou infraestrutura pr?pria. |

No modo `http-gateway`, configure estes secrets no Worker:

| Nome | Descri??o |
| --- | --- |
| `DATABASE_GATEWAY_URL` | URL HTTPS interna do gateway, sem a barra final. |
| `DATABASE_GATEWAY_TOKEN` | Token Bearer exclusivo do Worker. Nunca vai para o navegador. |

O Worker chama `POST {DATABASE_GATEWAY_URL}/v1/database/execute`:

```json
{
  "statements": [
    { "sql": "SELECT id FROM products WHERE slug=?", "values": ["exemplo"] }
  ]
}
```

A resposta deve usar este envelope. Para `first`, `all` e `run`, o gateway devolve
um item em `results`, com `result` contendo respectivamente um objeto/null, uma lista,
ou o resultado da muta??o. Em lotes, devolva um item por instru??o no formato compat?vel
com D1 (consultas usam `{ "results": [...] }`).

```json
{ "success": true, "results": [{ "result": { "id": "produto_1" } }] }
```

## Exemplo na AWS

Crie uma API privada (API Gateway + Lambda, ou servi?o ECS) dentro da VPC do RDS/Aurora.
Ela valida o token, aceita somente o contrato acima, usa consultas parametrizadas e limita
tempo, tamanho de lote e permiss?es ao banco da aplica??o. O Worker aponta para essa API.
O frontend continua usando a mesma API p?blica; nenhuma credencial do banco ? exposta.

## Roteiro de migra??o

1. Fa?a backup e restaure em um ambiente de homologa??o.
