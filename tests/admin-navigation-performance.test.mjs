import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/js/admin-app.js',import.meta.url),'utf8');

test('a newer admin navigation can supersede an in-flight navigation',()=>{
  assert.doesNotMatch(source,/if\(navigating\)return/);
  assert.match(source,/const navigationId=\+\+navigationVersion/);
  assert.match(source,/navigationId!==navigationVersion/);
});

test('aborted route requests reject normally instead of remaining pending forever',()=>{
  assert.doesNotMatch(source,/new Promise\(\(\)=>\{\}\)/);
  assert.match(source,/return nativeFetch\(input,request\)/);
});

test('activity tracking does not block rendering the selected route',()=>{
  assert.match(source,/function recordActivity\(route\)/);
  assert.doesNotMatch(source,/await api\('\/api\/v1\/admin\/auth\/session\?section=/);
  assert.match(source,/keepalive:true/);
});

test('admin tabs remain clickable and modules warm up on pointer down',()=>{
  assert.doesNotMatch(source,/querySelectorAll\('\[role="tab"\]'\)\.forEach\(tab=>tab\.disabled=true\)/);
  assert.match(source,/addEventListener\('pointerdown'/);
});
