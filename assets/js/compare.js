import { getComparisonAnalysis, getProductBySlug } from './api.js';
import { SHOPLAB_CONFIG as C } from './config.js';

const STORAGE_KEY = 'shoplab-compare-products';
let activeComparison = null;
let comparisonRunId = 0;
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '\x26amp;', '<': '\x26lt;', '>': '\x26gt;', '"': '\x26quot;', "'": '\x26#39;' })[char]);
const money = value => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').slice(0, 3); } catch { return []; } };
const write = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 3)));
const mediaUrl = product => {
  const media = product.media?.find(item => item.isPrimary) || product.media?.[0];
  return media?.storageKey ? `${C.API_BASE_URL}/media/${encodeURIComponent(media.storageKey)}?w=320&q=78` : media?.externalUrl || '';
};
const specificationMap = product => {
  const map = new Map();
  for (const group of product.specificationGroups || []) {
    for (const item of group.items || group.specifications || []) {
      const name = String(item.name || item.label || '').trim();
      const value = String(item.value ?? '').trim();
      if (name && value) map.set(name, value);
    }
  }
  return map;
};

function fallbackCriteria(products) {
  const maps = products.map(specificationMap);
  const names = [...new Set(maps.flatMap(map => [...map.keys()]))];
  return names.map(label => ({
    label,
    explanation: '',
    winnerSlugs: [],
    values: products.map((product, index) => ({
      productSlug: product.slug,
      rawValue: maps[index].get(label) || '',
      displayValue: maps[index].get(label) || '',
      assessment: 'neutral',
      note: '',
    })),
  }));
}

function syncButtons() {
  const selected = read();
  document.querySelectorAll('[data-compare-product]').forEach(button => {
    const active = selected.some(item => item.slug === button.dataset.compareProduct);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Remover produto da comparação' : 'Selecionar produto para comparar');
    if (!button.classList.contains('icon-compare')) button.textContent = active ? '✓ Comparando' : 'Comparar';
  });
  renderBar(selected);
}

function renderBar(selected) {
  document.querySelector('.compare-tray')?.remove();
  if (!selected.length || document.body.dataset.page === 'compare') return;
  const tray = document.createElement('aside');
  tray.className = 'compare-tray';
  tray.innerHTML = `<div><strong>${selected.length}/3 produtos</strong><span>${selected.map(item => safe(item.name)).join(' · ')}</span></div><div class="compare-tray-actions"><button class="btn ghost" type="button" data-clear-comparison>Limpar</button><a class="btn primary ${selected.length < 2 ? 'disabled' : ''}" ${selected.length < 2 ? 'aria-disabled="true"' : `href="comparar.html?produtos=${selected.map(item => encodeURIComponent(item.slug)).join(',')}"`}>Comparar agora</a></div>`;
  document.body.append(tray);
}

export function bindComparisonUI() {
  syncButtons();
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-compare-product]');
    if (button) {
      const selected = read();
      const slug = button.dataset.compareProduct;
      const index = selected.findIndex(item => item.slug === slug);
      if (index >= 0) selected.splice(index, 1);
      else {
        if (selected.length >= 3) return alert('Você pode comparar no máximo 3 produtos.');
        if (selected.length && selected[0].category !== button.dataset.compareCategory) return alert(`Escolha produtos da mesma categoria (${selected[0].category}).`);
        selected.push({ slug, name: button.dataset.compareName, category: button.dataset.compareCategory });
      }
      write(selected);
      syncButtons();
    }
    if (event.target.closest('[data-clear-comparison]')) {
      event.preventDefault();
      write([]);
      syncButtons();
      if (document.body.dataset.page === 'compare') location.href = 'produtos.html';
    }
  }, { capture: true });
}

function localComparisonAnalysis(products) {
  const byPrice = [...products].sort((a, b) => Number(a.price || Infinity) - Number(b.price || Infinity));
  const byScore = [...products].sort((a, b) => Number(b.editorialScore ?? b.score ?? 0) - Number(a.editorialScore ?? a.score ?? 0));
  const bestValue = byPrice[0];
  const bestOverall = Number(byScore[0]?.editorialScore ?? byScore[0]?.score ?? 0) > 0 ? byScore[0] : bestValue;
  const higherPrice = byPrice.at(-1);
  const differenceCents = Math.max(0, Number(higherPrice?.price || 0) - Number(bestValue?.price || 0));
  const pricePercent = Number(bestValue?.price) > 0 ? Math.round(differenceCents / Number(bestValue.price) * 100) : 0;
  const scoreFor = product => Math.max(0, Math.min(100, Number(product.editorialScore ?? product.score ?? 0)));
  return {
    aiUsed: false,
    summary: `Resultado calculado com preço, nota SHOPLAB e ficha técnica cadastrada. ${safe(bestValue?.name || 'O produto mais barato')} é a opção de menor preço nesta comparação.`,
    criteria: fallbackCriteria(products),
    priceComparison: differenceCents ? { cheaperSlug: bestValue.slug, moreExpensiveSlug: higherPrice.slug, differenceCents, differencePercent: pricePercent } : null,
    verdict: {
      headline: 'Resumo da comparação',
      reasoning: `${safe(bestValue.name)} tem o menor preço. ${bestOverall?.slug !== bestValue.slug ? `${safe(bestOverall.name)} tem a maior nota SHOPLAB entre os produtos selecionados.` : 'Ele também é a opção com melhor resultado geral pelos dados disponíveis.'}`,
      bestValueSlug: bestValue.slug,
      bestOverallSlug: bestOverall.slug,
      worthPayingMore: bestOverall.slug === bestValue.slug || !differenceCents ? 'no' : 'depends',
      worthPayingMoreReason: bestOverall.slug === bestValue.slug || !differenceCents ? 'Os dados cadastrados não mostram uma vantagem suficiente para pagar mais.' : 'Vale considerar apenas se os recursos adicionais da ficha técnica forem importantes para o seu uso.',
      confidence: 'medium',
      tradeoffs: ['Compare os campos destacados na ficha técnica antes de decidir.', 'A análise usa somente informações cadastradas no catálogo.'],
      evidence: [`Menor preço: ${safe(bestValue.name)} (${money(bestValue.price)}).`, ...(bestOverall.slug !== bestValue.slug ? [`Maior nota SHOPLAB: ${safe(bestOverall.name)} (${scoreFor(bestOverall)}/100).`] : [])],
    },
    profileScores: [],
    recommendations: products.map(product => ({ productSlug: product.slug, bestFor: product.slug === bestValue.slug ? 'Quem quer gastar menos entre as opções selecionadas.' : product.slug === bestOverall.slug ? 'Quem prioriza a maior nota SHOPLAB cadastrada.' : 'Quem prefere este conjunto específico de preço e recursos.', highlights: [`Preço: ${money(product.price)}`, `Nota SHOPLAB: ${scoreFor(product)}/100`] })),
  };
}
function normalizeProfileScoreDisplay(container) {
  container.querySelectorAll('.comparison-score-products article').forEach(card => {
    const rows = [...card.querySelectorAll('.comparison-score-row')];
    const lowConfidence = [...card.querySelectorAll('small')].some(note => /baixa/i.test(note.textContent));
    const allNeutral = rows.length > 0 && rows.every(row => Number(row.querySelector('strong')?.textContent) === 50);
    if (!lowConfidence || !allNeutral) return;
    rows.forEach(row => row.remove());
    card.querySelector('h4')?.insertAdjacentHTML('afterend', '<p class=comparison-score-unavailable><strong>Dados insuficientes para pontuar</strong><span>As fichas n&atilde;o permitem diferenciar estes perfis com seguran&ccedil;a.</span></p>');
  });
}
function renderRecommendations(analysis, products) {
  if (!analysis) return '';
  const verdict = analysis.verdict || null;
  const bestValue = verdict ? products.find(product => product.slug === verdict.bestValueSlug) : null;
  const bestOverall = verdict ? products.find(product => product.slug === verdict.bestOverallSlug) : null;
  const price = analysis.priceComparison || null;
  const cheaper = price ? products.find(product => product.slug === price.cheaperSlug) : null;
  const expensive = price ? products.find(product => product.slug === price.moreExpensiveSlug) : null;
  const priceHtml = price && cheaper && expensive ? `<div class="comparison-price-gap"><small>Diferença de preço calculada</small><strong>${safe(expensive.name)} custa ${money(price.differenceCents)} a mais</strong><span>${Number(price.differencePercent || 0)}% acima de ${safe(cheaper.name)}</span></div>` : '';
  const worthLabel = verdict?.worthPayingMore === 'yes' ? 'Sim' : verdict?.worthPayingMore === 'no' ? 'Não' : 'Depende do uso';
  const worthHtml = verdict ? `<div class="comparison-worth"><small>Vale pagar a diferença?</small><strong>${worthLabel}</strong><p>${safe(verdict.worthPayingMoreReason || '')}</p></div>` : '';
  const evidenceHtml = verdict?.evidence?.length ? `<div class="comparison-evidence"><strong>Evidências usadas</strong><ul>${verdict.evidence.map(item => `<li>${safe(item)}</li>`).join('')}</ul></div>` : '';
  const verdictHtml = verdict ? `<article class="comparison-verdict"><div><span class="eyebrow">VEREDITO DA IA</span><h3>${safe(verdict.headline || 'Conclusão da comparação')}</h3></div><p>${safe(verdict.reasoning || analysis.summary)}</p><div class="comparison-verdict-winners">${bestValue ? `<span><small>Melhor custo-benefício</small><strong>${safe(bestValue.name)}</strong></span>` : ''}${bestOverall ? `<span><small>Melhor no geral</small><strong>${safe(bestOverall.name)}</strong></span>` : ''}<span><small>Confiança</small><strong>${verdict.confidence === 'high' ? 'Alta' : verdict.confidence === 'medium' ? 'Média' : 'Baixa'}</strong></span></div><div class="comparison-decision-grid">${priceHtml}${worthHtml}</div>${verdict.tradeoffs?.length ? `<ul>${verdict.tradeoffs.map(item => `<li>${safe(item)}</li>`).join('')}</ul>` : ''}${evidenceHtml}</article>` : '';
  const scoreLabels = [['performance', 'Desempenho'], ['value', 'Custo-benefício'], ['work', 'Trabalho'], ['gaming', 'Jogos'], ['study', 'Estudos'], ['portability', 'Portabilidade']];
  const scoresHtml = analysis.profileScores?.length ? `<section class="comparison-profile-scores"><div><span class="eyebrow">NOTAS POR PERFIL</span><h3>Qual combina mais com seu uso?</h3><small>Notas relativas somente entre os produtos desta comparação.</small></div><div class="comparison-score-products">${analysis.profileScores.map(item => `<article><h4>${safe(item.productName || products.find(product => product.slug === item.productSlug)?.name || item.productSlug)}</h4>${scoreLabels.map(([key, label]) => `<div class="comparison-score-row"><span>${label}</span><meter min="0" max="100" value="${Number(item[key] || 0)}"></meter><strong>${Number(item[key] || 0)}</strong></div>`).join('')}<small>Confiança: ${item.confidence === 'high' ? 'alta' : item.confidence === 'medium' ? 'média' : 'baixa'}</small>${item.missingData?.length ? `<p>Dados ausentes: ${safe(item.missingData.join(', '))}</p>` : ''}</article>`).join('')}</div></section>` : '';
  const recommendations = (analysis.recommendations || []).map(item => {
    const product = products.find(entry => entry.slug === item.productSlug);
    if (!product) return '';
    return `<article class="comparison-recommendation"><span>Melhor para</span><h3>${safe(product.name)}</h3><p>${safe(item.bestFor || 'Quem procura este conjunto de características.')}</p>${item.highlights?.length ? `<ul>${item.highlights.map(highlight => `<li>${safe(highlight)}</li>`).join('')}</ul>` : ''}</article>`;
  }).join('');
  return `<section class="container comparison-intelligence"><div class="comparison-intelligence-heading"><div><span class="eyebrow">${analysis.aiUsed ? 'SHOPLAB+ · ANÁLISE POR IA' : 'ANÁLISE TÉCNICA SHOPLAB'}</span><h2>Onde cada produto se destaca</h2></div><span class="comparison-method">${analysis.aiUsed ? 'Algoritmo SHOPLAB+ · preço + ficha normalizada + contexto de uso' : 'Preço + ficha técnica + regras exatas'}</span></div>${verdictHtml}${scoresHtml}<p class="comparison-summary">${safe(analysis.summary)}</p>${recommendations ? `<div class="comparison-recommendations">${recommendations}</div>` : ''}<small class="comparison-disclaimer">A análise usa somente os dados cadastrados, sem inventar desempenho. Confirme detalhes importantes no fabricante antes da compra.</small></section>`;
}

function renderComparisonLoading() {
  return `<section class="container comparison-loading" role="status" aria-live="polite"><div class="comparison-loading-spinner" aria-hidden="true"></div><div class="comparison-loading-copy"><span class="eyebrow">ANÁLISE INTELIGENTE SHOPLAB</span><h2>Comparando os produtos…</h2><p>A ficha técnica já está disponível abaixo. Agora estamos interpretando nomes diferentes e verificando onde cada produto realmente se destaca.</p><div class="comparison-loading-steps" aria-hidden="true"><span>Alinhando especificações</span><span>Comparando valores</span><span>Preparando recomendações</span></div></div></section>`;
}

function renderPremiumComparisonState(analysis) {
  const plan = analysis.plan || {};
  if (analysis.quotaExceeded) return `<section class="container comparison-premium-gate"><span class="eyebrow">LIMITE MENSAL ATINGIDO</span><h2>A comparação técnica continua disponível</h2><p>Você já utilizou as ${Number(analysis.usage?.limit || 0)} novas análises inteligentes deste mês. Resultados SHOPLAB+ que já estiverem em cache continuam disponíveis sem gastar outra análise.</p><a class="btn primary" href="conta.html?aba=plus">Ver meu plano</a></section>`;
  return `<section class="container comparison-premium-gate"><span class="eyebrow">ANÁLISE INTELIGENTE SHOPLAB+</span><h2>Entenda melhor as diferenças com IA</h2><p>A comparação técnica abaixo continua gratuita. Com SHOPLAB+, a análise interpreta campos com nomes diferentes e explica qual produto é melhor para cada tipo de uso.</p><div><a class="btn primary" href="conta.html?aba=plus">Assinar por ${money(plan.amountCents || 990)}/mês</a><span>${Number(plan.aiMonthlyLimit || 50)} novas análises por mês</span></div></section>`;
}

function applyComparisonPaywall(analysis, products) {
  const table = document.querySelector('.comparison-table');
  if (!table) return;
  const shell = table.closest('.comparison-shell');
  if (!shell || shell.querySelector('.comparison-paywall')) return;
  shell.classList.add('is-premium-locked');
  const plan = analysis.plan || {}, gate = document.createElement('aside');
  gate.className = 'comparison-paywall';
  gate.innerHTML = `<span class="eyebrow">COMPARAÇÃO COMPLETA SHOPLAB+</span><h2>Continue para ver toda a comparação</h2><p>Desbloqueie a ficha completa, os vencedores de cada critério e o veredito personalizado da IA.</p><ul><li>Comparação completa de especificações</li><li>Melhor opção para cada tipo de uso</li><li>Conclusão e custo-benefício analisados por IA</li></ul><a class="btn primary" href="conta.html?aba=plus">Assinar por ${money(plan.amountCents || 990)}/mês</a><small>${Number(plan.aiMonthlyLimit || 50)} novas análises inteligentes por mês</small>`;
  shell.append(gate);
  document.querySelector('.comparison-actions')?.classList.add('is-premium-locked');
}

function normalizedComparisonValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function renderSpecificationRows(criteria, products) {
  if (!criteria?.length) return '';
  return criteria.map(criterion => {
    const values = products.map(product =>
      criterion.values?.find(item => item.productSlug === product.slug),
    );
    const comparableValues = values
      .map(value => normalizedComparisonValue(value?.displayValue || value?.rawValue))
      .filter(Boolean);
    const equal = comparableValues.length === products.length && new Set(comparableValues).size === 1;
    const explanation = !equal && criterion.explanation
      ? `<small class="criterion-explanation">${safe(criterion.explanation)}</small>`
      : '';
    return `<tr><th>${safe(criterion.label)}${explanation}</th>${products.map((product, index) => {
      const value = values[index];
      const winner = !equal && (value?.assessment === 'best' || criterion.winnerSlugs?.includes(product.slug));
      const note = !equal && value?.note ? `<span class="comparison-note">${safe(value.note)}</span>` : '';
      return `<td class="${winner ? 'comparison-best' : ''}"><strong>${safe(value?.displayValue || value?.rawValue || '—')}</strong>${winner ? `<small>Melhor: ${safe(criterion.label)}</small>` : ''}${note}</td>`;
    }).join('')}</tr>`;
  }).join('');
}

function applyAnalysisToUI(analysis, products) {
  const insight = document.querySelector('#comparison-intelligence-slot');
  if (!insight) return;

  if (analysis.loginRequired) {
    insight.innerHTML = `<section class="container comparison-premium-gate free-ai-login"><span class="eyebrow">5 CRÉDITOS DE IA GRÁTIS</span><h2>Entre para começar a comparação inteligente</h2><p>Faça login para liberar a análise completa por IA. Sua conta começa com 5 créditos gratuitos.</p><a class="btn primary" href="entrar.html?next=${encodeURIComponent(location.pathname + location.search)}">Entrar e usar meus créditos</a></section>`;
    return;
  }

  if (analysis.premiumRequired) {
    insight.innerHTML = '';
    applyComparisonPaywall(analysis, products);
    if (analysis.freeCreditsExhausted) {
      const gate = document.querySelector('.comparison-paywall');
      if (gate) {
        gate.querySelector('.eyebrow').textContent = 'SEUS 5 CRÉDITOS FORAM USADOS';
        gate.querySelector('h2').textContent = 'Continue comparando com SHOPLAB+';
        gate.querySelector('p').textContent = 'Você já aproveitou suas comparações gratuitas. Assine para receber novas análises inteligentes todos os meses.';
      }
    }
    return;
  }

  if (analysis.quotaExceeded) {
    insight.innerHTML = renderPremiumComparisonState(analysis);
  } else {
    insight.innerHTML = renderRecommendations(analysis, products);
    normalizeProfileScoreDisplay(insight);
  }

  if (analysis.freeAccess) {
    const label = insight.querySelector('.comparison-intelligence-heading .eyebrow');
    if (label) label.textContent = `CRÉDITO GRÁTIS · ${Number(analysis.freeCredits?.remaining || 0)} RESTANTES`;
  }

  const rows = document.querySelector('#comparison-specification-rows');
  if (rows && analysis.criteria?.length) {
    rows.innerHTML = renderSpecificationRows(analysis.criteria, products);
  }
}

function requestComparisonAnalysis(slugs, products, attempt = 0, runId = comparisonRunId) {
  getComparisonAnalysis(slugs)
    .then(analysis => {
      if (runId !== comparisonRunId) return;

      if (analysis?.processing && attempt < 60) {
        applyAnalysisToUI(analysis, products);
        setTimeout(() => requestComparisonAnalysis(slugs, products, attempt + 1, runId), 2000);
        return;
      }

      if (!analysis || analysis?.processing) {
        const insight = document.querySelector('#comparison-intelligence-slot');
        if (insight) {
          insight.innerHTML = `<section class="container comparison-loading comparison-loading-fallback"><div class="comparison-loading-copy"><span class="eyebrow">COMPARAÇÃO TÉCNICA DISPONÍVEL</span><h2>Os dados principais estão prontos</h2><p>A análise inteligente detalhada não ficou disponível agora, mas você pode comparar normalmente os preços e as fichas técnicas abaixo.</p></div></section>`;
        }
        return;
      }

      applyAnalysisToUI(analysis, products);
    })
    .catch(error => {
      if (runId !== comparisonRunId) return;
      const insight = document.querySelector('#comparison-intelligence-slot');
      if (insight) {
        insight.innerHTML = `<section class="container comparison-loading comparison-loading-fallback"><div class="comparison-loading-copy"><span class="eyebrow">COMPARAÇÃO TÉCNICA DISPONÍVEL</span><h2>Os dados principais estão prontos</h2><p>A análise inteligente detalhada não ficou disponível agora, mas você pode comparar normalmente os preços e as fichas técnicas abaixo.</p></div></section>`;
      }
      if (error?.name !== 'AbortError') console.warn('Comparação inteligente indisponível.', error);
    });
}

function startComparisonAnalysis(slugs, products) {
  activeComparison = { slugs: [...slugs], products };
  comparisonRunId += 1;
  requestComparisonAnalysis(slugs, products, 0, comparisonRunId);
}

export function initializeComparisonPage() {
  if (document.body.dataset.page !== 'compare' || !activeComparison) return;
  const { slugs, products } = activeComparison;
  const loadingCopy = document.querySelector('.comparison-loading-copy');
  if (loadingCopy && !loadingCopy.querySelector('.comparison-progress')) {
    loadingCopy.insertAdjacentHTML('beforeend', '<div class=comparison-progress><i><span></span></i><small><b>Analisando</b><span>Isso pode levar alguns segundos</span></small></div>');
  }
  startComparisonAnalysis(slugs, products);

}

window.addEventListener('pageshow', event => {
  if (!event.persisted || document.body.dataset.page !== 'compare' || !activeComparison) return;
  applyAnalysisToUI(localComparisonAnalysis(activeComparison.products), activeComparison.products);
});

export async function comparisonPage() {
  const query = new URLSearchParams(location.search).get('produtos');
  const slugs = (query ? query.split(',') : read().map(item => item.slug))
    .map(slug => String(slug || '').trim())
    .filter(Boolean)
    .slice(0, 3);
  if (slugs.length < 2) return `<main id="conteudo"><div class="container page-hero compare-empty"><span class="eyebrow">COMPARADOR SHOPLAB</span><h1 class="page-title">Escolha pelo menos dois produtos</h1><p class="muted">Adicione produtos da mesma categoria usando o botão Comparar.</p><a class="btn primary" href="produtos.html">Escolher produtos</a></div></main>`;
  const products = (await Promise.all(slugs.map(slug => getProductBySlug(slug)))).filter(Boolean);
  if (products.length < 2) return `<main id="conteudo"><div class="container page-hero"><h1>Não foi possível montar a comparação</h1><a class="btn primary" href="produtos.html">Voltar aos produtos</a></div></main>`;
  const category = products[0].category;
  if (products.some(product => product.category !== category)) return `<main id="conteudo"><div class="container page-hero"><h1>Produtos de categorias diferentes</h1><p class="muted">Compare produtos da mesma categoria para obter um resultado útil.</p><a class="btn primary" href="produtos.html">Nova comparação</a></div></main>`;
  write(products.map(({ slug, name, category: productCategory }) => ({ slug, name, category: productCategory })));

  const criteria = fallbackCriteria(products);
  const bestPrice = Math.min(...products.map(product => Number(product.price || Infinity)));
  const bestScore = Math.max(...products.map(product => Number(product.editorialScore ?? product.score ?? 0)));
  const cells = render => products.map(render).join('');
  const specificationRows = renderSpecificationRows(criteria, products);

  activeComparison = { slugs: [...slugs], products };

  return `<main id="conteudo" class="comparison-page"><div class="container page-hero"><span class="eyebrow">COMPARADOR SHOPLAB · ${safe(category)}</span><h1 class="page-title">Compare antes de escolher</h1><p class="muted">A SHOPLAB reconhece especificações equivalentes e explica as diferenças mais importantes.</p></div><div id="comparison-intelligence-slot">${renderComparisonLoading()}</div><section class="container comparison-shell" aria-label="Comparação de produtos"><table class="comparison-table"><thead><tr><th>Critério</th>${cells(product => `<th><a href="produto.html?slug=${encodeURIComponent(product.slug)}">${mediaUrl(product) ? `<img src="${safe(mediaUrl(product))}" alt="${safe(product.name)}" loading="lazy" decoding="async">` : ''}<strong>${safe(product.name)}</strong><small class="comparison-head-price${Number(product.price) === bestPrice ? ` is-best` : ``}">${money(product.price)}${Number(product.price) === bestPrice ? `<i>Melhor preço</i>` : ``}</small></a><button class="comparison-remove" type="button" data-remove-comparison="${safe(product.slug)}" aria-label="Remover produto da comparação">Remover</button></th>`)}</tr></thead><tbody><tr><th>Preço atual</th>${cells(product => `<td class="${Number(product.price) === bestPrice ? 'comparison-best' : ''}"><strong>${money(product.price)}</strong>${Number(product.price) === bestPrice ? '<small>Melhor preço</small>' : ''}</td>`)}</tr><tr><th>Nota SHOPLAB</th>${cells(product => { const score = Number(product.editorialScore ?? product.score ?? 0); return `<td class="${score === bestScore ? 'comparison-best' : ''}"><strong>${score}/100 ${Number(product.isFeatured) ? '<span class="owner-recommended">★</span>' : ''}</strong>${score === bestScore ? '<small>Maior nota</small>' : ''}</td>`; })}</tr><tr><th>Marca</th>${cells(product => `<td>${safe(product.brand || '—')}</td>`)}</tr></tbody><tbody id="comparison-specification-rows">${specificationRows}</tbody><tbody><tr><th>Ver produto</th>${cells(product => `<td><a class="btn primary" href="produto.html?slug=${encodeURIComponent(product.slug)}">Ver detalhes</a></td>`)}</tr></tbody></table></section><div class="container comparison-actions"><a class="btn ghost" href="produtos.html">Adicionar ou trocar produtos</a><button class="btn ghost" type="button" data-clear-comparison>Limpar comparação</button></div></main>`;
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-comparison]');
  if (!button) return;
  const selected = read().filter(item => item.slug !== button.dataset.removeComparison);
  write(selected);
  const url = new URL(location.href);
  url.searchParams.set('produtos', selected.map(item => item.slug).join(','));
  location.href = selected.length >= 2 ? url : 'produtos.html';
});
