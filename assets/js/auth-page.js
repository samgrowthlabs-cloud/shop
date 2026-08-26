import'./favicon.js?v=20260803-media-domain-38';import{signUp,signIn,signOut,recover,updatePassword,updateAccountCredentials,acceptRedirectSession,session,currentUser,apiProfile,userApi,startPresence}from'./auth.js?v=20260826-local-callback-4';
import'./search-ui.js?v=20260803-media-domain-38';
import{syncAccountLibrary,setCart}from'./user-library.js?v=20260807-card-compare-1';
import{initSiteHeader,setPremiumBrand}from'./site-header.js?v=20260726-mobile-header-4';
import{SHOPLAB_CONFIG}from'./config.js?v=20260803-media-domain-38';
const $=selector=>document.querySelector(selector),page=document.body.dataset.authPage;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>(Number(value||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const expiryDate=value=>{const text=String(value||''),date=new Date(text);if(!Number.isFinite(date.getTime()))return'—';return date.toLocaleDateString('pt-BR',{timeZone:/T00:00:00(?:\.000)?Z$/i.test(text)?'UTC':'America/Sao_Paulo'})};
const message=(text,type='error')=>{const box=$('#auth-message');box.textContent=text;box.className=`auth-message ${type}`};
const securityMessage=(text,type='error')=>{const box=$('#account-security-message');if(!box)return;box.textContent=text;box.className=`auth-message ${type}`};
const subscriptionCacheKey=userId=>`shoplab:plus-subscription:${userId}`;
const insightAutoEnabled=()=>{try{return localStorage.getItem('shoplab:ai-product-insight:auto')!=='off'}catch{return true}};
const insightToggleIcon=enabled=>enabled?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3m0 12v3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12M3 12h3m12 0h3M5.64 18.36l2.12-2.12m8.48-8.48 2.12-2.12"/><path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M12 3v3m0 12v3M3 12h3m12 0h3M18.36 5.64l-2.12 2.12M5.64 18.36l2.12-2.12"/><path d="M8.8 8.8A3.5 3.5 0 0 0 15.2 15.2"/></svg>';
const aiPreferenceControl=()=>{const enabled=insightAutoEnabled();return `<div class="plus-ai-preference"><div><span class="eyebrow">ECONOMIA DE CRÉDITOS</span><h4>Análise automática por IA</h4><p>${enabled?'Ao abrir um produto, a IA prepara sua análise automaticamente.':'A IA não é chamada ao abrir produtos; você pode gerar uma análise manualmente quando quiser.'}</p></div><button class="ai-insight-toggle ${enabled?'is-on':'is-off'}" id="plus-ai-insight-toggle" type="button" aria-pressed="${enabled}">${insightToggleIcon(enabled)}<span>IA ${enabled?'ativada':'desativada'}</span></button></div>`};
const readSubscriptionCache=userId=>{try{const cached=JSON.parse(sessionStorage.getItem(subscriptionCacheKey(userId))||'null');return cached&&Date.now()-Number(cached.savedAt||0)<5*60e3?cached.data:null}catch{return null}};
const saveSubscriptionCache=(userId,data)=>{try{sessionStorage.setItem(subscriptionCacheKey(userId),JSON.stringify({savedAt:Date.now(),data}))}catch{}};
let redirectError=null;let latestPremiumSubscription=null;try{acceptRedirectSession()}catch(error){redirectError=error}

function rows(items,kind){
  const icon=kind==='favorites'?'heart':kind==='ratings'?'star':'list';
  if(!items.length)return`<div class="account-empty"><img src="assets/icons/${icon}.svg" alt=""><p>Nada por aqui ainda.</p></div>`;
  return `<div class="account-list">${items.map(item=>{const image=item.storageKey?`${SHOPLAB_CONFIG.API_BASE_URL}/media/${encodeURIComponent(item.storageKey)}?w=160&q=76`:item.externalUrl||'';return`<article><a class="account-product-thumb" href="produto.html?slug=${encodeURIComponent(item.slug)}" aria-label="Ver ${esc(item.name||item.slug)}">${image?`<img src="${esc(image)}" alt="${esc(item.altText||item.name||'Produto')}" loading="lazy" decoding="async">`:`<img class="fallback" src="assets/icons/${icon}.svg" alt="">`}</a><a class="account-product-copy" href="produto.html?slug=${encodeURIComponent(item.slug)}"><strong>${esc(item.name||String(item.slug).replaceAll('-',' '))}</strong>${item.price!=null?`<small>${money(item.price)}</small>`:''}</a>${kind==='cart'?`<div class="account-item-side"><button class="btn ghost" type="button" data-remove-cart="${esc(item.slug)}" data-cart-quantity="${Number(item.quantity)||1}">Remover</button></div>`:''}${kind==='favorites'?'<img class="account-status-icon favorite" src="assets/icons/heart.svg" alt="Produto curtido">':''}${kind==='ratings'?`<span class="account-rating" aria-label="${Number(item.rating)} de 5 estrelas">${'★'.repeat(Number(item.rating))}${'☆'.repeat(5-Number(item.rating))}</span>`:''}</article>`}).join('')}</div>`;
}

function premiumBenefits(limit){
  return `<div class="premium-benefits">
    <article><span aria-hidden="true">⌕</span><div><strong>Busca inteligente Plus</strong><p>Entende o que você procura e prioriza adequação, qualidade, avaliações, preço e custo-benefício.</p></div></article>
    <article><span aria-hidden="true">✦</span><div><strong>Análises completas com IA</strong><p>${Number(limit||50)} novas análises por mês com ficha técnica normalizada, descrições e contexto de uso.</p></div></article>
    <article><span aria-hidden="true">⇄</span><div><strong>Comparação que explica de verdade</strong><p>Mostra diferenças, limitações, melhor escolha geral, melhor custo-benefício e quando vale pagar mais.</p></div></article>
    <article><span aria-hidden="true">◎</span><div><strong>Recomendações para o seu uso</strong><p>Identifica qual produto combina melhor com trabalho, estudos, jogos, leitura e outras necessidades.</p></div></article>
    <article><span aria-hidden="true">⚡</span><div><strong>Resultados salvos e rápidos</strong><p>Análises já geradas são recuperadas do cache sem consumir novamente a sua cota.</p></div></article>
    <article><span aria-hidden="true">+</span><div><strong>Identidade Plus</strong><p>Seu acesso aparece na conta e na marca SHOPLAB enquanto o plano estiver ativo.</p></div></article>
  </div>`;
}

function renderPremiumSubscription(data){
  latestPremiumSubscription=data;
  const target=$('#premium-subscription');if(!target||!data)return;
  setPremiumBrand(Boolean(data.premium));
  const plan=data.plan||{},usage=data.usage||{},status=data.status||'free';
  if(plan.enabled===false&&!data.premium){const text=esc(plan.comingSoonMessage||'Em breve');target.innerHTML=`<div class="premium-plan-state is-coming-soon"><span class="premium-status">EM BREVE</span><h3>${esc(plan.name||'SHOPLAB+')}</h3>${premiumBenefits(plan.aiMonthlyLimit)}<div class="notice"><strong>${text}</strong><p>As assinaturas, passes e funcionalidades do SHOPLAB+ ainda não estão disponíveis.</p></div></div>`;return}
  const grant=data.pendingGrant,grantCard=grant?`<div class="premium-grant-card" role="status"><span class="premium-status">PRESENTE DISPONÍVEL</span><h3>Você recebeu ${Number(grant.days)} ${Number(grant.days)===1?'dia':'dias'} de SHOPLAB+</h3><p>O Plus ainda não está ativo. Resgate até <strong>${esc(expiryDate(grant.claimExpiresAt))}</strong>; o período começa somente depois do resgate.</p><button class="btn primary" id="claim-premium-grant" type="button">Resgatar agora</button></div>`:'';
  if(grant&&!data.premium){target.innerHTML=grantCard;bindPremiumActions();return}
  if(data.premium){const passActive=status==='pass_active';const price=money(passActive?data.pass?.amountCents:data.subscription?.amountCents||plan.amountCents||0);target.innerHTML=`${grantCard}<div class="premium-plan-state active"><span class="premium-status">SHOPLAB+ ATIVO</span><h3>${esc(plan.name||'SHOPLAB+')}</h3><strong>${price}${passActive?`<small> por ${Number(plan.passDays||30)} dias</small>`:'<small>/mês</small>'}</strong>${passActive?`<p>Seu passe avulso é válido até <strong>${esc(expiryDate(data.pass?.accessExpiresAt))}</strong>.</p>`:'<p>Sua assinatura tem renovação automática mensal. No portal seguro você pode atualizar o cartão, consultar cobranças e cancelar o plano.</p>'}<p>Você tem ${Number(usage.remaining||0)} de ${Number(usage.limit||0)} novas análises inteligentes disponíveis neste mês. Resultados já armazenados no cache não consomem sua cota.</p><div class="premium-usage"><span style="width:${Math.min(100,Math.round(Number(usage.used||0)/Math.max(1,Number(usage.limit||1))*100))}%"></span></div>${aiPreferenceControl()}${passActive?'':'<div class="premium-subscription-actions"><button class="btn primary" id="manage-premium" type="button">Gerenciar assinatura</button><button class="btn ghost" id="cancel-premium" type="button">Cancelar agora</button></div>'}</div>`;bindPremiumActions();return}
  const subscriptionPending=status==='pending',passPending=status==='pass_pending';
  target.innerHTML=`<div class="premium-plan-state"><span class="premium-status">${plan.promotion?esc(plan.promotion.label):'ESCOLHA COMO PAGAR'}</span><h3>${esc(plan.name||'SHOPLAB+')}</h3>${premiumBenefits(plan.aiMonthlyLimit)}<div class="premium-payment-options"><article><span>PASSE AVULSO</span><strong>${money(plan.passAmountCents||plan.amountCents||0)}</strong>${plan.promotion&&plan.regularPassAmountCents>plan.passAmountCents?`<del>${money(plan.regularPassAmountCents)}</del>`:''}<p>Acesso por ${Number(plan.passDays||30)} dias, sem renovação automática. Os meios de pagamento disponíveis aparecem no checkout seguro.</p><button class="btn ghost" id="buy-premium-pass" type="button">${passPending?'Continuar pagamento':'Comprar acesso avulso'}</button></article><article><span>ASSINATURA</span><strong>${money(plan.amountCents||0)}<small>/mês</small></strong>${plan.promotion&&plan.regularAmountCents>plan.amountCents?`<del>${money(plan.regularAmountCents)}/mês</del>`:''}<p>Renovação automática mensal. Você pode cancelar quando quiser.</p><button class="btn primary" id="subscribe-premium" type="button">${subscriptionPending?'Continuar assinatura':'Assinar mensalmente'}</button></article></div><small>Os pagamentos são processados pelo checkout seguro da Stripe.</small></div>`;bindPremiumActions();
  const packageList=(plan.packages||[]).filter(item=>item.active!==false);
  const trial=plan.newUserTrial;
  const paymentNote=target.querySelector('.premium-plan-state>small');
  if(trial?.enabled&&Number(trial.days)>0)paymentNote?.insertAdjacentHTML('beforebegin',`<div class="premium-grant-card"><span class="premium-status">NOVOS USUÁRIOS</span><h3>${Number(trial.days)} ${Number(trial.days)===1?'dia grátis':'dias grátis'}</h3><p>${Number(trial.credits||0)} créditos · ${Number(trial.analysis||0)} análises · ${Number(trial.comparisons||0)} comparações para novas contas.</p></div>`);
  if(packageList.length)paymentNote?.insertAdjacentHTML('beforebegin',`<div class="premium-custom-packages"><span class="eyebrow">OUTROS PACOTES</span><div class="premium-payment-options">${packageList.map(item=>`<article><span>${item.mode==='monthly'?'ASSINATURA':'PACOTE AVULSO'}</span><h3>${esc(item.name)}</h3><strong>${money(item.priceCents)}${item.mode==='monthly'?'<small>/mês</small>':''}</strong><p>${Number(item.days||30)} dias · ${Number(item.credits||0)} créditos · ${Number(item.analysis||0)} análises · ${Number(item.comparisons||0)} comparações.</p><button class="btn ${item.mode==='monthly'?'primary':'ghost'}" type="button" data-buy-package="${esc(item.id)}" data-package-mode="${esc(item.mode)}">Escolher este pacote</button></article>`).join('')}</div></div>`);
  target.querySelectorAll('[data-buy-package]').forEach(button=>button.onclick=async()=>{button.disabled=true;button.textContent='Abrindo pagamento…';try{const endpoint=button.dataset.packageMode==='monthly'?'subscription/checkout':'subscription/pass-checkout';const result=await userApi(endpoint,{method:'POST',body:JSON.stringify({packageId:button.dataset.buyPackage})});if(result.checkoutUrl)location.href=result.checkoutUrl;else renderPremiumSubscription(result)}catch(error){message(error.message);button.disabled=false;button.textContent='Tentar novamente'}});
}

function bindPremiumActions(){
  const aiToggle=$('#plus-ai-insight-toggle');if(aiToggle)aiToggle.onclick=()=>{const enabled=!insightAutoEnabled();try{localStorage.setItem('shoplab:ai-product-insight:auto',enabled?'on':'off')}catch{};renderPremiumSubscription(latestPremiumSubscription)};
  const claim=$('#claim-premium-grant');if(claim)claim.onclick=async()=>{claim.disabled=true;claim.textContent='Ativando presente…';try{await userApi('subscription/grant/claim',{method:'POST'});const user=await currentUser();if(user)sessionStorage.removeItem(subscriptionCacheKey(user.id));message('Seu presente SHOPLAB+ foi ativado.','success');renderPremiumSubscription(await userApi('subscription'))}catch(error){message(error.message);claim.disabled=false;claim.textContent='Resgatar agora'}};
  const subscribe=$('#subscribe-premium');if(subscribe)subscribe.onclick=async()=>{subscribe.disabled=true;subscribe.textContent='Abrindo pagamento…';try{const result=await userApi('subscription/checkout',{method:'POST'});if(result.checkoutUrl)location.href=result.checkoutUrl;else renderPremiumSubscription(result)}catch(error){message(error.message);subscribe.disabled=false;subscribe.textContent='Tentar novamente'}};
  const pass=$('#buy-premium-pass');if(pass)pass.onclick=()=>{location.href='premium-checkout.html'};
  const manage=$('#manage-premium');if(manage)manage.onclick=async()=>{manage.disabled=true;manage.textContent='Abrindo portal…';try{const result=await userApi('subscription/portal',{method:'POST'});if(!result.portalUrl)throw new Error('O portal da assinatura não ficou disponível');location.href=result.portalUrl}catch(error){message(error.message);manage.disabled=false;manage.textContent='Gerenciar assinatura'}};
  const cancel=$('#cancel-premium');if(cancel)cancel.onclick=async()=>{if(!confirm('Deseja cancelar a assinatura Plus agora?'))return;cancel.disabled=true;try{await userApi('subscription/cancel',{method:'PUT'});message('Assinatura cancelada. Enviamos a confirmação por e-mail.','success');renderPremiumSubscription(await userApi('subscription'))}catch(error){message(error.message);cancel.disabled=false}};
}

async function refreshPremiumPaymentReturn(){
  const result=new URLSearchParams(location.search).get('premium_payment');if(!result)return;
  const target=$('#premium-subscription');if(result==='failure'){target?.insertAdjacentHTML('afterbegin','<p class="auth-message error">O pagamento não foi concluído. Você pode tentar novamente.</p>');return}
  target?.insertAdjacentHTML('afterbegin','<p class="auth-message success">Confirmando o pagamento com a Stripe…</p>');
  for(let attempt=0;attempt<6;attempt+=1){if(attempt)await new Promise(resolve=>setTimeout(resolve,2000));try{const data=await userApi('subscription');renderPremiumSubscription(data);if(data.premium){history.replaceState(null,'','conta.html?aba=plus');return}}catch{}}
  target?.insertAdjacentHTML('afterbegin','<p class="auth-message">O pagamento ainda está sendo processado. Atualize esta página em alguns instantes.</p>');
}

async function account(){
  const user=await currentUser();
  if(!user){location.replace('entrar.html?next=conta.html');return}
  const cachedSubscription=null;
  if(cachedSubscription)renderPremiumSubscription(cachedSubscription);
  const profileRequest=apiProfile();
  const subscriptionRequest=profileRequest.then(()=>userApi('subscription')).then(data=>{saveSubscriptionCache(user.id,data);renderPremiumSubscription(data);return data}).catch(()=>null);
  const [profile,library]=await Promise.all([profileRequest,syncAccountLibrary()]);
  refreshPremiumPaymentReturn();
  subscriptionRequest.then(subscription=>{if(!subscription&&!cachedSubscription&&$('#premium-subscription'))$('#premium-subscription').innerHTML='<p>Não foi possível carregar o plano SHOPLAB+ agora. Tente atualizar a página.</p>'});
  startPresence();
  const accountTabs={perfil:'profile',gerenciar:'manage-account',plus:'premium',convites:'invites',lista:'cart',favoritos:'favorites',avaliacoes:'ratings'};
  const legacyTabs={profile:'perfil','manage-account':'gerenciar',premium:'plus',invites:'convites',cart:'lista',carrinho:'lista',favorites:'favoritos',ratings:'avaliacoes','cart-list':'lista','favorites-list':'favoritos','ratings-list':'avaliacoes'};
  const accountParams=new URLSearchParams(location.search),legacyTab=legacyTabs[location.hash.slice(1)],hasRequestedTab=accountTabs[accountParams.get('aba')]||legacyTab||accountParams.has('premium_payment');
  let activeTab=accountParams.get('aba');
  if(accountParams.has('premium_payment'))activeTab='plus';
  if(!accountTabs[activeTab])activeTab=legacyTab||'perfil';
  if(location.hash){const cleanUrl=new URL(location.href);cleanUrl.hash='';cleanUrl.searchParams.set('aba',activeTab);history.replaceState(null,'',cleanUrl)}
  if(hasRequestedTab)document.body.dataset.accountSection=activeTab;
  const accountTabTitles={perfil:'Meu perfil',gerenciar:'Gerenciar conta',plus:'SHOPLAB Plus',convites:'Convites e recompensas',lista:'Minha lista',favoritos:'Produtos curtidos',avaliacoes:'Minhas avaliações'};
  const mobileTabTitle=$('#mobile-account-tab-title');if(mobileTabTitle)mobileTabTitle.textContent=accountTabTitles[activeTab]||'Minha conta';
  Object.entries(accountTabs).forEach(([tab,id])=>{const panel=document.getElementById(id);if(panel)panel.hidden=tab!==activeTab});
  $('.account-sidebar nav')?.querySelectorAll('[data-account-tab]').forEach(link=>{const active=link.dataset.accountTab===activeTab;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
  const displayName=profile.displayName||user.user_metadata?.display_name||user.email?.split('@')[0]||'Minha conta',initials=displayName.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(),avatar=user.user_metadata?.avatar_url||user.user_metadata?.picture||'';
  const paintAvatar=id=>{const target=$(id);if(!target)return;if(avatar){target.innerHTML=`<img src="${esc(avatar)}" alt="Foto de ${esc(displayName)}" referrerpolicy="no-referrer">`;return}if(!target.querySelector("img"))target.innerHTML=`<b>${esc(initials)}</b>`};
  ['#header-account-avatar','#mobile-header-account-avatar','#mobile-overview-avatar','#sidebar-account-avatar','#profile-account-avatar'].forEach(paintAvatar);
  ['#header-account-name','#sidebar-account-name','#account-welcome-name'].forEach(selector=>{const target=$(selector);if(target)target.textContent=selector==='#account-welcome-name'?`Olá, ${displayName.split(' ')[0]}!`:displayName});
  $('#sidebar-account-email').textContent=user.email||'';
  $('#account-email').textContent=user.email;
  $('#mobile-overview-name').textContent=displayName;
  $('#mobile-overview-email').textContent=user.email||'';
  $('#account-new-email').value=user.email||'';
  $('#display-name').value=displayName;
  $('#favorites-list').innerHTML=rows(library.favorites||[],'favorites');
  $('#ratings-list').innerHTML=rows(library.ratings||[],'ratings');
  $('#cart-list').innerHTML=rows(library.cart||[],'cart');
  const referral=await userApi('referrals').catch(()=>null);if(referral){const target=$('#referral-summary'),progress=referral.nextMilestone?Math.min(100,Math.round(referral.qualified/referral.nextMilestone*100)):100;target.innerHTML=`<div class="referral-numbers"><strong>${referral.qualified}</strong><span>convites qualificados</span><strong>${referral.pending}</strong><span>em validação</span></div><div class="referral-progress"><span style="width:${progress}%"></span></div><p>${referral.nextMilestone?`Faltam ${Math.max(0,referral.nextMilestone-referral.qualified)} para solicitar a recompensa de ${referral.nextMilestone} convites.`:'Você alcançou todas as metas disponíveis.'}</p><small>${esc(referral.rules)}</small>${(referral.rewards||[]).map(item=>`<div class="referral-reward"><b>Meta de ${item.milestone}</b><span>${esc(item.status)}</span></div>`).join('')}`}
  const counts={cart:(library.cart||[]).length,favorites:(library.favorites||[]).length,ratings:(library.ratings||[]).length};
  ['#account-cart-count','#mobile-account-cart-count','#mobile-summary-cart','#sidebar-cart-count','#summary-cart-count'].forEach(selector=>{const target=$(selector);if(target){target.textContent=counts.cart;target.hidden=!counts.cart&&['#account-cart-count','#mobile-account-cart-count'].includes(selector)}});$('#summary-favorites-count').textContent=counts.favorites;$('#summary-ratings-count').textContent=counts.ratings;$('#mobile-summary-favorites').textContent=counts.favorites;$('#mobile-summary-ratings').textContent=counts.ratings;
  $('#account-form').onsubmit=async event=>{event.preventDefault();try{await apiProfile({method:'PUT',body:JSON.stringify({displayName:$('#display-name').value})});message('Perfil salvo.','success')}catch(error){message(error.message)}};
  $('#account-email-form').onsubmit=async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button'),email=$('#account-new-email').value.trim();if(email.toLowerCase()===String(user.email||'').toLowerCase()){securityMessage('Esse já é o e-mail atual da sua conta.');return}button.disabled=true;try{await updateAccountCredentials({email});securityMessage('Solicitação enviada. Confirme a alteração pelos e-mails enviados pela SHOPLAB.','success')}catch(error){securityMessage(error.message)}finally{button.disabled=false}};
  $('#account-password-form').onsubmit=async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button'),password=$('#account-new-password').value,confirmation=$('#account-confirm-password').value;if(password!==confirmation){securityMessage('As senhas não coincidem. Digite a mesma senha nos dois campos.');return}if(password.length<8){securityMessage('A nova senha precisa ter pelo menos 8 caracteres.');return}button.disabled=true;try{await updateAccountCredentials({password});event.currentTarget.reset();securityMessage('Senha alterada com sucesso.','success')}catch(error){securityMessage(error.message)}finally{button.disabled=false}};
  $('#manage-sign-out').onclick=async()=>{await signOut();location.replace('entrar.html')};
  $('#cart-list').onclick=async event=>{const button=event.target.closest('[data-remove-cart]');if(!button)return;await setCart(button.dataset.removeCart,0);button.closest('article').remove();counts.cart=Math.max(0,counts.cart-1);['#account-cart-count','#mobile-account-cart-count','#mobile-summary-cart','#sidebar-cart-count','#summary-cart-count'].forEach(selector=>{const target=$(selector);if(target){target.textContent=counts.cart;target.hidden=!counts.cart&&['#account-cart-count','#mobile-account-cart-count'].includes(selector)}});if(!$('#cart-list article'))$('#cart-list').innerHTML=rows([],'cart')};
  $('#sign-out').onclick=async()=>{await signOut();location.replace('index.html')};
  $('#mobile-sign-out').onclick=async()=>{await signOut();location.replace('index.html')};
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
  if(page==='account'){
    initSiteHeader().catch(()=>{});
    await account();
    return enhanceReferralGiftCards()
  }
  await initSiteHeader();
  if(page==='callback'){
    if(!session()){
      document.querySelector('.auth-card').innerHTML='<h1>Não foi possível confirmar sua conta</h1><p>Abra novamente o link mais recente enviado para o seu e-mail. Se o problema continuar, solicite outro e-mail de confirmação.</p><a class="btn primary" href="entrar.html">Ir para entrar</a>';
      return;
    }
    location.replace('conta');
    return
  }
  const form=$('#auth-form');if(!form)return;
  if(page==='reset'&&redirectError)message(redirectError.message);
  form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;try{if(page==='signup'){await signUp({name:$('#name').value,email:$('#email').value,password:$('#password').value});message('Cadastro criado. Confira seu e-mail para confirmar a conta.','success');form.reset()}else if(page==='login'){await signIn($('#email').value,$('#password').value);location.replace(new URLSearchParams(location.search).get('next')||'conta.html')}else if(page==='recover'){await recover($('#email').value);message('Enviamos o link de recuperação, caso o e-mail esteja cadastrado.','success')}else if(page==='reset'){if(redirectError)throw redirectError;acceptRedirectSession();await updatePassword($('#password').value);form.reset();message('Senha alterada com sucesso. Agora você já pode entrar com a nova senha.','success')}}catch(error){message(error.message)}finally{button.disabled=false}};
}
init();
