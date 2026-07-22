import'./favicon.js';import{currentUser,userApi}from'./auth.js';

const $=selector=>document.querySelector(selector);
const money=value=>(Number(value||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

function showMessage(text,type='error'){
  const box=$('#premium-checkout-message');box.textContent=text;box.className=`premium-checkout-message ${type}`;
}

async function initialize(){
  const user=await currentUser();
  if(!user){location.replace(`entrar.html?next=${encodeURIComponent('premium-checkout.html')}`);return}
  let config;
  try{config=await userApi('subscription/payment-config')}
  catch(error){$('#premium-checkout-loading').hidden=true;showMessage(error.message);return}
  if(config.premium){location.replace('conta.html#premium');return}
  const plan=config.plan||{};
  $('#pass-days').textContent=`${Number(plan.passDays||30)} dias`;
  $('#pass-price').textContent=money(plan.passAmountCents||plan.amountCents||0);
  if(plan.promotion){$('#premium-checkout-promo').hidden=false;$('#premium-checkout-promo').textContent=plan.promotion.label||'Oferta por tempo limitado'}
  if(plan.promotion&&plan.regularPassAmountCents>plan.passAmountCents){$('#pass-regular-price').hidden=false;$('#pass-regular-price').textContent=money(plan.regularPassAmountCents)}
  $('#premium-checkout-loading').hidden=true;
  $('#stripe-checkout-action').hidden=false;
  const button=$('#open-stripe-checkout');
  button.onclick=async()=>{
    button.disabled=true;button.textContent='Abrindo a Stripe…';showMessage('Criando uma sessão segura de pagamento…','loading');
    try{
      const result=await userApi('subscription/pass-checkout',{method:'POST'});
      if(result.premium){location.replace('conta.html#premium');return}
      if(!/^https:\/\//i.test(result.checkoutUrl||''))throw new Error('O checkout seguro não retornou um endereço válido.');
      location.href=result.checkoutUrl;
    }catch(error){showMessage(error.message);button.disabled=false;button.textContent='Tentar novamente'}
  };
}

initialize();
