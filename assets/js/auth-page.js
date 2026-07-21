import{signUp,signIn,signOut,recover,updatePassword,acceptRedirectSession,currentUser,apiProfile,userApi,startPresence}from'./auth.js';
import{syncAccountLibrary,setCart}from'./user-library.js';
import{initSiteHeader,setPremiumBrand}from'./site-header.js?v=20260720-premium-logo-1';
import{SHOPLAB_CONFIG}from'./config.js';
const $=selector=>document.querySelector(selector),page=document.body.dataset.authPage;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>(Number(value||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const expiryDate=value=>{const text=String(value||''),date=new Date(text);if(!Number.isFinite(date.getTime()))return'—';return date.toLocaleDateString('pt-BR',{timeZone:/T00:00:00(?:\.000)?Z$/i.test(text)?'UTC':'America/Sao_Paulo'})};
const message=(text,type='error')=>{const box=$('#auth-message');box.textContent=text;box.className=`auth-message ${type}`};
let redirectError=null;try{acceptRedirectSession()}catch(error){redirectError=error}

function rows(items,kind){
  const icon=kind==='favorites'?'heart':kind==='ratings'?'star':'cart';
  if(!items.length)return`<div class="account-empty"><img src="assets/icons/${icon}.svg" alt=""><p>Nada por aqui ainda.</p></div>`;
  return `<div class="account-list">${items.map(item=>{const image=item.storageKey?`${SHOPLAB_CONFIG.API_BASE_URL}/media/${encodeURIComponent(item.storageKey)}`:item.externalUrl||'';return`<article><a class="account-product-thumb" href="produto.html?slug=${encodeURIComponent(item.slug)}" aria-label="Ver ${esc(item.name||item.slug)}">${image?`<img src="${esc(image)}" alt="${esc(item.altText||item.name||'Produto')}" loading="lazy" decoding="async">`:`<img class="fallback" src="assets/icons/${icon}.svg" alt="">`}</a><a class="account-product-copy" href="produto.html?slug=${encodeURIComponent(item.slug)}"><strong>${esc(item.name||String(item.slug).replaceAll('-',' '))}</strong>${item.price!=null?`<small>${money(item.price)}</small>`:''}</a>${kind==='cart'?`<div class="account-item-side"><button class="btn ghost" type="button" data-remove-cart="${esc(item.slug)}" data-cart-quantity="${Number(item.quantity)||1}">Remover</button></div>`:''}${kind==='favorites'?'<img class="account-status-icon favorite" src="assets/icons/heart.svg" alt="Produto curtido">':''}${kind==='ratings'?`<span class="account-rating" aria-label="${Number(item.rating)} de 5 estrelas">${'★'.repeat(Number(item.rating))}${'☆'.repeat(5-Number(item.rating))}</span>`:''}</article>`}).join('')}</div>`;
}

function renderPremiumSubscription(data){
  const target=$('#premium-subscription');if(!target||!data)return;
  setPremiumBrand(Boolean(data.premium));
  const nav=$('.account-sidebar nav');if(nav&&!nav.querySelector('a[href="#premium"]'))nav.querySelector('a[href="#invites"]')?.insertAdjacentHTML('beforebegin','<a href="#premium">Premium</a>');
  const plan=data.plan||{},usage=data.usage||{},status=data.status||'free';
  if(data.premium){const passActive=status==='pass_active';const price=money(passActive?data.pass?.amountCents:data.subscription?.amountCents||plan.amountCents||0);target.innerHTML=`<div class="premium-plan-state active"><span class="premium-status">PREMIUM ATIVO</span><h3>${esc(plan.name||'SHOPLAB Premium')}</h3><strong>${price}${passActive?`<small> por ${Number(plan.passDays||30)} dias</small>`:'<small>/mês</small>'}</strong>${passActive?`<p>Seu passe avulso é válido até <strong>${esc(expiryDate(data.pass?.accessExpiresAt))}</strong>.</p>`:'<p>Sua assinatura tem renovação automática mensal.</p>'}<p>Você tem ${Number(usage.remaining||0)} de ${Number(usage.limit||0)} novas análises inteligentes disponíveis neste mês. Resultados já armazenados no cache não consomem sua cota.</p><div class="premium-usage"><span style="width:${Math.min(100,Math.round(Number(usage.used||0)/Math.max(1,Number(usage.limit||1))*100))}%"></span></div>${passActive?'':'<button class="btn ghost" id="cancel-premium" type="button">Cancelar assinatura</button>'}</div>`;bindPremiumActions();return}
  const subscriptionPending=status==='pending',passPending=status==='pass_pending';
  target.innerHTML=`<div class="premium-plan-state"><span class="premium-status">${plan.promotion?esc(plan.promotion.label):'ESCOLHA COMO PAGAR'}</span><h3>${esc(plan.name||'SHOPLAB Premium')}</h3><ul><li>${Number(plan.aiMonthlyLimit||50)} novas comparações inteligentes por mês</li><li>Explicações claras sobre as diferenças</li><li>Recomendações para cada tipo de uso</li><li>Comparações em cache sem consumir novamente</li></ul><div class="premium-payment-options"><article><span>PASSE AVULSO</span><strong>${money(plan.passAmountCents||plan.amountCents||0)}</strong>${plan.promotion&&plan.regularPassAmountCents>plan.passAmountCents?`<del>${money(plan.regularPassAmountCents)}</del>`:''}<p>Acesso por ${Number(plan.passDays||30)} dias, sem renovação automática. Os meios de pagamento disponíveis aparecem no checkout seguro.</p><button class="btn ghost" id="buy-premium-pass" type="button">${passPending?'Continuar pagamento':'Comprar acesso avulso'}</button></article><article><span>ASSINATURA</span><strong>${money(plan.amountCents||0)}<small>/mês</small></strong>${plan.promotion&&plan.regularAmountCents>plan.amountCents?`<del>${money(plan.regularAmountCents)}/mês</del>`:''}<p>Renovação automática mensal. Você pode cancelar quando quiser.</p><button class="btn primary" id="subscribe-premium" type="button">${subscriptionPending?'Continuar assinatura':'Assinar mensalmente'}</button></article></div><small>Os pagamentos são processados pelo checkout seguro da Stripe.</small></div>`;bindPremiumActions();
}

function bindPremiumActions(){
  const subscribe=$('#subscribe-premium');if(subscribe)subscribe.onclick=async()=>{subscribe.disabled=true;subscribe.textContent='Abrindo pagamento…';try{const result=await userApi('subscription/checkout',{method:'POST'});if(result.checkoutUrl)location.href=result.checkoutUrl;else renderPremiumSubscription(result)}catch(error){message(error.message);subscribe.disabled=false;subscribe.textContent='Tentar novamente'}};
  const pass=$('#buy-premium-pass');if(pass)pass.onclick=()=>{location.href='premium-checkout.html'};
  const cancel=$('#cancel-premium');if(cancel)cancel.onclick=async()=>{if(!confirm('Deseja cancelar a assinatura Premium agora?'))return;cancel.disabled=true;try{await userApi('subscription/cancel',{method:'PUT'});message('Assinatura cancelada. Enviamos a confirmação por e-mail.','success');renderPremiumSubscription(await userApi('subscription'))}catch(error){message(error.message);cancel.disabled=false}};
}

async function refreshPremiumPaymentReturn(){
  const result=new URLSearchParams(location.search).get('premium_payment');if(!result)return;
  const target=$('#premium-subscription');if(result==='failure'){target?.insertAdjacentHTML('afterbegin','<p class="auth-message error">O pagamento não foi concluído. Você pode tentar novamente.</p>');return}
  target?.insertAdjacentHTML('afterbegin','<p class="auth-message success">Confirmando o pagamento com a Stripe…</p>');
  for(let attempt=0;attempt<6;attempt+=1){if(attempt)await new Promise(resolve=>setTimeout(resolve,2000));try{const data=await userApi('subscription');renderPremiumSubscription(data);if(data.premium){history.replaceState(null,'','conta.html#premium');return}}catch{}}
  target?.insertAdjacentHTML('afterbegin','<p class="auth-message">O pagamento ainda está sendo processado. Atualize esta página em alguns instantes.</p>');
}

async function account(){
  const user=await currentUser();
  if(!user){location.replace('entrar.html?next=conta.html');return}
  const [profile,library,subscription]=await Promise.all([apiProfile(),syncAccountLibrary(),userApi('subscription').catch(()=>null)]);
  renderPremiumSubscription(subscription);
  refreshPremiumPaymentReturn();
  if(!subscription&&$('#premium-subscription'))$('#premium-subscription').innerHTML='<p>Não foi possível carregar o plano Premium agora. Tente atualizar a página.</p>';
  startPresence();
  const displayName=profile.displayName||user.user_metadata?.display_name||user.email?.split('@')[0]||'Minha conta',initials=displayName.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(),avatar=user.user_metadata?.avatar_url||user.user_metadata?.picture||'';
  const paintAvatar=id=>{const target=$(id);if(target)target.innerHTML=avatar?`<img src="${esc(avatar)}" alt="Foto de ${esc(displayName)}" referrerpolicy="no-referrer">`:`<b>${esc(initials)}</b>`};
  ['#header-account-avatar','#sidebar-account-avatar','#profile-account-avatar'].forEach(paintAvatar);
  ['#header-account-name','#sidebar-account-name','#account-welcome-name'].forEach(selector=>{const target=$(selector);if(target)target.textContent=selector==='#account-welcome-name'?`Olá, ${displayName.split(' ')[0]}!`:displayName});
  $('#sidebar-account-email').textContent=user.email||'';
  $('#account-email').textContent=user.email;
  $('#display-name').value=displayName;
  $('#favorites-list').innerHTML=rows(library.favorites||[],'favorites');
  $('#ratings-list').innerHTML=rows(library.ratings||[],'ratings');
  $('#cart-list').innerHTML=rows(library.cart||[],'cart');
  const referral=await userApi('referrals').catch(()=>null);if(referral){const target=$('#referral-summary'),progress=referral.nextMilestone?Math.min(100,Math.round(referral.qualified/referral.nextMilestone*100)):100;target.innerHTML=`<div class="referral-numbers"><strong>${referral.qualified}</strong><span>convites qualificados</span><strong>${referral.pending}</strong><span>em validação</span></div><div class="referral-progress"><span style="width:${progress}%"></span></div><p>${referral.nextMilestone?`Faltam ${Math.max(0,referral.nextMilestone-referral.qualified)} para solicitar a recompensa de ${referral.nextMilestone} convites.`:'Você alcançou todas as metas disponíveis.'}</p><small>${esc(referral.rules)}</small>${(referral.rewards||[]).map(item=>`<div class="referral-reward"><b>Meta de ${item.milestone}</b><span>${esc(item.status)}</span></div>`).join('')}`}
  const cartCount=(library.cart||[]).reduce((total,item)=>total+Number(item.quantity||0),0),counts={cart:cartCount,favorites:(library.favorites||[]).length,ratings:(library.ratings||[]).length};
  ['#account-cart-count','#sidebar-cart-count','#summary-cart-count'].forEach(selector=>{const target=$(selector);if(target){target.textContent=counts.cart;target.hidden=!counts.cart&&selector==='#account-cart-count'}});$('#summary-favorites-count').textContent=counts.favorites;$('#summary-ratings-count').textContent=counts.ratings;
  $('#account-form').onsubmit=async event=>{event.preventDefault();try{await apiProfile({method:'PUT',body:JSON.stringify({displayName:$('#display-name').value})});message('Perfil salvo.','success')}catch(error){message(error.message)}};
  $('#cart-list').onclick=async event=>{const button=event.target.closest('[data-remove-cart]');if(!button)return;const quantity=Number(button.dataset.cartQuantity||1);await setCart(button.dataset.removeCart,0);button.closest('article').remove();counts.cart=Math.max(0,counts.cart-quantity);['#account-cart-count','#sidebar-cart-count','#summary-cart-count'].forEach(selector=>{const target=$(selector);if(target){target.textContent=counts.cart;target.hidden=!counts.cart&&selector==='#account-cart-count'}});if(!$('#cart-list article'))$('#cart-list').innerHTML=rows([],'cart')};
  $('#sign-out').onclick=async()=>{await signOut();location.replace('index.html')};
}

async function enhanceReferralGiftCards(){
  const [referral,manualRewards]=await Promise.all([userApi('referrals').catch(()=>null),userApi('rewards').catch(()=>[])]),target=$('#referral-summary');
  if(!referral||!target)return;
  target.querySelectorAll('.referral-reward').forEach(element=>element.remove());
  target.insertAdjacentHTML('beforeend',(referral.rewards||[]).map(item=>item.giftCard?`<article class="gift-card-wallet"><div class="gift-card-brand">${item.giftCard.logoUrl?`<img src="${esc(item.giftCard.logoUrl)}" alt="Logo ${esc(item.giftCard.type)}">`:''}<div><small>GIFT CARD ENTREGUE</small><h3>${esc(item.giftCard.type)}</h3><strong>${money(item.giftCard.valueCents)}</strong></div></div><div class="gift-card-secret"><span>Código</span><code>${esc(item.giftCard.code)}</code><button class="btn ghost" type="button" data-copy-gift="${esc(item.giftCard.code)}">Copiar</button></div>${item.giftCard.pin?`<div class="gift-card-secret"><span>PIN</span><code>${esc(item.giftCard.pin)}</code><button class="btn ghost" type="button" data-copy-gift="${esc(item.giftCard.pin)}">Copiar</button></div>`:''}${item.giftCard.expiresAt?`<small>Válido até ${expiryDate(item.giftCard.expiresAt)}</small>`:''}${item.giftCard.instructions?`<p>${esc(item.giftCard.instructions)}</p>`:''}</article>`:`<div class="referral-reward"><b>Meta de ${item.milestone}</b><span>${esc(item.status)}</span></div>`).join(''));
  if(manualRewards.length)target.insertAdjacentHTML('beforeend',`<div class="manual-rewards-heading"><span class="eyebrow">PRESENTES DA SHOPLAB</span><h3>Suas recompensas especiais</h3></div>${manualRewards.map(item=>`<article class="gift-card-wallet special-reward"><div class="gift-card-brand">${item.logoUrl?`<img src="${esc(item.logoUrl)}" alt="Logo ${esc(item.giftCardType)}">`:''}<div><small>${esc(item.title)}</small><h3>${esc(item.giftCardType)}</h3><strong>${money(item.valueCents)}</strong></div></div>${item.reason?`<p class="reward-reason">${esc(item.reason)}</p>`:''}<div class="gift-card-secret"><span>Código</span><code>${esc(item.code)}</code><button class="btn ghost" type="button" data-copy-gift="${esc(item.code)}">Copiar</button></div>${item.pin?`<div class="gift-card-secret"><span>PIN</span><code>${esc(item.pin)}</code><button class="btn ghost" type="button" data-copy-gift="${esc(item.pin)}">Copiar</button></div>`:''}${item.expiresAt?`<small>Válido até ${expiryDate(item.expiresAt)}</small>`:''}${item.instructions?`<p>${esc(item.instructions)}</p>`:''}${item.status==='redeemed'?`<p class="reward-reason"><strong>Resgate confirmado em ${new Date(item.redeemedAt).toLocaleString('pt-BR')}</strong></p>`:`<button class="btn primary" type="button" data-redeem-reward="${esc(item.id)}">Já resgatei este código</button>`}</article>`).join('')}`);
  target.onclick=async event=>{const copyButton=event.target.closest('[data-copy-gift]');if(copyButton){await navigator.clipboard.writeText(copyButton.dataset.copyGift);copyButton.textContent='Copiado';setTimeout(()=>copyButton.textContent='Copiar',1500);return}const redeemButton=event.target.closest('[data-redeem-reward]');if(!redeemButton)return;if(!confirm('Confirma que você já utilizou este código? Esta ação não pode ser desfeita.'))return;redeemButton.disabled=true;try{const result=await userApi(`rewards/${encodeURIComponent(redeemButton.dataset.redeemReward)}/redeem`,{method:'PUT'});const status=document.createElement('p');status.className='reward-reason';status.innerHTML=`<strong>Resgate confirmado em ${new Date(result.redeemedAt).toLocaleString('pt-BR')}</strong>`;redeemButton.replaceWith(status)}catch(error){message(error.message);redeemButton.disabled=false}};
}

async function init(){
  await initSiteHeader();
  if(page==='callback'){location.replace('conta.html');return}
  if(page==='account'){await account();return enhanceReferralGiftCards()}
  const form=$('#auth-form');if(!form)return;
  if(page==='reset'&&redirectError)message(redirectError.message);
  form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;try{if(page==='signup'){await signUp({name:$('#name').value,email:$('#email').value,password:$('#password').value});message('Cadastro criado. Confira seu e-mail para confirmar a conta.','success');form.reset()}else if(page==='login'){await signIn($('#email').value,$('#password').value);location.replace(new URLSearchParams(location.search).get('next')||'conta.html')}else if(page==='recover'){await recover($('#email').value);message('Enviamos o link de recuperação, caso o e-mail esteja cadastrado.','success')}else if(page==='reset'){if(redirectError)throw redirectError;acceptRedirectSession();await updatePassword($('#password').value);form.reset();message('Senha alterada com sucesso. Agora você já pode entrar com a nova senha.','success')}}catch(error){message(error.message)}finally{button.disabled=false}};
}
init();
