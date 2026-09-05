import { SHOPLAB_CONFIG as C } from './config.js?v=20260803-media-domain-38';

let room = null;
const CALL_SESSION_KEY = 'shoplab.teamCall.joined';
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

class TeamCallController {
  constructor(session) {
    this.session = session;
    this.participants = new Map();
    this.peers = new Map();
    this.remoteStreams = new Map();
    this.pendingIce = new Map();
    this.analysers = new Map();
    this.iceServers = [];
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.destroyed = false;
    this.joining = false;
    this.offerLocks = new Map();
    this.screenRelay = null;
    this.onRouteLeave = (event) => { if (event.detail?.route === 'call') this.leave(false); };
  }

  render() {
    if (!$('#shoplab-team-call-styles')) document.head.insertAdjacentHTML('beforeend', '<link id="shoplab-team-call-styles" rel="stylesheet" href="../assets/css/admin-team-call.css?v=20260905-team-call-v1">');
    $('.admin-heading h1').textContent = 'Call da equipe';
    $('.admin-actions').innerHTML = '<span id="call-status" class="call-status disconnected"><i></i> Desconectado</span><span id="call-count" class="call-count">0 online</span>';
    $('#content').innerHTML = `<section class="team-call" aria-live="polite">
      <div id="call-notice" class="call-notice">Entre na sala para conversar com a equipe por áudio e compartilhar sua tela.</div>
      <div id="call-stage" class="call-stage"><div class="call-stage-empty"><span>▣</span><b>Nenhuma tela compartilhada</b><small>Quando alguém compartilhar, a tela aparecerá aqui.</small></div></div>
      <section><div class="call-section-heading"><div><span class="eyebrow">NA SALA</span><h2>Participantes</h2></div><small>Até 4 pessoas</small></div><div id="call-participants" class="call-participants"><div class="call-participants-empty">A sala está vazia.</div></div></section>
      <footer class="call-controls">
        <button id="call-join" class="btn primary" type="button">Entrar na call</button>
        <button id="call-mute" class="btn ghost" type="button" disabled>🎙 Microfone ativo</button>
        <button id="call-share" class="btn ghost" type="button" disabled>▣ Compartilhar tela</button>
        <button id="call-leave" class="btn call-leave" type="button" disabled>☎ Sair</button>
      </footer>
      <div id="call-audio" hidden></div>
    </section>`;
    $('#call-join').onclick = () => this.join();
    $('#call-mute').onclick = () => this.toggleMute();
    $('#call-share').onclick = () => this.screenStream ? this.stopSharing() : this.startSharing();
    $('#call-leave').onclick = () => this.leave(true);
    addEventListener('shoplab:admin-route-leave', this.onRouteLeave);
    this.updateUi();
    if (sessionStorage.getItem(CALL_SESSION_KEY) === '1') queueMicrotask(() => this.join({ resumed: true }));
  }

  debug(event, detail = {}) {
    if (location.hostname === 'localhost' || location.search.includes('callDebug=1')) console.debug('[SHOPLAB Call]', event, detail);
  }

  notice(message, kind = '') {
    const node = $('#call-notice');
    if (!node) return;
    node.textContent = message;
    node.className = `call-notice ${kind}`;
  }

  setStatus(status) {
    this.status = status;
    const labels = { disconnected: 'Desconectado', connecting: 'Conectando', connected: 'Conectado', reconnecting: 'Reconectando', error: 'Erro de conexão' };
    const node = $('#call-status');
    if (node) { node.className = `call-status ${status}`; node.innerHTML = `<i></i> ${labels[status]}`; }
    this.updateUi();
  }

  updateUi() {
    const joined = ['connecting', 'connected', 'reconnecting'].includes(this.status);
    if ($('#call-join')) $('#call-join').hidden = joined;
    if ($('#call-mute')) { $('#call-mute').disabled = !joined || !this.audioTrack; $('#call-mute').textContent = this.audioTrack?.enabled ? '🎙 Microfone ativo' : '🔇 Microfone mudo'; $('#call-mute').classList.toggle('is-off', !this.audioTrack?.enabled); }
    if ($('#call-share')) { $('#call-share').disabled = !joined || !navigator.mediaDevices?.getDisplayMedia; $('#call-share').textContent = this.screenStream ? '■ Parar compartilhamento' : '▣ Compartilhar tela'; $('#call-share').classList.toggle('is-sharing', Boolean(this.screenStream)); }
    if ($('#call-leave')) $('#call-leave').disabled = !joined;
    if ($('#call-count')) $('#call-count').textContent = `${this.participants.size} online`;
    this.renderParticipants();
  }

  renderParticipants() {
    const root = $('#call-participants');
    if (!root) return;
    root.innerHTML = this.participants.size ? [...this.participants.values()].map((person) => `<article class="call-person ${person.speaking ? 'is-speaking' : ''} ${person.sharing ? 'is-sharing' : ''}" data-participant="${esc(person.participantId)}"><span class="call-avatar">${esc(person.name.trim().charAt(0).toUpperCase() || '?')}</span><div><b>${esc(person.name)}${person.participantId === this.selfId ? ' (você)' : ''}</b><small>${person.sharing ? 'Compartilhando a tela' : person.muted ? 'Microfone mudo' : person.speaking ? 'Falando agora' : 'Microfone ativo'}</small></div><span class="call-person-icon">${person.muted ? '🔇' : '🎙'}</span></article>`).join('') : '<div class="call-participants-empty">A sala está vazia.</div>';
  }

  async api(path) {
    const response = await fetch(C.API_BASE_URL + path, { credentials: 'include' });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error?.message || 'Não foi possível abrir a call.');
    return body.data;
  }

  async join({ resumed = false } = {}) {
    if (this.joining || ['connecting', 'connected', 'reconnecting'].includes(this.status)) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection || !window.WebSocket) return this.notice('Este navegador não oferece os recursos necessários para a call.', 'error');
    this.destroyed = false;
    this.joining = true;
    this.setStatus('connecting');
    this.notice('Solicitando acesso ao microfone…');
    try {
      const config = await this.api('/api/v1/admin/team-call/config');
      this.iceServers = config.iceServers || [];
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      this.audioTrack = this.localStream.getAudioTracks()[0];
      if (!this.audioTrack) throw new Error('Nenhum microfone foi encontrado.');
      this.audioTrack.onended = () => { this.notice('O microfone foi desconectado. Saia e entre novamente após reconectá-lo.', 'error'); this.audioTrack = null; this.updateUi(); };
      this.watchSpeaking('local', this.localStream, () => this.selfId);
      sessionStorage.setItem(CALL_SESSION_KEY, '1');
      this.connectSocket();
      this.notice(config.turnEnabled ? 'Conectando com suporte a redes restritas…' : 'Conectando à sala…');
    } catch (error) {
      this.setStatus('error');
      const denied = ['NotAllowedError', 'PermissionDeniedError'].includes(error.name);
      this.notice(denied ? 'O acesso ao microfone foi bloqueado. Libere a permissão do site e tente novamente.' : error.message || 'Não foi possível acessar o microfone.', 'error');
      this.stopLocalMedia();
      if (!resumed) sessionStorage.removeItem(CALL_SESSION_KEY);
    } finally {
      this.joining = false;
    }
  }

  connectSocket() {
    if (this.destroyed) return;
    const url = new URL(C.API_BASE_URL + '/api/v1/admin/team-call/socket');
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(url);
    this.socket.onopen = () => { this.debug('signaling-open'); this.send({ type: 'ready' }); };
    this.socket.onmessage = (event) => this.onSignal(event);
    this.socket.onerror = () => this.notice('A conexão da call encontrou um problema.', 'error');
    this.socket.onclose = (event) => {
      this.debug('signaling-close', { code: event.code });
      if (this.destroyed) return;
      this.closePeers();
      if (event.code === 4001) { this.notice('Esta conta entrou na call em outra aba.', 'error'); return this.setStatus('error'); }
      if (this.reconnectAttempts >= 6) { this.setStatus('error'); this.notice('Não foi possível reconectar. Verifique a internet e tente entrar novamente.', 'error'); this.stopLocalMedia(); return; }
      this.setStatus('reconnecting');
      this.notice('Conexão perdida. Tentando reconectar…');
      const delay = Math.min(12000, 800 * 2 ** this.reconnectAttempts++);
      this.reconnectTimer = setTimeout(() => this.connectSocket(), delay);
    };
  }

  send(message) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  async onSignal(event) {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.type === 'welcome') {
      this.selfId = message.selfId;
      this.participants.clear();
      this.participants.set(this.selfId, { participantId: this.selfId, name: this.session.actor?.name || 'Você', muted: !this.audioTrack?.enabled, sharing: false });
      for (const person of message.participants || []) this.participants.set(person.participantId, person);
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.notice('Você está na call. O áudio é transmitido diretamente entre os participantes.', 'success');
      for (const person of message.participants || []) await this.createOffer(person.participantId);
      return;
    }
    if (message.type === 'participant-joined') {
      if (this.participants.has(message.participant.participantId)) this.removeParticipant(message.participant.participantId);
      this.participants.set(message.participant.participantId, message.participant); this.updateUi(); return;
    }
    if (message.type === 'participant-left') { this.removeParticipant(message.participantId); return; }
    if (message.type === 'participant-updated') {
      const person = this.participants.get(message.participantId);
      if (person) Object.assign(person, { ...(typeof message.muted === 'boolean' ? { muted: message.muted } : {}), ...(typeof message.sharing === 'boolean' ? { sharing: message.sharing } : {}) });
      if (message.sharing === false && message.participantId !== this.selfId) this.removeRemoteVideo(message.participantId);
      if (message.sharing === true && message.participantId !== this.selfId && this.remoteStreams.has(message.participantId)) this.showScreen(message.participantId, this.remoteStreams.get(message.participantId), false);
      this.updateUi();
      return;
    }
    if (message.type === 'share-granted' || message.type === 'share-denied') { this.shareReply?.(message); this.shareReply = null; return; }
    if (['offer', 'answer', 'ice'].includes(message.type)) await this.handlePeerSignal(message);
  }

  peerFor(participantId) {
    if (this.peers.has(participantId)) return this.peers.get(participantId);
    const peer = new RTCPeerConnection({ iceServers: this.iceServers, bundlePolicy: 'max-bundle' });
    this.peers.set(participantId, peer);
    for (const track of this.localStream?.getAudioTracks() || []) peer.addTrack(track, this.localStream);
    // Reserve video during the first negotiation so screen sharing only swaps tracks.
    const screenTransceiver = peer.addTransceiver('video', { direction: 'sendrecv' });
    screenTransceiver.sender._shoplabScreenSender = true;
    const screenTrack = this.screenRelay?.track || this.screenStream?.getVideoTracks()[0] || null;
    if (screenTrack) screenTransceiver.sender.replaceTrack(screenTrack).catch(() => {});
    peer.onicecandidate = ({ candidate }) => { if (candidate) this.send({ type: 'ice', target: participantId, candidate }); };
    peer.ontrack = ({ track, streams }) => this.attachRemoteTrack(participantId, track, streams[0]);
    peer.onconnectionstatechange = () => {
      this.debug('peer-state', { participantId, state: peer.connectionState });
      if (peer.connectionState === 'failed') { peer.restartIce(); this.createOffer(participantId); }
    };
    this.debug('peer-created', { participantId });
    return peer;
  }

  async createOffer(participantId) {
    const peer = this.peerFor(participantId);
    const previous = this.offerLocks.get(participantId) || Promise.resolve();
    const next = previous.then(async () => {
      if (peer.signalingState !== 'stable') return;
      await peer.setLocalDescription(await peer.createOffer());
      this.send({ type: 'offer', target: participantId, description: peer.localDescription });
    }).catch((error) => this.debug('offer-failed', { participantId, error: error.message }));
    this.offerLocks.set(participantId, next);
    await next;
  }

  async handlePeerSignal(message) {
    const peer = this.peerFor(message.from);
    try {
      if (message.type === 'ice') {
        if (!peer.remoteDescription) { const queue = this.pendingIce.get(message.from) || []; queue.push(message.candidate); this.pendingIce.set(message.from, queue); }
        else await peer.addIceCandidate(message.candidate);
        return;
      }
      await peer.setRemoteDescription(message.description);
      for (const candidate of this.pendingIce.get(message.from) || []) await peer.addIceCandidate(candidate);
      this.pendingIce.delete(message.from);
      if (message.type === 'offer') { await peer.setLocalDescription(await peer.createAnswer()); this.send({ type: 'answer', target: message.from, description: peer.localDescription }); }
    } catch (error) { this.debug('signal-failed', { type: message.type, error: error.message }); }
  }

  attachRemoteTrack(participantId, track, stream) {
    stream ||= new MediaStream([track]);
    if (track.kind === 'audio') {
      let audio = document.querySelector(`audio[data-call-audio="${CSS.escape(participantId)}"]`);
      if (!audio) { audio = document.createElement('audio'); audio.autoplay = true; audio.dataset.callAudio = participantId; $('#call-audio')?.append(audio); }
      audio.srcObject = stream;
      this.watchSpeaking(`remote:${participantId}`, stream, () => participantId);
      audio.play().catch(() => this.notice('Clique em qualquer lugar da página para liberar a reprodução do áudio.', 'error'));
    } else if (track.kind === 'video') {
      stream = new MediaStream([track]);
      this.remoteStreams.set(participantId, stream);
      track.onended = () => this.removeRemoteVideo(participantId);
      const display = () => {
        const person = this.participants.get(participantId);
        if (person?.sharing || !track.muted) this.showScreen(participantId, stream, false);
      };
      track.onunmute = display;
      display();
    }
  }

  toggleMute() {
    if (!this.audioTrack) return;
    this.audioTrack.enabled = !this.audioTrack.enabled;
    const person = this.participants.get(this.selfId);
    if (person) person.muted = !this.audioTrack.enabled;
    this.send({ type: 'mute', muted: !this.audioTrack.enabled });
    this.updateUi();
  }

  claimScreen() {
    return new Promise((resolve) => { this.shareReply = resolve; this.send({ type: 'share-claim' }); setTimeout(() => { if (this.shareReply) { this.shareReply = null; resolve({ type: 'share-denied', name: 'outro participante' }); } }, 5000); });
  }

  async createScreenRelay(sourceStream) {
    const sourceTrack = sourceStream.getVideoTracks()[0];
    const settings = sourceTrack.getSettings?.() || {};
    const sourceVideo = document.createElement('video');
    sourceVideo.muted = true; sourceVideo.playsInline = true; sourceVideo.srcObject = sourceStream;
    await sourceVideo.play().catch((error) => this.debug('screen-relay-play-fallback', { error: error.message }));
    if (!sourceVideo.videoWidth) await new Promise((resolve) => { sourceVideo.onloadedmetadata = resolve; setTimeout(resolve, 1200); });
    if (!sourceVideo.videoWidth || sourceTrack.readyState !== 'live') {
      sourceVideo.srcObject = null;
      return { stream: sourceStream, track: sourceTrack, stop() {} };
    }
    const sourceWidth = sourceVideo.videoWidth || Number(settings.width) || 1280;
    const sourceHeight = sourceVideo.videoHeight || Number(settings.height) || 720;
    const scale = Math.min(1, 1920 / sourceWidth, 1080 / sourceHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(2, Math.floor(sourceWidth * scale / 2) * 2);
    canvas.height = Math.max(2, Math.floor(sourceHeight * scale / 2) * 2);
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context || !canvas.captureStream) return { stream: sourceStream, track: sourceTrack, stop() {} };
    context.fillStyle = '#111'; context.fillRect(0, 0, canvas.width, canvas.height);
    let frame = 0;
    const draw = () => { if (sourceTrack.readyState !== 'live') return; try { context.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height); } catch {} frame = requestAnimationFrame(draw); };
    draw();
    const relayStream = canvas.captureStream(24), relayTrack = relayStream.getVideoTracks()[0];
    relayTrack.contentHint = 'detail';
    return { stream: relayStream, track: relayTrack, stop() { cancelAnimationFrame(frame); relayStream.getTracks().forEach((item) => item.stop()); sourceVideo.pause(); sourceVideo.srcObject = null; } };
  }
  async startSharing() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 24, max: 30 }, width: { max: 2560 }, height: { max: 1440 } }, audio: false });
      const result = await this.claimScreen();
      if (result.type !== 'share-granted') { stream.getTracks().forEach((track) => track.stop()); return this.notice(`${result.name || 'Outro participante'} já está compartilhando a tela.`, 'error'); }
      this.screenStream = stream;
      const sourceTrack = stream.getVideoTracks()[0];
      sourceTrack.contentHint = 'detail';
      sourceTrack.onended = () => this.stopSharing();
      this.screenRelay = await this.createScreenRelay(stream);
      const track = this.screenRelay.track;
      for (const [participantId, peer] of this.peers) {
        const sender = peer.getSenders().find((item) => item._shoplabScreenSender);
        if (sender) {
          await sender.replaceTrack(track);
          const parameters = sender.getParameters();
          parameters.encodings ||= [{}];
          parameters.encodings[0].maxBitrate = 4000000;
          parameters.encodings[0].maxFramerate = 24;
          parameters.degradationPreference = 'maintain-resolution';
          await sender.setParameters(parameters).catch(() => {});
        } else {
          const created = peer.addTrack(track, stream); created._shoplabScreenSender = true;
        }
        await this.createOffer(participantId);
      }
      const person = this.participants.get(this.selfId); if (person) person.sharing = true;
      this.showScreen(this.selfId, stream, true);
      this.notice('Sua tela está sendo compartilhada.', 'success');
      this.updateUi();
      this.debug('screen-started');
    } catch (error) {
      if (this.screenStream === stream) this.stopSharing();
      else stream?.getTracks().forEach((track) => track.stop());
      if (error.name !== 'AbortError') this.notice(error.name === 'NotAllowedError' ? 'O compartilhamento de tela foi cancelado ou bloqueado.' : 'Não foi possível compartilhar a tela.', 'error');
    }
  }

  stopSharing(notify = true) {
    if (!this.screenStream) return;
    const tracks = this.screenStream.getTracks();
    for (const peer of this.peers.values()) for (const sender of peer.getSenders()) if (sender._shoplabScreenSender || (sender.track && tracks.includes(sender.track))) sender.replaceTrack(null).catch(() => {});
    tracks.forEach((track) => { track.onended = null; track.stop(); });
    this.screenRelay?.stop();
    this.screenRelay = null;
    this.screenStream = null;
    const person = this.participants.get(this.selfId); if (person) person.sharing = false;
    if (notify) this.send({ type: 'share-stop' });
    this.clearStage();
    this.notice('O compartilhamento de tela foi encerrado.');
    this.updateUi();
    this.debug('screen-stopped');
  }

  showScreen(participantId, stream, local) {
    const person = this.participants.get(participantId);
    $('#call-stage').innerHTML = `<video id="call-screen-video" autoplay playsinline ${local ? 'muted' : ''}></video><span class="call-screen-owner">${local ? 'Você' : esc(person?.name || 'Participante')} está compartilhando</span>`;
    const video = $('#call-screen-video');
    video.srcObject = stream;
    video.play().catch(() => this.notice('Clique na tela compartilhada para iniciar a reprodução.', 'error'));
  }

  clearStage() {
    if ($('#call-stage')) $('#call-stage').innerHTML = '<div class="call-stage-empty"><span>▣</span><b>Nenhuma tela compartilhada</b><small>Quando alguém compartilhar, a tela aparecerá aqui.</small></div>';
  }

  removeRemoteVideo(participantId) { if (!this.remoteStreams.has(participantId)) return; this.remoteStreams.delete(participantId); this.clearStage(); }

  watchSpeaking(key, stream, participantId) {
    if (!stream?.getAudioTracks().length || this.analysers.has(key)) return;
    const context = new AudioContext(), analyser = context.createAnalyser(), source = context.createMediaStreamSource(stream), samples = new Uint8Array(analyser.fftSize = 256);
    source.connect(analyser);
    const entry = { context, analyser, source, frame: 0, speaking: false };
    const tick = () => {
      if (this.destroyed || context.state === 'closed') return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0; for (const sample of samples) { const value = (sample - 128) / 128; sum += value * value; }
      const speaking = Math.sqrt(sum / samples.length) > .035;
      if (speaking !== entry.speaking) { entry.speaking = speaking; const person = this.participants.get(participantId()); if (person && !person.muted) { person.speaking = speaking; this.renderParticipants(); } }
      entry.frame = requestAnimationFrame(tick);
    };
    entry.frame = requestAnimationFrame(tick); this.analysers.set(key, entry);
  }

  removeParticipant(participantId) {
    this.peers.get(participantId)?.close(); this.peers.delete(participantId);
    this.pendingIce.delete(participantId);
    this.participants.delete(participantId); this.removeRemoteVideo(participantId);
    const audio = document.querySelector(`audio[data-call-audio="${CSS.escape(participantId)}"]`); if (audio) { audio.srcObject = null; audio.remove(); }
    this.updateUi();
  }

  closePeers() { for (const peer of this.peers.values()) peer.close(); this.peers.clear(); this.remoteStreams.clear(); $('#call-audio')?.replaceChildren(); }
  stopLocalMedia() { this.localStream?.getTracks().forEach((track) => track.stop()); this.localStream = null; this.audioTrack = null; }

  leave(showMessage = true) {
    this.destroyed = true;
    if (showMessage) sessionStorage.removeItem(CALL_SESSION_KEY);
    clearTimeout(this.reconnectTimer);
    if (this.screenStream) this.stopSharing(false);
    this.socket?.close(1000, 'Saiu da call'); this.socket = null;
    this.closePeers(); this.stopLocalMedia();
    for (const item of this.analysers.values()) { cancelAnimationFrame(item.frame); item.source.disconnect(); item.context.close().catch(() => {}); }
    this.analysers.clear(); this.participants.clear(); this.selfId = null;
    removeEventListener('shoplab:admin-route-leave', this.onRouteLeave);
    this.setStatus('disconnected'); this.clearStage();
    if (showMessage) { this.destroyed = false; addEventListener('shoplab:admin-route-leave', this.onRouteLeave); this.notice('Você saiu da call.'); }
    this.debug('left');
  }
}

async function run(target, session) {
  if (target !== 'team-call') throw new Error('Área de call inválida.');
  room?.leave(false);
  room = new TeamCallController(session);
  room.render();
}

window.ShoplabTeamCall = { run, leave: () => room?.leave(true) };
