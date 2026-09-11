import{SHOPLAB_CONFIG}from'./config.js?v=20260803-media-domain-38';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
const validTypes=new Set(['todos','produtos','noticias']);
const typeFromUrl=()=>{const value=normalize(new URLSearchParams(location.search).get('type')||'todos');return validTypes.has(value)?value:'todos'};
const articleUrl=slug=>`noticias.html?slug=${encodeURIComponent(slug)}`;
const mediaUrl=value=>value?new URL(value,SHOPLAB_CONFIG.API_BASE_URL+'/').href:'';
const dateLabel=value=>{try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(value))}catch{return''}};
const newsCard=article=>`<article class="universal-news-card"><a href="${articleUrl(article.slug)}" aria-label="Ler ${esc(article.title)}"><span class="universal-news-media">${article.image?.url?`<img src="${esc(mediaUrl(article.image.url))}" alt="${esc(article.image.alt||article.title)}" loading="lazy" decoding="async">`:'<span aria-hidden="true"></span>'}</span><span class="universal-news-copy"><small>${esc(article.category)}</small><strong>${esc(article.title)}</strong><span>${Number(article.readingTime)||1} min · ${esc(dateLabel(article.publishedAt))}</span></span></a></article>`;
const informationalIntent=query=>/(^|\s)(quando|data|lan[cç]amento|lan[cç]a|lan[cç]ado|novo|nova|not[ií]cia|not[ií]cias|como|por que|qual|review|an[aá]lise)(\s|$)/i.test(query);
export async function searchNews(query){
  const key=`shoplab:universal-news:${normalize(query)}`;
  try{const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(cached&&Date.now()-cached.savedAt<300000)return cached.data}catch{}
  const response=await fetch(`${SHOPLAB_CONFIG.API_BASE_URL}/api/v1/news?${new URLSearchParams({q:query,limit:'50'})}`,{credentials:'include'});
  if(!response.ok)throw new Error(`Falha ao buscar notícias (${response.status})`);
  const payload=await response.json(),data=payload.data||payload;
  try{sessionStorage.setItem(key,JSON.stringify({savedAt:Date.now(),data}))}catch{}
  return data;
}
export async function initUniversalSearch(){
  if(document.body.dataset.page!=='search'||!window.__shoplabListing)return;
  const query=new URLSearchParams(location.search).get('q')?.trim()||'',state=window.__shoplabListing,hero=document.querySelector('.page-hero'),listing=document.querySelector('.listing-section');
  if(!query||!hero||!listing)return;
  let newsData={items:[],total:0};
  try{newsData=await searchNews(query)}catch(error){console.warn('[SHOPLAB] Busca de notícias indisponível:',error)}
  const products=state.products||[],news=newsData.items||[],newsTotal=Number(newsData.total)||news.length,total=products.length+newsTotal,isInformational=informationalIntent(normalize(query));
  hero.classList.add('universal-search-hero');hero.dataset.intent=isInformational?'informational':'commercial';
  hero.querySelector('.page-title')?.insertAdjacentHTML('afterend',`<div class="universal-search-tabs" role="tablist" aria-label="Tipos de resultado"><button type="button" role="tab" data-search-type="todos">Todos <span>(${total})</span></button><button type="button" role="tab" data-search-type="produtos">Produtos <span>(${products.length})</span></button><button type="button" role="tab" data-search-type="noticias">Notícias <span>(${newsTotal})</span></button></div>`);
  const insight=hero.querySelector('.premium-search-insight');
  if(!insight)hero.insertAdjacentHTML('beforeend',`<div class="premium-search-insight universal-search-insight"><span>SHOPLAB+ · BUSCA INTELIGENTE</span><strong>Resultados organizados por relevância</strong><p>Encontramos produtos e notícias relacionados à sua busca. Produtos continuam priorizados para facilitar sua comparação.</p></div>`);
  else if(news.length)insight.insertAdjacentHTML('beforeend','<small class="universal-insight-note">Também encontramos notícias relacionadas, organizadas por relevância editorial.</small>');
  listing.dataset.searchPanel='produtos';listing.setAttribute('role','tabpanel');listing.setAttribute('aria-label','Produtos');
  const allProducts=products.slice(0,8).map(state.card).join(''),allNews=news.slice(0,4).map(newsCard).join(''),allSections=[products.length?`<section class="universal-result-section"><header><div><span class="eyebrow">Comparação e ofertas</span><h2>Produtos <small>(${products.length})</small></h2></div>${products.length>8?'<button type="button" data-show-all="produtos">Ver todos os produtos →</button>':''}</header><div class="products universal-products">${allProducts}</div></section>`:'',news.length?`<section class="universal-result-section universal-news-section"><header><div><span class="eyebrow">Conteúdo editorial</span><h2>Notícias <small>(${newsTotal})</small></h2></div>${newsTotal>4?'<button type="button" data-show-all="noticias">Ver todas as notícias →</button>':''}</header><div class="universal-news-grid">${allNews}</div></section>`:''].join('');
  const empty=`<div class="universal-empty"><strong>Nenhum resultado encontrado para “${esc(query)}”.</strong><span>Tente pesquisar com termos diferentes ou mais gerais.</span></div>`;
  listing.insertAdjacentHTML('beforebegin',`<div class="container universal-search-panels"><div data-search-panel="todos" role="tabpanel">${allSections||empty}</div><div data-search-panel="noticias" role="tabpanel">${news.length?`<section class="universal-result-section universal-news-section"><header><div><span class="eyebrow">Conteúdo editorial</span><h2>Notícias <small>(${newsTotal})</small></h2></div></header><div class="universal-news-grid is-full">${news.map(newsCard).join('')}</div></section>`:`<div class="universal-empty"><strong>Nenhuma notícia encontrada para “${esc(query)}”.</strong><span>Confira os produtos ou tente outros termos.</span></div>`}</div></div>`);
  const activate=(type,{historyMode='push'}={})=>{type=validTypes.has(type)?type:'todos';document.querySelectorAll('[data-search-type]').forEach(button=>{const active=button.dataset.searchType===type;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1});document.querySelectorAll('[data-search-panel]').forEach(panel=>panel.hidden=panel.dataset.searchPanel!==type);if(historyMode!=='none'){const url=new URL(location.href);type==='todos'?url.searchParams.delete('type'):url.searchParams.set('type',type);history[historyMode==='replace'?'replaceState':'pushState']({searchType:type},'',url)}document.dispatchEvent(new CustomEvent('shoplab:search-view-changed',{detail:{type}}))};
  document.querySelector('.universal-search-tabs')?.addEventListener('click',event=>{const button=event.target.closest('[data-search-type]');if(button)activate(button.dataset.searchType)});
  document.querySelector('.universal-search-tabs')?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const buttons=[...document.querySelectorAll('[data-search-type]')],current=buttons.indexOf(document.activeElement);let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;event.preventDefault();buttons[next].focus();activate(buttons[next].dataset.searchType)});
  document.querySelector('.universal-search-panels')?.addEventListener('click',event=>{const button=event.target.closest('[data-show-all]');if(button)activate(button.dataset.showAll)});
  addEventListener('popstate',()=>activate(typeFromUrl(),{historyMode:'none'}));activate(typeFromUrl(),{historyMode:'replace'});
}