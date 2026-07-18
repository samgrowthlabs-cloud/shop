import{getSiteConfig,cachedSiteConfig}from'./api.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function applySiteTheme(theme){
  const root=document.documentElement;
  if(!theme){delete root.dataset.seasonalTheme;return}
  const headerEnd=theme.headerBackgroundEnd||theme.headerBackground;
  const headerBackground=Number(theme.headerGradientEnabled)?`linear-gradient(${Number(theme.headerGradientAngle)||0}deg,${theme.headerBackground},${headerEnd})`:theme.headerBackground;
  const mediaUrl=String(theme.headerMediaUrl||'').replace(/["\\]/g,'');
  const mediaSize=theme.headerMediaSize==='custom'?`${Math.min(400,Math.max(10,Number(theme.headerMediaScale)||100))}% auto`:theme.headerMediaSize||'cover';
  const properties={
    '--season-header-bg':theme.headerBackground,
    '--season-header-background':headerBackground,
    '--season-header-text':theme.headerTextColor,
    '--season-header-image':mediaUrl?`url("${mediaUrl}")`:'none',
    '--season-header-image-opacity':String(Math.min(1,Math.max(0,Number(theme.headerMediaOpacity)||0))),
    '--season-header-image-position':theme.headerMediaPosition||'center',
    '--season-header-image-size':mediaSize,
    '--season-header-image-repeat':Number(theme.headerMediaRepeat)?'repeat':'no-repeat',
    '--season-logo-color':theme.logoTextColor||theme.accentColor,
    '--season-logo-height':`${Math.min(80,Math.max(20,Number(theme.logoHeight)||36))}px`,
    '--accent':theme.accentColor,
    '--accent-hover':`color-mix(in srgb,${theme.accentColor} 82%,#000)`,
    '--text':theme.pageTextColor,
    '--muted':theme.mutedTextColor,
    '--bg':`color-mix(in srgb,${theme.accentColor} 4%,#fff)`,
    '--surface':'#fff','--surface-soft':`color-mix(in srgb,${theme.accentColor} 8%,#fff)`,
    '--surface-elevated':`color-mix(in srgb,${theme.accentColor} 5%,#fff)`,
    '--border':`color-mix(in srgb,${theme.accentColor} 20%,#d8d8d8)`,
  };
  for(const [name,value]of Object.entries(properties))root.style.setProperty(name,value);
  root.dataset.seasonalTheme=theme.id;
}

function themeLogo(theme){
  const brand=document.querySelector('.header-brand');
  if(!brand||!theme?.logoUrl)return;
  brand.innerHTML=`<span class="brand-images"><img class="brand-image brand-image-main" src="${esc(theme.logoUrl)}" alt="${esc(theme.logoText||'SHOPLAB')}">${theme.logoHoverUrl?`<img class="brand-image brand-image-hover" src="${esc(theme.logoHoverUrl)}" alt="">`:''}</span>`;
}

function headerSpotlight(config){
  const row=document.querySelector('.account-site-header .header-row');
  if(!row||row.querySelector('.header-highlight'))return;
  const spotlight=(config.headerSpotlights||[]).find(item=>item.mediaUrl);
  if(!spotlight)return;
  const item=document.createElement('a');
  item.className='header-highlight has-media';
  item.href=spotlight.linkUrl||'promocoes.html';
  item.title=spotlight.altText||spotlight.name||'Destaque SHOPLAB';
  item.innerHTML=`<img src="${esc(spotlight.mediaUrl)}" alt="${esc(item.title)}">`;
  row.append(item);
}

function paintHeader(config){if(!config)return;applySiteTheme(config.theme);themeLogo(config.theme);headerSpotlight(config)}

export async function initSiteHeader(){
  paintHeader(cachedSiteConfig());
  try{
    const config=await getSiteConfig();
    paintHeader(config);
    return config;
  }catch(error){
    console.warn('Não foi possível carregar o tema do cabeçalho.',error);
    return null;
  }
}
