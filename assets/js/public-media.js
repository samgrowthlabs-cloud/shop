import{SHOPLAB_CONFIG as C}from'./config.js';
import{session,userApi}from'./auth.js';

const cache=new Map();
async function getProduct(slug){if(cache.has(slug))return cache.get(slug);const promise=fetch(`${C.API_BASE_URL}/api/v1/products/${encodeURIComponent(slug)}?mediaVersion=2`,{cache:'default'}).then(r=>r.ok?r.json():null).then(j=>j?.data||null).catch(()=>null);cache.set(slug,promise);return promise}
const url=m=>m?.storageKey?`${C.API_BASE_URL}/media/${encodeURIComponent(m.storageKey)}`:m?.externalUrl||'';
const safe=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

async function cardMedia(card){
  if(card.dataset.mediaSwapReady||card.dataset.mediaSwapLoading)return;
  card.dataset.mediaSwapLoading='1';
  const link=card.querySelector('.product-media');
  if(!link){delete card.dataset.mediaSwapLoading;return}
  const slug=new URL(link.href,location.href).searchParams.get('slug'),data=slug?await getProduct(slug):null,items=(data?.media||[]).filter(item=>url(item));
  const primary=items.find(item=>item.isPrimary)||items[0],currentImage=link.querySelector('img'),currentUrl=currentImage?.src||'';
  if(!currentImage&&primary){
    link.querySelector('.product-symbol')?.remove();
    link.insertAdjacentHTML('beforeend',`<img class="product-image-primary" src="${safe(url(primary))}" alt="${safe(primary.altText||data.name||'Produto')}" loading="lazy" decoding="async">`);
  }else if(currentImage){
    currentImage.classList.add('product-image-primary');
  }
  const mainUrl=primary?new URL(url(primary),location.href).href:currentUrl;
  const alternate=items.find(item=>item.isHover&&new URL(url(item),location.href).href!==mainUrl)||items.find(item=>new URL(url(item),location.href).href!==mainUrl);
  if(alternate){
    link.insertAdjacentHTML('beforeend',`<img class="product-image-alternate" src="${safe(url(alternate))}" alt="${safe(alternate.altText||`${data.name||'Produto'} em outro ângulo`)}" loading="lazy" decoding="async">`);
    card.classList.add('has-alternate-image');
  }
  card.dataset.mediaSwapReady='1';
  delete card.dataset.mediaSwapLoading;
}

document.addEventListener('click',event=>{
  const media=event.target.closest('.product-card.has-alternate-image .product-media');
  if(!media||!matchMedia('(hover: none), (pointer: coarse)').matches)return;
  const card=media.closest('.product-card');
  if(card.classList.contains('show-alternate-image'))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  document.querySelectorAll('.product-card.show-alternate-image').forEach(item=>item.classList.remove('show-alternate-image'));
  card.classList.add('show-alternate-image');
},true);

function renderPromotion(data){const promotion=data?.promotion,host=document.querySelector('.detail > div:last-child');if(!promotion||!host||host.querySelector('.product-promotion'))return;const percent=Number(data.campaignDiscountPercent||data.discount||0),coupon=promotion.couponCode?`<span class="promotion-coupon">Cupom: <b>${safe(promotion.couponCode)}</b></span>`:'';host.querySelector('.offer')?.insertAdjacentHTML('beforebegin',`<aside class="product-promotion"><span class="promotion-kicker">PROMOÇÃO ATIVA · ${percent}% OFF</span><strong>${safe(promotion.name)}</strong>${coupon}<span>Termina em <b class="promotion-countdown" data-ends="${safe(promotion.endsAt)}">calculando...</b></span></aside>`);const counter=host.querySelector('.promotion-countdown');let timer;const update=()=>{const remaining=Math.max(0,new Date(counter.dataset.ends).getTime()-Date.now()),seconds=Math.floor(remaining/1000)%60,minutes=Math.floor(remaining/60000)%60,hours=Math.floor(remaining/3600000)%24,days=Math.floor(remaining/86400000);counter.textContent=remaining?`${days}d ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:'Promoção encerrada';if(!remaining&&timer)clearInterval(timer)};update();timer=setInterval(update,1000)}

function renderDescriptions(data){
  if(!data||document.querySelector('.product-description-section'))return;
  const productCopy=document.querySelector('.detail > div:last-child'),current=productCopy?.querySelector(':scope > p:not(.muted)'),shortText=(data.shortDescription||data.subtitle||'').trim(),longText=(data.fullDescription||data.description||'').trim();
  if(current){current.className='product-short-description';current.textContent=shortText||longText||'Confira os detalhes, características e ofertas disponíveis para este produto.'}
  if(!longText||longText===(shortText||'').trim())return;
  const analysis=document.querySelector('#conteudo > .section.alt'),section=document.createElement('section');section.className='section product-description-section';
  section.innerHTML=`<div class="container"><div class="section-head"><div><span class="eyebrow">DETALHES DO PRODUTO</span><h2>Descrição completa</h2></div></div><div class="long-description collapsed" id="long-description"><p>${safe(longText)}</p></div><button class="btn ghost description-toggle" type="button" aria-expanded="false" aria-controls="long-description">Mostrar mais</button></div>`;
  if(analysis)analysis.insertAdjacentElement('beforebegin',section);else document.querySelector('#conteudo')?.append(section);
  section.querySelector('.description-toggle').addEventListener('click',event=>{const content=section.querySelector('.long-description'),expanded=event.currentTarget.getAttribute('aria-expanded')==='true';content.classList.toggle('collapsed',expanded);event.currentTarget.setAttribute('aria-expanded',String(!expanded));event.currentTarget.textContent=expanded?'Mostrar mais':'Mostrar menos';if(expanded)section.scrollIntoView({behavior:'smooth',block:'start'})});
}

function productSpecifications(data){return(data?.specificationGroups||[]).flatMap(group=>(group.items||group.specifications||[]).map(item=>({name:String(item.name||item.label||'').trim(),value:String(item.value||'').trim()}))).filter(item=>item.name&&item.value)}
function specificationIcon(name){const key=name.toLocaleLowerCase('pt-BR');let icon='feature';if(/processador|cpu|chip/.test(key))icon='cpu';else if(/memória ram|memória suportada/.test(key))icon='ram';else if(/armazenamento|ssd|capacidade/.test(key))icon='storage';else if(/tela|resolução|monitor/.test(key))icon='monitor';else if(/placa de vídeo|gpu|gráfico/.test(key))icon='gpu';else if(/bateria|carregamento/.test(key))icon='battery';return`<img src="assets/icons/${icon}.svg" alt="">`}
function renderProductInformation(data){
  if(!data||document.querySelector('.product-information-sections'))return;
  const specifications=productSpecifications(data),detailCopy=document.querySelector('.detail > div:last-child'),offer=detailCopy?.querySelector('.offer');
  const productTitle=detailCopy?.querySelector('h1');if(productTitle&&data.brand&&!detailCopy.querySelector('.detail-brand')){const brandLogo=data.brandLogoUrl?`<img src="${safe(data.brandLogoUrl)}" alt="Logo ${safe(data.brand)}">`:'';productTitle.insertAdjacentHTML('afterend',`<div class="detail-brand">${brandLogo}<span><small>Marca</small><strong>${safe(data.brand)}</strong></span></div>`);const oldBrandText=[...detailCopy.querySelectorAll(':scope > p.muted')].find(item=>item.textContent.trim()===String(data.brand).trim());oldBrandText?.remove()}
  const shareButton=detailCopy?.querySelector('.detail-share'),compareSvg='<img src="assets/icons/compare.svg" alt="">';if(shareButton&&!detailCopy.querySelector('.detail-favorite')){shareButton.innerHTML='<img src="assets/icons/share.svg" alt=""><span>Compartilhar</span>';shareButton.insertAdjacentHTML('beforebegin',`<button class="btn ghost detail-favorite icon-compare compare-product" type="button" data-compare-product="${safe(data.slug)}" data-compare-name="${safe(data.name)}" data-compare-category="${safe(data.category||'Sem categoria')}" aria-pressed="false">${compareSvg}<span>Comparar</span></button>`)}
  const currentPrice=Number(data.price||0),oldPrice=Number(data.oldPrice||0),discount=oldPrice>currentPrice&&currentPrice>0?Math.round((1-currentPrice/oldPrice)*100):Number(data.discount||0);
  if(offer){const money=value=>(Number(value||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),logo=data.storeLogoUrl?`<img src="${safe(data.storeLogoUrl)}" alt="Logo ${safe(data.store||'da loja')}">`:'<span aria-hidden="true">🤝</span>';offer.innerHTML=`<small class="offer-label">Melhor preço encontrado</small><div class="offer-price-top">${oldPrice>currentPrice?`<span class="old">${money(oldPrice)}</span>`:''}${discount>0?`<span class="detail-discount">-${discount}%</span>`:''}</div><div class="price">${money(currentPrice)}</div><div class="offer-seller">${logo}<p>Vendido por <strong>${safe(data.store||'loja parceira')}</strong> · parceiro verificado</p><img class="offer-verified" src="assets/icons/verified.svg" alt="Verificado"></div><a class="btn primary" href="#" data-offer="${safe(data.slug)}">Ir para oferta <span aria-hidden="true">→</span></a><small class="offer-redirect"><img src="assets/icons/shield-check.svg" alt=""> Você será redirecionado para a loja parceira.</small>`}
  const priority=['Processador','Memória RAM','Armazenamento','Tamanho da tela','Tela','Placa de vídeo','Bateria','Resolução','Capacidade','Tipo'];
  const highlights=[...priority.map(name=>specifications.find(item=>item.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))).filter(Boolean),...specifications].filter((item,index,list)=>list.findIndex(other=>other.name===item.name)===index).slice(0,4);
  if(offer&&highlights.length)offer.insertAdjacentHTML('beforebegin',`<div class="product-tech-highlights">${highlights.map(item=>`<div><span>${specificationIcon(item.name)}</span><strong>${safe(item.value)}</strong><small>${safe(item.name)}</small></div>`).join('')}</div>`);
  const oldAnalysis=document.querySelector('#conteudo > .section.alt'),information=document.createElement('div');information.className='product-information-sections';
  information.innerHTML=specifications.length?`<section class="product-specifications-section"><div class="container"><div class="product-section-title"><span class="eyebrow">FICHA TÉCNICA</span><h2>Especificações completas</h2></div><dl class="product-specifications-grid">${specifications.map(item=>`<div><dt>${safe(item.name)}</dt><dd>${safe(item.value)}</dd></div>`).join('')}</dl></div></section>`:'';
  if(oldAnalysis)oldAnalysis.replaceWith(information);else document.querySelector('#conteudo')?.append(information);
  const description=document.querySelector('.product-description-section');if(description)information.insertAdjacentElement('afterend',description);
}

function arrangeMobileOffer(){
  const detail=document.querySelector('.page-hero .detail'),media=detail?.querySelector(':scope > .detail-media'),copy=detail?.querySelector(':scope > div:last-child'),offer=detail?.querySelector('.offer');
  if(!detail||!media||!copy||!offer)return;
  let anchor=copy.querySelector('[data-offer-position]');
  if(!anchor){
    anchor=document.createElement('span');
    anchor.hidden=true;
    anchor.dataset.offerPosition='true';
    offer.insertAdjacentElement('beforebegin',anchor);
  }
  const disclaimer=[...copy.querySelectorAll(':scope > small.muted')].find(item=>/preço pode mudar|loja parceira/i.test(item.textContent));
  const title=detail.querySelector('.page-title');
  let titleAnchor=copy.querySelector('[data-title-position]');
  if(title&&!titleAnchor){
    titleAnchor=document.createElement('span');
    titleAnchor.hidden=true;
    titleAnchor.dataset.titlePosition='true';
    title.insertAdjacentElement('beforebegin',titleAnchor);
  }
  const actions=detail.querySelector('.user-product-actions');
  let actionsAnchor=copy.querySelector('[data-actions-position]');
  if(actions&&!actionsAnchor){
    actionsAnchor=document.createElement('span');
    actionsAnchor.hidden=true;
    actionsAnchor.dataset.actionsPosition='true';
    actions.insertAdjacentElement('beforebegin',actionsAnchor);
  }
  const mobile=matchMedia('(max-width:760px)').matches;
  if(mobile){
    let titleSlot=detail.querySelector(':scope > .mobile-product-title-slot');
    if(!titleSlot){
      titleSlot=document.createElement('div');
      titleSlot.className='mobile-product-title-slot';
      media.insertAdjacentElement('beforebegin',titleSlot);
    }
    if(title)titleSlot.append(title);
    let slot=detail.querySelector(':scope > .mobile-offer-slot');
    if(!slot){
      slot=document.createElement('div');
      slot.className='mobile-offer-slot';
      media.insertAdjacentElement('afterend',slot);
    }
    slot.append(offer);
    if(disclaimer)slot.append(disclaimer);
    if(actions)slot.append(actions);
  }else{
    if(title&&titleAnchor)titleAnchor.insertAdjacentElement('afterend',title);
    detail.querySelector(':scope > .mobile-product-title-slot')?.remove();
    anchor.insertAdjacentElement('afterend',offer);
    if(disclaimer)offer.insertAdjacentElement('afterend',disclaimer);
    if(actions&&actionsAnchor)actionsAnchor.insertAdjacentElement('afterend',actions);
    detail.querySelector(':scope > .mobile-offer-slot')?.remove();
  }
}

async function renderPremiumProductInsight(data,insightPromise){
  if(!data||document.querySelector('.premium-product-insight'))return;
  const anchor=document.querySelector('.product-description-section')||document.querySelector('.product-information-sections')||document.querySelector('#conteudo > .section.alt');
  if(!anchor)return;
  const section=document.createElement('section');section.className='section premium-product-insight is-loading';
  if(!session()){
    section.className='section premium-product-insight is-locked free-ai-login';
    section.innerHTML=`<div class="container"><span class="eyebrow">5 CRÉDITOS DE IA GRÁTIS</span><h2>Entre para analisar este produto com IA</h2><p>Crie sua conta ou faça login para usar comparação inteligente e análises personalizadas. Você começa com 5 créditos gratuitos.</p><a class="btn primary" href="entrar.html?next=${encodeURIComponent(location.pathname+location.search)}">Entrar e usar meus créditos</a></div>`;
    anchor.insertAdjacentElement('afterend',section);
    return;
  }
  section.innerHTML='<div class="container"><span class="eyebrow">SHOPLAB+ · ANÁLISE PARA VOCÊ</span><h2>Como este produto combina com seu perfil</h2><p>Preparando uma conclusão personalizada…</p></div>';
  anchor.insertAdjacentElement('afterend',section);
  try{
    const insight=await(insightPromise||userApi(`products/${encodeURIComponent(data.slug)}/plus-insight`));
    if(insight.freeCreditsExhausted){section.className='section premium-product-insight is-locked';section.innerHTML='<div class="container"><span class="eyebrow">SEUS 5 CRÉDITOS FORAM USADOS</span><h2>Continue analisando com SHOPLAB+</h2><p>Você já aproveitou suas análises gratuitas. Assine para receber novas análises inteligentes todos os meses.</p><a class="btn primary" href="conta.html?aba=plus">Conhecer o SHOPLAB+</a></div>';return}
    if(insight.premiumRequired){section.className='section premium-product-insight is-locked';section.innerHTML=`<div class="container"><span class="eyebrow">EXCLUSIVO SHOPLAB+</span><h2>Descubra se este produto é para você</h2><p>Receba uma conclusão personalizada, veja para quem o produto é indicado e como ele pode ajudar no seu uso.</p><a class="btn primary" href="conta.html?aba=plus">Conhecer o SHOPLAB+</a></div>`;return}
    if(insight.quotaExceeded){section.className='section premium-product-insight is-locked';section.innerHTML='<div class="container"><span class="eyebrow">SHOPLAB+</span><h2>Limite mensal de novas análises atingido</h2><p>Análises já salvas em cache continuam disponíveis. Consulte seu plano para acompanhar a renovação da cota.</p><a class="btn ghost" href="conta.html?aba=plus">Ver meu plano</a></div>';return}
    if(!insight.conclusion?.length){section.remove();return}
    const lines=value=>`<div>${(value||[]).map(item=>`<p>${safe(item)}</p>`).join('')}</div>`;
    section.className='section premium-product-insight';
    section.innerHTML=`<div class="container"><div class="premium-insight-head"><div><span class="eyebrow">SHOPLAB+ · ANÁLISE PARA VOCÊ</span><h2>Como este produto combina com seu perfil</h2></div><small>${insight.cacheHit?'Análise personalizada salva':'Nova análise personalizada'}</small></div><article class="premium-insight-conclusion"><h3>Conclusão da IA</h3>${lines(insight.conclusion)}</article><div class="premium-insight-grid"><article><span>01</span><h3>Para quem é este produto</h3>${lines(insight.bestFor)}</article><article><span>02</span><h3>Como ele pode ajudar</h3>${lines(insight.howItHelps)}</article></div><small class="premium-insight-disclaimer">Análise baseada nos dados cadastrados do produto e nas suas preferências de uso. Confirme informações importantes com o fabricante.</small></div>`;
    if(insight.freeAccess){
      const label=section.querySelector('.premium-insight-head .eyebrow'),status=section.querySelector('.premium-insight-head small');
      if(label)label.textContent='CRÉDITO GRÁTIS · ANÁLISE PARA VOCÊ';
      if(status)status.textContent=`${Number(insight.freeCredits?.remaining||0)} créditos grátis restantes`;
    }
  }catch(error){
    if(/entre na sua conta/i.test(String(error?.message||''))){
      section.className='section premium-product-insight is-locked free-ai-login';
      section.innerHTML=`<div class="container"><span class="eyebrow">5 CRÉDITOS DE IA GRÁTIS</span><h2>Entre para analisar este produto com IA</h2><p>Sua sessão expirou. Entre novamente para usar seus créditos gratuitos.</p><a class="btn primary" href="entrar.html?next=${encodeURIComponent(location.pathname+location.search)}">Entrar na minha conta</a></div>`;
    }else section.remove();
  }
}

function openGallery(items,startIndex,name){
  let index=Math.max(0,Math.min(startIndex,items.length-1));
  const modal=document.createElement('div');modal.className='image-viewer';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Galeria de imagens do produto');
  modal.innerHTML=`<div class="image-viewer-backdrop" data-close-gallery></div><div class="image-viewer-panel"><button class="image-viewer-close" type="button" data-close-gallery aria-label="Fechar galeria">×</button><button class="image-viewer-nav previous" type="button" aria-label="Imagem anterior">‹</button><figure><img><figcaption></figcaption></figure><button class="image-viewer-nav next" type="button" aria-label="Próxima imagem">›</button><div class="image-viewer-count"></div></div>`;
  const image=modal.querySelector('img'),caption=modal.querySelector('figcaption'),count=modal.querySelector('.image-viewer-count');
  const show=next=>{index=(next+items.length)%items.length;image.src=url(items[index]);image.alt=items[index].altText||name||'Produto';caption.textContent=items[index].caption||items[index].altText||'';count.textContent=`${index+1} de ${items.length}`};
  const close=()=>{document.removeEventListener('keydown',keyboard);modal.remove();document.body.classList.remove('gallery-open')};
  const keyboard=event=>{if(event.key==='Escape')close();if(event.key==='ArrowLeft')show(index-1);if(event.key==='ArrowRight')show(index+1)};
  modal.addEventListener('click',event=>{if(event.target.closest('[data-close-gallery]'))close();else if(event.target.closest('.previous'))show(index-1);else if(event.target.closest('.next'))show(index+1)});
  document.addEventListener('keydown',keyboard);document.body.append(modal);document.body.classList.add('gallery-open');show(index);modal.querySelector('.image-viewer-close').focus();
}

async function detailMedia(){
  const box=document.querySelector('.detail-media');if(!box||box.dataset.mediaReady)return;box.dataset.mediaReady='1';
  const slug=new URLSearchParams(location.search).get('slug'),insightPromise=slug&&session()?userApi(`products/${encodeURIComponent(slug)}/plus-insight`).catch(()=>null):null,data=slug?await getProduct(slug):null;renderPromotion(data);renderDescriptions(data);renderProductInformation(data);arrangeMobileOffer();const actionObserver=new MutationObserver(()=>{if(document.querySelector('.user-product-actions')){arrangeMobileOffer();actionObserver.disconnect()}});actionObserver.observe(document.querySelector('.page-hero .detail')||document.body,{childList:true,subtree:true});matchMedia('(max-width:760px)').addEventListener('change',arrangeMobileOffer);renderPremiumProductInsight(data,insightPromise);const items=(data?.media||[]).filter(item=>url(item));if(!items.length)return;box.classList.toggle('has-multiple-media',items.length>1);
  const main=items.find(x=>x.isPrimary)||items[0],mainIndex=items.indexOf(main),visible=items.slice(0,4);
  const thumbs=visible.map((item,index)=>{const remaining=items.length-3,isMore=items.length>4&&index===3;return `<button type="button" class="${item.id===main.id?'active':''} ${isMore?'more-images':''}" data-index="${index}" aria-label="${isMore?`Ver mais ${remaining} imagens`:`Ver imagem ${index+1}`}"><img src="${url(item)}" alt="" loading="lazy">${isMore?`<span>+${remaining}</span>`:''}</button>`}).join('');
  box.innerHTML=`<button class="detail-main-image" type="button" data-index="${mainIndex}" aria-label="Ampliar imagem"><img src="${url(main)}" alt="${safe(main.altText||data.name||'Produto')}" style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;padding:24px;object-fit:contain;object-position:center;transform:none"><span class="detail-image-magnifier" aria-hidden="true"></span></button>${items.length>1?`<div class="detail-thumbs">${thumbs}</div>`:''}`;
  const mainButton=box.querySelector('.detail-main-image'),mainImage=mainButton.querySelector('img'),magnifier=mainButton.querySelector('.detail-image-magnifier'),syncMagnifier=()=>{magnifier.style.backgroundImage=`url("${String(mainImage.currentSrc||mainImage.src).replaceAll('"','%22')}")`};
  syncMagnifier();
  mainImage.addEventListener('load',syncMagnifier);
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    mainButton.addEventListener('pointerenter',syncMagnifier);
    mainButton.addEventListener('pointermove',event=>{const rect=mainButton.getBoundingClientRect(),styles=getComputedStyle(mainImage),paddingX=parseFloat(styles.paddingLeft||0)+parseFloat(styles.paddingRight||0),paddingY=parseFloat(styles.paddingTop||0)+parseFloat(styles.paddingBottom||0),availableWidth=Math.max(1,rect.width-paddingX),availableHeight=Math.max(1,rect.height-paddingY),ratio=(mainImage.naturalWidth||1)/(mainImage.naturalHeight||1),renderedWidth=Math.min(availableWidth,availableHeight*ratio),renderedHeight=renderedWidth/ratio,imageLeft=(rect.width-renderedWidth)/2,imageTop=(rect.height-renderedHeight)/2,x=event.clientX-rect.left,y=event.clientY-rect.top;if(x<imageLeft||x>imageLeft+renderedWidth||y<imageTop||y>imageTop+renderedHeight){mainButton.classList.remove('is-magnifying');return}const lens=156,zoom=2.15,lensX=Math.max(lens/2+8,Math.min(rect.width-lens/2-8,x)),lensY=Math.max(lens/2+8,Math.min(rect.height-lens/2-8,y)),sourceX=x-imageLeft,sourceY=y-imageTop;mainButton.style.setProperty('--magnifier-x',`${lensX}px`);mainButton.style.setProperty('--magnifier-y',`${lensY}px`);magnifier.style.backgroundSize=`${renderedWidth*zoom}px ${renderedHeight*zoom}px`;magnifier.style.backgroundPosition=`${lens/2-sourceX*zoom}px ${lens/2-sourceY*zoom}px`;mainButton.classList.add('is-magnifying')});
    mainButton.addEventListener('pointerleave',()=>mainButton.classList.remove('is-magnifying'));
  }
  const showMain=index=>{index=(index+items.length)%items.length;const item=items[index];mainImage.src=url(item);mainImage.alt=item.altText||data.name||'Produto';mainButton.dataset.index=String(index);mainButton.classList.remove('is-magnifying');box.querySelectorAll('.detail-thumbs button').forEach(thumb=>thumb.classList.toggle('active',Number(thumb.dataset.index)===index));};
  let swipeStartX=null,swiped=false;
  if(matchMedia('(hover:none),(pointer:coarse)').matches){
    mainButton.style.touchAction='pan-y pinch-zoom';
    mainButton.addEventListener('pointerdown',event=>{swipeStartX=event.clientX;swiped=false},{passive:true});
    mainButton.addEventListener('pointerup',event=>{if(swipeStartX==null)return;const distance=event.clientX-swipeStartX;swipeStartX=null;if(Math.abs(distance)<42)return;swiped=true;showMain(Number(mainButton.dataset.index||0)+(distance<0?1:-1))},{passive:true});
    mainButton.addEventListener('pointercancel',()=>{swipeStartX=null},{passive:true});
  }
  mainButton.addEventListener('click',event=>{if(swiped){swiped=false;event.preventDefault();return}openGallery(items,Number(event.currentTarget.dataset.index)||0,data.name)});
  box.querySelector('.detail-thumbs')?.addEventListener('click',event=>{const button=event.target.closest('[data-index]');if(!button)return;const index=Number(button.dataset.index);if(button.classList.contains('more-images')){openGallery(items,index,data.name);return}showMain(index)});
}

document.addEventListener('click',async event=>{const link=event.target.closest('[data-offer]');if(!link)return;event.preventDefault();event.stopImmediatePropagation();const original=link.textContent;link.textContent='Abrindo oferta...';link.setAttribute('aria-busy','true');const product=await getProduct(link.dataset.offer);if(product?.offerId){location.href=`${C.API_BASE_URL}/go/${encodeURIComponent(product.slug)}/${encodeURIComponent(product.offerId)}`;return}link.textContent=original;link.removeAttribute('aria-busy');alert('Este produto ainda não possui um link afiliado ativo.')},true);

document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-share-product]');
  if(!button)return;
  const original=button.innerHTML,slug=button.dataset.shareProduct,name=button.dataset.shareName||'Produto SHOPLAB';
  button.disabled=true;button.textContent='Preparando...';
  try{
    const product=await getProduct(slug),money=value=>(Number(value||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),price=Number(product?.price||0),oldPrice=Number(product?.oldPrice||0);
    const shareUrl=session()?(await userApi('share-links',{method:'POST',body:JSON.stringify({slug})})).url:`${C.API_BASE_URL}/share/${encodeURIComponent(slug)}?site=${encodeURIComponent(location.origin)}`;
    const priceText=price?(oldPrice>price?`De ${money(oldPrice)} por ${money(price)}`:`Por ${money(price)}`):'';
    const data={title:name,text:[`Confira ${name} na SHOPLAB`,priceText].filter(Boolean).join(' — '),url:shareUrl};
    if(navigator.share){
      await navigator.share(data);
    }else{
      await navigator.clipboard.writeText(shareUrl);
      button.textContent='Link copiado!';
      setTimeout(()=>button.innerHTML=original,1800);
      return;
    }
  }catch(error){if(error.name!=='AbortError'){try{const shareUrl=session()?(await userApi('share-links',{method:'POST',body:JSON.stringify({slug})})).url:`${C.API_BASE_URL}/share/${encodeURIComponent(slug)}?site=${encodeURIComponent(location.origin)}`;await navigator.clipboard.writeText(shareUrl);button.textContent='Link copiado!';setTimeout(()=>button.innerHTML=original,1800);return}catch{}}}
  button.disabled=false;button.innerHTML=original;
},true);

/* Midia alternativa sob demanda: evita uma requisicao de produto para cada card no carregamento. */
document.addEventListener('pointerover',event=>{
  if(matchMedia('(hover:none),(pointer:coarse)').matches)return;
  const card=event.target.closest?.('.product-card');
  if(card)cardMedia(card);
},{passive:true});
document.addEventListener('click',async event=>{
  const media=event.target.closest?.('.product-card .product-media');
  if(!media||!matchMedia('(hover:none),(pointer:coarse)').matches)return;
  const card=media.closest('.product-card');
  if(card.dataset.mediaSwapReady||card.dataset.mediaSwapLoading)return;
  event.preventDefault();event.stopImmediatePropagation();
  await cardMedia(card);
  if(card.classList.contains('has-alternate-image'))card.classList.add('show-alternate-image');
  else location.href=media.href;
},true);
let detailScanQueued=false;
const detailObserver=new MutationObserver(()=>{
  if(detailScanQueued)return;detailScanQueued=true;
  requestAnimationFrame(()=>{
    detailScanQueued=false;
    if(!document.querySelector('.detail'))return;
    detailMedia();detailObserver.disconnect();
  });
});
function scan(){if(document.querySelector('.detail'))detailMedia();else detailObserver.observe(document.documentElement,{childList:true,subtree:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scan,{once:true}):scan();
