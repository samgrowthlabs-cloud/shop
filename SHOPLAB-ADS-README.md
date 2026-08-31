# ShopLab Ads

O **ShopLab Ads** é o sistema de anúncios patrocinados da SHOPLAB. Ele insere cards de publicidade dentro das mesmas grades em que os produtos aparecem, mantendo a experiência visual do catálogo.

Os anúncios podem aparecer na página inicial, em produtos e pesquisas, nas categorias e na página de um produto. Todo card é identificado como **Patrocinado** e usa a marca **SLAds / ShopLab Ads**.

## Como o card funciona

O card patrocinado possui:

- identificação visível de conteúdo patrocinado;
- imagem ou vídeo horizontal em proporção **9:6 (3:2)**;
- título público;
- preço atual e preço antigo opcionais;
- botão de ação;
- cores configuráveis para botão e preços;
- link para um produto da SHOPLAB ou para uma URL externa.

O preview exibido no painel administrativo reproduz o mesmo card que o usuário verá no site.

### Imagem e vídeo

A mídia deve ser horizontal, preferencialmente em proporção 3:2. Imagens e vídeos são recortados para preencher o espaço do card.

Vídeos são reproduzidos automaticamente, sem áudio, em loop e apenas quando o navegador permite. É recomendado usar MP4 ou WebM otimizado para web.

## Criando uma campanha

No painel administrativo, acesse **Marketing > ShopLab Ads > Campanhas** e selecione **Criar novo anúncio**.

Preencha:

1. **Nome do anúncio:** identificação interna da campanha.
2. **Tipo de mídia:** imagem ou vídeo.
3. **Palavras-chave:** termos usados para relacionar o anúncio às pesquisas.
4. **Título público:** texto mostrado no card.
5. **Texto e cor do botão:** chamada para a ação.
6. **Preço antigo e atual:** valores exibidos no card, quando informados.
7. **Mídia 9:6:** arquivo visual da campanha.
8. **Produto da SHOPLAB:** vínculo opcional com um produto cadastrado.
9. **URL de destino:** página aberta quando o usuário clica.
10. **Distribuição:** peso, destaque, força na busca e páginas permitidas.
11. **Status:** mantenha como rascunho durante a preparação e ative quando estiver pronto.

## Produto vinculado

Um anúncio pode usar um produto já cadastrado na SHOPLAB. Quando existe um produto vinculado, o sistema pode aproveitar automaticamente:

- nome do produto;
- imagem principal, quando o anúncio não possui mídia própria;
- preço atual;
- preço antigo;
- link da página do produto.

Os valores e textos preenchidos diretamente no anúncio têm prioridade visual quando estiverem configurados.

## Distribuição automática

Os anúncios ativos são escolhidos automaticamente e inseridos entre os produtos. A escolha não segue uma ordem fixa: cada campanha participa de uma seleção ponderada.

### Peso de exibição

O peso varia de **1 a 100**. Quanto maior o peso, maior a chance de o anúncio ser escolhido e mais cedo ele tende a aparecer no feed.

O peso representa probabilidade, não uma garantia exata. Um anúncio com peso 80 tende a aparecer mais vezes que um anúncio com peso 20, mas a distribuição ainda possui variação para evitar repetição rígida.

### Campanha em destaque

A opção **Campanha em destaque** aplica prioridade adicional à campanha. Atualmente, anúncios destacados recebem um multiplicador de **1,6** na seleção geral.

Use destaque para campanhas importantes, lançamentos e ações com prazo curto. Evite destacar todos os anúncios, pois isso reduz a diferença entre eles.

### Máximo por página

Define quantas vezes a mesma campanha pode aparecer em uma única página. O sistema aceita de 1 a 4 aparições, respeitando também o peso configurado.

Para uma experiência equilibrada, o recomendado é:

- **1 aparição:** campanha comum;
- **2 aparições:** campanha relevante ou com peso alto;
- **3 ou 4 aparições:** somente ações especiais.

### Páginas permitidas

Cada campanha pode ser habilitada para:

- início;
- produtos e busca;
- categorias;
- página do produto.

O anúncio só participa da seleção quando a página atual está entre os destinos permitidos.

## Funcionamento na pesquisa

Quando uma pessoa pesquisa, o ShopLab Ads compara a consulta com:

- título público;
- nome interno do anúncio;
- palavras-chave;
- nome do produto vinculado.

Anúncios relacionados recebem prioridade sobre campanhas sem relação com a pesquisa. Entre os anúncios relacionados, entram no cálculo:

- peso de exibição;
- campanha em destaque;
- quantidade e qualidade das correspondências;
- força na busca.

### Força na busca

A força varia de **1 a 10** e amplifica a relevância encontrada no título e nas palavras-chave.

Exemplo: um anúncio com as palavras-chave `notebook gamer, RTX, placa de vídeo` recebe prioridade quando alguém pesquisa termos próximos. Quanto maior a força na busca, maior o impacto dessa correspondência na seleção.

Em uma pesquisa real, apenas o melhor anúncio relacionado é inserido entre os resultados, evitando excesso de publicidade.

## Posição dentro das grades

Na página inicial, o card aparece naturalmente entre os cards de produto.

Nas páginas de produtos, pesquisa e categoria, o anúncio usa duas colunas para preservar o formato horizontal 9:6. Ele preenche toda a área reservada sem sobrepor os produtos.

A posição varia de acordo com o peso. Campanhas de peso maior tendem a entrar mais cedo e com maior frequência.

## Fechamento temporário

Quando a opção de fechamento está habilitada, o usuário pode ocultar o anúncio. O campo **Voltar depois de quantos minutos?** define quanto tempo o card ficará escondido naquele navegador.

O limite configurável é de 10.080 minutos, equivalente a sete dias.

## Analytics

A aba **Analytics** funciona separadamente da listagem de campanhas e apresenta:

- impressões;
- cliques;
- taxa de cliques (CTR);
- desempenho por anúncio;
- resultados no período de 7, 30 ou 90 dias.

Uma impressão é registrada quando pelo menos 50% do card fica visível. O clique é registrado quando o usuário abre a oferta.

O CTR é calculado assim:

```text
CTR = (cliques / impressões) × 100
```

## Configurações recomendadas

### Campanha comum

```text
Peso: 25
Destaque: não
Força na busca: 3
Máximo por página: 1
```

### Campanha prioritária

```text
Peso: 70
Destaque: sim
Força na busca: 5
Máximo por página: 2
```

### Campanha focada em pesquisa

```text
Peso: 40
Destaque: opcional
Força na busca: 8
Máximo por página: 1
Palavras-chave: específicas e diretamente relacionadas ao produto
```

## Boas práticas

- Use títulos curtos e objetivos.
- Cadastre palavras-chave realmente relacionadas à oferta.
- Evite repetir a mesma palavra em várias formas sem necessidade.
- Use vídeo curto, leve e sem depender de áudio.
- Confirme se preço, botão e link levam para a mesma oferta anunciada.
- Mantenha o máximo por página baixo para não poluir o catálogo.
- Compare peso, impressões, cliques e CTR antes de aumentar a exposição.
- Pause campanhas encerradas ou com destino indisponível.

## Resumo do algoritmo

De forma simplificada, a prioridade de uma campanha considera:

```text
prioridade efetiva = peso
                    × bônus de destaque
                    × relevância da pesquisa
                    × força na busca
```

Depois de filtrar status e páginas permitidas, o sistema faz uma seleção ponderada. Isso permite que campanhas menores continuem concorrendo, enquanto campanhas mais relevantes ou com maior peso aparecem com mais frequência.

## Arquivos principais

- `assets/js/shoplab-ads.js`: painel administrativo, edição e preview.
- `assets/js/shoplab-ads-public.js`: renderização pública, vídeo, inserção no feed e eventos.
- `assets/css/admin.css`: layout do gerenciador e dos previews.
- `cloudflare-dashboard/worker.js`: armazenamento, API, seleção ponderada e analytics.

