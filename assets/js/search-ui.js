import{SHOPLAB_CONFIG as C}from'./config.js';
const RECENT_KEY='shoplab-recent-searches';
let controller=null,activeIndex=-1;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const recent=()=>{try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]').slice(0,5)}catch{return[]}};
const searchUrl=query=>`busca.html?q=${encodeURIComponent(query)}`;
function saveRecent(query){const clean=query.trim().slice(0,100);if(clean.length<2)return;localStorage.setItem(RECENT_KEY,JSON.stringify([clean,...recent().filter(item=>item.toLocaleLowerCase('pt-BR')!==clean.toLocaleLowerCase('pt-BR'))].slice(0,5)))}
function userAuthorization(){try{const session=JSON.parse(localStorage.getItem('shoplab:user-session')||'null');return session?.access_token?{authorization:`Bearer ${session.access_token}`}:{}}catch{return{}}}
async function apiEnvelope(path,signal){const response=await fetch(`${C.API_BASE_URL}${path}`,{signal,headers:userAuthorization()});if(!response.ok)throw new Error('Busca indisponível');const json=await response.json();return{items:json.data||[],meta:json.meta||{}}}
async function api(path,signal){return(await apiEnvelope(path,signal)).items}
function highlight(text,query){const safe=escapeHtml(text),terms=query.trim().split(/\s+/).filter(term=>term.length>1).map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));if(!terms.length)return safe;return safe.replace(new RegExp(`(${terms.join('|')})`,'gi'),'<mark>$1</mark>')}
function attach(form){
  if(form.dataset.searchReady)return;
  form.dataset.searchReady='true';form.classList.add('search-enhanced');
  const input=form.querySelector('input[name=q]');if(!input)return;
  const panel=document.createElement('div');panel.className='search-panel';panel.setAttribute('role','listbox');panel.setAttribute('aria-label','Sugestões de pesquisa');form.append(panel);
  let timer,aiTimer;
  const close=()=>{panel.classList.remove('open');input.setAttribute('aria-expanded','false');activeIndex=-1};
  const open=html=>{panel.innerHTML=html;panel.classList.add('open');input.setAttribute('aria-expanded','true');activeIndex=-1};
  const header=(title,action='')=>`<div class="search-panel-title"><span>${title}</span>${action}</div>`;
  const smartAction=query=>`<a class="smart-search-action" role="option" href="${searchUrl(query)}"><span class="smart-search-icon">✦</span><span><b>Pesquisar com inteligência</b><small>Entender intenção, orçamento, categoria e alternativas</small></span><span class="smart-search-arrow">→</span></a>`;
  const aiEligible=query=>query.length>=12&&query.trim().split(/\s+/).length>=3&&/\b(at[eé]|acima|abaixo|menos|mais|barato|melhor|para|por|entre|reais|estudar|trabalhar|jogar|correr|presente)\b/i.test(query);
  const renderSuggestions=(query,items,meta={})=>{const products=items.slice(0,6).map(item=>{const image=item.storageKey?`${C.API_BASE_URL}/media/${encodeURIComponent(item.storageKey)}`:item.externalUrl||'';return `<a class="suggestion-product" role="option" href="produto.html?slug=${encodeURIComponent(item.slug)}">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(item.altText||item.name)}" loading="lazy">`:'<span class="suggestion-placeholder">⌕</span>'}<span class="suggestion-copy"><span class="suggestion-main">${highlight(item.name,query)}</span><small>${escapeHtml([item.category,item.brand].filter(Boolean).join(' · ')||'Produto')}</small></span><span class="suggestion-arrow">→</span></a>`}).join('');const title=meta.aiUsed?'Sugestões ajustadas pela IA':items.length?'Produtos encontrados':'Busca inteligente';open(`${header(title,`<button type="button" data-clear-input aria-label="Limpar pesquisa" title="Limpar pesquisa"><img src="assets/icons/trash.svg" alt=""></button>`)}${meta.aiUsed&&meta.explanation?`<p class="search-ai-context"><span>✦</span>${escapeHtml(meta.explanation)}</p>`:''}${products?`<div class="suggestion-list">${products}</div>`:''}${smartAction(query)}`)};
  const renderRecent=()=>{const items=recent();if(!items.length)return close();open(`${header('Pesquisas recentes','<button type="button" data-clear-history aria-label="Limpar histórico" title="Limpar histórico"><img src="assets/icons/trash.svg" alt=""></button>')}<div class="recent-search-list">${items.map(item=>`<a class="recent-search-item" role="option" href="${searchUrl(item)}"><span class="history-icon">↗</span><span>${escapeHtml(item)}</span></a>`).join('')}</div>`)};
  const load=async(ai=false)=>{
    const query=input.value.trim();if(query.length<2)return renderRecent();
    controller?.abort();controller=new AbortController();
    try{
      const result=await apiEnvelope(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}${ai?'&ai=1':''}`,controller.signal);
      if(input.value.trim()!==query)return;
      renderSuggestions(query,result.items,result.meta);
    }catch(error){if(error.name!=='AbortError')open(`${header('Pesquisa')}<div class="search-panel-error">Não foi possível carregar sugestões rápidas.</div>${smartAction(query)}`)}
  };
  const scheduleAi=()=>{clearTimeout(aiTimer);const query=input.value.trim();if(aiEligible(query))aiTimer=setTimeout(()=>{if(input.value.trim()===query)load(true)},850)};
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');
  input.addEventListener('focus',()=>{if(input.value.trim().length>=2){load();scheduleAi()}else renderRecent()});
  input.addEventListener('input',()=>{clearTimeout(timer);clearTimeout(aiTimer);timer=setTimeout(()=>{load();scheduleAi()},180)});
  input.addEventListener('keydown',event=>{const options=[...panel.querySelectorAll('[role=option]')];if(event.key==='Escape')return close();if(!['ArrowDown','ArrowUp','Enter'].includes(event.key)||!options.length)return;if(event.key==='Enter'&&activeIndex<0)return;event.preventDefault();activeIndex=event.key==='ArrowDown'?(activeIndex+1)%options.length:(activeIndex<=0?options.length-1:activeIndex-1);options.forEach((option,index)=>option.classList.toggle('active',index===activeIndex));options[activeIndex].scrollIntoView({block:'nearest'});if(event.key==='Enter')options[activeIndex].click()});
  form.addEventListener('submit',()=>saveRecent(input.value));
  panel.addEventListener('click',event=>{if(event.target.closest('[data-clear-history]')){localStorage.removeItem(RECENT_KEY);close();input.focus()}if(event.target.closest('[data-clear-input]')){input.value='';renderRecent();input.focus()}if(event.target.closest('[role=option]'))saveRecent(input.value)});
  document.addEventListener('click',event=>{if(!form.contains(event.target))close()});
}
async function loadTrending(){const container=document.querySelector('.trending');if(!container||container.dataset.real)return;container.dataset.real='true';try{const items=await api('/api/v1/search/trending');if(items.length)container.innerHTML=`<strong>Em alta:</strong>${items.slice(0,6).map(item=>`<a href="${searchUrl(item.query)}">${escapeHtml(item.query)}</a>`).join('')}`}catch{}}
function scan(){document.querySelectorAll('form.search').forEach(attach);loadTrending()}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scan):scan();
