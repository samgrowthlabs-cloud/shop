import{SHOPLAB_CONFIG as C}from'./config.js';
import{session,userApi}from'./auth.js';

const cache=new Map();
async function getProduct(slug){if(cache.has(slug))return cache.get(slug);const promise=fetch(`${C.API_BASE_URL}/api/v1/products/${encodeURIComponent(slug)}`).then(r=>r.ok?r.json():null).then(j=>j?.data||null).catch(()=>null);cache.set(slug,promise);return promise}
const url=m=>m?.storageKey?`${C.API_BASE_URL}/media/${encodeURIComponent(m.storageKey)}`:m?.externalUrl||'';
const safe=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

async function cardMedia(card){if(card.dataset.mediaReady)return;card.dataset.mediaReady='1';const link=card.querySelector('.product-media'),slug=new URL(link.href,location.href).searchParams.get('slug'),data=slug?await getProduct(slug):null,media=data?.media?.find(x=>x.isPrimary)||data?.media?.[0];if(!media||!url(media))return;link.innerHTML=`${card.querySelector('.badge')?.outerHTML||''}<img src="${url(media)}" alt="${safe(media.altText||data.name||'Produto')}" loading="lazy" decoding="async">`}

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
  if(offer){const money=value=>(Number(value||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),logo=data.storeLogoUrl?`<img src="${safe(data.storeLogoUrl)}" alt="Logo ${safe(data.store||'da loja')}">`:'<span aria-hidden="true">🤝</span>';offer.innerHTML=`<small class="offer-label">Melhor preço encontrado</small><div class="price">${money(data.price)} ${Number(data.oldPrice)>Number(data.price)?`<span class="old">${money(data.oldPrice)}</span>`:''}</div><div class="offer-seller">${logo}<p>Vendido por <strong>${safe(data.store||'loja parceira')}</strong> · parceiro verificado</p><img class="offer-verified" src="assets/icons/verified.svg" alt="Verificado"></div><a class="btn primary" href="#" data-offer="${safe(data.slug)}">Ir para oferta <span aria-hidden="true">→</span></a><small class="offer-redirect"><img src="assets/icons/shield-check.svg" alt=""> Você será redirecionado para a loja parceira.</small>`}
  const currentPrice=Number(data.price||0),oldPrice=Number(data.oldPrice||0),discount=oldPrice>currentPrice&&currentPrice>0?Math.round((1-currentPrice/oldPrice)*100):Number(data.discount||0),priceLine=offer?.querySelector('.price');if(priceLine&&discount>0&&!priceLine.querySelector('.detail-discount'))priceLine.insertAdjacentHTML('beforeend',` <span class="detail-discount">${discount}% OFF</span>`);
  const priority=['Processador','Memória RAM','Armazenamento','Tamanho da tela','Tela','Placa de vídeo','Bateria','Resolução','Capacidade','Tipo'];
  const highlights=[...priority.map(name=>specifications.find(item=>item.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))).filter(Boolean),...specifications].filter((item,index,list)=>list.findIndex(other=>other.name===item.name)===index).slice(0,4);
  if(offer&&highlights.length)offer.insertAdjacentHTML('beforebegin',`<div class="product-tech-highlights">${highlights.map(item=>`<div><span>${specificationIcon(item.name)}</span><strong>${safe(item.value)}</strong><small>${safe(item.name)}</small></div>`).join('')}</div>`);
  const oldAnalysis=document.querySelector('#conteudo > .section.alt'),information=document.createElement('div');information.className='product-information-sections';
  information.innerHTML=specifications.length?`<section class="product-specifications-section"><div class="container"><div class="product-section-title"><span class="eyebrow">FICHA TÉCNICA</span><h2>Especificações completas</h2></div><dl class="product-specifications-grid">${specifications.map(item=>`<div><dt>${safe(item.name)}</dt><dd>${safe(item.value)}</dd></div>`).join('')}</dl></div></section>`:'';
  if(oldAnalysis)oldAnalysis.replaceWith(information);else document.querySelector('#conteudo')?.append(information);
  const description=document.querySelector('.product-description-section');if(description)information.insertAdjacentElement('afterend',description);
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
  const slug=new URLSearchParams(location.search).get('slug'),data=slug?await getProduct(slug):null;renderPromotion(data);renderDescriptions(data);renderProductInformation(data);const items=(data?.media||[]).filter(item=>url(item));if(!items.length)return;
  const main=items.find(x=>x.isPrimary)||items[0],mainIndex=items.indexOf(main),visible=items.slice(0,4);
  const thumbs=visible.map((item,index)=>{const remaining=items.length-3,isMore=items.length>4&&index===3;return `<button type="button" class="${item.id===main.id?'active':''} ${isMore?'more-images':''}" data-index="${index}" aria-label="${isMore?`Ver mais ${remaining} imagens`:`Ver imagem ${index+1}`}"><img src="${url(item)}" alt="" loading="lazy">${isMore?`<span>+${remaining}</span>`:''}</button>`}).join('');
  box.innerHTML=`<button class="detail-main-image" type="button" data-index="${mainIndex}" aria-label="Ampliar imagem"><img src="${url(main)}" alt="${safe(main.altText||data.name||'Produto')}"></button>${items.length>1?`<div class="detail-thumbs">${thumbs}</div>`:''}`;
  box.querySelector('.detail-main-image').addEventListener('click',event=>openGallery(items,Number(event.currentTarget.dataset.index)||0,data.name));
  box.querySelector('.detail-thumbs')?.addEventListener('click',event=>{const button=event.target.closest('[data-index]');if(!button)return;const index=Number(button.dataset.index);if(button.classList.contains('more-images')){openGallery(items,index,data.name);return}const item=items[index],image=box.querySelector('.detail-main-image img'),mainButton=box.querySelector('.detail-main-image');image.src=url(item);image.alt=item.altText||data.name||'Produto';mainButton.dataset.index=index;box.querySelectorAll('.detail-thumbs button').forEach(thumb=>thumb.classList.toggle('active',thumb===button))});
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

function scan(){document.querySelectorAll('.product-card').forEach(cardMedia);detailMedia()}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scan):scan();
