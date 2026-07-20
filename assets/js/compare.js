import { getComparisonAnalysis, getProductBySlug } from './api.js';
import { SHOPLAB_CONFIG as C } from './config.js';

const STORAGE_KEY = 'shoplab-compare-products';
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = value => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').slice(0, 3); } catch { return []; } };
const write = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 3)));
const mediaUrl = product => {
  const media = product.media?.find(item => item.isPrimary) || product.media?.[0];
  return media?.storageKey ? `${C.API_BASE_URL}/media/${encodeURIComponent(media.storageKey)}` : media?.externalUrl || '';
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

function renderRecommendations(analysis, products) {
  if (!analysis) return '';
  const recommendations = (analysis.recommendations || []).map(item => {
    const product = products.find(entry => entry.slug === item.productSlug);
    if (!product) return '';
    return `<article class="comparison-recommendation"><span>Melhor para</span><h3>${safe(product.name)}</h3><p>${safe(item.bestFor || 'Quem procura este conjunto de características.')}</p>${item.highlights?.length ? `<ul>${item.highlights.map(highlight => `<li>${safe(highlight)}</li>`).join('')}</ul>` : ''}</article>`;
  }).join('');
  return `<section class="container comparison-intelligence"><div class="comparison-intelligence-heading"><div><span class="eyebrow">${analysis.aiUsed ? 'ANÁLISE INTELIGENTE SHOPLAB' : 'ANÁLISE TÉCNICA SHOPLAB'}</span><h2>Onde cada produto se destaca</h2></div><span class="comparison-method">Regras exatas + ${analysis.aiUsed ? 'IA para interpretar os textos' : 'ficha técnica'}</span></div><p class="comparison-summary">${safe(analysis.summary)}</p>${recommendations ? `<div class="comparison-recommendations">${recommendations}</div>` : ''}<small class="comparison-disclaimer">A análise usa somente os dados cadastrados na ficha técnica. Confirme detalhes importantes no fabricante antes da compra.</small></section>`;
}

function renderComparisonLoading() {
  return `<section class="container comparison-loading" role="status" aria-live="polite"><div class="comparison-loading-spinner" aria-hidden="true"></div><div class="comparison-loading-copy"><span class="eyebrow">ANÁLISE INTELIGENTE SHOPLAB</span><h2>Comparando os produtos…</h2><p>A ficha técnica já está disponível. Agora estamos interpretando nomes diferentes e verificando onde cada produto realmente se destaca.</p><div class="comparison-loading-steps" aria-hidden="true"><span>Alinhando especificações</span><span>Comparando valores</span><span>Preparando recomendações</span></div></div></section>`;
}

function renderPremiumComparisonState(analysis) {
  const plan = analysis.plan || {};
  if (analysis.quotaExceeded) return `<section class="container comparison-premium-gate"><span class="eyebrow">LIMITE MENSAL ATINGIDO</span><h2>A comparação técnica continua disponível</h2><p>Você já utilizou as ${Number(analysis.usage?.limit || 0)} novas análises inteligentes deste mês. Resultados Premium que já estiverem em cache continuam disponíveis sem gastar outra análise.</p><a class="btn primary" href="conta.html#premium">Ver meu plano</a></section>`;
  return `<section class="container comparison-premium-gate"><span class="eyebrow">ANÁLISE INTELIGENTE PREMIUM</span><h2>Entenda melhor as diferenças com IA</h2><p>A comparação técnica abaixo continua gratuita. No Premium, a SHOPLAB interpreta campos com nomes diferentes e explica qual produto é melhor para cada tipo de uso.</p><div><a class="btn primary" href="conta.html#premium">Assinar por ${money(plan.amountCents || 990)}/mês</a><span>${Number(plan.aiMonthlyLimit || 50)} novas análises por mês</span></div></section>`;
}

function showComparisonFallbackWhenReady(products, attempt = 0) {
  const insight = document.querySelector('#comparison-intelligence-slot');
  if (!insight && attempt < 400) {
    setTimeout(() => showComparisonFallbackWhenReady(products, attempt + 1), 25);
    return;
  }
  if (!insight) return;
  insight.innerHTML = `<section class="container comparison-loading comparison-loading-fallback"><div class="comparison-loading-copy"><span class="eyebrow">COMPARAÇÃO TÉCNICA DISPONÍVEL</span><h2>Os dados principais estão prontos</h2><p>A análise inteligente detalhada não ficou disponível agora, mas você pode comparar normalmente os preços e as fichas técnicas abaixo.</p></div></section>`;
}

function normalizedComparisonValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function renderSpecificationRows(criteria, products) {
  return criteria.map(criterion => {
    const values = products.map(product =>
      criterion.values?.find(item => item.productSlug === product.slug),
    );
    const comparableValues = values
      .map(value => normalizedComparisonValue(value?.displayValue || value?.rawValue))
      .filter(Boolean);
    const equal = comparableValues.length >= 2 && new Set(comparableValues).size === 1;
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

function applyComparisonAnalysisWhenReady(analysis, products, attempt = 0) {
  const insight = document.querySelector('#comparison-intelligence-slot');
  const rows = document.querySelector('#comparison-specification-rows');
  if ((!insight || !rows) && attempt < 400) {
    setTimeout(() => applyComparisonAnalysisWhenReady(analysis, products, attempt + 1), 25);
    return;
  }
  if (!insight || !rows) return;
  insight.innerHTML = analysis.premiumRequired || analysis.quotaExceeded
    ? renderPremiumComparisonState(analysis)
    : renderRecommendations(analysis, products);
  if (analysis.criteria?.length) rows.innerHTML = renderSpecificationRows(analysis.criteria, products);
}

function requestComparisonAnalysis(slugs, products, attempt = 0) {
  getComparisonAnalysis(slugs)
    .then(analysis => {
      if (analysis?.processing && attempt < 40) {
        setTimeout(() => requestComparisonAnalysis(slugs, products, attempt + 1), 1000);
        return;
      }
      applyComparisonAnalysisWhenReady(analysis, products);
    })
    .catch(error => {
      showComparisonFallbackWhenReady(products);
      if (error?.name !== 'AbortError') console.warn('Comparação inteligente indisponível; a ficha técnica rápida foi mantida.', error);
    });
}

export async function comparisonPage() {
  const query = new URLSearchParams(location.search).get('produtos');
  const slugs = (query ? query.split(',') : read().map(item => item.slug)).map(decodeURIComponent).filter(Boolean).slice(0, 3);
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
  requestComparisonAnalysis(slugs, products);

  return `<main id="conteudo" class="comparison-page"><div class="container page-hero"><span class="eyebrow">COMPARADOR SHOPLAB · ${safe(category)}</span><h1 class="page-title">Compare antes de escolher</h1><p class="muted">A SHOPLAB reconhece especificações equivalentes e explica as diferenças mais importantes.</p></div><div id="comparison-intelligence-slot">${renderComparisonLoading()}</div><section class="container comparison-shell" aria-label="Comparação de produtos"><table class="comparison-table"><thead><tr><th>Critério</th>${cells(product => `<th><a href="produto.html?slug=${encodeURIComponent(product.slug)}">${mediaUrl(product) ? `<img src="${safe(mediaUrl(product))}" alt="${safe(product.name)}" loading="lazy" decoding="async">` : ''}<strong>${safe(product.name)}</strong></a><button type="button" data-remove-comparison="${safe(product.slug)}">Remover</button></th>`)}</tr></thead><tbody><tr><th>Preço atual</th>${cells(product => `<td class="${Number(product.price) === bestPrice ? 'comparison-best' : ''}"><strong>${money(product.price)}</strong>${Number(product.price) === bestPrice ? '<small>Melhor preço</small>' : ''}</td>`)}</tr><tr><th>Nota SHOPLAB</th>${cells(product => { const score = Number(product.editorialScore ?? product.score ?? 0); return `<td class="${score === bestScore ? 'comparison-best' : ''}"><strong>${score}/100 ${Number(product.isFeatured) ? '<span class="owner-recommended">★</span>' : ''}</strong>${score === bestScore ? '<small>Maior nota</small>' : ''}</td>`; })}</tr><tr><th>Marca</th>${cells(product => `<td>${safe(product.brand || '—')}</td>`)}</tr></tbody><tbody id="comparison-specification-rows">${specificationRows}</tbody><tbody><tr><th>Ver produto</th>${cells(product => `<td><a class="btn primary" href="produto.html?slug=${encodeURIComponent(product.slug)}">Ver detalhes</a></td>`)}</tr></tbody></table></section><div class="container comparison-actions"><a class="btn ghost" href="produtos.html">Adicionar ou trocar produtos</a><button class="btn ghost" type="button" data-clear-comparison>Limpar comparação</button></div></main>`;
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
