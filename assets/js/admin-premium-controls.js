import{SHOPLAB_CONFIG as C}from'./config.js?v=20260803-media-domain-38';

const $=(selector,root=document)=>root.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cents=value=>Math.round(Number(String(value||'').replace(',','.'))*100);
const api=async(path,options={})=>{const response=await fetch(`${C.API_BASE_URL}${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});const json=await response.json();if(!response.ok||!json.success)throw new Error(json.error?.message||`Erro ${response.status}`);return json.data};
const number=(form,name)=>Math.max(0,Number(form.elements[name]?.value||0));

export async function install(){
  let form;
  for(let attempt=0;attempt<80&&!form;attempt+=1){form=$('#premium-form');if(!form)await new Promise(resolve=>setTimeout(resolve,50))}
  if(!form)return;
  if(document.getElementById('shoplab-commercial-controls'))return;
  const data=await api('/api/v1/admin/premium-settings'),settings=data.settings||{},plan=data.effectivePlan||{};
  let packages=Array.isArray(plan.packages)?plan.packages:[];
  const controls=document.createElement('section');controls.id='shoplab-commercial-controls';controls.className='full shoplab-commercial-controls';
  controls.innerHTML=`
    <div class="admin-card shoplab-status-card">
      <div class="section-head"><div><span class="eyebrow">PUBLICAÇÃO</span><h2>Disponibilidade do SHOPLAB+</h2><p class="muted">Desligue tudo enquanto os pagamentos ainda estão em teste.</p></div><span class="status ${plan.enabled?'published':'draft'}" id="shoplab-status">${plan.enabled?'Ativo':'Em breve'}</span></div>
      <div class="form-grid">
        <div class="form-field full switch-field"><label><input name="isEnabled" type="checkbox" ${plan.enabled?'checked':''}> Ativar SHOPLAB+, ofertas e checkouts</label></div>
        <div class="form-field switch-field"><label><input name="comparisonEnabled" type="checkbox" ${plan.features?.comparison?'checked':''}> Ativar comparações inteligentes</label></div>
        <div class="form-field switch-field"><label><input name="analysisEnabled" type="checkbox" ${plan.features?.analysis?'checked':''}> Ativar análises de produto</label></div>
        <div class="form-field full"><label>Mensagem quando estiver desligado</label><input name="comingSoonMessage" maxlength="160" value="${esc(plan.comingSoonMessage||'Em breve')}"></div>
      </div>
    </div>
    <div class="admin-card"><div class="section-head"><div><span class="eyebrow">LIMITES</span><h2>O que cada modalidade entrega</h2></div></div><div class="form-grid">
      <div class="form-field"><label>Análises no mensal</label><input name="monthlyAnalysisLimit" type="number" min="0" max="100000" value="${numberValue(settings.monthly_analysis_limit,50)}"></div>
      <div class="form-field"><label>Comparações no mensal</label><input name="monthlyComparisonLimit" type="number" min="0" max="100000" value="${numberValue(settings.monthly_comparison_limit,50)}"></div>
      <div class="form-field"><label>Créditos no avulso</label><input name="passCreditLimit" type="number" min="0" max="100000" value="${numberValue(settings.pass_credit_limit,50)}"></div>
      <div class="form-field"><label>Análises no avulso</label><input name="passAnalysisLimit" type="number" min="0" max="100000" value="${numberValue(settings.pass_analysis_limit,50)}"></div>
      <div class="form-field"><label>Comparações no avulso</label><input name="passComparisonLimit" type="number" min="0" max="100000" value="${numberValue(settings.pass_comparison_limit,50)}"></div>
    </div></div>
    <div class="admin-card"><div class="section-head"><div><span class="eyebrow">BOAS-VINDAS</span><h2>Benefício para novos usuários</h2></div></div><div class="form-grid">
      <div class="form-field full switch-field"><label><input name="newUserTrialEnabled" type="checkbox" ${Number(settings.new_user_trial_enabled)?'checked':''}> Dar período grátis automaticamente</label></div>
      <div class="form-field"><label>Dias grátis</label><input name="newUserTrialDays" type="number" min="0" max="3650" value="${numberValue(settings.new_user_trial_days,0)}"></div>
      <div class="form-field"><label>Créditos</label><input name="newUserTrialCredits" type="number" min="0" max="100000" value="${numberValue(settings.new_user_trial_credits,0)}"></div>
      <div class="form-field"><label>Análises</label><input name="newUserTrialAnalysisLimit" type="number" min="0" max="100000" value="${numberValue(settings.new_user_trial_analysis_limit,0)}"></div>
      <div class="form-field"><label>Comparações</label><input name="newUserTrialComparisonLimit" type="number" min="0" max="100000" value="${numberValue(settings.new_user_trial_comparison_limit,0)}"></div>
    </div></div>
    <div class="admin-card"><div class="section-head"><div><span class="eyebrow">PACOTES</span><h2>Pacotes personalizados</h2><p class="muted">Crie opções adicionais para preparar sua futura oferta comercial.</p></div><button class="btn ghost" id="add-shoplab-package" type="button">+ Criar pacote</button></div><div id="shoplab-package-list"></div></div>`;
  controls.querySelectorAll('input,select').forEach(field=>field.setAttribute('form','premium-form'));
  form.insertAdjacentElement('beforebegin',controls);
  const renderPackages=()=>{$('#shoplab-package-list').innerHTML=packages.length?packages.map((item,index)=>`<article class="shoplab-package-row" data-package="${index}"><div class="form-grid"><div class="form-field"><label>Nome</label><input data-key="name" maxlength="100" value="${esc(item.name)}"></div><div class="form-field"><label>Modalidade</label><select data-key="mode"><option value="pass" ${item.mode!=='monthly'?'selected':''}>Avulso</option><option value="monthly" ${item.mode==='monthly'?'selected':''}>Mensal</option></select></div><div class="form-field"><label>Preço (R$)</label><input data-key="price" inputmode="decimal" value="${(Number(item.priceCents||300)/100).toFixed(2).replace('.',',')}"></div><div class="form-field"><label>Dias</label><input data-key="days" type="number" min="1" value="${Number(item.days||30)}"></div><div class="form-field"><label>Créditos</label><input data-key="credits" type="number" min="0" value="${Number(item.credits||0)}"></div><div class="form-field"><label>Análises</label><input data-key="analysis" type="number" min="0" value="${Number(item.analysis||0)}"></div><div class="form-field"><label>Comparações</label><input data-key="comparisons" type="number" min="0" value="${Number(item.comparisons||0)}"></div><div class="form-field switch-field"><label><input data-key="active" type="checkbox" ${item.active!==false?'checked':''}> Ativo</label></div></div><button class="btn danger" data-remove-package="${index}" type="button">Excluir pacote</button></article>`).join(''):'<div class="empty">Nenhum pacote personalizado.</div>'};
  renderPackages();
  $('#add-shoplab-package').onclick=()=>{packages.push({id:crypto.randomUUID(),name:`Novo pacote ${packages.length+1}`,mode:'pass',priceCents:990,days:30,credits:50,analysis:25,comparisons:25,active:true});renderPackages()};
  $('#shoplab-package-list').onclick=event=>{const button=event.target.closest('[data-remove-package]');if(button){packages.splice(Number(button.dataset.removePackage),1);renderPackages()}};
  form.addEventListener('submit',async event=>{
    event.preventDefault();event.stopImmediatePropagation();
    packages=[...document.querySelectorAll('[data-package]')].map(row=>({id:packages[Number(row.dataset.package)]?.id||crypto.randomUUID(),name:$('[data-key="name"]',row).value.trim(),mode:$('[data-key="mode"]',row).value,priceCents:cents($('[data-key="price"]',row).value),days:Number($('[data-key="days"]',row).value),credits:Number($('[data-key="credits"]',row).value),analysis:Number($('[data-key="analysis"]',row).value),comparisons:Number($('[data-key="comparisons"]',row).value),active:$('[data-key="active"]',row).checked}));
    const body={planName:form.elements.planName.value.trim(),monthlyPriceCents:cents(form.elements.monthlyPrice.value),passPriceCents:cents(form.elements.passPrice.value),passDays:Number(form.elements.passDays.value),aiMonthlyLimit:Number(form.elements.aiMonthlyLimit.value),promotionEnabled:form.elements.promotionEnabled.checked,promotionLabel:form.elements.promotionLabel.value.trim(),promotionMonthlyPriceCents:form.elements.promotionMonthlyPrice.value?cents(form.elements.promotionMonthlyPrice.value):null,promotionPassPriceCents:form.elements.promotionPassPrice.value?cents(form.elements.promotionPassPrice.value):null,promotionStartsAt:form.elements.promotionStartsAt.value?new Date(form.elements.promotionStartsAt.value).toISOString():null,promotionEndsAt:form.elements.promotionEndsAt.value?new Date(form.elements.promotionEndsAt.value).toISOString():null,isEnabled:form.elements.isEnabled.checked,comparisonEnabled:form.elements.comparisonEnabled.checked,analysisEnabled:form.elements.analysisEnabled.checked,comingSoonMessage:form.elements.comingSoonMessage.value.trim(),monthlyAnalysisLimit:number(form,'monthlyAnalysisLimit'),monthlyComparisonLimit:number(form,'monthlyComparisonLimit'),passCreditLimit:number(form,'passCreditLimit'),passAnalysisLimit:number(form,'passAnalysisLimit'),passComparisonLimit:number(form,'passComparisonLimit'),newUserTrialEnabled:form.elements.newUserTrialEnabled.checked,newUserTrialDays:number(form,'newUserTrialDays'),newUserTrialCredits:number(form,'newUserTrialCredits'),newUserTrialAnalysisLimit:number(form,'newUserTrialAnalysisLimit'),newUserTrialComparisonLimit:number(form,'newUserTrialComparisonLimit'),packages};
    try{await api('/api/v1/admin/premium-settings',{method:'PUT',body:JSON.stringify(body)});const message=$('#message');message.textContent='Configurações do SHOPLAB+ salvas. Os próximos acessos e checkouts já respeitarão estas regras.';message.className='admin-message show success';setTimeout(()=>location.reload(),700)}catch(error){const message=$('#message');message.textContent=error.message;message.className='admin-message show error'}
  },true);
}

function numberValue(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?Math.max(0,parsed):fallback}
if(document.body.dataset.adminApp!=='true')install().catch(error=>{const message=$('#message');if(message){message.textContent=error.message;message.className='admin-message show error'}});
