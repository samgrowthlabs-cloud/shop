import test from 'node:test';
import assert from 'node:assert/strict';
import {newsRoute} from '../cloudflare-dashboard/news.js';

const article={id:'news-1',slug:'resident-evil-2-switch-2',title:'Resident Evil 2 chega ao Switch 2',subtitle:'Teste',excerpt:'Resumo da notícia',content:'<p>Conteúdo</p>',category:'Games',tags:'[]',author:'SHOPLAB',coverImageId:'cover-1',imageUrl:'/media/news/capa.webp',imageAlt:'Capa de Resident Evil 2',imageWidth:1600,imageHeight:900,imagePlaceholder:null,streamUid:null,streamStatus:null,videoAspectRatio:null,videoDuration:null,videoThumbnailUrl:null,publishedAt:'2026-09-25T12:00:00.000Z',updatedAt:'2026-09-25T13:00:00.000Z',readingTime:3,seoTitle:null,seoDescription:null,canonicalUrl:null,views:0,uniqueViews:0,likes:0,clicks:0,read50:0,read90:0,productClicks:0,qualityScore:.8,isFeatured:0};
const env={DB:{prepare(){return{bind(){return this},async first(){return article},async all(){return{results:[article]}}}}},ASSETS:{async fetch(){return new Response('<!doctype html><html><head><title>Noticias | SHOPLAB</title><meta name="description" content="Novidades, analises, ofertas e guias para comprar melhor."></head><body><div id="news-app"></div></body></html>',{headers:{'content-type':'text/html'}})}}};

test('página da notícia expõe a capa como imagem principal para buscadores',async()=>{
  const url=new URL(`https://shoplab.com.br/noticias/${article.slug}`),response=await newsRoute(new Request(url),env,url),html=await response.text();
  assert.match(html,/<link rel="image_src" href="https:\/\/shoplab\.com\.br\/media\/news\/capa\.webp">/);
  assert.match(html,/<meta property="og:image:width" content="1600">/);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(schema.image[0].contentUrl,'https://shoplab.com.br/media/news/capa.webp');
  assert.equal(schema.image[0].width,1600);
  assert.equal(schema.thumbnailUrl,schema.image[0].url);
});

test('sitemap de notícias inclui a capa no namespace de imagens',async()=>{
  const url=new URL('https://shoplab.com.br/news-sitemap.xml'),response=await newsRoute(new Request(url),env,url),xml=await response.text();
  assert.match(xml,/xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.match(xml,/<image:loc>https:\/\/shoplab\.com\.br\/media\/news\/capa\.webp<\/image:loc>/);
  assert.match(xml,/<image:caption>Resident Evil 2 chega ao Switch 2<\/image:caption>/);
});