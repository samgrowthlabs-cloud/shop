# E-mails de autenticação da SHOPLAB

Modelos em português brasileiro, prontos para uso no Supabase hospedado.

## Como configurar

1. Acesse **Supabase Dashboard > Authentication > Email Templates**.
2. Selecione cada tipo, copie o assunto abaixo e cole o HTML do arquivo correspondente.
3. Salve e envie um e-mail de teste de cada fluxo.

| Tipo no Supabase | Assunto | Arquivo |
| --- | --- | --- |
| Confirm sign up | Confirme seu cadastro na SHOPLAB | `confirmacao-cadastro.html` |
| Invite user | Você foi convidado para a SHOPLAB | `convite.html` |
| Magic link | Seu link de acesso à SHOPLAB | `link-magico.html` |
| Change email address | Confirme seu novo e-mail na SHOPLAB | `alteracao-email.html` |
| Reset password | Redefina sua senha da SHOPLAB | `recuperacao-senha.html` |
| Reauthentication | Seu código de verificação da SHOPLAB | `reautenticacao.html` |

## Configuração necessária

- Em **Authentication > URL Configuration**, mantenha a URL pública correta em **Site URL**.
- Adicione à lista de redirecionamentos todas as origens usadas pelo site, incluindo a página `redefinir-senha.html`.
- Em produção, configure SMTP próprio em **Authentication > SMTP Settings**.
- Desative rastreamento e reescrita de links no provedor de e-mail. Links de autenticação são de uso único e podem ser consumidos por verificadores automáticos.
- Nunca substitua `{{ .ConfirmationURL }}` ou `{{ .Token }}` por valores fixos.

Os arquivos são mantidos no repositório como fonte de verdade, mas alterações neles não atualizam automaticamente o painel do Supabase.
