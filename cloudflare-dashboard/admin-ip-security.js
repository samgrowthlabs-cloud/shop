const IPV4_BITS=32n,IPV6_BITS=128n;
function ipv4Parts(value){
  const parts=String(value).split('.');
  if(parts.length!==4||parts.some(part=>!/^\d{1,3}$/.test(part)||Number(part)>255))return null;
  return parts.map(Number);
}
export function parseIp(value){
  let input=String(value||'').trim().toLowerCase();
  if(!input||input.includes(':::'))return null;
  if(input.startsWith('[')&&input.endsWith(']'))input=input.slice(1,-1);
  const zone=input.indexOf('%');if(zone>=0)input=input.slice(0,zone);
  const v4=ipv4Parts(input);
  if(v4)return{version:4,bits:IPV4_BITS,value:v4.reduce((total,part)=>(total<<8n)|BigInt(part),0n)};
  if((input.match(/::/g)||[]).length>1||!/^[0-9a-f:.]+$/.test(input))return null;
  let ipv4Tail=null;
  if(input.includes('.')){const lastColon=input.lastIndexOf(':'),tail=ipv4Parts(input.slice(lastColon+1));if(!tail)return null;ipv4Tail=[(tail[0]<<8)|tail[1],(tail[2]<<8)|tail[3]];input=input.slice(0,lastColon)+':v4'}
  const halves=input.split('::'),read=part=>part?part.split(':').filter(Boolean).flatMap(token=>token==='v4'?ipv4Tail:[/^[0-9a-f]{1,4}$/.test(token)?parseInt(token,16):NaN]):[];
  const left=read(halves[0]),right=read(halves[1]);if([...left,...right].some(Number.isNaN))return null;
  let groups;if(halves.length===2){const missing=8-left.length-right.length;if(missing<1)return null;groups=[...left,...Array(missing).fill(0),...right]}else groups=left;
  if(groups.length!==8)return null;
  return{version:6,bits:IPV6_BITS,value:groups.reduce((total,part)=>(total<<16n)|BigInt(part),0n)};
}
export function parseNetwork(value){
  const parts=String(value||'').trim().split('/');if(parts.length>2)return null;
  const ip=parseIp(parts[0]);if(!ip)return null;
  const prefix=parts.length===1?Number(ip.bits):Number(parts[1]);if(!Number.isInteger(prefix)||prefix<0||prefix>Number(ip.bits))return null;
  const hostBits=ip.bits-BigInt(prefix),mask=hostBits===ip.bits?0n:((1n<<ip.bits)-1n)^((1n<<hostBits)-1n);
  return{version:ip.version,prefix,network:ip.value&mask,bits:ip.bits,canonical:`${parts[0].toLowerCase()}${prefix===Number(ip.bits)?'':'/'+prefix}`,isBroad:prefix<(ip.version===4?24:64)};
}
export function ipMatchesNetwork(ipValue,networkValue){const ip=parseIp(ipValue),network=parseNetwork(networkValue);if(!ip||!network||ip.version!==network.version)return false;const hostBits=network.bits-BigInt(network.prefix),mask=hostBits===network.bits?0n:((1n<<network.bits)-1n)^((1n<<hostBits)-1n);return(ip.value&mask)===network.network}
export function ipMatchesAny(ip,networks){return(networks||[]).some(network=>ipMatchesNetwork(ip,network))}
