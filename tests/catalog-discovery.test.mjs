import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const schema=readFileSync(new URL('../cloudflare-dashboard/schema.sql',import.meta.url),'utf8');
const migration=readFileSync(new URL('../cloudflare-dashboard/catalog-discovery-upgrade.sql',import.meta.url),'utf8');
const source=readFileSync(new URL('../cloudflare-dashboard/worker.js',import.meta.url),'utf8');
export function fixture({legacy=false}={}){
  const db=new DatabaseSync(':memory:');db.exec(legacy?schema.split('-- Additive and replayable.')[0]:schema);
  const context=vm.createContext({console,TextEncoder,TextDecoder,URL,URLSearchParams,Request,Response,Headers,FormData,File,crypto,fetch,setTimeout,clearTimeout,atob,btoa,caches:{default:{match:async()=>null,put:async()=>{}}}});
  const workerForVm=source.replace(/^import \{ newsRoute, NewsAnalyticsDO \} from "\.\/news\.js";\r?$/m,'').replace(/^export \{ NewsAnalyticsDO \};\r?$/m,'');
  vm.runInContext(workerForVm.replace(/export class /g,'class ').replace('export default','globalThis.worker =')+'\nglobalThis.catalog={catalogRules,catalogRuleSql,catalogRows,catalogResolve,catalogAdmin,catalogProduct,catalogDiscovery,catalogPage,catalogImage,publicCollection,publicFeaturedCollections,adminPermissionForRequest,route};',context);
  const DB={prepare(sql){return {bind(...args){this.args=args;return this},async all(){return {results:db.prepare(sql).all(...(this.args||[]))}},async first(){return db.prepare(sql).get(...(this.args||[]))||null},async run(){const r=db.prepare(sql).run(...(this.args||[]));return {meta:{changes:Number(r.changes)}}}}},async batch(statements){db.exec('BEGIN');try{const out=[];for(const s of statements){const result=await s.all();out.push({...result,meta:{changes:db.prepare('SELECT changes() n').get().n}})}db.exec('COMMIT');return out}catch(error){db.exec('ROLLBACK');throw error}}};
  return {db,env:{DB,ASSETS:{fetch:async()=>new Response('asset',{status:404})}},api:context.catalog,worker:context.worker};
}
const request=(path,body,method='POST')=>new Request('https://shoplab.test'+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
const path='/api/v1/admin/taxonomy';
async function save(f,resource,body,id){const response=await f.api.catalogAdmin(request(`${path}/${resource}${id?'/'+id:''}`,body,id?'PUT':'POST'),f.env,'test',`${path}/${resource}${id?'/'+id:''}`);const json=await response.json();assert.equal(response.status,200,JSON.stringify(json));return json.data.id}
async function seed(f){
 const category=await save(f,'categories',{name:'Celulares',slug:'celulares'});
 const subcategory=await save(f,'categories',{name:'Android',slug:'android',categoryId:category});
 f.db.prepare("INSERT INTO products(id,name,slug,status,category_id,base_price_cents) VALUES('phone','Galaxy','galaxy','published',?,199999),('draft-phone','Rascunho','rascunho','draft',?,10000)").run(category,category);
 return {category,subcategory};
}
test('fresh schema and migration replay preserve products, categories and collection links',()=>{
 const f=fixture();const before=f.db.prepare('SELECT count(*) n FROM products').get().n;
 f.db.exec(migration);f.db.exec(migration);assert.equal(f.db.prepare('SELECT count(*) n FROM products').get().n,before);assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('validated rule compiler rejects unknown fields, invalid ranges and injection',()=>{
 const f=fixture();assert.throws(()=>f.api.catalogRules({sql:'1=1'}));assert.throws(()=>f.api.catalogRules({minPriceCents:200,maxPriceCents:100}));assert.throws(()=>f.api.catalogRules({maxPriceCents:'2000'}));assert.throws(()=>f.api.catalogRules({version:2}));
 const sql=f.api.catalogRuleSql({brandId:"x' OR 1=1 --",maxPriceCents:200000});assert.ok(!sql.sql.includes('OR 1=1'));assert.equal(sql.values[0],"x' OR 1=1 --");
});
test('dynamic collections respond to price changes, exclude drafts, and paginate',async()=>{
 const f=fixture(),{category}=await seed(f);const id=await save(f,'collections',{name:'Até R$ 2.000',slug:'ate-2000',categoryId:category,collectionType:'dynamic',rules:{version:1,maxPriceCents:200000}});
 const resolved=await f.api.catalogResolve(f.env,'/celulares/ate-2000');assert.equal(resolved.entity.id,id);
 let data=await f.api.catalogRows(f.env,resolved.entity,'collection');assert.equal(data.total,1);assert.equal(data.products[0].id,'phone');
 f.db.exec("UPDATE products SET base_price_cents=200001 WHERE id='phone'");data=await f.api.catalogRows(f.env,resolved.entity,'collection');assert.equal(data.total,0);
 f.db.exec("UPDATE products SET base_price_cents=200000 WHERE id='phone'");data=await f.api.catalogRows(f.env,resolved.entity,'collection',new URLSearchParams('limit=1&page=2'));assert.equal(data.total,1);assert.equal(data.products.length,0);
 const legacyApi=await f.api.publicCollection(new Request('https://shoplab.test/api/v1/collections/ate-2000'),f.env,'ate-2000','test');assert.equal((await legacyApi.json()).data.total,1);
});
test('product classification supports multiple manual collections and all required features',async()=>{
 const f=fixture(),{category,subcategory}=await seed(f),feature=await save(f,'features',{name:'NFC',slug:'nfc'});
 const collection=await save(f,'collections',{name:'Uso diário',slug:'uso-diario',collectionType:'manual',productIds:['phone']});
 const second=await save(f,'collections',{name:'Favoritos',slug:'favoritos',collectionType:'manual'});
 const body={categoryId:category,subcategoryId:subcategory,featureIds:[feature],collectionIds:[collection,second]};
 let response=await f.api.catalogProduct(request('/api/v1/admin/products/phone/classification',body,'PUT'),f.env,'phone','test');assert.equal(response.status,200,await response.clone().text());
 assert.equal(f.db.prepare("SELECT count(*) n FROM product_collection_items WHERE product_id='phone'").get().n,2);
 const dynamic=await save(f,'collections',{name:'Com NFC',slug:'com-nfc',collectionType:'dynamic',rules:{featureIds:[feature]}});
 const entity=(await f.api.catalogResolve(f.env,'/colecoes/com-nfc')).entity;assert.equal((await f.api.catalogRows(f.env,entity,'collection')).total,1);
 body.collectionIds=[dynamic];response=await f.api.catalogProduct(request('/api/v1/admin/products/phone/classification',body,'PUT'),f.env,'phone','test');assert.equal(response.status,422);
 assert.equal(f.db.prepare("SELECT count(*) n FROM product_collection_items WHERE product_id='phone'").get().n,2);
 const sub=(await f.api.catalogResolve(f.env,'/celulares/android')).entity;assert.equal((await f.api.catalogRows(f.env,sub,'category')).total,1);
});
test('renaming parent categories keeps category, child and collection aliases',async()=>{
 const f=fixture(),{category}=await seed(f);await save(f,'collections',{name:'Câmera',slug:'camera',categoryId:category,collectionType:'manual'});
 await save(f,'categories',{name:'Smartphones',slug:'smartphones'},category);
 assert.equal((await f.api.catalogResolve(f.env,'/celulares')).redirect,'/smartphones');assert.equal((await f.api.catalogResolve(f.env,'/celulares/android')).redirect,'/smartphones/android');assert.equal((await f.api.catalogResolve(f.env,'/celulares/camera')).redirect,'/smartphones/camera');
 const page=await f.api.catalogPage(new Request('https://shoplab.test/celulares'),f.env,'/celulares');assert.equal(page.status,301);
});
test('hierarchy, duplicate paths, deactivation and reserved slugs are validated',async()=>{
 const f=fixture(),{category,subcategory}=await seed(f);
 for(const [resource,body] of [['categories',{name:'Depth',slug:'depth',categoryId:subcategory}],['categories',{name:'API',slug:'api'}],['collections',{name:'Android',slug:'android',categoryId:category,collectionType:'manual'}]]){
 const response=await f.api.catalogAdmin(request(`${path}/${resource}`,body),f.env,'test',`${path}/${resource}`);assert.equal(response.status,422);
 }
 await f.api.catalogAdmin(request(`${path}/categories/${category}`,undefined,'DELETE'),f.env,'test',`${path}/categories/${category}`);assert.equal(await f.api.catalogResolve(f.env,'/celulares/android'),null);assert.equal(f.db.prepare("SELECT count(*) n FROM products WHERE id='phone'").get().n,1);
});
test('SEO HTML contains canonical, H1, structured data and product links before JavaScript',async()=>{
 const f=fixture();await seed(f);const response=await f.api.catalogPage(new Request('https://shoplab.test/celulares'),f.env,'/celulares');const html=await response.text();assert.match(html,/<h1>Celulares<\/h1>/);assert.match(html,/rel="canonical" href="https:\/\/shoplab.test\/celulares"/);assert.match(html,/application\/ld\+json/);assert.match(html,/produto\?slug=galaxy/);
});
test('new admin routes enforce server-side permissions',()=>{
 const f=fixture();assert.equal(f.api.adminPermissionForRequest('PUT',path+'/categories/abc'),'categories.manage');assert.equal(f.api.adminPermissionForRequest('PUT','/api/v1/admin/products/abc/classification'),'products.edit');
});

test('legacy child assignments and category collections survive migration',async()=>{
 const f=fixture({legacy:true});
 f.db.exec(`INSERT INTO categories(id,name,slug) VALUES('parent','Phones','phones');INSERT INTO categories(id,name,slug,parent_id) VALUES('child','Android','android','parent');INSERT INTO products(id,name,slug,status,category_id,tags_json) VALUES('old-phone','Old Phone','old-phone','published','child','["NFC","5G"]');INSERT INTO product_collections(id,name,slug) VALUES('legacy','Old collection','old-collection');INSERT INTO product_collection_categories(collection_id,category_id) VALUES('legacy','child');`);
 f.db.exec(migration);
 assert.equal(f.db.prepare("SELECT category_id FROM products WHERE id='old-phone'").get().category_id,'parent');
 assert.equal(f.db.prepare("SELECT subcategory_id FROM product_classification WHERE product_id='old-phone'").get().subcategory_id,'child');
 assert.equal(f.db.prepare("SELECT count(*) n FROM product_features WHERE product_id='old-phone'").get().n,2);
 const collection=(await f.api.catalogResolve(f.env,'/colecoes/old-collection')).entity;
 assert.equal((await f.api.catalogRows(f.env,collection,'collection')).total,1);
 f.db.exec("UPDATE products SET tags_json='[]' WHERE id='old-phone'");f.db.exec(migration);
 assert.equal(f.db.prepare("SELECT count(*) n FROM product_features WHERE product_id='old-phone'").get().n,0);
});
test('legacy product edits and feature renames update searchable tags',async()=>{
 const f=fixture(),{category,subcategory}=await seed(f);
 f.db.prepare("UPDATE products SET category_id=?,tags_json='[\"NFC\"]' WHERE id='phone'").run(subcategory);
 assert.equal(f.db.prepare("SELECT category_id FROM products WHERE id='phone'").get().category_id,category);
 const feature=f.db.prepare("SELECT id FROM features WHERE name='NFC'").get().id;
 await save(f,'features',{name:'Near Field Communication',slug:'nfc'},feature);
 assert.equal(JSON.parse(f.db.prepare("SELECT tags_json FROM products WHERE id='phone'").get().tags_json)[0],'Near Field Communication');
 assert.equal(f.db.prepare("SELECT feature_id FROM product_features WHERE product_id='phone'").get().feature_id,feature);
});
test('migration rejects unsupported deep legacy hierarchy before backfill',()=>{
 const f=fixture({legacy:true});f.db.exec("INSERT INTO categories(id,name,slug,parent_id) VALUES('one','One','one',NULL),('two','Two','two','one'),('three','Three','three','two')");
 assert.throws(()=>f.db.exec(migration),/CHECK constraint/);
 assert.equal(f.db.prepare("SELECT count(*) n FROM sqlite_master WHERE name='product_features'").get().n,0);
});
test('duplicate primary offers do not duplicate products',async()=>{
 const f=fixture();await seed(f);f.db.exec("INSERT INTO partners(id,name,slug) VALUES('store','Store','store');INSERT INTO offers(id,product_id,partner_id,affiliate_url,current_price_cents,is_primary) VALUES('a','phone','store','https://example.com/a',190000,1),('b','phone','store','https://example.com/b',195000,1)");
 const entity=(await f.api.catalogResolve(f.env,'/celulares')).entity,rows=await f.api.catalogRows(f.env,entity,'category');assert.equal(rows.total,1);assert.equal(rows.products.length,1);
});
test('legacy query URLs follow renamed collections and preserve filters',async()=>{
 const f=fixture(),{category}=await seed(f);const id=await save(f,'collections',{name:'Camera',slug:'camera',categoryId:category,collectionType:'manual'});await save(f,'collections',{name:'Photography',slug:'photography',categoryId:category,collectionType:'manual'},id);
 const response=await f.api.route(new Request('https://shoplab.test/colecao.html?slug=camera&sort=price-asc'),f.env,{},'test');assert.equal(response.status,301);assert.equal(response.headers.get('location'),'https://shoplab.test/celulares/photography?sort=price-asc');
 const missing=await f.api.route(new Request('https://shoplab.test/categoria?slug=missing'),f.env,{},'test');assert.equal(missing.status,404);
});
test('existing product listing filters both main and subcategory',async()=>{
 const f=fixture(),{subcategory}=await seed(f);f.db.prepare("UPDATE products SET category_id=? WHERE id='phone'").run(subcategory);
 for(const category of ['celulares','android']){const response=await f.api.route(new Request('https://shoplab.test/api/v1/products?category='+category),f.env,{},'test');assert.deepEqual((await response.json()).data.map(p=>p.id),['phone'])}
});
test('manual preview uses unsaved selection and excludes unpublished products',async()=>{
 const f=fixture();await seed(f);const response=await f.api.catalogAdmin(request(path+'/preview',{collectionType:'manual',productIds:['phone','draft-phone'],rules:{version:1}}),f.env,'test',path+'/preview');const data=(await response.json()).data;assert.equal(data.total,1);assert.equal(data.products[0].id,'phone');
});
test('search finds synchronized features and respects subcategory filters',async()=>{
 const f=fixture(),{subcategory}=await seed(f);f.db.exec(readFileSync(new URL('../cloudflare-dashboard/search-upgrade.sql',import.meta.url),'utf8'));
 f.db.prepare("UPDATE products SET category_id=?,tags_json='[\"NFC\"]' WHERE id='phone'").run(subcategory);
 const response=await f.api.route(new Request('https://shoplab.test/api/v1/search?q=NFC&category=android'),f.env,{waitUntil(){}},'test');assert.equal(response.status,200);assert.ok((await response.json()).data.some(p=>p.id==='phone'));
});
test('unauthenticated taxonomy mutation is rejected before any write',async()=>{
 const f=fixture();const before=f.db.prepare('SELECT count(*) n FROM categories').get().n;
 const response=await f.api.route(request(path+'/categories',{name:'Unauthorized',slug:'unauthorized'}),f.env,{},'test');assert.equal(response.status,401);assert.equal(f.db.prepare('SELECT count(*) n FROM categories').get().n,before);
});
test('assigned subcategories cannot move away from their product main category',async()=>{
 const f=fixture(),{subcategory}=await seed(f);f.db.prepare("UPDATE products SET category_id=? WHERE id='phone'").run(subcategory);const parent=await save(f,'categories',{name:'Other',slug:'other'});
 const response=await f.api.catalogAdmin(request(path+'/categories/'+subcategory,{name:'Android',slug:'android',categoryId:parent},'PUT'),f.env,'test',path+'/categories/'+subcategory);assert.equal(response.status,422);
});
test('image and SEO controls are persisted on category create and edit',async()=>{
 const f=fixture(),id=await save(f,'categories',{name:'New',slug:'new-category',seoTitle:'Custom title',imageScale:150,imagePositionX:20});
 let row=(await f.api.catalogResolve(f.env,'/new-category')).entity;assert.equal(row.seoTitle,'Custom title');assert.equal(row.image_scale,150);assert.equal(row.image_position_x,20);
 await save(f,'categories',{name:'New',slug:'new-category',seoTitle:'Edited title',imageScale:120},id);row=(await f.api.catalogResolve(f.env,'/new-category')).entity;assert.equal(row.seoTitle,'Edited title');assert.equal(row.image_scale,120);
});
test('catalog image upload reuses R2 helper and replaces stored keys',async()=>{
 const f=fixture(),{category}=await seed(f),writes=[],deletes=[];f.env.MEDIA={put:async key=>writes.push(key),delete:async key=>deletes.push(key)};
 for(let i=0;i<2;i++){const form=new FormData();form.set('image',new File([new Uint8Array([137,80,78,71])],'sample.png',{type:'image/png'}));const response=await f.api.catalogImage(new Request('https://shoplab.test/upload',{method:'POST',body:form}),f.env,'categories',category,'test');assert.equal(response.status,200)}
 assert.equal(writes.length,2);assert.deepEqual(deletes,[writes[0]]);assert.equal(f.db.prepare('SELECT image_storage_key FROM categories WHERE id=?').get(category).image_storage_key,writes[1]);
});

test('worker reports the required catalog migration instead of a generic 500',async()=>{
 const f=fixture({legacy:true});
 const response=await f.worker.fetch(new Request('https://shoplab.test/api/v1/discovery?path=/celulares'),f.env,{waitUntil(){}});
 const payload=await response.json();
 assert.equal(response.status,503);
 assert.equal(payload.error.code,'CATALOG_DISCOVERY_MIGRATION_REQUIRED');
 assert.match(payload.error.message,/catalog-discovery-upgrade\.sql/);
});