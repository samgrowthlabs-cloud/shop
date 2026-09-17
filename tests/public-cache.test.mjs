import assert from 'node:assert/strict';
import test from 'node:test';
import {performance} from 'node:perf_hooks';

class MemoryStorage{
  constructor(){this.values=new Map()}
  get length(){return this.values.size}
  key(index){return [...this.values.keys()][index]??null}
  getItem(key){return this.values.get(key)??null}
  setItem(key,value){this.values.set(key,String(value))}
  removeItem(key){this.values.delete(key)}
}
globalThis.sessionStorage=new MemoryStorage();
globalThis.window={dispatchEvent(){}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail}};

const {publicJson}=await import('../assets/js/public-cache.js?test=1');

test('cold load waits for the network; warm load returns immediately and revalidates',async()=>{
  let requests=0;
  globalThis.fetch=async()=>{
    requests+=1;
    await new Promise(resolve=>setTimeout(resolve,40));
    return new Response(JSON.stringify({data:{id:'produto-a',version:requests}}),{status:200,headers:{'content-type':'application/json','etag':`"v${requests}"`}});
  };
  const coldStart=performance.now();
  const cold=await publicJson('product:produto-a','https://example.test/api/v1/products/produto-a',{freshFor:0});
  const coldMs=performance.now()-coldStart;
  const warmStart=performance.now();
  const warm=await publicJson('product:produto-a','https://example.test/api/v1/products/produto-a',{freshFor:0});
  const warmMs=performance.now()-warmStart;
  assert.equal(cold.id,'produto-a');
  assert.equal(warm.id,'produto-a');
  assert.ok(coldMs>=35,`cold=${coldMs.toFixed(2)}ms`);
  assert.ok(warmMs<10,`warm=${warmMs.toFixed(2)}ms`);
  assert.equal(requests,2,'warm navigation starts one silent revalidation');
  console.log(JSON.stringify({scenario:'public-cache',coldMs:Number(coldMs.toFixed(2)),warmMs:Number(warmMs.toFixed(2)),improvement:Number((coldMs/Math.max(warmMs,.01)).toFixed(1))+'x'}));
});
