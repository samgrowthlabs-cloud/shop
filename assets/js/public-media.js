import{SHOPLAB_CONFIG as C}from'./config.js';

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
  const slug=new URLSearchParams(location.search).get('slug'),data=slug?await getProduct(slug):null;renderPromotion(data);renderDescriptions(data);const items=(data?.media||[]).filter(item=>url(item));if(!items.length)return;
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
  const original=button.textContent,slug=button.dataset.shareProduct,name=button.dataset.shareName||'Produto SHOPLAB';
  button.disabled=true;button.textContent='Preparando...';
  try{
    const shareUrl=`${C.API_BASE_URL}/share/${encodeURIComponent(slug)}?site=${encodeURIComponent(location.origin)}`;
    const data={title:name,text:`Confira ${name} na SHOPLAB`,url:shareUrl};
    if(navigator.share){
      await navigator.share(data);
    }else{
      await navigator.clipboard.writeText(shareUrl);
      button.textContent='Link copiado!';
      setTimeout(()=>button.textContent=original,1800);
      return;
    }
  }catch(error){if(error.name!=='AbortError'){try{const shareUrl=`${C.API_BASE_URL}/share/${encodeURIComponent(slug)}?site=${encodeURIComponent(location.origin)}`;await navigator.clipboard.writeText(shareUrl);button.textContent='Link copiado!';setTimeout(()=>button.textContent=original,1800);return}catch{}}}
  button.disabled=false;button.textContent=original;
},true);

function scan(){document.querySelectorAll('.product-card').forEach(cardMedia);detailMedia()}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scan):scan();
