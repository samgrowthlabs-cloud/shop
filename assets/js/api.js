import{SHOPLAB_CONFIG as C}from'./config.js';
const cache=new Map();
async function request(path,{mock,method='GET',body,signal}={}){const key=method+path;if(method==='GET'&&cache.has(key))return cache.get(key);const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),C.REQUEST_TIMEOUT);signal?.addEventListener('abort',()=>ctrl.abort());try{const url=C.USE_MOCK_DATA?mock:`${C.API_BASE_URL}${path}`;if(!url)throw new Error('API não configurada');const res=await fetch(url,{method,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,headers:body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:undefined,credentials:'include',signal:ctrl.signal});if(!res.ok)throw new Error(`Falha na requisição (${res.status})`);const json=await res.json(),data=json.data??json;if(method==='GET')cache.set(key,data);return data}finally{clearTimeout(timer)}}
async function withActivePromotions(products){if(C.USE_MOCK_DATA)return products;const campaigns=await request('/api/v1/promotions'),promoted=new Map();for(const campaign of campaigns)for(const product of campaign.products||[]){const current=promoted.get(product.id);if(!current||Number(product.price)<Number(current.price))promoted.set(product.id,product)}return products.map(product=>promoted.get(product.id)||product)}
export const getProducts=async()=>withActivePromotions(await request('/api/v1/products',{mock:'assets/mock/products.json'}));
export const getTrendingProducts=async(limit=8)=>C.USE_MOCK_DATA?(await getProducts()).slice(0,limit):withActivePromotions(await request(`/api/v1/products/trending?limit=${limit}`));
export const getCategories=()=>request('/api/v1/categories',{mock:'assets/mock/categories.json'});
export const getProductBySlug=async slug=>{
  const product=C.USE_MOCK_DATA?(await getProducts()).find(item=>item.slug===slug):await request(`/api/v1/products/${encodeURIComponent(slug)}`);
  if(!product)return product;
  const primaryOffer=product.offers?.[0]||{};
  const productPrice=Number(product.price||0),offerPrice=Number(primaryOffer.price||0);
  const productOldPrice=Number(product.oldPrice||0),offerOldPrice=Number(primaryOffer.oldPrice||0);
  return{...product,score:product.score??product.editorialScore??product.editorial_score??0,editorialScore:product.editorialScore??product.editorial_score??null,description:product.description??product.fullDescription??product.shortDescription??product.full_description??product.short_description??'',price:productPrice>0?productPrice:offerPrice,oldPrice:productOldPrice>0?productOldPrice:offerOldPrice,store:product.store||primaryOffer.store||'',offerId:product.offerId||primaryOffer.id||'',icon:product.icon||({'Livros e e-books':'▤','Tecnologia':'⌘','Áudio':'♫','Produtividade':'✓'}[product.category]||'⌬')};
};
export const searchProducts=async({q='',category='',sort=''}={})=>{
  const categorySlug=category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!C.USE_MOCK_DATA&&q)return withActivePromotions(await request(`/api/v1/search?${new URLSearchParams({q,category:categorySlug,sort})}`));
  let products=C.USE_MOCK_DATA?await getProducts():await withActivePromotions(await request(`/api/v1/products?${new URLSearchParams({category:categorySlug,limit:'50'})}`));
  const normalized=q.toLocaleLowerCase('pt-BR');
  if(normalized)products=products.filter(product=>(product.name+' '+product.brand+' '+product.category).toLocaleLowerCase('pt-BR').includes(normalized));
  if(C.USE_MOCK_DATA&&category)products=products.filter(product=>product.category===category);
  return products.sort((a,b)=>sort==='price-asc'?a.price-b.price:sort==='discount'?b.discount-a.discount:0);
};
export const getPromotions=async()=>C.USE_MOCK_DATA?[{id:'mock',name:'Ofertas em destaque',slug:'ofertas',description:'Produtos com preços reduzidos.',couponCode:'',startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+86400000).toISOString(),products:(await getProducts()).filter(product=>product.discount>0)}]:request('/api/v1/promotions');
export const getRecommendations=async slug=>C.USE_MOCK_DATA?(await getProducts()).filter(p=>p.slug!==slug).slice(0,4):withActivePromotions(await request(`/api/v1/products/${encodeURIComponent(slug)}/related`));
export const getProductOffers=async slug=>(await getProductBySlug(slug))?.offers||[];
export const trackEvent=event=>C.USE_MOCK_DATA?Promise.resolve({mock:true,event}):request('/api/v1/events',{method:'POST',body:event});
export const loginAdmin=credentials=>request('/api/v1/admin/auth/login',{method:'POST',body:credentials});
export const logoutAdmin=()=>request('/api/v1/admin/auth/logout',{method:'POST'});
export const getAdminSession=()=>request('/api/v1/admin/auth/session');
export const createProduct=data=>request('/api/v1/admin/products',{method:'POST',body:data});
export const updateProduct=(id,data)=>request(`/api/v1/admin/products/${encodeURIComponent(id)}`,{method:'PUT',body:data});
export const uploadProductMedia=(id,file)=>{const f=new FormData();f.append('file',file);return request(`/api/v1/admin/products/${encodeURIComponent(id)}/media`,{method:'POST',body:f})};
