# Migrações D1

## Regra principal

- Instalação nova: execute `cloudflare-dashboard/schema.sql`.
- Banco existente: não execute o schema completo como atualização. Execute os arquivos `*-upgrade.sql` que correspondem aos recursos utilizados, na ordem em que foram introduzidos quando houver dependência.
- Faça backup/export do banco antes de uma migração relevante.

## Mapa por área

| Área | Arquivos |
| --- | --- |
| Busca | `search-upgrade.sql` |
| Preços e Mercado Livre | `product-pricing-upgrade.sql`, `mercadolivre-price-sync-upgrade.sql` |
| Catálogo | `brand-store-logo-upgrade.sql`, `category-image-upgrade.sql`, `category-image-position-upgrade.sql`, `category-image-scale-upgrade.sql`, `product-collections-upgrade.sql`, `product-media-hover-upgrade.sql` |
| Promoções | `promotion-upgrade.sql` |
| Temas, logos e tipografia | `site-customization-upgrade.sql`, `theme-logo-media-upgrade.sql`, `theme-logo-color-upgrade.sql`, `theme-component-colors-upgrade.sql`, `theme-icon-color-upgrade.sql`, `site-typography-upgrade.sql` |
| Banners e cabeçalho | `banner-style-editor-upgrade.sql`, `banner-image-controls-upgrade.sql`, `banner-personalization-upgrade.sql`, `header-spotlight-upgrade.sql`, `header-spotlight-animation-upgrade.sql`, `header-spotlight-image-controls-upgrade.sql`, `header-theme-media-upgrade.sql`, `header-theme-image-controls-upgrade.sql`, `header-ad-strips-upgrade.sql`, `header-ad-editor-upgrade.sql`, `header-ad-layers-upgrade.sql`, `ad-placement-duration-upgrade.sql` |
| Administração | `admin-collaborators-upgrade.sql`, `ai-feature-settings-upgrade.sql` |
| Usuários, biblioteca e recompensas | `user-auth-upgrade.sql`, `user-library-upgrade.sql`, `user-library-isolation-cleanup.sql`, `user-engagement-referrals-upgrade.sql`, `gift-card-rewards-upgrade.sql`, `manual-user-rewards-upgrade.sql`, `manual-reward-redemption-upgrade.sql` |
| SHOPLAB+ | `premium-subscriptions-upgrade.sql`, `premium-settings-upgrade.sql`, `premium-product-insight-cache-upgrade.sql`, `premium-pass-payments-upgrade.sql`, `premium-access-grants-upgrade.sql`, `free-ai-credits-upgrade.sql`, `comparison-analysis-cache-upgrade.sql`, `personalized-recommendations-upgrade.sql` |
| Anúncios | `shoplab-adsense-upgrade.sql`, `shoplab-ads-presentation-upgrade.sql` |

## Tipografia

`site-typography-upgrade.sql` cria a tabela de configuração global de fontes e pesos. Ela é necessária em banco existente para o painel de tipografia; em uma instalação nova, a tabela já está em `schema.sql`.

## Como executar

No Cloudflare Dashboard: D1 → banco escolhido → Console → cole o conteúdo do arquivo → Execute. Registre no changelog interno a data, ambiente e arquivo aplicado.