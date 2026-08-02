const MOBILE_QUERY='(max-width:760px)';
const mobile=()=>matchMedia(MOBILE_QUERY).matches;
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const safeSession={
  get(key){try{return sessionStorage.getItem(key)}catch{return null}},
  set(key,value){try{sessionStorage.setItem(key,value)}catch{}}
};

function enhanceSearch(){
  document.querySelectorAll('.mobile-home-search input,.header .search input').forEach(input=>{
    input.type='search';
    input.inputMode='search';
    input.enterKeyHint='search';
    input.autocapitalize='none';
    input.spellcheck=false;
  });
}

function enhanceRails(){
  document.querySelectorAll('[data-product-rail]').forEach(rail=>{
    if(rail.dataset.mobileEnhanced)return;
    const track=rail.querySelector(':scope>.products');
    if(!track)return;
    rail.dataset.mobileEnhanced='true';
    const progress=document.createElement('div');
    progress.className='mobile-rail-progress';
    progress.setAttribute('aria-hidden','true');
    progress.innerHTML='<i></i>';
    rail.append(progress);
    let frame=0;
    const update=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const max=Math.max(0,track.scrollWidth-track.clientWidth);
        const ratio=max?Math.min(1,Math.max(0,track.scrollLeft/max)):0;
        progress.style.setProperty('--rail-progress',String(ratio));
        rail.classList.toggle('is-at-start',ratio<.015);
        rail.classList.toggle('is-at-end',ratio>.985||max===0);
      });
    };
    track.addEventListener('scroll',update,{passive:true});
    new ResizeObserver(update).observe(track);
    update();
  });
}

function restoreScrollPosition(){
  if(!('scrollRestoration'in history))return;
  history.scrollRestoration='manual';
  const key='shoplab:scroll:'+location.pathname+location.search;
  addEventListener('pagehide',()=>safeSession.set(key,String(scrollY)),{capture:true});
  const navigation=performance.getEntriesByType?.('navigation')?.[0];
  if(navigation?.type!=='back_forward')return;
  const target=Number(safeSession.get(key)||0);
  if(!target)return;
  let attempts=0;
  const restore=()=>{
    attempts+=1;
    scrollTo({top:target,behavior:'auto'});
    if(Math.abs(scrollY-target)>4&&attempts<30)setTimeout(restore,60);
  };
  setTimeout(restore,0);
}

function productDock(){
  if(document.body.dataset.page!=='product'||document.querySelector('.mobile-product-dock'))return;
  const offer=document.querySelector('.detail .offer');
  const action=offer?.querySelector('[data-offer]');
  if(!offer||!action)return;
  const dock=document.createElement('aside');
  dock.className='mobile-product-dock';
  dock.setAttribute('aria-label','Oferta do produto');
  dock.innerHTML='<div class="mobile-product-dock-price"><small>Melhor preço</small><strong></strong><span hidden>Antes <s></s></span></div><a class="btn primary">Ver oferta <span aria-hidden="true">→</span></a>';
  const current=dock.querySelector('.mobile-product-dock-price>strong'),before=dock.querySelector('.mobile-product-dock-price>span'),beforeValue=before.querySelector('s');
  const syncPrice=()=>{
    const price=offer.querySelector(':scope>.price,.price'),old=offer.querySelector('.offer-price-top .old,.price .old');
    if(!price)return;
    const copy=price.cloneNode(true);copy.querySelectorAll('.old').forEach(item=>item.remove());
    current.textContent=copy.textContent.trim().replace(/\s+/g,' ');
    const oldText=old?.textContent.trim()||'';
    before.hidden=!oldText;beforeValue.textContent=oldText;
  };
  syncPrice();
  const link=dock.querySelector('a');
  link.href=action.href;
  link.dataset.offer=action.dataset.offer||'';
  document.body.append(dock);
  new MutationObserver(syncPrice).observe(offer,{childList:true,subtree:true,characterData:true});
  const observer=new IntersectionObserver(entries=>{
    dock.classList.toggle('is-visible',!entries[0].isIntersecting&&entries[0].boundingClientRect.top<0);
  },{rootMargin:'-72px 0px -20% 0px'});
  observer.observe(offer);
}
function iosInstallHelp(){
  const ua=navigator.userAgent;
  const ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=matchMedia('(display-mode:standalone)').matches||navigator.standalone===true;
  if(!ios||standalone||document.querySelector('.pwa-ios-card'))return;
  const dismissed=Number(localStorage.getItem('shoplab-ios-install-dismissed')||0);
  if(Date.now()-dismissed<1209600000)return;
  const card=document.createElement('aside');
  card.className='pwa-install-card pwa-ios-card';
  card.setAttribute('aria-label','Instalar SHOPLAB no iPhone');
  card.innerHTML='<img src="assets/img/favicon.svg" alt=""><div><strong>Instale a SHOPLAB</strong><span>Toque em Compartilhar e depois “Adicionar à Tela de Início”.</span></div><button class="close" type="button" aria-label="Fechar">×</button>';
  card.querySelector('.close').onclick=()=>{localStorage.setItem('shoplab-ios-install-dismissed',String(Date.now()));card.remove()};
  document.body.append(card);
}


function enhanceProductCards(){
  if(document.documentElement.dataset.mobileCardNavigation==='1')return;
  document.documentElement.dataset.mobileCardNavigation='1';
  document.addEventListener('click',event=>{
    const card=event.target.closest?.('.product-card[data-card-url]');
    if(!card||event.target.closest('a,button,input,select,textarea,label'))return;
    location.href=card.dataset.cardUrl;
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const card=event.target.closest?.('.product-card[data-card-url]');
    if(!card||event.target.closest('a,button,input,select,textarea,label'))return;
    event.preventDefault();location.href=card.dataset.cardUrl;
  });
  document.querySelectorAll('.product-card img').forEach(image=>{image.draggable=false});
}

function prioritizeMobileContent(){
  const images=[...document.querySelectorAll('main img,.home-banner img,.product-card img')];
  images.forEach(image=>{
    const rect=image.getBoundingClientRect();
    if(rect.top<innerHeight*1.25&&rect.bottom>-80){
      image.loading='eager';
      image.fetchPriority=rect.top<innerHeight?'high':'auto';
    }else if(!image.hasAttribute('loading'))image.loading='lazy';
    image.decoding='async';
  });
  document.querySelectorAll('main .home-section,main .product-related-section,main>section').forEach((section,index)=>{
    if(index>1)section.classList.add('mobile-deferred-section');
  });
}

function deferIosInstallHelp(){
  let shown=false;
  const show=()=>{if(shown)return;shown=true;iosInstallHelp();cleanup()};
  const cleanup=()=>{
    removeEventListener('pointerdown',show);
    removeEventListener('keydown',show);
    removeEventListener('scroll',show);
  };
  addEventListener('pointerdown',show,{once:true,passive:true});
  addEventListener('keydown',show,{once:true});
  addEventListener('scroll',show,{once:true,passive:true});
  setTimeout(show,12000);
}
function keyboardAwareness(){
  if(!visualViewport)return;
  const sync=()=>{
    const opened=innerHeight-visualViewport.height>150;
    document.documentElement.classList.toggle('mobile-keyboard-open',opened);
  };
  visualViewport.addEventListener('resize',sync,{passive:true});
  visualViewport.addEventListener('scroll',sync,{passive:true});
  sync();
}

function watchDynamicContent(){
  let queued=false;
  const enhance=()=>{
    queued=false;
    enhanceSearch();
    enhanceRails();
    enhanceProductCards();
    prioritizeMobileContent();
    productDock();
  };
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(enhance)}};
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  enhance();
}

function init(){
  if(!mobile())return;
  document.documentElement.classList.add('mobile-app-ui');
  enhanceSearch();
  restoreScrollPosition();
  keyboardAwareness();
  enhanceProductCards();
  prioritizeMobileContent();
  deferIosInstallHelp();
  watchDynamicContent();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();