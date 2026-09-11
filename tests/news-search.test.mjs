import test from 'node:test';
import assert from 'node:assert/strict';
import {newsRoute} from '../cloudflare-dashboard/news.js';
const rows=[
  {id:'title',slug:'gta-6',title:'GTA 6: data de lançamento',subtitle:'Tudo sobre o jogo',excerpt:'Preço e plataformas',content:'Rockstar Games',category:'Games',tags:'["grand theft auto","rockstar"]',author:'ShopLab',publishedAt:'2026-09-10T12:00:00Z',updatedAt:'2026-09-10T12:00:00Z',readingTime:7,qualityScore:.8},
  {id:'tag',slug:'rockstar',title:'O futuro dos jogos',subtitle:'',excerpt:'Novidades da indústria',content:'Estúdio de grandes franquias',category:'Games',tags:'["gta","rockstar"]',author:'ShopLab',publishedAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z',readingTime:4,qualityScore:.9},
  {id:'other',slug:'iphone',title:'Novo iPhone',subtitle:'',excerpt:'Celular Apple',content:'Tecnologia móvel',category:'Celulares',tags:'["apple"]',author:'ShopLab',publishedAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z',readingTime:3,qualityScore:.9}
];
const env={DB:{prepare(){return{async all(){return{results:rows}}}}}};
async function search(q){const response=await newsRoute(new Request(`https://shoplab.test/api/v1/news?q=${encodeURIComponent(q)}&limit=50`),env,new URL(`https://shoplab.test/api/v1/news?q=${encodeURIComponent(q)}&limit=50`));return response.json()}
test('busca de notícias normaliza caixa e acentos e prioriza título',async()=>{for(const query of ['GTA','gta','Gta']){const result=await search(query);assert.deepEqual(result.data.items.map(item=>item.id),['title','tag']);assert.equal(result.data.total,2);assert.equal('content' in result.data.items[0],false)}});
test('busca de notícias encontra termos distribuídos em tags e conteúdo',async()=>{const result=await search('grand theft auto');assert.deepEqual(result.data.items.map(item=>item.id),['title']);const rockstar=await search('ROCKSTAR');assert.deepEqual(rockstar.data.items.map(item=>item.id),['title','tag']);const accent=await search('lancamento');assert.deepEqual(accent.data.items.map(item=>item.id),['title'])});