import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveInterest,shouldSendNewsletter,INTEREST_WEIGHTS} from '../cloudflare-dashboard/services/email/newsletter.js';
import {sendEmail} from '../cloudflare-dashboard/services/email/provider.js';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

test('migration de newsletter é incremental e reaplicável',()=>{
  const db=new DatabaseSync(':memory:'),migration=readFileSync(new URL('../cloudflare-dashboard/newsletter-upgrade.sql',import.meta.url),'utf8');
  db.exec(migration);db.exec(migration);
  const tables=db.prepare("SELECT COUNT(*) total FROM sqlite_master WHERE type='table' AND name IN('newsletter_subscribers','user_interests','newsletter_campaigns','newsletter_deliveries','email_events')").get();
  assert.equal(tables.total,5);db.close();
});

test('decay reduz pela metade após a meia-vida',()=>{
  const now=Date.now(),original=Date.now;Date.now=()=>now;
  try{assert.ok(Math.abs(effectiveInterest(20,new Date(now-45*864e5).toISOString())-10)<.01)}finally{Date.now=original}
});

test('clique e afiliado pesam mais que abertura',()=>{
  assert.ok(INTEREST_WEIGHTS.EMAIL_CLICK>INTEREST_WEIGHTS.EMAIL_OPEN);
  assert.ok(INTEREST_WEIGHTS.AFFILIATE_CLICK>INTEREST_WEIGHTS.NEWS_VIEW);
});

test('não envia para cancelado, suprimido ou dormente',async()=>{
  const article={};
  assert.equal(await shouldSendNewsletter({}, {status:'unsubscribed'},article,100),false);
  assert.equal(await shouldSendNewsletter({}, {status:'suppressed'},article,100),false);
  assert.equal(await shouldSendNewsletter({}, {status:'active',personalizationEnabled:1,lastSiteActivityAt:new Date(Date.now()-61*864e5).toISOString()},article,100),false);
});

test('EMAIL_ENV test redireciona destinatário antes do SES',async()=>{
  const original=globalThis.fetch;let payload;
  globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({MessageId:'test-id'}),{status:200,headers:{'content-type':'application/json'}})};
  try{const result=await sendEmail({EMAIL_ENV:'test',EMAIL_TEST_RECIPIENT:'qa@shoplab.com.br',AWS_SES_REGION:'us-east-2',AWS_SES_ACCESS_KEY_ID:'AKIATEST',AWS_SES_SECRET_ACCESS_KEY:'secret-test-value',AWS_SES_FROM_TRANSACTIONAL:'ShopLab <no-reply@shoplab.com.br>'},{to:'real@example.com',subject:'Teste',html:'<p>ok</p>',text:'ok'});assert.equal(result.id,'test-id');assert.deepEqual(payload.Destination.ToAddresses,['qa@shoplab.com.br']);assert.match(payload.Content.Simple.Subject.Data,/^\[TESTE\]/)}finally{globalThis.fetch=original}
});
