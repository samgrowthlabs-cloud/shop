import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveInterest,shouldSendNewsletter,INTEREST_WEIGHTS,adminNewsletterStats} from '../cloudflare-dashboard/services/email/newsletter.js';
import {sendEmail} from '../cloudflare-dashboard/services/email/provider.js';
import {emailBrandingHead,emailLogo} from '../cloudflare-dashboard/services/email/branding.js';
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

test('branding de e-mail combina dark mode com fallback legível',()=>{
  const head=emailBrandingHead(),logo=emailLogo({origin:'https://shoplab.com.br'});
  assert.match(head,/color-scheme/);
  assert.match(head,/@media \(prefers-color-scheme:dark\)/);
  assert.match(logo,/shoplab-wordmark\.png/);
  assert.match(logo,/bgcolor="#f7faf9"/);
  assert.match(logo,/linear-gradient\(#f7faf9,#f7faf9\)/);
  assert.match(logo,/shoplab-email-logo-dark/);
  assert.match(head,/shoplab-email-logo-surface/);
});
test('painel administrativo agrega adesão, personalização e leitura sem expor usuários',async()=>{
  const db=new DatabaseSync(':memory:'),newsletterMigration=readFileSync(new URL('../cloudflare-dashboard/newsletter-upgrade.sql',import.meta.url),'utf8'),newsMigration=readFileSync(new URL('../cloudflare-dashboard/news-upgrade.sql',import.meta.url),'utf8');
  db.exec('CREATE TABLE products(id TEXT PRIMARY KEY)');db.exec(newsMigration);db.exec(newsletterMigration);
  db.prepare("INSERT INTO newsletter_subscribers(id,user_id,email,status,personalization_enabled,engagement_state) VALUES('s1','u1','a@example.com','active',1,'very_active'),('s2','u2','b@example.com','active',0,'active'),('s3','u3','c@example.com','unsubscribed',1,'inactive')").run();
  db.prepare("INSERT INTO news_articles(id,slug,title,category,status,published_at,views,unique_views,read_50,read_90) VALUES('n1','teste','Notícia teste','Tecnologia','published',CURRENT_TIMESTAMP,100,80,60,40)").run();
  db.prepare("INSERT INTO news_article_stats_daily(article_id,date,completes) VALUES('n1','2026-09-17',25)").run();
  const prepare=sql=>({args:[],bind(...args){this.args=args;return this},async all(){return{results:db.prepare(sql).all(...this.args)}}}),DB={prepare,async batch(statements){return Promise.all(statements.map(statement=>statement.all()))}};
  const result=await adminNewsletterStats({DB});
  assert.equal(result.subscriberSummary.active,2);assert.equal(result.subscriberSummary.personalizationEnabled,1);assert.equal(result.subscriberSummary.personalizationRate,50);assert.equal(result.reading.opens,100);assert.equal(result.reading.read90,40);assert.equal(result.reading.completed,25);assert.equal(result.articles[0].title,'Notícia teste');assert.equal(result.articles[0].completed,25);assert.equal('email' in result.articles[0],false);db.close();
});