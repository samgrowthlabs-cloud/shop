import test from 'node:test';
import assert from 'node:assert/strict';
import{parseIp,parseNetwork,ipMatchesNetwork,ipMatchesAny}from'../cloudflare-dashboard/admin-ip-security.js';
import{readFile}from'node:fs/promises';
const worker=await readFile(new URL('../cloudflare-dashboard/worker.js',import.meta.url),'utf8'),client=await readFile(new URL('../assets/js/admin-security.js',import.meta.url),'utf8'),css=await readFile(new URL('../assets/css/admin-security.css',import.meta.url),'utf8');

test('validates IPv4 and IPv6 addresses',()=>{assert.equal(parseIp('203.0.113.8').version,4);assert.equal(parseIp('2001:db8::8').version,6);assert.equal(parseIp('999.1.1.1'),null);assert.equal(parseIp('2001:::1'),null)});
test('matches IPv4 CIDR without string-prefix shortcuts',()=>{assert.equal(ipMatchesNetwork('203.0.113.42','203.0.113.0/24'),true);assert.equal(ipMatchesNetwork('203.0.114.1','203.0.113.0/24'),false);assert.equal(ipMatchesNetwork('203.0.113.9','203.0.113.9'),true)});
test('matches compressed IPv6 CIDR',()=>{assert.equal(ipMatchesNetwork('2001:db8:abcd::99','2001:db8:abcd::/64'),true);assert.equal(ipMatchesNetwork('2001:db8:abce::1','2001:db8:abcd::/64'),false)});
test('flags broad ranges and rejects invalid prefixes',()=>{assert.equal(parseNetwork('10.0.0.0/8').isBroad,true);assert.equal(parseNetwork('2001:db8::/64').isBroad,false);assert.equal(parseNetwork('10.0.0.0/33'),null)});
test('client supplied unrelated values cannot affect matching',()=>{assert.equal(ipMatchesAny('198.51.100.9',['203.0.113.0/24']),false)});
test('security events use a dedicated incremental endpoint',()=>{assert.match(worker,/\/api\/v1\/admin\/security\/events/);assert.match(worker,/WHERE rowid>\?/);assert.match(client,/security\/events/);assert.match(client,/\?after=\$\{eventCursor\}/);assert.match(client,/setTimeout\(\(\)=>refreshEvents\(false\),document\.hidden\?12000:4000\)/)});
test('security activity has its own bounded scrollbar',()=>{assert.match(css,/#security-events\{max-height:430px;overflow-y:auto/)});
