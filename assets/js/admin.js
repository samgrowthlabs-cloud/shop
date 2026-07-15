import{SHOPLAB_CONFIG as C}from'./config.js';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],page=document.body.dataset.adminPage;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>v==null?'—':(Number(v)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
async function api(path,options={}){const res=await fetch(`${C.API_BASE_URL}${path}`,{...options,credentials:'include',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});let json;try{json=await res.json()}catch{throw new Error('Resposta inválida da API')}if(res.status===401&&page!=='login'){location.href='login.html';throw new Error('Sessão expirada')}if(!res.ok||!json.success)throw new Error(json.error?.message||`Erro ${res.status}`);return json.data}
function message(text,type='error'){const el=$('#message');if(!el)return;el.textContent=text;el.className=`admin-message show ${type}`}
async function guard(){if(page==='login')return;await api('/api/v1/admin/auth/session')}
function shell(active,title,action=''){return `<div class="admin-shell"><aside class="sidebar"><a class="logo" href="../index.html"><span class="logo-mark">⌬</span>SHOP<b>LAB</b></a><nav>${[['dashboard','Visão geral','index.html'],['products','Produtos','produtos.html'],['categories','Categorias','categorias.html'],['promotions','Promoções','promocoes.html']].map(([id,label,href])=>`<a class="${active===id?'active':''}" href="${href}">${label}</a>`).join('')}</nav></aside><main class="admin-main"><header class="admin-top"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h1>${title}</h1></div><div class="admin-actions">${action}<button class="btn ghost" id="logout">Sair</button></div></header><div id="message" class="admin-message"></div><div id="content"><div class="admin-loading">Carregando dados reais…</div></div></main></div><div class="modal" id="category-modal"><div class="modal-card"><div class="modal-head"><h2>Categoria</h2><button class="icon-btn modal-close" type="button">×</button></div><form id="category-form" class="form-grid" style="margin-top:20px"><input id="category-id" type="hidden"><div class="form-field"><label>Nome</label><input id="category-name" required maxlength="100"></div><div class="form-field"><label>Slug</label><input id="category-slug" required maxlength="100" placeholder="exemplo-de-categoria"></div><div class="form-field"><label>Ícone</label><input id="category-icon" maxlength="8"></div><div class="form-field"><label><input id="category-active" type="checkbox" checked> Categoria ativa</label></div><div class="form-field full"><label>Descrição</label><textarea id="category-description" rows="4" maxlength="1000"></textarea></div><button class="btn primary">Salvar</button></form></div></div>`}
function bindLogout(){$('#logout')?.addEventListener('click',async()=>{try{await api('/api/v1/admin/auth/logout',{method:'POST'});location.href='login.html'}catch(e){message(e.message)}});$('.modal-close')?.addEventListener('click',()=>$('#category-modal')?.classList.remove('open'))}
async function login(){
  const button=$('#login-form button[type=submit]');
  window.turnstileToken='';

  if(!C.TURNSTILE_SITE_KEY){
    $('#turnstile-widget').innerHTML='<div class="turnstile-note">A sitekey pública do Turnstile ainda não foi configurada em assets/js/config.js.</div>';
    button.disabled=true;
    button.textContent='Configure o Turnstile';
  }else{
    try{
      await loadTurnstile();
      window.turnstileWidgetId=window.turnstile.render('#turnstile-widget',{
        sitekey:C.TURNSTILE_SITE_KEY,
        theme:'light',
        action:'admin_login',
        callback:token=>{window.turnstileToken=token;button.disabled=false;button.textContent='Entrar'},
        'expired-callback':()=>{window.turnstileToken='';button.disabled=true;button.textContent='Verifique novamente'},
        retry:'auto',
        'retry-interval':3000,
        'refresh-expired':'auto',
        'error-callback':code=>{
          window.turnstileToken='';
          button.disabled=true;
          message(`Turnstile recusou a verificação (código ${code||'desconhecido'}) em ${location.hostname}.`);
          return true;
        },
        'unsupported-callback':()=>{
          window.turnstileToken='';
          button.disabled=true;
          message('Este navegador ou alguma extensão está bloqueando o Turnstile. Teste sem bloqueador de anúncios.');
        }
      });
      button.disabled=true;
      button.textContent='Aguardando verificação…';
    }catch(error){
      button.disabled=true;
      message(error.message);
    }
  }

  $('#login-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const password=$('#password').value;
    if(!password){message('Digite a senha administrativa.');return}
    if(!window.turnstileToken){message('Conclua a verificação de segurança antes de entrar.');return}
    button.disabled=true;
    button.textContent='Entrando…';
    try{
      await api('/api/v1/admin/auth/login',{method:'POST',body:JSON.stringify({password,turnstileToken:window.turnstileToken})});
      location.href='index.html';
    }catch(error){
      message(error.message);
      window.turnstileToken='';
      if(typeof window.turnstile?.reset==='function')window.turnstile.reset(window.turnstileWidgetId);
      button.disabled=true;
      button.textContent='Aguardando verificação…';
    }
  });
}
function loadTurnstile(){return new Promise((resolve,reject)=>{if(typeof window.turnstile?.render==='function')return resolve();const existing=document.querySelector('script[data-shoplab-turnstile]');if(existing){const started=Date.now();const timer=setInterval(()=>{if(typeof window.turnstile?.render==='function'){clearInterval(timer);resolve()}else if(Date.now()-started>10000){clearInterval(timer);reject(new Error('O Turnstile demorou para carregar. Atualize a página.'))}},50);return}const script=document.createElement('script');script.dataset.shoplabTurnstile='true';script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.onload=()=>{const started=Date.now();const timer=setInterval(()=>{if(typeof window.turnstile?.render==='function'){clearInterval(timer);resolve()}else if(Date.now()-started>10000){clearInterval(timer);reject(new Error('A API do Turnstile não ficou disponível.'))}},50)};script.onerror=()=>reject(new Error('Não foi possível carregar o Turnstile'));document.head.append(script)})}
async function dashboard(){document.body.innerHTML=shell('dashboard','Visão geral');bindLogout();const d=await api('/api/v1/admin/dashboard');$('#content').innerHTML=`<div class="stats">${[['Produtos',d.products],['Publicados',d.published],['Rascunhos',d.drafts],['Ofertas ativas',d.activeOffers],['Cliques',d.offerClicks],['Categorias',d.categories]].map(([l,v])=>`<div class="stat"><span class="muted">${l}</span><strong>${v}</strong></div>`).join('')}</div><section class="section"><div class="admin-card"><h2>Produtos mais acessados</h2>${d.topProducts.length?`<div class="chart-list">${d.topProducts.map((x,i)=>`<div class="chart-row"><span>${esc(x.name)}</span><div class="bar"><span style="width:${Math.max(4,100-i*18)}%"></span></div><b>${x.viewCount}</b></div>`).join('')}</div>`:'<div class="empty">As visualizações aparecerão aqui.</div>'}</div></section>`}
async function products(){document.body.innerHTML=shell('products','Produtos','<button class="btn primary" id="new-product">+ Novo produto</button>');bindLogout();const load=async()=>{const q=encodeURIComponent($('#product-search')?.value||''),status=encodeURIComponent($('#product-status')?.value||'');const rows=await api(`/api/v1/admin/products?q=${q}&status=${status}`);$('#table-body').innerHTML=rows.map(p=>`<tr><td><b>${esc(p.name)}</b><br><small class="muted">${esc(p.slug)}</small></td><td>${esc(p.category||'—')}</td><td>${money(p.price)}</td><td><span class="status ${p.status}">${esc(p.status)}</span></td><td><button class="btn ghost edit" data-id="${p.id}">Editar</button> <button class="btn ghost danger delete" data-id="${p.id}">Excluir</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Nenhum produto.</td></tr>'};$('#content').innerHTML=`<div class="toolbar"><input id="product-search" placeholder="Buscar por nome ou slug"><select id="product-status"><option value="">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option></select></div><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead><tbody id="table-body"></tbody></table></div>`;await load();$('#product-search').addEventListener('input',debounce(load,300));$('#product-status').addEventListener('change',load);$('#new-product').onclick=()=>location.href='produto-formulario.html';$('#table-body').addEventListener('click',async e=>{const del=e.target.closest('.delete');if(del&&confirm('Excluir este produto definitivamente?')){try{await api(`/api/v1/admin/products/${del.dataset.id}`,{method:'DELETE'});message('Produto excluído.','success');await load()}catch(err){message(err.message)}}})}
async function categories(){document.body.innerHTML=shell('categories','Categorias','<button class="btn primary" id="new-category">+ Nova categoria</button>');bindLogout();const load=async()=>{const rows=await api('/api/v1/admin/categories');$('#category-body').innerHTML=rows.map(c=>`<tr><td>${esc(c.icon)} <b>${esc(c.name)}</b></td><td>${esc(c.slug)}</td><td>${c.productCount}</td><td><span class="status ${c.isActive?'active':'draft'}">${c.isActive?'Ativa':'Inativa'}</span></td><td><button class="btn ghost edit-category" data-json="${encodeURIComponent(JSON.stringify(c))}">Editar</button> <button class="btn ghost danger delete-category" data-id="${c.id}">Excluir</button></td></tr>`).join('')};$('#content').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Categoria</th><th>Slug</th><th>Produtos</th><th>Status</th><th>Ações</th></tr></thead><tbody id="category-body"></tbody></table></div>`;await load();const open=(c={})=>{$('#category-id').value=c.id||'';$('#category-name').value=c.name||'';$('#category-slug').value=c.slug||'';$('#category-icon').value=c.icon||'⌬';$('#category-description').value=c.description||'';$('#category-active').checked=c.isActive!==0;$('#category-modal').classList.add('open')};$('#new-category').onclick=()=>open();$('#category-body').addEventListener('click',async e=>{const edit=e.target.closest('.edit-category'),del=e.target.closest('.delete-category');if(edit)open(JSON.parse(decodeURIComponent(edit.dataset.json)));if(del&&confirm('Excluir categoria?'))try{await api(`/api/v1/admin/categories/${del.dataset.id}`,{method:'DELETE'});message('Categoria excluída.','success');await load()}catch(err){message(err.message)}});$('#category-form').onsubmit=async e=>{e.preventDefault();const id=$('#category-id').value,body={name:$('#category-name').value,slug:$('#category-slug').value,icon:$('#category-icon').value,description:$('#category-description').value,isActive:$('#category-active').checked};try{await api(id?`/api/v1/admin/categories/${id}`:'/api/v1/admin/categories',{method:id?'PUT':'POST',body:JSON.stringify(body)});$('#category-modal').classList.remove('open');message('Categoria salva.','success');await load()}catch(err){message(err.message)}}}
async function productForm(){document.body.innerHTML=shell('products','Novo produto');bindLogout();const categories=await api('/api/v1/admin/categories');$('#content').innerHTML=`<form id="product-form" class="admin-card form-grid"><div class="form-field full"><label>Nome</label><input id="name" required maxlength="160"></div><div class="form-field"><label>Slug</label><input id="slug" required pattern="[a-z0-9-]+"></div><div class="form-field"><label>Categoria</label><select id="category"><option value="">Sem categoria</option>${categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="form-field"><label>Tipo</label><select id="type"><option value="affiliate">Afiliado</option><option value="book">Livro</option><option value="digital">Digital</option></select></div><div class="form-field"><label>Status</label><select id="status"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></div><div class="form-field"><label>Nota editorial</label><input id="score" type="number" min="0" max="100"></div><div class="form-field full"><label>Descrição curta</label><textarea id="short" rows="3" maxlength="500"></textarea></div><div class="form-field full"><label>Descrição completa</label><textarea id="full" rows="8" maxlength="30000"></textarea></div><div><button class="btn primary">Salvar produto</button></div></form>`;$('#name').addEventListener('input',()=>{$('#slug').value=$('#name').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')});$('#product-form').onsubmit=async e=>{e.preventDefault();try{const result=await api('/api/v1/admin/products',{method:'POST',body:JSON.stringify({name:$('#name').value,slug:$('#slug').value,categoryId:$('#category').value||null,productType:$('#type').value,status:$('#status').value,editorialScore:Number($('#score').value)||null,shortDescription:$('#short').value,fullDescription:$('#full').value})});message(`Produto salvo: ${result.id}`,'success');setTimeout(()=>location.href='produtos.html',700)}catch(err){message(err.message)}}}
function debounce(fn,ms){let timer;return()=>{clearTimeout(timer);timer=setTimeout(fn,ms)}}
async function init(){try{await guard();if(page==='login')return login();if(page==='dashboard')return dashboard();if(page==='products')return products();if(page==='categories')return categories();if(page==='product-form')return productForm()}catch(e){message(e.message)}}init();
