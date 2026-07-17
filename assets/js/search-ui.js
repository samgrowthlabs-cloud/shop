import{SHOPLAB_CONFIG as C}from'./config.js';
const RECENT_KEY='shoplab-recent-searches';
let controller=null,activeIndex=-1;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const recent=()=>{try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]').slice(0,5)}catch{return[]}};
const searchUrl=query=>`busca.html?q=${encodeURIComponent(query)}`;
function saveRecent(query){const clean=query.trim().slice(0,100);if(clean.length<2)return;localStorage.setItem(RECENT_KEY,JSON.stringify([clean,...recent().filter(item=>item.toLocaleLowerCase('pt-BR')!==clean.toLocaleLowerCase('pt-BR'))].slice(0,5)))}
async function api(path,signal){const response=await fetch(`${C.API_BASE_URL}${path}`,{signal});if(!response.ok)throw new Error('Busca indisponível');const json=await response.json();return json.data||[]}
function highlight(text,query){const safe=escapeHtml(text),terms=query.trim().split(/\s+/).filter(term=>term.length>1).map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));if(!terms.length)return safe;return safe.replace(new RegExp(`(${terms.join('|')})`,'gi'),'<mark>$1</mark>')}
function attach(form){
  if(form.dataset.searchReady)return;
  form.dataset.searchReady='true';form.classList.add('search-enhanced');
  const input=form.querySelector('input[name=q]');if(!input)return;
  const panel=document.createElement('div');panel.className='search-panel';panel.setAttribute('role','listbox');panel.setAttribute('aria-label','Sugestões de pesquisa');form.append(panel);
  let timer;
  const close=()=>{panel.classList.remove('open');input.setAttribute('aria-expanded','false');activeIndex=-1};
  const open=html=>{panel.innerHTML=html;panel.classList.add('open');input.setAttribute('aria-expanded','true');activeIndex=-1};
  const header=(title,action='')=>`<div class="search-panel-title"><span>${title}</span>${action}</div>`;
  const smartAction=query=>`<a class="smart-search-action" role="option" href="${searchUrl(query)}"><span class="smart-search-icon">✦</span><span><b>Pesquisar com inteligência</b><small>Entender intenção, orçamento, categoria e alternativas</small></span><span class="smart-search-arrow">→</span></a>`;
  const renderRecent=()=>{const items=recent();if(!items.length)return close();open(`${header('Pesquisas recentes','<button type="button" data-clear-history>Limpar histórico</button>')}<div class="recent-search-list">${items.map(item=>`<a class="recent-search-item" role="option" href="${searchUrl(item)}"><span class="history-icon">↗</span><span>${escapeHtml(item)}</span></a>`).join('')}</div>`)};
  const load=async()=>{
    const query=input.value.trim();if(query.length<2)return renderRecent();
    controller?.abort();controller=new AbortController();
    open('<div class="search-panel-loading"><span></span> Procurando produtos…</div>');
    try{
      const items=await api(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}`,controller.signal);
      const products=items.slice(0,6).map(item=>{const image=item.storageKey?`${C.API_BASE_URL}/media/${encodeURIComponent(item.storageKey)}`:item.externalUrl||'';return `<a class="suggestion-product" role="option" href="produto.html?slug=${encodeURIComponent(item.slug)}">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(item.altText||item.name)}" loading="lazy">`:'<span class="suggestion-placeholder">⌕</span>'}<span class="suggestion-copy"><span class="suggestion-main">${highlight(item.name,query)}</span><small>${escapeHtml([item.category,item.brand].filter(Boolean).join(' · ')||'Produto')}</small></span><span class="suggestion-arrow">→</span></a>`}).join('');
      open(`${header(items.length?'Produtos encontrados':'Busca inteligente',`<button type="button" data-clear-input aria-label="Limpar pesquisa">Limpar</button>`)}${products?`<div class="suggestion-list">${products}</div>`:''}${smartAction(query)}`);
    }catch(error){if(error.name!=='AbortError')open(`${header('Pesquisa')}<div class="search-panel-error">Não foi possível carregar sugestões rápidas.</div>${smartAction(query)}`)}
  };
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');
  input.addEventListener('focus',()=>input.value.trim().length>=2?load():renderRecent());
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(load,180)});
  input.addEventListener('keydown',event=>{const options=[...panel.querySelectorAll('[role=option]')];if(event.key==='Escape')return close();if(!['ArrowDown','ArrowUp','Enter'].includes(event.key)||!options.length)return;if(event.key==='Enter'&&activeIndex<0)return;event.preventDefault();activeIndex=event.key==='ArrowDown'?(activeIndex+1)%options.length:(activeIndex<=0?options.length-1:activeIndex-1);options.forEach((option,index)=>option.classList.toggle('active',index===activeIndex));options[activeIndex].scrollIntoView({block:'nearest'});if(event.key==='Enter')options[activeIndex].click()});
  form.addEventListener('submit',()=>saveRecent(input.value));
  panel.addEventListener('click',event=>{if(event.target.closest('[data-clear-history]')){localStorage.removeItem(RECENT_KEY);close();input.focus()}if(event.target.closest('[data-clear-input]')){input.value='';renderRecent();input.focus()}if(event.target.closest('[role=option]'))saveRecent(input.value)});
  document.addEventListener('click',event=>{if(!form.contains(event.target))close()});
}
async function loadTrending(){const container=document.querySelector('.trending');if(!container||container.dataset.real)return;container.dataset.real='true';try{const items=await api('/api/v1/search/trending');if(items.length)container.innerHTML=`<strong>Em alta:</strong>${items.slice(0,6).map(item=>`<a href="${searchUrl(item.query)}">${escapeHtml(item.query)}</a>`).join('')}`}catch{}}
function scan(){document.querySelectorAll('form.search').forEach(attach);loadTrending()}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scan):scan();
