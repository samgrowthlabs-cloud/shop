import {recordInterest} from './newsletter.js';
const json=(data,status=200)=>new Response(JSON.stringify({success:status<400,data:status<400?data:null,error:status<400?null:data}),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const safeEqual=(left,right)=>{const a=new TextEncoder().encode(String(left||'')),b=new TextEncoder().encode(String(right||''));let diff=a.length^b.length;for(let i=0;i<Math.min(a.length,b.length);i++)diff|=a[i]^b[i];return diff===0};
const eventDate=(event,type)=>event[type]?.timestamp||event.mail?.timestamp||new Date().toISOString();
export async function sesEventWebhook(req,env){
  if(req.method!=='POST')return json({code:'METHOD_NOT_ALLOWED',message:'Método não permitido.'},405);
  const configured=String(env.SES_EVENT_WEBHOOK_SECRET||''),provided=req.headers.get('x-shoplab-ses-webhook-secret');
  if(configured.length<32||!safeEqual(configured,provided))return json({code:'UNAUTHORIZED',message:'Evento não autenticado.'},401);
  const envelope=await req.json(),event=envelope.detail||envelope,eventType=String(event.eventType||event.notificationType||envelope['detail-type']||'').toLowerCase().replace(/\s+/g,'_'),messageId=String(event.mail?.messageId||event.mail?.message_id||'').slice(0,200);
  if(!messageId||!eventType)return json({code:'INVALID_EVENT',message:'Evento SES inválido.'},422);
  const delivery=await env.DB.prepare('SELECT id,campaign_id campaignId,user_id userId,status FROM newsletter_deliveries WHERE ses_message_id=?').bind(messageId).first();
  if(!delivery)return json({ignored:true,reason:'unknown_message'});
  const occurredAt=eventDate(event,eventType),url=String(event.click?.link||event.click?.url||'').slice(0,2000)||null,userAgent=String(event.click?.userAgent||event.open?.userAgent||'').slice(0,500)||null,isBot=Boolean(event.click?.ipAddress&&/(bot|crawler|scanner|preview|safelinks)/i.test(userAgent||'')),dedupeKey=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${messageId}|${eventType}|${occurredAt}|${url||''}`)).then(value=>[...new Uint8Array(value)].map(x=>x.toString(16).padStart(2,'0')).join(''));
  const inserted=await env.DB.prepare('INSERT OR IGNORE INTO email_events(id,dedupe_key,delivery_id,campaign_id,user_id,ses_message_id,event_type,url,is_bot,user_agent,occurred_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),dedupeKey,delivery.id,delivery.campaignId,delivery.userId,messageId,eventType,url,isBot?1:0,userAgent,occurredAt).run();
  if(!inserted.meta.changes)return json({duplicate:true});
  const statements=[];
  if(eventType==='delivery')statements.push(env.DB.prepare("UPDATE newsletter_deliveries SET status='delivered',delivered_at=? WHERE id=? AND status IN('sent','sending')").bind(occurredAt,delivery.id),env.DB.prepare('UPDATE newsletter_campaigns SET delivered_count=delivered_count+1 WHERE id=?').bind(delivery.campaignId));
  if(eventType==='open')statements.push(env.DB.prepare("UPDATE newsletter_deliveries SET status=CASE WHEN status='clicked' THEN status ELSE 'opened' END,opened_at=COALESCE(opened_at,?) WHERE id=?").bind(occurredAt,delivery.id),env.DB.prepare('UPDATE newsletter_subscribers SET last_email_open_at=? WHERE user_id=?').bind(occurredAt,delivery.userId),env.DB.prepare('UPDATE newsletter_campaigns SET opened_count=opened_count+1 WHERE id=?').bind(delivery.campaignId));
  if(eventType==='click')statements.push(env.DB.prepare("UPDATE newsletter_deliveries SET status='clicked',clicked_at=? WHERE id=?").bind(occurredAt,delivery.id),env.DB.prepare('UPDATE newsletter_subscribers SET last_email_click_at=? WHERE user_id=?').bind(occurredAt,delivery.userId),env.DB.prepare('UPDATE newsletter_campaigns SET clicked_count=clicked_count+1 WHERE id=?').bind(delivery.campaignId));
  if(eventType==='bounce'){const hard=String(event.bounce?.bounceType||'').toLowerCase()==='permanent';statements.push(env.DB.prepare(`UPDATE newsletter_deliveries SET status=? WHERE id=?`).bind(hard?'hard_bounce':'soft_bounce',delivery.id),env.DB.prepare('UPDATE newsletter_campaigns SET bounced_count=bounced_count+1 WHERE id=?').bind(delivery.campaignId));if(hard)statements.push(env.DB.prepare("UPDATE newsletter_subscribers SET status='suppressed',updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(delivery.userId))}
  if(eventType==='complaint')statements.push(env.DB.prepare("UPDATE newsletter_deliveries SET status='complained' WHERE id=?").bind(delivery.id),env.DB.prepare("UPDATE newsletter_subscribers SET status='suppressed',updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(delivery.userId),env.DB.prepare('UPDATE newsletter_campaigns SET complained_count=complained_count+1 WHERE id=?').bind(delivery.campaignId));
  if(eventType==='subscription')statements.push(env.DB.prepare("UPDATE newsletter_subscribers SET status='unsubscribed',unsubscribed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(delivery.userId),env.DB.prepare('UPDATE newsletter_campaigns SET unsubscribed_count=unsubscribed_count+1 WHERE id=?').bind(delivery.campaignId));
  if(statements.length)await env.DB.batch(statements);
  if(eventType==='click'&&!isBot)await recordInterest(env,delivery.userId,'topic',url||'newsletter','EMAIL_CLICK');
  if(eventType==='open'&&!isBot)await recordInterest(env,delivery.userId,'topic','newsletter','EMAIL_OPEN');
  return json({accepted:true,eventType,isBot});
}
