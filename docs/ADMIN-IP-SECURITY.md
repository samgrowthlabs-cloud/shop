# Protecao do Admin por IP

O Worker protege `admin.shoplab.com.br` e todas as rotas `/api/v1/admin/*` antes de servir a aplicacao. O IP e lido exclusivamente de `CF-Connecting-IP`. A allowlist autoritativa fica no D1 (`admin_ip_allowlist`) e e mantida em cache por no maximo 5 segundos em cada isolate. Falha de leitura, IP ausente ou IP invalido negam o acesso.

## Implantacao

1. Antes do deploy, descubra o IP publico atual do proprietario por um canal confiavel.
2. Configure uma allowlist de bootstrap/recuperacao como secret (aceita IPv4, IPv6 e CIDR separados por virgula):

   `npx wrangler secret put ADMIN_RECOVERY_IPS`

3. Execute a migration:

   `npx wrangler d1 execute shoplab --remote --file cloudflare-dashboard/admin-ip-security-upgrade.sql`

4. Publique o Worker com `npx wrangler deploy`. O `wrangler.jsonc` ja associa o custom domain `admin.shoplab.com.br` e executa o Worker antes da rota `/seguranca`.
5. Entre no Admin a partir do IP de recuperacao, abra **Seguranca**, use **Adicionar meu IP atual** e confirme a senha atual do proprietario.

`ADMIN_RECOVERY_IPS` nao ignora login, sessao ou RBAC; ele apenas participa da barreira de rede. Depois do cadastro normal, mantenha-o como um acesso de emergencia estritamente controlado ou remova-o com `npx wrangler secret delete ADMIN_RECOVERY_IPS`. Para recuperar um lockout, atualize esse secret no ambiente Cloudflare a partir de uma conta protegida por MFA, acesse o painel, corrija a allowlist e remova/rotacione o secret. Nao existe URL publica de bypass.

## Operacao

- Apenas o ator `owner` pode listar ou alterar a allowlist.
- Toda mutacao exige novamente `ADMIN_PASSWORD`.
- A revogacao invalida o cache local imediatamente e os demais isolates em ate 5 segundos.
- O ultimo registro ativo do D1 nao pode ser revogado.
- Faixas maiores que `/24` (IPv4) ou `/64` (IPv6) exigem confirmacao explicita.
- Eventos de bloqueio, erro, inclusao, edicao e revogacao ficam em `admin_security_events` e nao possuem endpoint de exclusao.

## Dispositivos confiaveis

A migration `admin-trusted-devices-upgrade.sql` adiciona o modo hibrido, mas preserva `strict` como padrao. Tokens possuem 256 bits aleatorios, duram 180 dias, ficam apenas no cookie `shoplab_trusted_device` (`Secure`, `HttpOnly`, `SameSite=None`, `Path=/api/v1/`) e somente SHA-256 e armazenado no D1. O token gira depois de cada desafio de nova rede.

`https://admin.shoplab.com.br/admin-access` e o unico corredor que ignora a allowlist inicial, inclusive quando a politica continua em modo estrito. Ele permite somente consultar o estado do proprio fluxo, autenticar com Turnstile, criar/consultar uma solicitacao e consumir uma aprovacao mediante o desafio secreto. As APIs `/api/v1/admin/*` continuam fail-closed. No modo hibrido, uma concessao temporaria dura 2 horas e vincula IP, hash da sessao, dispositivo e identidade.

### Solicitacoes de colaboradores

A migration `admin-device-requests-upgrade.sql` cria pedidos com duracao de 10 minutos e estados `PENDING`, `APPROVED`, `DENIED`, `EXPIRED` e `CONSUMED`. Em bancos onde essa tabela ja existe, execute tambem `admin-device-request-metadata-upgrade.sql` antes do deploy do Worker para adicionar o snapshot de e-mail e o pais detectado pela Cloudflare. O navegador gera um desafio de 256 bits e guarda-o em `sessionStorage`; o D1 recebe somente SHA-256. O `request_id` sem esse desafio nao permite consultar nem consumir a aprovacao.

O proprietario aprova ou nega no Admin com reautenticacao, mas nunca recebe o token final. Autorizar o IP observado e uma escolha separada, desmarcada por padrao; aprovar apenas o dispositivo nao altera a allowlist. Depois da aprovacao, o navegador original envia o desafio pelo header `X-Device-Request-Secret`, o Worker revalida sessao, identidade, colaborador ativo, status e expiracao, cria o Trusted Device e marca o pedido como `CONSUMED` atomicamente. Sao permitidos no maximo tres pedidos por colaborador ou IP em uma janela de dez minutos; desafios invalidos acumulam tentativas e o pedido e negado na oitava falha. O polling ocorre a cada sete segundos e para nos estados terminais.
