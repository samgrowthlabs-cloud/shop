# ShopLab Ads

O **ShopLab Ads** é o sistema de cards patrocinados da SHOPLAB. Este documento descreve o comportamento implementado atualmente em `cloudflare-dashboard/worker.js` e `assets/js/shoplab-ads-public.js`.

> Alguns campos já existem no painel ou no banco para evoluções futuras. Eles estão identificados no fim e não devem ser confundidos com sinais usados pelo algoritmo atual.

## Fluxo completo

1. O administrador cria a campanha, envia a mídia e define o destino.
2. A campanha fica em `draft`, `active` ou `paused`.
3. A página envia à API o contexto: página, dispositivo, categoria, produto, busca e anúncios vistos na sessão.
4. O Worker filtra campanhas elegíveis, resolve os placements manuais e preenche os espaços livres com campanhas ponderadas.
5. O navegador reordena a resposta usando interesses salvos localmente.
6. O front-end limita a quantidade, escolhe a posição no feed e renderiza os cards.
7. Uma impressão é registrada com pelo menos 50% do card visível; o clique, ao abrir o destino.

## Elegibilidade

A campanha precisa estar `active`, dentro de `starts_at`/`ends_at` e pertencer ao modo `manual` ou `weighted` consultado. No manual, também precisa estar associada ao dispositivo, página e eventual categoria. No ponderado, precisa superar o corte de peso da página.

O servidor reconhece `home`, `products`, `category` e `product`; qualquer outro valor vira `home`. Portanto, a pesquisa, que envia `search`, é tratada no servidor como `home`. `tablet` também é tratado como `desktop`.

## Distribuição manual

Uma campanha `manual` participa somente dos placements associados. O servidor calcula afinidade pelas pesquisas dos últimos 60 dias do usuário autenticado:

```text
afinidade = soma das ocorrências das palavras-chave
            no histórico recente de pesquisas
```

Os candidatos são ordenados por afinidade decrescente; empates recebem ordem aleatória. A mesma campanha não vence dois placements manuais na resposta e cada placement recebe no máximo uma campanha. Para visitantes anônimos, todos começam com afinidade zero.

## Distribuição ponderada

O peso de `weighted`, entre 1 e 100, tem duas funções. Primeiro, define onde a campanha concorre:

| Contexto no servidor | Peso mínimo |
|---|---:|
| Início (`home`) | 1 |
| Produtos (`products`) | 26 |
| Categoria (`category`) | 51 |
| Produto (`product`) | 76 |

Logo, o peso não é apenas chance: hoje ele também é corte de elegibilidade.

Para cada placement automático livre, o Worker gera uma chave por campanha:

```text
peso efetivo = max(1, peso) × (1 + 2 × afinidade)
chave aleatória = -ln(U) / peso efetivo
```

`U` é uniforme entre 0 e 1. Vence a menor chave. Essa amostragem exponencial ponderada faz pesos efetivos maiores vencerem mais vezes sem eliminar completamente os menores.

O máximo de vitórias automáticas da campanha na resposta é:

```text
limite automático = teto(peso / 25)
```

Pesos 1–25 permitem uma vitória; 26–50, duas; 51–75, três; 76–100, quatro. O limite vem de `distribution_weight`, não de `max_per_page`. Placements ocupados manualmente não entram no sorteio.

## Personalização no navegador

Após a seleção do servidor, o navegador reordena candidatos por interesses locais, sem fingerprinting. Os sinais perdem força exponencialmente com constante de 30 dias.

- visita a categoria: +3;
- visita a produto: +4;
- pesquisa atual: +2;
- clique em produto: +2;
- clique em categoria: +1,5;
- históricos locais auxiliares de categorias e produtos vistos.

```text
categoria correspondente: sinal × 12
produto correspondente:   sinal × 15
palavra da busca:          sinal × 5
```

Essa etapa só muda a ordem do que o servidor já escolheu. Os últimos 20 anúncios vistos são enviados em `seen`, mas o endpoint atual ainda não usa esse parâmetro.

## Quantidade e posição

O front-end mostra até 2 cards no início, até 1 em produto/categoria/pesquisa, até 2 em promoções e até 2 nos demais contextos.

Na pesquisa, o navegador procura `searchMatch`, mas o endpoint não devolve essa marca; na prática, usa o primeiro candidato recebido.

A posição é definida pelo front-end, não pelo peso: pesquisa usa slots 2, 4 e 7; categoria entra após pelo menos 4 itens; início, entre os primeiros 3 a 6 itens da seção; promoções, nos slots 2 e 8. O intervalo orgânico usa `minimumOrganicItems` se vier da API. Como o endpoint não o envia, valem 8 no mobile e 6 nas demais larguras.

## Card, mídia e produto vinculado

O card mostra **Patrocinado / ShopLab Ads**, título, imagem ou vídeo, preços e CTA. A mídia usa 3:2 (9:6) com `cover`. Vídeos rodam sem áudio, em loop, e pausam fora da área visível.

Com produto vinculado, o destino vira a página do produto e os preços atuais substituem os textos cadastrados quando existem. Ainda é necessária mídia própria: o endpoint não usa automaticamente a imagem do produto.

Fechar o card oculta a campanha nesse navegador por 1 a 10.080 minutos, conforme `dismiss_minutes`.

## Analytics

O navegador cria uma sessão aleatória em `sessionStorage` e envia no máximo um evento local por combinação de sessão, campanha, placement e tipo.

- **Impressão:** pelo menos 50% do card visível.
- **Clique:** acionamento do link.
- **CTR:** `(cliques / impressões) × 100`.
- **Métricas únicas:** sessões distintas.

Os eventos incluem campanha, dispositivo, página, placement, índice, URL e sessão. O preview administrativo não registra eventos.

## Campos ainda fora do algoritmo público

Existem no schema e/ou painel, mas o endpoint público ativo não os usa para filtrar ou pontuar:

- `featured` (destaque);
- `search_boost` (força na busca);
- `max_per_page`;
- `target_pages`;
- `no_end_date`;
- `category_slugs` e `related_product_slugs` no filtro do servidor;
- multiplicador de performance por CTR;
- exploração fixa de 15%;
- limites globais configuráveis por página.

Portanto, não existe hoje a fórmula `peso × destaque × relevância × força`. A fórmula efetiva é a de **peso efetivo** acima. A segmentação contextual só pode afetar a reordenação local se vier na resposta, mas o endpoint atual não seleciona esses campos.

## Arquivos principais

- `assets/js/shoplab-ads.js`: formulário administrativo e preview.
- `assets/js/shoplab-ads-public.js`: contexto, personalização, renderização, posição e eventos.
- `cloudflare-dashboard/worker.js`: elegibilidade, placements, sorteio e analytics.
- `cloudflare-dashboard/shoplab-ads-*.sql`: evolução do schema.

## Resumo técnico

```text
campanhas ativas e dentro da data
  → vencedores dos placements manuais
  → placements livres
  → corte mínimo de peso conforme a página
  → sorteio por [peso × (1 + 2 × afinidade)]
  → limite teto(peso / 25)
  → reordenação local por interesses
  → limite e posição definidos pelo front-end
  → impressão a 50% de visibilidade e clique
```
