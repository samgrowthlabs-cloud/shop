import {SHOPLAB_CONFIG as C} from './config.js?v=20260803-media-domain-38';

const routes={
  painel:{label:'Resumo',group:'overview',module:'main',target:'dashboard',permission:'dashboard.view'},
  usuarios:{label:'Usuários',group:'growth',module:'main',target:'users',permission:'users.view'},
  produtos:{label:'Produtos',group:'catalog',module:'v2',target:'products',permission:'products.view'},
  categorias:{label:'Categorias',group:'catalog',module:'main',target:'categories',permission:'categories.manage'},
  colecoes:{label:'Coleções',group:'catalog',module:'main',target:'collections',permission:'categories.manage'},
  marcas:{label:'Marcas',group:'catalog',module:'v2',target:'brands',permission:'brands.manage'},
  parceiros:{label:'Lojas parceiras',group:'catalog',module:'v2',target:'partners',permission:'partners.manage'},
  promocoes:{label:'Promoções',group:'marketing',module:'v2',target:'promotions',permission:'promotions.manage'},
  banners:{label:'Banners',group:'marketing',module:'v2',target:'banners',permission:'banners.manage'},
  destaques:{label:'Destaques',group:'marketing',module:'v2',target:'header-spotlight',permission:'header_spotlights.manage'},
  anuncios:{label:'Abaixo do menu',group:'marketing',module:'v2',target:'header-ads',permission:'header_ads.manage'},
  'shoplab-ads':{label:'SHOPLAB Ads',group:'marketing',module:'ads',target:'shoplab-ads',permission:'shoplab_ads.view'},
  premium:{label:'SHOPLAB+',group:'growth',module:'main',target:'premium',permission:'premium.manage'},
  ia:{label:'Inteligência artificial',group:'growth',module:'v2',target:'ai-settings',permission:'ai.manage'},
  equipe:{label:'Pessoas e cargos',group:'team',module:'v2',target:'collaborators',permission:'collaborators.manage'},
  arquivos:{label:'Arquivos compartilhados',group:'team',module:'v2',target:'shared-files',permission:'shared_files.manage'},
  midia:{label:'Roteiros',group:'team',module:'v2',target:'media-scripts',permission:'media_scripts.view'},
  conversor:{label:'Conversão',group:'team',module:'converter',target:'media-converter',permission:'media_conversion.use'},
  gravador:{label:'Gravador',group:'team',module:'recorder',target:'audio-recorder',permission:'media_recording.use'},
  mixer:{label:'Mixer',group:'team',module:'mixer',target:'audio-mixer',permission:'media_mixer.use'},
  aparencia:{label:'Identidade visual',group:'appearance',module:'v2',target:'themes',permission:'themes.manage'},
  'produto-formulario':{label:'Editor de produto',group:'catalog',module:'v2',target:'product-form',permission:'products.edit',secondary:true}
};
const icon=paths=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
const icons={
  overview:icon('<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>'),
  catalog:icon('<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/>'),
  marketing:icon('<path d="M4 13v-2l12-5v12L4 13Z"/><path d="M16 9.5h2.5a2.5 2.5 0 0 1 0 5H16"/><path d="m6.5 13 1.3 6H11l-1.4-4.8"/>'),
  growth:icon('<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="m4 7 5-4 5 4 6-5"/><path d="M16 2h4v4"/>'),
  team:icon('<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.2"/><path d="M15.5 14.5a4 4 0 0 1 5 4"/>'),
  appearance:icon('<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.3-2.1-.8-1.4.2-3.1 1.8-3.1H18a3 3 0 0 0 3-3C21 7.4 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>')
};
const groups=[
  {id:'overview',label:'Visão geral',icon:icons.overview},
  {id:'catalog',label:'Catálogo',icon:icons.catalog},
  {id:'marketing',label:'Marketing',icon:icons.marketing},
  {id:'growth',label:'Clientes e crescimento',icon:icons.growth},
  {id:'team',label:'Equipe e acessos',icon:icons.team},
  {id:'appearance',label:'Aparência',icon:icons.appearance}
];
const legacy={'index.html':'painel','usuarios.html':'usuarios','produtos.html':'produtos','produto-formulario.html':'produto-formulario','categorias.html':'categorias','colecoes.html':'colecoes','marcas.html':'marcas','parceiros.html':'parceiros','promocoes.html':'promocoes','banners.html':'banners','destaque-cabecalho.html':'destaques','anuncios-cabecalho.html':'shoplab-ads','premium.html':'premium','ia.html':'ia','colaboradores.html':'equipe','arquivos.html':'arquivos','temas.html':'aparencia'};
let session,navigating=false,currentRoute='',routeRequests=new AbortController();const deniedRoutes=new Set();
const moduleImports={main:()=>import('./admin.js?v=20260829-audit-all-1'),v2:()=>import('./admin-v2.js?v=20260829-r2-ffmpeg-21'),ads:()=>import('./shoplab-ads.js?v=20260831-ads-native-frequency-15'),converter:()=>import('./media-converter.js?v=20260829-r2-ffmpeg-21'),recorder:()=>import('./audio-recorder.js?v=20260831-browser-ai-4'),mixer:()=>import('./audio-mixer.js?v=20260829-r2-ffmpeg-21')};
const loadedModules=new Map();
const ensureModule=name=>{if(!loadedModules.has(name))loadedModules.set(name,moduleImports[name]().catch(error=>{loadedModules.delete(name);throw error}));return loadedModules.get(name)};
const nativeFetch=window.fetch.bind(window),nativeSetTimeout=window.setTimeout.bind(window),nativeSetInterval=window.setInterval.bind(window),nativeClearTimeout=window.clearTimeout.bind(window),nativeClearInterval=window.clearInterval.bind(window),routeTimers=new Set();
window.fetch=(input,options={})=>{const url=typeof input==='string'?input:input?.url||'',request=url.includes('/api/v1/admin/')&&!options.signal?{...options,signal:routeRequests.signal}:options;return nativeFetch(input,request).catch(error=>error?.name==='AbortError'?new Promise(()=>{}):Promise.reject(error))};
window.setTimeout=(callback,delay,...args)=>{const id=nativeSetTimeout((...values)=>{routeTimers.delete(id);callback(...values)},delay,...args);routeTimers.add(id);return id};
window.setInterval=(callback,delay,...args)=>{const id=nativeSetInterval(callback,delay,...args);routeTimers.add(id);return id};
window.clearTimeout=id=>{routeTimers.delete(id);nativeClearTimeout(id)};
window.clearInterval=id=>{routeTimers.delete(id);nativeClearInterval(id)};
function cancelPreviousRoute(){routeRequests.abort();routeRequests=new AbortController();for(const id of routeTimers){nativeClearTimeout(id);nativeClearInterval(id)}routeTimers.clear()}
const can=permission=>permission==='authenticated'&&Boolean(session?.actor)||session?.actor?.permissions?.includes('*')||session?.actor?.permissions?.includes(permission)||(permission==='media_scripts.view'&&['media_scripts.manage','media_scripts.edit','media_scripts.comment'].some(item=>session?.actor?.permissions?.includes(item)));
const allowed=key=>routes[key]&&!deniedRoutes.has(key)&&can(routes[key].permission);
const routeFromUrl=()=>new URL(location.href).searchParams.get('tab')||'painel';
const routeUrl=(key,source)=>{const url=new URL('index.html',location.href),origin=new URL(source||location.href,location.href);url.searchParams.set('tab',key);if(key==='produto-formulario'&&origin.searchParams.get('id'))url.searchParams.set('id',origin.searchParams.get('id'));return url};

function shellHtml(){
  return `<div class="admin-shell admin-app-shell">
    <aside class="sidebar"><a class="logo" href="../index.html">SHOP<b>LAB</b></a><div class="admin-actor"><b></b><small></small></div><span class="admin-navigation-label">Navegação</span><nav id="admin-area-tabs" role="tablist" aria-label="Áreas do painel"></nav><a class="admin-site-link" href="../index.html">Ver site público ↗</a></aside>
    <main class="admin-main"><header class="admin-top admin-app-header"><div class="admin-heading"><span class="eyebrow"></span><h1>Administração</h1></div><div class="admin-actions"></div><div id="admin-page-tabs" class="admin-page-tabs" role="tablist" aria-label="Funções da área"></div></header><div id="message" class="admin-message"></div><div id="content" role="tabpanel" tabindex="-1"><div class="admin-loading">Preparando painel…</div></div></main>
  </div><div id="admin-overlays"></div>`;
}

function installShell(){
  document.body.innerHTML=shellHtml();
  const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  Object.defineProperty(document.body,'innerHTML',{
    configurable:true,
    get(){return descriptor.get.call(this)},
    set(value){
      if(typeof value!=='string'||!value.includes('admin-shell'))return descriptor.set.call(this,value);
      const template=document.createElement('template');template.innerHTML=value;
      const incoming=template.content.querySelector('.admin-shell');
      const title=incoming?.querySelector('.admin-top h1')?.textContent||'Administração';
      const actions=incoming?.querySelector('.admin-actions')?.innerHTML||'';
      const content=incoming?.querySelector('#content')?.innerHTML||'<div class="admin-loading">Carregando…</div>';
      document.querySelector('.admin-heading h1').textContent=title;
      document.querySelector('.admin-actions').innerHTML=actions;
      document.querySelector('#message').className='admin-message';
      document.querySelector('#message').textContent='';
      document.querySelector('#content').innerHTML=content;
      const overlays=document.querySelector('#admin-overlays');overlays.innerHTML='';
      [...template.content.children].filter(node=>!node.classList?.contains('admin-shell')).forEach(node=>overlays.append(node));
    }
  });
}

function renderNavigation(route){
  const active=routes[route],activeGroup=groups.find(group=>group.id===active.group);
  const sidebar=document.querySelector('.sidebar'),logo=sidebar.querySelector('.logo');
  sidebar.querySelectorAll('.admin-actor').forEach(node=>node.remove());
  logo.insertAdjacentHTML('afterend','<div class="admin-actor"><b></b><small></small></div>');
  sidebar.querySelectorAll('.admin-navigation-label').forEach(node=>node.remove());
  document.querySelector('#admin-area-tabs').insertAdjacentHTML('beforebegin','<span class="admin-navigation-label">Navegação</span>');
  document.querySelectorAll('.sidebar .admin-site-link').forEach(link=>link.remove());
  sidebar.insertAdjacentHTML('beforeend','<a class="admin-site-link" href="../index.html">Ver site público ↗</a>');
  const areaTabs=document.querySelector('#admin-area-tabs');
  areaTabs.innerHTML=groups.map(group=>{const items=Object.keys(routes).filter(key=>routes[key].group===group.id&&!routes[key].secondary&&allowed(key));if(!items.length)return'';const target=items.includes(route)?route:items[0],selected=group.id===active.group;return `<button type="button" role="tab" aria-selected="${selected}" class="admin-area-tab ${selected?'active':''}" data-admin-route="${target}"><span>${group.icon}</span><b>${group.label}</b></button>`}).join('');
  const tabs=Object.keys(routes).filter(key=>routes[key].group===active.group&&!routes[key].secondary&&allowed(key));
  document.querySelector('#admin-page-tabs').innerHTML=tabs.map(key=>`<button type="button" role="tab" aria-selected="${key===route}" aria-controls="content" class="${key===route?'active':''}" data-admin-route="${key}">${routes[key].label}</button>`).join('');
  document.querySelector('.admin-heading .eyebrow').textContent=activeGroup.label.toUpperCase();
  const actor=document.querySelector('.admin-actor');
  actor.querySelector('b').textContent=session.actor?.name||'Admin';
  actor.querySelector('small').textContent=session.actor?.roleLabel||'';
  document.querySelector('#content').setAttribute('aria-label',active.label);
}

async function api(path,options={}){const response=await fetch(C.API_BASE_URL+path,{...options,credentials:'include'});const json=await response.json();if(response.status===401){location.href='login.html';throw new Error('Sessão expirada')}if(!response.ok||!json.success){const error=new Error(json.error?.message||`Erro ${response.status}`);error.status=response.status;error.code=json.error?.code||'';throw error}return json.data}

async function navigate(requested,{push=true,source}={}){
  if(navigating)return;
  let route=allowed(requested)?requested:Object.keys(routes).find(allowed);
  if(!route){location.href='login.html';return}
  cancelPreviousRoute();navigating=true;currentRoute=route;document.documentElement.classList.add('admin-is-navigating');
  if(push)history.pushState({route},'',routeUrl(route,source));
  document.body.dataset.adminPage=routes[route].target;
  renderNavigation(route);
  document.querySelectorAll('[role="tab"]').forEach(tab=>tab.disabled=true);
  document.querySelector('#content').innerHTML='<div class="admin-loading">Carregando dados…</div>';
  try{
    document.querySelector('.admin-main')?.classList.remove('ads-editor');document.querySelector('.ads-view-tabs')?.remove();
    await ensureModule(routes[route].module);
    const controller=routes[route].module==='main'?window.ShoplabAdminMain:routes[route].module==='ads'?window.ShoplabAdsAdmin:routes[route].module==='converter'?window.ShoplabMediaConverter:routes[route].module==='recorder'?window.ShoplabAudioRecorder:routes[route].module==='mixer'?window.ShoplabAudioMixer:window.ShoplabAdminV2;
    await controller.run(routes[route].target,session);
    renderNavigation(route);
  }catch(error){
    if(error?.name==='AbortError')return;
    if(error?.status===403){
      deniedRoutes.add(route);renderNavigation(route);
      const fallback=Object.keys(routes).find(allowed);
      if(fallback&&fallback!==route)setTimeout(()=>navigate(fallback,{push:true}),0);
      else document.querySelector('#content').innerHTML='<div class="empty">Nenhuma área disponível para este acesso.</div>';
      return;
    }
    document.querySelector('#message').textContent=error.message;document.querySelector('#message').className='admin-message show error';
  }finally{
    navigating=false;document.documentElement.classList.remove('admin-is-navigating');document.querySelectorAll('[role="tab"]').forEach(tab=>tab.disabled=false);
  }
}
window.ShoplabAdminApp={navigate:(route,options={})=>navigate(route,options),refresh:()=>navigate(currentRoute,{push:false}),restoreChrome:()=>renderNavigation(currentRoute)};

document.addEventListener('click',event=>{const control=event.target.closest('[data-admin-route],.admin-main a[href]');if(!control)return;const href=control.getAttribute('href')||'',file=href.split('?')[0].split('/').pop(),route=control.dataset.adminRoute||legacy[file];if(!route)return;event.preventDefault();navigate(route,{source:href})});
document.addEventListener('pointerover',event=>{const control=event.target.closest('[data-admin-route]'),route=control?.dataset.adminRoute,moduleName=routes[route]?.module;if(moduleName)ensureModule(moduleName).catch(()=>{})},{passive:true});
document.addEventListener('keydown',event=>{const tab=event.target.closest('[role="tab"][data-admin-route]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const tabs=[...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]:not(:disabled)')];let index=tabs.indexOf(tab);if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else index=(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;event.preventDefault();tabs[index]?.focus()});
addEventListener('popstate',()=>navigate(routeFromUrl(),{push:false}));
addEventListener('unhandledrejection',event=>{if(event.reason?.name==='AbortError')event.preventDefault()});

async function start(){
  installShell();
  session=await api('/api/v1/admin/auth/session');routeRequests=new AbortController();
  const roleColor=/^#[0-9a-f]{6}$/i.test(String(session?.actor?.roleColor||''))?session.actor.roleColor:'';
  document.documentElement.toggleAttribute('data-admin-role-color',Boolean(roleColor));
  if(roleColor)document.documentElement.style.setProperty('--admin-role-color',roleColor);
  await navigate(routeFromUrl(),{push:false});
  const warmCatalog=()=>{if(routes[currentRoute]?.module!=='v2')ensureModule('v2').catch(()=>{})};
  if('requestIdleCallback' in window)requestIdleCallback(warmCatalog,{timeout:1800});else setTimeout(warmCatalog,700);
}
start().catch(error=>{document.body.innerHTML=`<main class="login-page"><section class="login-box"><h1>Não foi possível abrir o admin</h1><p>${error.message}</p><a class="btn primary" href="login.html">Entrar novamente</a></section></main>`});
