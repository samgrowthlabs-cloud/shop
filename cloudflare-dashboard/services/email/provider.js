const encoder=new TextEncoder();
const hex=buffer=>[...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
const sha256=value=>crypto.subtle.digest('SHA-256',typeof value==='string'?encoder.encode(value):value);
const hmac=(key,value)=>crypto.subtle.importKey('raw',typeof key==='string'?encoder.encode(key):key,{name:'HMAC',hash:'SHA-256'},false,['sign']).then(imported=>crypto.subtle.sign('HMAC',imported,encoder.encode(value)));
const cleanHeader=value=>String(value||'').replace(/[\r\n]+/g,' ').trim();

export function emailSettings(env){
  const mode=String(env.EMAIL_ENV||'test').toLowerCase();
  return {mode,region:String(env.AWS_SES_REGION||'us-east-2'),accessKey:String(env.AWS_SES_ACCESS_KEY_ID||''),secretKey:String(env.AWS_SES_SECRET_ACCESS_KEY||''),configurationSet:String(env.AWS_SES_CONFIGURATION_SET||''),testRecipient:String(env.EMAIL_TEST_RECIPIENT||'').trim()};
}

async function signedSesRequest(env,payload){
  const settings=emailSettings(env);
  if(!settings.accessKey||!settings.secretKey)throw Error('AWS_SES_CREDENTIALS_NOT_CONFIGURED');
  const host=`email.${settings.region}.amazonaws.com`,path='/v2/email/outbound-emails',body=JSON.stringify(payload),now=new Date(),amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,''),date=amzDate.slice(0,8),bodyHash=hex(await sha256(body));
  const canonicalHeaders=`content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`,signedHeaders='content-type;host;x-amz-date',canonicalRequest=`POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`,scope=`${date}/${settings.region}/ses/aws4_request`,stringToSign=`AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hex(await sha256(canonicalRequest))}`;
  const kDate=await hmac(`AWS4${settings.secretKey}`,date),kRegion=await hmac(kDate,settings.region),kService=await hmac(kRegion,'ses'),kSigning=await hmac(kService,'aws4_request'),signature=hex(await hmac(kSigning,stringToSign));
  const authorization=`AWS4-HMAC-SHA256 Credential=${settings.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response=await fetch(`https://${host}${path}`,{method:'POST',headers:{'content-type':'application/json','x-amz-date':amzDate,authorization},body});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(String(result.message||result.Message||result.__type||`SES ${response.status}`).slice(0,500));
  return {id:String(result.MessageId||'').slice(0,200),raw:result};
}

export async function sendEmail(env,message){
  const settings=emailSettings(env),originalTo=cleanHeader(message.to),testMode=settings.mode!=='production';
  if(testMode&&!settings.testRecipient)throw Error('EMAIL_TEST_RECIPIENT_NOT_CONFIGURED');
  const to=testMode?settings.testRecipient:originalTo,kind=message.kind==='newsletter'?'newsletter':'transactional',from=cleanHeader(message.from||(kind==='newsletter'?env.AWS_SES_FROM_NEWSLETTER:env.AWS_SES_FROM_TRANSACTIONAL));
  if(!from||!to)throw Error('SES_FROM_OR_RECIPIENT_NOT_CONFIGURED');
  if(testMode)console.warn(JSON.stringify({event:'[EMAIL TEST MODE]',originalRecipient:originalTo,testRecipient:to,user_id:message.userId||null,campaign_id:message.campaignId||null,article_id:message.articleId||null}));
  const headers=Object.entries(message.headers||{}).map(([Name,Value])=>({Name:cleanHeader(Name),Value:cleanHeader(Value)})).filter(item=>item.Name&&item.Value);
  const payload={FromEmailAddress:from,Destination:{ToAddresses:[to]},Content:{Simple:{Subject:{Data:cleanHeader(testMode?`[TESTE] ${message.subject}`:message.subject),Charset:'UTF-8'},Body:{Html:{Data:String(message.html||''),Charset:'UTF-8'},Text:{Data:String(message.text||''),Charset:'UTF-8'}},Headers:headers}},EmailTags:Object.entries(message.tags||{}).map(([Name,Value])=>({Name:cleanHeader(Name).replace(/[^A-Za-z0-9_-]/g,'').slice(0,256),Value:cleanHeader(Value).replace(/[^A-Za-z0-9_-]/g,'').slice(0,256)})).filter(item=>item.Name&&item.Value)};
  if(kind==='newsletter'&&String(env.AWS_SES_REPLY_TO_NEWSLETTER||'').trim())payload.ReplyToAddresses=[cleanHeader(env.AWS_SES_REPLY_TO_NEWSLETTER)];
  const selectedConfigurationSet=kind==='newsletter'?settings.configurationSet:String(env.AWS_SES_TRANSACTIONAL_CONFIGURATION_SET||'');
  if(selectedConfigurationSet)payload.ConfigurationSetName=selectedConfigurationSet;
  return signedSesRequest(env,payload);
}
