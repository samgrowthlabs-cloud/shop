const faviconUrl=new URL('../img/favicon.svg?v=20260721-cart-lab-1',import.meta.url).href;
const current=[...document.querySelectorAll('link[rel~="icon"]')];
const icon=current[0]||document.createElement('link');
icon.rel='icon';
icon.type='image/svg+xml';
icon.href=faviconUrl;
if(!icon.parentNode)document.head.append(icon);
for(const extra of current.slice(1))extra.remove();
