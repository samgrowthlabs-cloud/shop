import{SHOPLAB_CONFIG as C}from'./config.js?v=20260803-media-domain-38';
const api=async(path,options={})=>{const response=await fetch(`${C.API_BASE_URL}${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});const json=await response.json();if(!response.ok||!json.success)throw new Error(json.error?.message||`Erro ${response.status}`);return json.data};
async function install(){
  let anchor;
  for(let attempt=0;attempt<120&&!anchor;attempt+=1){anchor=document.querySelector('#promo-list');if(!anchor)await new Promise(resolve=>setTimeout(resolve,50))}
  if(!anchor||document.querySelector('#catalog-settings-form'))return;
  const data=await api('/api/v1/admin/catalog-settings');
  const card=document.createElement('section');card.className='admin-card';
  card.innerHTML=`<div class="section-head"><div><span class="eyebrow">NOVIDADES</span><h2>Período de novidade</h2><p class="muted">Define por quantos dias após a publicação o produto aparece na página Novidades.</p></div></div><form id="catalog-settings-form" class="form-grid"><div class="form-field"><label>Dias como novidade</label><input name="noveltyDays" type="number" min="1" max="3650" required value="${Number(data.noveltyDays||30)}"></div><button class="btn primary" type="submit">Salvar período</button></form>`;
  anchor.insertAdjacentElement('beforebegin',card);
  card.querySelector('form').onsubmit=async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button'),message=document.querySelector('#message');button.disabled=true;try{await api('/api/v1/admin/catalog-settings',{method:'PUT',body:JSON.stringify({noveltyDays:Number(event.currentTarget.elements.noveltyDays.value)})});message.textContent='Período de Novidades atualizado.';message.className='admin-message show success'}catch(error){message.textContent=error.message;message.className='admin-message show error'}finally{button.disabled=false}};
}
if(document.body.dataset.adminPage==='promotions')install().catch(()=>{});
