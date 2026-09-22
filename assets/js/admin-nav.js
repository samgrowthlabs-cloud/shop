function installCollectionsNav(){
  const category=document.querySelector('.sidebar a[href="categorias.html"]');
  if(!category||document.querySelector('.sidebar a[href="colecoes.html"]'))return;
  const link=document.createElement('a');link.href='colecoes.html';link.textContent='Coleções';
  if(document.body.dataset.adminPage==='collections')link.className='active';
  category.after(link);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installCollectionsNav,{once:true});else installCollectionsNav();
new MutationObserver(installCollectionsNav).observe(document.documentElement,{childList:true,subtree:true});