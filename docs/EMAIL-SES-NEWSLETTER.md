# Amazon SES e newsletter inteligente

O Worker envia e-mails por SES v2 com AWS Signature V4, sem SDK no bundle. `services/email/provider.js` é a única camada autorizada a chamar SES. Autenticação do usuário continua no Supabase; seus templates e links sensíveis não usam tracking da newsletter.

## Segurança de devteste

`wrangler.jsonc` fixa `EMAIL_ENV=test`. Nesse modo todo destinatário é substituído por `EMAIL_TEST_RECIPIENT`, e o log estruturado começa com `[EMAIL TEST MODE]`, incluindo destinatário original/de teste e IDs disponíveis. A decisão depende da variável, não da branch.

Secrets obrigatórios no Worker:

- `AWS_SES_ACCESS_KEY_ID`
- `AWS_SES_SECRET_ACCESS_KEY`
- `EMAIL_TEST_RECIPIENT`
- `NEWSLETTER_TOKEN_SECRET` (aleatório, mínimo 32 caracteres)
- `SES_EVENT_WEBHOOK_SECRET` (aleatório, mínimo 32 caracteres)

Variáveis: `AWS_SES_REGION=us-east-2`, `AWS_SES_FROM_TRANSACTIONAL`, `AWS_SES_FROM_NEWSLETTER`, `AWS_SES_CONFIGURATION_SET` (newsletter), `AWS_SES_TRANSACTIONAL_CONFIGURATION_SET` (opcional, sem tracking de links sensíveis), `PUBLIC_SITE_URL` e `EMAIL_ENV`.

## Provisionamento manual

1. Aplicar `cloudflare-dashboard/newsletter-upgrade.sql` no D1.
2. Criar as Queues `shoplab-newsletter-devteste` e `shoplab-newsletter-devteste-dlq` antes do deploy.
3. Reutilizar o configuration set existente quando apropriado; não criar duplicado. Para marketing, habilitar SEND, DELIVERY, OPEN, CLICK, BOUNCE, COMPLAINT, REJECT e SUBSCRIPTION.
4. Criar regra EventBridge para eventos SES e API Destination `POST https://shoplab.com.br/api/v1/email/events/ses`, enviando `x-shoplab-ses-webhook-secret` com o mesmo valor do secret do Worker.
5. Conceder à chave IAM somente `ses:SendEmail` sobre identidades/configuration sets necessários.

## Testes seguros

- Opt-in: entrar, abrir uma notícia e ativar; repetir não duplica porque `user_id` é único.
- Opt-out: desativar no card ou abrir o link assinado do e-mail; não exige login e preserva histórico.
- Envio: publicar com “Automático”. A publicação termina antes da segmentação; a Queue cria entregas idempotentes e o SES envia somente ao endereço de teste.
- Open/click: encaminhar payload EventBridge com `messageId` conhecido e o header secreto. Repetir o mesmo payload deve retornar `duplicate:true`.
- Bounce permanente/complaint: encaminhar eventos e confirmar subscriber `suppressed`; soft bounce não suprime imediatamente.
- Throttling: consumer único, lote de 10 e espaçamento de 100 ms mantêm alvo aproximado de 10 mensagens/s, abaixo da cota de 14/s.

Antes de produção, trocar explicitamente `EMAIL_ENV=production`, revisar remetentes, IAM, configuration set, EventBridge, alarmes da DLQ e executar um canário controlado. Não remover secrets antigos de produção automaticamente; o secret do provedor legado pode ser removido manualmente após o deploy SES validado.
