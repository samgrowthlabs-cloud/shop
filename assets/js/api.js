import{SHOPLAB_CONFIG as C}from'./config.js?v=20260803-media-domain-38';
const cache=new Map(),inflight=new Map();
function userAuthorization(){try{const value=JSON.parse(localStorage.getItem('shoplab:user-session')||'null');return value?.access_token?{authorization:`Bearer ${value.access_token}`}:{}}catch{return{}}}
async function request(path,{mock,method='GET',body,signal,timeout=C.REQUEST_TIMEOUT}={}){const key=method+path;if(method==='GET'){if(cache.has(key))return cache.get(key);if(inflight.has(key))return inflight.get(key)}const task=(async()=>{const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);signal?.addEventListener('abort',()=>ctrl.abort(),{once:true});try{const url=C.USE_MOCK_DATA?mock:`${C.API_BASE_URL}${path}`;if(!url)throw new Error('API não configurada');const res=await fetch(url,{method,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,headers:{...userAuthorization(),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},credentials:'include',signal:ctrl.signal});if(!res.ok)throw new Error(`Falha na requisição (${res.status})`);const json=await res.json(),data=json.data??json;if(method==='GET')cache.set(key,data);return data}finally{clearTimeout(timer)}})();if(method==='GET')inflight.set(key,task);try{return await task}finally{if(method==='GET'&&inflight.get(key)===task)inflight.delete(key)}}
async function withActivePromotions(products){if(C.USE_MOCK_DATA)return products;const campaigns=await request('/api/v1/promotions'),promoted=new Map();for(const campaign of campaigns)for(const product of campaign.products||[]){const current=promoted.get(product.id);if(!current||Number(product.price)<Number(current.price))promoted.set(product.id,product)}return products.map(product=>promoted.has(product.id)?{...product,...promoted.get(product.id)}:product)}
export const getProducts=async({store='',limit=100}={})=>withActivePromotions(await request(`/api/v1/products?${new URLSearchParams({store,limit:String(Math.min(100,Math.max(1,Number(limit)||100)))})}`,{mock:'assets/mock/products.json'}));
export const getTrendingProducts=async(limit=8)=>C.USE_MOCK_DATA?(await getProducts()).slice(0,limit):withActivePromotions(await request(`/api/v1/products/trending?limit=${limit}`));
export const getCategories=()=>request('/api/v1/categories',{mock:'assets/mock/categories.json'});
export const getWeeklyCategoryHighlights=async(limit=6)=>C.USE_MOCK_DATA?(await getCategories()).slice(0,limit).map((category,index)=>({...category,weeklyViews:Math.max(1,24-index*3),imageUrl:category.imageUrl||null})):request(`/api/v1/categories/weekly-highlights?limit=${Math.min(12,Math.max(1,Number(limit)||6))}`);
const SITE_CONFIG_CACHE='shoplab:site-config';
export function cachedSiteConfig(){try{const value=JSON.parse(localStorage.getItem(SITE_CONFIG_CACHE)||'null');return value&&typeof value==='object'?value:null}catch{return null}}
export const getSiteConfig=async()=>{if(C.USE_MOCK_DATA)return{banners:[],theme:null};const config=await request('/api/v1/site-config');try{localStorage.setItem(SITE_CONFIG_CACHE,JSON.stringify(config))}catch{}return config};
const PRODUCT_SESSION_CACHE='shoplab:product-data-v1',PRODUCT_CACHE_TTL=10*60*1000;
function productSessionCache(){try{const value=JSON.parse(sessionStorage.getItem(PRODUCT_SESSION_CACHE)||'{}');return value&&typeof value==='object'?value:{}}catch{return{}}}
function cachedProduct(slug){const entry=productSessionCache()[slug];return entry&&Date.now()-Number(entry.savedAt)<PRODUCT_CACHE_TTL?entry.product:null}
function rememberProduct(slug,product){if(!product)return product;try{const stored=productSessionCache();stored[slug]={savedAt:Date.now(),product};const recent=Object.entries(stored).sort((a,b)=>Number(b[1].savedAt)-Number(a[1].savedAt)).slice(0,12);sessionStorage.setItem(PRODUCT_SESSION_CACHE,JSON.stringify(Object.fromEntries(recent)))}catch{}return product}
function normalizeProduct(product){if(!product)return product;const primaryOffer=product.offers?.[0]||{},productPrice=Number(product.price||0),offerPrice=Number(primaryOffer.price||0),productOldPrice=Number(product.oldPrice||0),offerOldPrice=Number(primaryOffer.oldPrice||0);return{...product,score:product.score??product.editorialScore??product.editorial_score??0,editorialScore:product.editorialScore??product.editorial_score??null,description:product.description??product.fullDescription??product.shortDescription??product.full_description??product.short_description??'',price:productPrice>0?productPrice:offerPrice,oldPrice:productOldPrice>0?productOldPrice:offerOldPrice,store:product.store||primaryOffer.store||'',offerId:product.offerId||primaryOffer.id||'',icon:product.icon||({'Livros e e-books':'▤','Tecnologia':'⌘','Áudio':'♫','Produtividade':'✓'}[product.category]||'⌬')}}
const fetchProductBySlug=async slug=>normalizeProduct(C.USE_MOCK_DATA?(await getProducts()).find(item=>item.slug===slug):await request(`/api/v1/products/${encodeURIComponent(slug)}`));
export const prefetchProduct=slug=>{slug=String(slug||'').trim();if(!slug)return Promise.resolve(null);const cached=cachedProduct(slug);return cached?Promise.resolve(cached):fetchProductBySlug(slug).then(product=>rememberProduct(slug,product))};
export const productPrimaryImageUrl=(product,width=0)=>{const media=(product?.media||[]).find(item=>item.isPrimary)||(product?.media||[])[0];if(media?.storageKey)return`${C.API_BASE_URL}/media/${encodeURIComponent(media.storageKey)}${width?`?w=${width}&q=78`:''}`;return media?.externalUrl||product?.primaryExternalUrl||(product?.primaryStorageKey?`${C.API_BASE_URL}/media/${encodeURIComponent(product.primaryStorageKey)}${width?`?w=${width}&q=78`:''}`:'')};
export const prefetchProductMedia=async slug=>{const product=await prefetchProduct(slug),width=matchMedia('(max-width:760px)').matches?640:960,src=productPrimaryImageUrl(product,width);if(!src)return product;await new Promise(resolve=>{const image=new Image();image.fetchPriority='high';image.decoding='async';image.onload=image.onerror=resolve;image.src=src});return product};
export const getProductBySlug=async slug=>{const cached=cachedProduct(slug);if(cached){setTimeout(()=>fetchProductBySlug(slug).then(product=>rememberProduct(slug,product)).catch(()=>null),0);return cached}return rememberProduct(slug,await fetchProductBySlug(slug))};
export const searchProducts=async({q='',category='',categorySlug='',sort='',store=''}={})=>{
  categorySlug=categorySlug||category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!C.USE_MOCK_DATA&&q)return withActivePromotions(await request(`/api/v1/search?${new URLSearchParams({q,category:categorySlug,sort})}`));
  let products=C.USE_MOCK_DATA?await getProducts():await withActivePromotions(await request(`/api/v1/products?${new URLSearchParams({category:categorySlug,store,limit:'50'})}`));
  const normalized=q.toLocaleLowerCase('pt-BR');
  if(normalized)products=products.filter(product=>(product.name+' '+product.brand+' '+product.category).toLocaleLowerCase('pt-BR').includes(normalized));
  if(C.USE_MOCK_DATA&&category)products=products.filter(product=>product.category===category);
  return products.sort((a,b)=>sort==='price-asc'?a.price-b.price:sort==='discount'?b.discount-a.discount:0);
};
export const searchProductsWithMeta=async({q='',categorySlug='',sort='',smart=false}={})=>{
  if(C.USE_MOCK_DATA)return{data:await searchProducts({q,categorySlug,sort}),meta:{intent:{understood:false}}};
  // Smart searches may wait for the AI to interpret the query before querying the catalog.
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),Math.max(C.REQUEST_TIMEOUT,30000));
  try{
    const response=await fetch(`${C.API_BASE_URL}/api/v1/search?${new URLSearchParams({q,category:categorySlug,sort,smart:smart?"1":""})}`,{credentials:'include',headers:userAuthorization(),signal:ctrl.signal});
    if(!response.ok)throw new Error(`Falha na busca (${response.status})`);
    const json=await response.json();
    return{data:json.data||[],meta:json.meta||{}};
  }finally{clearTimeout(timer)}
};
export const getPromotions=async()=>C.USE_MOCK_DATA?[{id:'mock',name:'Ofertas em destaque',slug:'ofertas',description:'Produtos com preços reduzidos.',couponCode:'',startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+86400000).toISOString(),products:(await getProducts()).filter(product=>product.discount>0)}]:request('/api/v1/promotions');
export const getCollection=slug=>request(`/api/v1/collections/${encodeURIComponent(slug)}`);
export const getFeaturedCollections=()=>C.USE_MOCK_DATA?Promise.resolve([]):request('/api/v1/collections');
const HOME_DATA_CACHE='shoplab:home-data-v1';
export function cachedHomeData(){try{const value=JSON.parse(localStorage.getItem(HOME_DATA_CACHE)||'null');return value&&Array.isArray(value.products)?value:null}catch{return null}}
function cacheHomeData(value){try{if(value&&Array.isArray(value.products))localStorage.setItem(HOME_DATA_CACHE,JSON.stringify(value))}catch{}return value}
export const getHomeData=async()=>{
  if(C.USE_MOCK_DATA)return cacheHomeData(await Promise.all([getProducts({limit:50}),getTrendingProducts(16),getPromotions(),getCategories(),getFeaturedCollections(),getSiteConfig()]).then(([products,trending,campaigns,categories,collections,siteConfig])=>({products,trending,campaigns,categories,collections,siteConfig})));
  try{
    const prefetched=window.__SHOPLAB_HOME_PROMISE;
    if(prefetched){window.__SHOPLAB_HOME_PROMISE=null;const value=await prefetched;if(value)return cacheHomeData(value)}
    return cacheHomeData(await request('/api/v1/home'));
  }catch(error){
    const cached=cachedHomeData();if(cached)return cached;
    return cacheHomeData(await Promise.all([getProducts({limit:50}),getTrendingProducts(16),getPromotions(),getCategories(),getFeaturedCollections(),getSiteConfig()]).then(([products,trending,campaigns,categories,collections,siteConfig])=>({products,trending,campaigns,categories,collections,siteConfig})));
  }
};
export const getRecommendations=async(slug,{standard=false}={})=>{if(C.USE_MOCK_DATA)return(await getProducts()).filter(p=>p.slug!==slug).slice(0,standard?8:4);const products=await request(`/api/v1/products/${encodeURIComponent(slug)}/related?audience=${userAuthorization().authorization?'member':'guest'}&mode=${standard?'standard':'all'}&v=12`);return withActivePromotions(products).catch(()=>products)};
export const getProductOffers=async slug=>(await getProductBySlug(slug))?.offers||[];
export const getComparisonAnalysis=slugs=>request('/api/v1/comparisons/analyze',{method:'POST',body:{slugs},timeout:90000});
export const trackEvent=event=>C.USE_MOCK_DATA?Promise.resolve({mock:true,event}):request('/api/v1/events',{method:'POST',body:event});
export const loginAdmin=credentials=>request('/api/v1/admin/auth/login',{method:'POST',body:credentials});
export const logoutAdmin=()=>request('/api/v1/admin/auth/logout',{method:'POST'});
export const getAdminSession=()=>request('/api/v1/admin/auth/session');
export const createProduct=data=>request('/api/v1/admin/products',{method:'POST',body:data});
export const updateProduct=(id,data)=>request(`/api/v1/admin/products/${encodeURIComponent(id)}`,{method:'PUT',body:data});
export const uploadProductMedia=(id,file)=>{const f=new FormData();f.append('file',file);return request(`/api/v1/admin/products/${encodeURIComponent(id)}/media`,{method:'POST',body:f})};
