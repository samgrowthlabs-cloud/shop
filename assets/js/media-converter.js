import {FFmpeg} from '../vendor/ffmpeg/ffmpeg/index.js';
import {fetchFile} from '../vendor/ffmpeg/util/index.js';
import {SHOPLAB_CONFIG as C} from './config.js';

const $=(selector,root=document)=>root.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const MAX_BYTES=300*1024*1024;
const presets={
  mp3:{label:'MP3 · 192 kbps',group:'Áudio',kind:'ffmpeg',ext:'mp3',mime:'audio/mpeg',accept:'media',args:output=>['-i','input','-vn','-codec:a','libmp3lame','-b:a','192k',output]},
  m4a:{label:'M4A · AAC',group:'Áudio',kind:'ffmpeg',ext:'m4a',mime:'audio/mp4',accept:'media',args:output=>['-i','input','-vn','-codec:a','aac','-b:a','192k',output]},
  ogg:{label:'OGG · Vorbis',group:'Áudio',kind:'ffmpeg',ext:'ogg',mime:'audio/ogg',accept:'media',args:output=>['-i','input','-vn','-codec:a','libvorbis','-q:a','5',output]},
  opus:{label:'Opus · compacto',group:'Áudio',kind:'ffmpeg',ext:'opus',mime:'audio/ogg',accept:'media',args:output=>['-i','input','-vn','-codec:a','libopus','-b:a','128k',output]},
  flac:{label:'FLAC · sem perdas',group:'Áudio',kind:'ffmpeg',ext:'flac',mime:'audio/flac',accept:'media',args:output=>['-i','input','-vn','-codec:a','flac',output]},
  wav:{label:'WAV · sem compressão',group:'Áudio',kind:'ffmpeg',ext:'wav',mime:'audio/wav',accept:'media',args:output=>['-i','input','-vn','-codec:a','pcm_s16le',output]},
  mp4:{label:'MP4 · H.264',group:'Vídeo',kind:'ffmpeg',ext:'mp4',mime:'video/mp4',accept:'video',args:output=>['-i','input','-c:v','libx264','-preset','veryfast','-c:a','aac','-movflags','faststart',output]},
  webm:{label:'WebM · VP8',group:'Vídeo',kind:'ffmpeg',ext:'webm',mime:'video/webm',accept:'video',args:output=>['-i','input','-c:v','libvpx','-deadline','realtime','-c:a','libvorbis',output]},
  mkv:{label:'MKV · H.264',group:'Vídeo',kind:'ffmpeg',ext:'mkv',mime:'video/x-matroska',accept:'video',args:output=>['-i','input','-c:v','libx264','-preset','veryfast','-c:a','aac',output]},
  avi:{label:'AVI · MPEG-4',group:'Vídeo',kind:'ffmpeg',ext:'avi',mime:'video/x-msvideo',accept:'video',args:output=>['-i','input','-c:v','mpeg4','-q:v','5','-c:a','libmp3lame','-b:a','192k',output]},
  gif:{label:'GIF · animação',group:'Vídeo',kind:'ffmpeg',ext:'gif',mime:'image/gif',accept:'video',args:output=>['-i','input','-vf','fps=12,scale=720:-1:flags=lanczos',output]},
  png:{label:'PNG',group:'Imagem',kind:'image',ext:'png',mime:'image/png',accept:'image'},
  jpg:{label:'JPEG',group:'Imagem',kind:'image',ext:'jpg',mime:'image/jpeg',accept:'image'},
  webp:{label:'WebP',group:'Imagem',kind:'image',ext:'webp',mime:'image/webp',accept:'image'},
  compress:{label:'Compactar para 720p',group:'Ferramentas',kind:'ffmpeg',ext:'mp4',mime:'video/mp4',accept:'video',args:output=>['-i','input','-vf','scale=-2:min(720\\,ih)','-c:v','libx264','-crf','29','-preset','veryfast','-c:a','aac','-b:a','128k','-movflags','faststart',output]},
  silent:{label:'Remover áudio do vídeo',group:'Ferramentas',kind:'ffmpeg',ext:'mp4',mime:'video/mp4',accept:'video',args:output=>['-i','input','-an','-c:v','libx264','-crf','23','-preset','veryfast','-movflags','faststart',output]},
  frame:{label:'Extrair capa do vídeo',group:'Ferramentas',kind:'ffmpeg',ext:'jpg',mime:'image/jpeg',accept:'video',args:output=>['-ss','00:00:01','-i','input','-frames:v','1','-q:v','2',output]},
  normalize:{label:'Normalizar volume',group:'Ferramentas',kind:'ffmpeg',ext:'mp3',mime:'audio/mpeg',accept:'media',args:output=>['-i','input','-vn','-af','loudnorm=I=-16:LRA=11:TP=-1.5','-codec:a','libmp3lame','-b:a','192k',output]},
  voice:{label:'Limpar gravação de voz',group:'Ferramentas',kind:'ffmpeg',ext:'mp3',mime:'audio/mpeg',accept:'media',args:output=>['-i','input','-vn','-af','highpass=f=80,lowpass=f=12000,afftdn=nf=-25,loudnorm=I=-16:LRA=7:TP=-1.5','-codec:a','libmp3lame','-b:a','192k',output]},
  podcast:{label:'Finalizar para podcast',group:'Ferramentas',kind:'ffmpeg',ext:'mp3',mime:'audio/mpeg',accept:'media',args:output=>['-i','input','-vn','-af','highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=20:release=250,loudnorm=I=-16:LRA=7:TP=-1.5','-codec:a','libmp3lame','-b:a','192k',output]}};
let ffmpeg=null,loaded=false,working=false,resultUrl='';
const bytes=value=>value>=1048576?`${(value/1048576).toFixed(1)} MB`:`${Math.ceil(value/1024)} KB`;
const outputName=(file,preset)=>`${file.name.replace(/\.[^.]+$/,'')||'arquivo-convertido'}.${preset.ext}`;

async function loadEngine(setStatus){
  if(loaded)return;
  setStatus('Carregando o motor de conversão pela primeira vez…');
  ffmpeg=new FFmpeg();
  ffmpeg.on('progress',({progress})=>{const value=Math.max(0,Math.min(1,Number(progress)||0));$('#converter-progress span').style.width=`${Math.round(value*100)}%`;$('#converter-progress-label').textContent=`Convertendo · ${Math.round(value*100)}%`});
  await ffmpeg.load({coreURL:new URL('../vendor/ffmpeg/core/ffmpeg-core.js',import.meta.url).href,wasmURL:C.API_BASE_URL+'/media/'+encodeURIComponent('system/ffmpeg/ffmpeg-core.wasm')});
  loaded=true;
}
async function convertImage(file,preset,quality){
  const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d');if(preset.ext==='jpg'){context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height)}context.drawImage(bitmap,0,0);bitmap.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível converter esta imagem')),preset.mime,quality));
}
async function convertMedia(file,preset,setStatus){
  await loadEngine(setStatus);const output=`output-${crypto.randomUUID()}.${preset.ext}`;await ffmpeg.writeFile('input',await fetchFile(file));const code=await ffmpeg.exec(preset.args(output));if(code!==0)throw new Error('O formato ou codec deste arquivo não pôde ser convertido');const data=await ffmpeg.readFile(output);await Promise.allSettled([ffmpeg.deleteFile('input'),ffmpeg.deleteFile(output)]);return new Blob([data.buffer],{type:preset.mime});
}
function render(){
  document.querySelector('.admin-heading h1').textContent='Conversão de mídia';document.querySelector('.admin-actions').innerHTML='';
  $('#content').innerHTML=`<section class="converter-hero"><div><span class="converter-kicker">FERRAMENTAS · EQUIPE</span><h2>Conversor de mídia</h2><p>Transforme vídeos, áudios e imagens sem enviar nenhum arquivo para a internet.</p></div><div class="converter-private"><b>100% privado</b><span>Processamento no navegador</span></div></section><section class="converter-workspace"><div class="converter-drop" id="converter-drop"><input id="converter-file" type="file" accept="video/*,audio/*,image/*"><div class="converter-drop-icon">⇧</div><h3>Solte o arquivo aqui</h3><p>ou clique para escolher · limite recomendado de 300 MB</p><div id="converter-file-summary"></div></div><div class="converter-settings"><div><span class="converter-step">01</span><h3>Formato de saída</h3></div><label class="converter-select-field"><span>Escolha o que deseja fazer</span><select id="converter-format">${['Áudio','Vídeo','Imagem','Ferramentas'].map(group=>`<optgroup label="${group}">${Object.entries(presets).filter(([,preset])=>preset.group===group).map(([key,preset])=>`<option value="${key}">${preset.label}</option>`).join('')}</optgroup>`).join('')}</select></label><div class="converter-choice-hint" id="converter-choice-hint"><b>MP3 · 192 kbps</b><span>Áudio</span></div><label class="converter-quality" id="converter-quality-wrap" hidden><span>Qualidade da imagem <b id="converter-quality-value">90%</b></span><input id="converter-quality" type="range" min="50" max="100" value="90"></label><button class="btn primary converter-button" id="converter-start" disabled>Converter arquivo</button><div class="converter-progress" id="converter-progress" hidden><span></span></div><p id="converter-progress-label" class="converter-status"></p></div></section><section class="converter-result" id="converter-result" hidden><div><span>✓</span><div><b id="converter-result-name"></b><small id="converter-result-size"></small></div></div><a class="btn primary" id="converter-download" download>Baixar convertido</a></section><section class="converter-recipes"><article><span>♫</span><b>Vídeo para áudio</b><p>Extraia MP3, M4A, OGG, Opus, FLAC ou WAV.</p></article><article><span>▶</span><b>Formatos de vídeo</b><p>Converta para MP4, WebM, MKV, AVI ou GIF.</p></article><article><span>▧</span><b>Imagens</b><p>Imagens, compactação, capa, vídeo sem áudio e volume normalizado.</p></article></section>`;
}
async function run(){
  render();let file=null;const input=$('#converter-file'),drop=$('#converter-drop'),start=$('#converter-start'),status=$('#converter-progress-label'),progress=$('#converter-progress');
  const setStatus=text=>status.textContent=text;
  const updateQualityVisibility=()=>{const preset=presets[$('#converter-format').value];$('#converter-quality-wrap').hidden=!(file?.type.startsWith('image/')&&preset.kind==='image')};
  const selectFile=value=>{file=value||null;$('#converter-file-summary').innerHTML=file?`<div class="converter-file-pill"><span>${esc(file.name)}</span><b>${bytes(file.size)}</b></div>`:'';start.disabled=!file;updateQualityVisibility();if(file&&file.size>MAX_BYTES){setStatus('Este arquivo ultrapassa 300 MB e pode esgotar a memória do navegador.');start.disabled=true}else setStatus('')};
  input.onchange=()=>selectFile(input.files[0]);drop.ondragover=event=>{event.preventDefault();drop.classList.add('is-dragging')};drop.ondragleave=()=>drop.classList.remove('is-dragging');drop.ondrop=event=>{event.preventDefault();drop.classList.remove('is-dragging');selectFile(event.dataTransfer.files[0])};
  $('#converter-format').onchange=event=>{const preset=presets[event.target.value];updateQualityVisibility();$('#converter-choice-hint').innerHTML=`<b>${preset.label}</b><span>${preset.group}</span>`};
  $('#converter-quality').oninput=event=>$('#converter-quality-value').textContent=`${event.target.value}%`;
  start.onclick=async()=>{if(!file||working)return;const preset=presets[$('#converter-format').value];if(preset.accept==='image'&&!file.type.startsWith('image/')){setStatus('Escolha uma imagem para esse formato de saída.');return}if(preset.accept==='video'&&!file.type.startsWith('video/')){setStatus('Escolha um vídeo para usar esta conversão.');return}working=true;start.disabled=true;progress.hidden=false;$('#converter-result').hidden=true;try{setStatus('Preparando conversão…');const blob=preset.kind==='image'?await convertImage(file,preset,Number($('#converter-quality').value)/100):await convertMedia(file,preset,setStatus);if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=URL.createObjectURL(blob);const name=outputName(file,preset),download=$('#converter-download');download.href=resultUrl;download.download=name;$('#converter-result-name').textContent=name;$('#converter-result-size').textContent=bytes(blob.size);$('#converter-result').hidden=false;$('#converter-progress span').style.width='100%';setStatus('Conversão concluída. O arquivo já pode ser baixado.')}catch(error){setStatus(error.message||'Falha na conversão. Tente outro formato.')}finally{working=false;start.disabled=false}};
}
window.ShoplabMediaConverter={run};