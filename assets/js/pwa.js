const head=document.head;

function ensureHead(){
  const viewport=head.querySelector('meta[name="viewport"]');
  if(viewport)viewport.content='width=device-width,initial-scale=1,viewport-fit=cover';
  if(!head.querySelector('link[rel="manifest"]')){
    const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='/manifest.webmanifest';head.append(manifest);
  }
  const metas=[
    ['theme-color','#078a7d'],
    ['mobile-web-app-capable','yes'],
    ['apple-mobile-web-app-capable','yes'],
    ['apple-mobile-web-app-status-bar-style','default'],
    ['apple-mobile-web-app-title','SHOPLAB']
  ];
  for(const [name,content] of metas){let meta=head.querySelector(`meta[name="${name}"]`);if(!meta){meta=document.createElement('meta');meta.name=name;head.append(meta)}meta.content=content}
  if(!head.querySelector('link[rel="apple-touch-icon"]')){const icon=document.createElement('link');icon.rel='apple-touch-icon';icon.href='/assets/img/pwa-maskable.svg';head.append(icon)}
}

function icon(path){return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"></path></svg>`}

function currentSection(){
  const page=document.body.dataset.page||'';
  const path=location.pathname;
  if(page==='home'||/index\.html$/.test(path)||path==='/')return'home';
  if(page==='search'||/busca\.html$/.test(path))return'search';
  if(page==='promotions'||/promocoes\.html$/.test(path))return'offers';
  if(/conta\.html$/.test(path)&&new URLSearchParams(location.search).get('aba')==='lista')return'list';
  if(/conta\.html$|entrar\.html$|cadastro\.html$/.test(path))return'account';
  return'';
}

function focusHeaderSearch(){
  const input=document.querySelector('.mobile-home-search input, .header .search input, input[type="search"]');
  if(!input)return false;
  const search=input.closest('form')||input;
  input.focus({preventScroll:true});
  const end=input.value.length;
  try{input.setSelectionRange(end,end)}catch{}
  requestAnimationFrame(()=>search.scrollIntoView({
    behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',
    block:'start'
  }));
  return document.activeElement===input;
}

function installMobileNavigation(){
  if(document.body.matches('[data-auth-page]:not([data-auth-page="account"]),.pwa-offline')||matchMedia('(min-width:761px)').matches)return;
  const active=currentSection();
  const items=[
    ['home','index.html','Início','M3 11.5 12 4l9 7.5M5.5 10v9h13v-9M9.5 19v-5h5v5'],
    ['search','busca.html','Buscar','M10.8 4a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6ZM16 16l4 4'],
    ['offers','promocoes.html','Ofertas','M4 7.5V5h2.5L19 17.5 13.5 23 1 10.5V7.5h3Zm3.5 1h.01'],
    ['list','conta.html?aba=lista','Lista','M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01'],
    ['account','conta.html','Conta','M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0']
  ];
  let nav=document.querySelector('.pwa-bottom-nav');
  if(!nav){
    nav=document.createElement('nav');nav.className='pwa-bottom-nav';nav.setAttribute('aria-label','Navegação principal');
    nav.innerHTML=items.map(([key,href,label,path])=>`<a data-pwa-nav="${key}" href="${href}">${icon(path)}<span>${label}</span></a>`).join('');
    document.body.append(nav);
  }
  nav.querySelectorAll('[data-pwa-nav]').forEach(link=>{
    const selected=link.dataset.pwaNav===active;link.classList.toggle('active',selected);
    if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  const searchLink=nav.querySelector('[data-pwa-nav="search"]');
  if(searchLink&&!searchLink.dataset.focusBound){
    searchLink.dataset.focusBound='true';
    searchLink.addEventListener('click',event=>{if(focusHeaderSearch())event.preventDefault()});
  }
}

let installEvent=null,installPromptArmed=false;
function armInstallPrompt(){
  if(installPromptArmed)return;installPromptArmed=true;
  const reveal=()=>{showInstallPrompt();cleanup()};
  const cleanup=()=>{removeEventListener('pointerdown',reveal);removeEventListener('keydown',reveal);removeEventListener('scroll',reveal)};
  addEventListener('pointerdown',reveal,{once:true,passive:true});
  addEventListener('keydown',reveal,{once:true});
  addEventListener('scroll',reveal,{once:true,passive:true});
  setTimeout(reveal,12000);
}
function showInstallPrompt(){
  if(!installEvent||document.querySelector('.pwa-install-card')||matchMedia('(display-mode:standalone)').matches)return;
  const dismissed=Number(localStorage.getItem('shoplab-install-dismissed')||0);if(Date.now()-dismissed<604800000)return;
  const card=document.createElement('aside');card.className='pwa-install-card';card.setAttribute('aria-label','Instalar aplicativo SHOPLAB');
  card.innerHTML=`<img src="assets/img/favicon.svg" alt=""><div><strong>Leve a SHOPLAB com você</strong><span>Instale para abrir mais rápido.</span></div><button class="install" type="button">Instalar</button><button class="close" type="button" aria-label="Agora não">×</button>`;
  card.querySelector('.install').onclick=async()=>{installEvent.prompt();await installEvent.userChoice;installEvent=null;card.remove()};
  card.querySelector('.close').onclick=()=>{localStorage.setItem('shoplab-install-dismissed',String(Date.now()));card.remove()};
  document.body.append(card);
}

ensureHead();


if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js?v=20260820-banner-carousel-reset-1').then(registration=>registration.update()).catch(()=>{}));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;armInstallPrompt()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMobileNavigation,{once:true});else installMobileNavigation();
