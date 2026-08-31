import { SHOPLAB_CONFIG as C } from "./config.js";
const $ = (s, r = document) => r.querySelector(s),
  prefsKey = "shoplab:recorder-prompter:v4";
let installed,
  scrollTimer,
  countdownTimer,
  finishTimer,
  scrolling = false,
  pauseUntil = 0,
  nextPause = 0,
  pausePoints = [],
  voskModel,
  voskRecognizer,
  voskLoading,
  voskPending = [],
  voskPendingLength = 0,
  voiceActive = false,
  currentSentence = 0,
  voiceScrollFrame = 0,
  voiceScrollTarget = 0;
async function scripts() {
  const response = await fetch(C.API_BASE_URL + "/api/v1/admin/media-scripts", {
      credentials: "include",
    }),
    payload = await response.json();
  if (!response.ok || !payload.success)
    throw Error(
      payload.error?.message || "Não foi possível carregar os roteiros",
    );
  return payload.data?.items || [];
}
async function install() {
  const studio = $("#recorder-studio");
  if (!studio || installed === studio) return;
  installed = studio;
  const info = $("#recorder-capture-info");
  info.insertAdjacentHTML(
    "afterend",
    `<section class='recorder-prompter'><header><div class='recorder-prompter-brand'><i></i><div><span>TELEPROMPTER INTEGRADO</span><b>Grave lendo seu roteiro</b><small id='recorder-prompter-status'>Pronto para gravar</small></div></div><button class='btn ghost' id='recorder-prompter-toggle' type='button'>Abrir teleprompter</button></header><div id='recorder-prompter-body' hidden><div class='recorder-prompter-setup'><label class='recorder-script-field'><span>Roteiro</span><select id='recorder-script'><option value=''>Carregando roteiros…</option></select></label><label><span>Velocidade</span><input id='recorder-prompter-speed' type='range' min='.5' max='8' step='.25' value='2'><output id='recorder-prompter-speed-value'>2×</output></label><label><span>Fonte</span><input id='recorder-prompter-font' type='range' min='24' max='80' step='2' value='42'><output id='recorder-prompter-font-value'>42</output></label><label><span>Largura</span><input id='recorder-prompter-width' type='range' min='560' max='1200' step='10' value='960'><output id='recorder-prompter-width-value'>960</output></label><button class='btn ghost' id='recorder-prompter-mirror' type='button' aria-pressed='false'>Espelhar</button><button class='btn primary' id='record-with-prompter' type='button'>Gravar com teleprompter</button><label class='recorder-prompter-option recorder-voice-option'><input id='recorder-prompter-voice' type='checkbox'><span></span><b>Seguir minha voz</b></label><label class='recorder-prompter-option'><input id='prompter-fullscreen' type='checkbox' checked><span></span>Tela cheia</label><label class='recorder-prompter-option fixed-scroll-option'><input id='recorder-prompter-auto-pause' type='checkbox' checked><span></span>Pausar nas frases</label><label class='recorder-prompter-option'><input id='prompter-auto-finish' type='checkbox'><span></span>Finalizar após 10 s</label></div><div class='recorder-prompter-progress'><i id='recorder-prompter-progress-bar'></i></div><div class='recorder-prompter-stage' id='recorder-prompter-stage'><div id='recorder-prompter-countdown' hidden></div><div id='recorder-prompter-finish' hidden></div><div id='recorder-prompter-text'>Escolha um roteiro para começar.</div></div><footer><span id='recorder-prompter-percent'>0% concluído</span><span id='recorder-prompter-help'><kbd>Espaço</kbd> pausar &nbsp; <kbd>↑ ↓</kbd> velocidade</span><span id='recorder-prompter-remaining'>--:-- restantes</span><button id='recorder-prompter-exit' type='button'>Sair da tela cheia</button><button id='recorder-prompter-reset' type='button'>Voltar ao início</button></footer></div></section>`,
  );
  const autoFinish = $("#prompter-auto-finish");
  autoFinish.checked = true;
  autoFinish.disabled = true;
  autoFinish.parentElement.lastChild.textContent = "Parar ao concluir";
  $("#recorder-prompter-remaining").insertAdjacentHTML(
    "afterend",
    "<button class='recorder-prompter-pause' id='recorder-prompter-pause' type='button' disabled>⏸ Pausar gravação</button>",
  );
  bind();
  setupRecognition();
  applyPreferences();
  try {
    const items = await scripts(),
      select = $("#recorder-script");
    select.innerHTML =
      `<option value=''>Selecione um roteiro</option>` +
      items
        .filter((i) => i.status !== "used")
        .map((i) => `<option value='${i.id}'>${escapeHtml(i.title)}</option>`)
        .join("");
    select._items = items;
  } catch (error) {
    $("#recorder-script").innerHTML =
      `<option value=''>${error.message}</option>`;
  }
}
const escapeHtml = (value) => {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
};
function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(prefsKey) || "{}");
  } catch {
    return {};
  }
}
function savePreferences() {
  localStorage.setItem(
    prefsKey,
    JSON.stringify({
      speed: $("#recorder-prompter-speed").value,
      font: $("#recorder-prompter-font").value,
      width: $("#recorder-prompter-width").value,
      mirror: $("#recorder-prompter-mirror").classList.contains("active"),
      fullscreen: $("#prompter-fullscreen").checked,
      voice: $("#recorder-prompter-voice").checked,
      autoPause: $("#recorder-prompter-auto-pause").checked,
      autoFinish: $("#prompter-auto-finish").checked,
    }),
  );
}
function paintRange(input) {
  const progress =
    ((Number(input.value) - Number(input.min)) /
      (Number(input.max) - Number(input.min))) *
    100;
  input.style.setProperty("--range-progress", progress + "%");
}
function updateControls() {
  $("#recorder-prompter-speed-value").textContent =
    Number($("#recorder-prompter-speed").value).toLocaleString("pt-BR") + "×";
  $("#recorder-prompter-font-value").textContent = $(
    "#recorder-prompter-font",
  ).value;
  $("#recorder-prompter-width-value").textContent = $(
    "#recorder-prompter-width",
  ).value;
  [
    "recorder-prompter-speed",
    "recorder-prompter-font",
    "recorder-prompter-width",
  ].forEach((id) => paintRange($("#" + id)));
  $("#recorder-prompter-text").style.fontSize =
    $("#recorder-prompter-font").value + "px";
  $("#recorder-prompter-text").style.maxWidth =
    $("#recorder-prompter-width").value + "px";
  savePreferences();
  updateProgress();
}
function applyPreferences() {
  const p = readPreferences();
  if (p.speed) $("#recorder-prompter-speed").value = p.speed;
  if (p.font) $("#recorder-prompter-font").value = p.font;
  if (p.width) $("#recorder-prompter-width").value = p.width;
  if (p.fullscreen === false) $("#prompter-fullscreen").checked = false;
  if (p.voice) $("#recorder-prompter-voice").checked = true;
  if (p.autoPause === false) $("#recorder-prompter-auto-pause").checked = false;
  if (p.autoFinish) $("#prompter-auto-finish").checked = true;
  if (p.mirror) {
    $("#recorder-prompter-mirror").classList.add("active");
    $("#recorder-prompter-mirror").setAttribute("aria-pressed", "true");
    $("#recorder-prompter-text").classList.add("mirrored");
  }
  updateVoiceMode();
  updateControls();
}
function buildPausePoints(value) {
  pausePoints = [];
  for (let i = 0; i < value.length; i++)
    if (/[.!?]/.test(value[i]) && (!value[i + 1] || /\s/.test(value[i + 1])))
      pausePoints.push(i / value.length);
  nextPause = 0;
}
function renderScript(value) {
  const target = $("#recorder-prompter-text");
  target.replaceChildren();
  const parts = value.match(/\s+|\S+/g) || [value];
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      target.append(document.createTextNode(part));
      continue;
    }
    const span = document.createElement("span");
    span.className = "recorder-prompter-word";
    span.textContent = part;
    span.dataset.voice = normalize(part);
    target.append(span);
  }
  currentSentence = 0;
  buildPausePoints(value);
}
function normalize(value) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function setupRecognition() {
  const label = $("#recorder-prompter-voice").closest("label");
  label.classList.remove("voice-activity-fallback");
  label.classList.add("vosk-local");
  label.title = "Reconhecimento em português executado localmente pelo Vosk";
}
function updateVoiceMode() {
  const active = $("#recorder-prompter-voice").checked;
  $(".recorder-prompter").classList.toggle("voice-mode", active);
  $("#recorder-prompter-help").innerHTML = active
    ? "<span class=voice-listening-dot></span> Vosk local · áudio não sai do navegador"
    : "<kbd>Espaço</kbd> pausar &nbsp; <kbd>↑ ↓</kbd> velocidade";
  savePreferences();
}
function loadVoskLibrary() {
  if (window.Vosk) return Promise.resolve(window.Vosk);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-shoplab-vosk]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Vosk), {
        once: true,
      });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = new URL(
      "../vendor/vosk/vosk.js?v=0.0.8",
      import.meta.url,
    ).href;
    script.dataset.shoplabVosk = "true";
    script.onload = () => resolve(window.Vosk);
    script.onerror = () =>
      reject(new Error("Não foi possível carregar o Vosk"));
    document.head.append(script);
  });
}
async function ensureVosk() {
  if (voskModel?.ready) return voskModel;
  if (voskLoading) return voskLoading;
  const status = $("#recorder-prompter-status");
  status.textContent = "Baixando modelo português · primeira vez pode demorar";
  $(".recorder-prompter").classList.add("is-loading-voice");
  voskLoading = (async () => {
    const Vosk = await loadVoskLibrary();
    if (!Vosk?.createModel) throw new Error("Biblioteca Vosk indisponível");
    const modelKey = "system/vosk/vosk-model-small-pt-0.3.tar.gz";
    const modelUrl = C.API_BASE_URL + "/media/" + encodeURIComponent(modelKey);
    voskModel = await Vosk.createModel(modelUrl, -1);
    status.textContent = "Modelo português pronto · carregado localmente";
    return voskModel;
  })()
    .catch((error) => {
      voskLoading = null;
      throw error;
    })
    .finally(() =>
      $(".recorder-prompter")?.classList.remove("is-loading-voice"),
    );
  return voskLoading;
}
function createVoskRecognizer(sampleRate = 48000) {
  if (!voskModel?.ready) throw new Error("Modelo Vosk ainda não carregado");
  if (voskRecognizer) voskRecognizer.remove();
  voskRecognizer = new voskModel.KaldiRecognizer(sampleRate);
  voskRecognizer.setWords(true);
  voskRecognizer.on("partialresult", (message) => {
    const text = message?.result?.partial || "";
    if (text) {
      $("#recorder-prompter-status").textContent = 'Vosk ouviu: "' + text + '"';
      followVoice(text);
    }
  });
  voskRecognizer.on("result", (message) => {
    const text = message?.result?.text || "";
    if (text) {
      $("#recorder-prompter-status").textContent =
        'Vosk confirmou: "' + text + '"';
      followVoice(text);
    }
  });
}
function feedVosk(event) {
  if (!voiceActive || !voskRecognizer) return;
  const channel = event.detail?.channels?.[0],
    sampleRate = Number(event.detail?.sampleRate || 48000);
  if (!(channel instanceof Float32Array) || !channel.length) return;
  voskPending.push(channel);
  voskPendingLength += channel.length;
  if (voskPendingLength < 2048) return;
  const audio = new Float32Array(voskPendingLength);
  let offset = 0;
  for (const chunk of voskPending) {
    audio.set(chunk, offset);
    offset += chunk.length;
  }
  voskPending = [];
  voskPendingLength = 0;
  try {
    voskRecognizer.acceptWaveformFloat(audio, sampleRate);
  } catch (error) {
    $("#recorder-prompter-status").textContent =
      "Falha ao processar áudio local · " + error.message;
  }
}
function startVoice() {
  voiceActive = true;
  voskPending = [];
  voskPendingLength = 0;
  $("#recorder-prompter-status").textContent =
    "Vosk ouvindo · fale as palavras do roteiro";
  createVoskRecognizer(48000);
  window.addEventListener("shoplab:recorder-pcm", feedVosk);
}
function stopVoice() {
  voiceActive = false;
  voskPending = [];
  voskPendingLength = 0;
  window.removeEventListener("shoplab:recorder-pcm", feedVosk);
  if (voskRecognizer) {
    try {
      voskRecognizer.retrieveFinalResult();
      voskRecognizer.remove();
    } catch {}
    voskRecognizer = null;
  }
}
function wordDistance(a, b) {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = saved;
    }
  }
  return row[b.length];
}
function wordsMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;
  return (
    wordDistance(a, b) <=
    Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.28))
  );
}
function scrollVoiceTo(target) {
  const stage = $("#recorder-prompter-stage"),
    reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  voiceScrollTarget = Math.max(0, target);
  if (reducedMotion) {
    cancelAnimationFrame(voiceScrollFrame);
    voiceScrollFrame = 0;
    stage.scrollTop = voiceScrollTarget;
    return;
  }
  if (voiceScrollFrame) return;
  const animate = () => {
    const distance = voiceScrollTarget - stage.scrollTop;
    if (Math.abs(distance) < 0.75) {
      stage.scrollTop = voiceScrollTarget;
      voiceScrollFrame = 0;
      return;
    }
    stage.scrollTop += distance * 0.14;
    voiceScrollFrame = requestAnimationFrame(animate);
  };
  voiceScrollFrame = requestAnimationFrame(animate);
}
function followVoice(transcript) {
  if (!voiceActive) return;
  const spoken = normalize(transcript)
      .split(" ")
      .filter((word) => word.length > 1)
      .slice(-12),
    nodes = [...document.querySelectorAll(".recorder-prompter-word")],
    script = nodes.map((node) => node.dataset.voice);
  if (!spoken.length || !nodes.length) return;
  let best = -1,
    bestScore = -Infinity,
    bestConfidence = 0;
  const lastSpoken = spoken[spoken.length - 1],
    start = Math.max(0, currentSentence - 1),
    end = Math.min(nodes.length, currentSentence + 29);
  for (let i = start; i < end; i++) {
    if (!wordsMatch(script[i], lastSpoken)) continue;
    let hits = 1,
      exactHits = script[i] === lastSpoken ? 1 : 0,
      skipped = 0,
      scriptIndex = i - 1;
    for (
      let voiceIndex = spoken.length - 2;
      voiceIndex >= 0 && scriptIndex >= 0;
      voiceIndex--
    ) {
      let found = false;
      for (let look = scriptIndex; look >= Math.max(0, scriptIndex - 3); look--)
        if (wordsMatch(script[look], spoken[voiceIndex])) {
          hits++;
          if (script[look] === spoken[voiceIndex]) exactHits++;
          skipped += scriptIndex - look;
          scriptIndex = look - 1;
          found = true;
          break;
        }
      if (!found) scriptIndex--;
    }
    const compared = Math.min(spoken.length, 8),
      confidence = hits / compared,
      advance = Math.max(0, i - currentSentence),
      isSafeAdvance =
        advance <= 3 ||
        (hits >= 2 && exactHits >= 1 && confidence >= 0.4) ||
        (hits >= 3 && confidence >= 0.5);
    if (!isSafeAdvance) continue;
    const score = hits * 3 + exactHits * 1.25 - skipped * 0.45 - advance * 0.12;
    if (score > bestScore) {
      bestScore = score;
      best = i;
      bestConfidence = confidence;
    }
  }
  const advance = best - currentSentence,
    enough =
      best >= 0 &&
      (advance <= 1 ||
        (spoken.length === 1
          ? advance <= 3 && lastSpoken.length > 5 && script[best] === lastSpoken
          : bestConfidence >= (advance > 3 ? 0.4 : 0.25)));
  if (best < 0 || !enough) return;
  currentSentence = Math.max(currentSentence, best);
  nodes.forEach((node, index) => {
    node.classList.toggle("is-current", index === currentSentence);
    node.classList.toggle("is-read", index < currentSentence);
  });
  const stage = $("#recorder-prompter-stage"),
    word = nodes[currentSentence],
    target = word.offsetTop - stage.clientHeight * 0.46;
  scrollVoiceTo(target);
  updateProgress();
  $("#recorder-prompter-status").textContent =
    "Acompanhando · palavra " + (currentSentence + 1) + " de " + nodes.length;
  if (
    currentSentence >= nodes.length - 2 &&
    bestConfidence > 0.5
  )
    beginFinish();
}
function updateProgress() {
  const stage = $("#recorder-prompter-stage");
  if (!stage) return 0;
  const max = Math.max(1, stage.scrollHeight - stage.clientHeight),
    progress = Math.min(1, stage.scrollTop / max),
    speed = Number($("#recorder-prompter-speed").value),
    remaining = Math.max(0, (max - stage.scrollTop) / (speed * 33.333));
  $("#recorder-prompter-progress-bar").style.width = progress * 100 + "%";
  $("#recorder-prompter-percent").textContent =
    Math.round(progress * 100) + "% concluído";
  $("#recorder-prompter-remaining").textContent =
    Math.floor(remaining / 60) +
    ":" +
    String(Math.ceil(remaining % 60)).padStart(2, "0") +
    " restantes";
  return progress;
}
function bind() {
  $("#recorder-prompter-toggle").onclick = () => {
    $("#recorder-prompter-body").hidden = !$("#recorder-prompter-body").hidden;
    updateProgress();
  };
  $("#recorder-script").onchange = (e) => {
    const item = e.currentTarget._items?.find(
        (i) => i.id === e.currentTarget.value,
      ),
      text = item?.content || "Escolha um roteiro para começar.";
    renderScript(text);
    $("#recorder-prompter-stage").scrollTop = 0;
    updateProgress();
  };
  [
    "recorder-prompter-speed",
    "recorder-prompter-font",
    "recorder-prompter-width",
  ].forEach((id) => ($("#" + id).oninput = updateControls));
  [
    "prompter-fullscreen",
    "recorder-prompter-auto-pause",
    "prompter-auto-finish",
  ].forEach((id) => ($("#" + id).onchange = savePreferences));
  $("#recorder-prompter-voice").onchange = async () => {
    updateVoiceMode();
    if (!$("#recorder-prompter-voice").checked) return;
    try {
      await ensureVosk();
    } catch (error) {
      $("#recorder-prompter-voice").checked = false;
      updateVoiceMode();
      $("#recorder-prompter-status").textContent =
        "Não foi possível carregar o modelo · " + (error.message || "erro");
    }
  };
  $("#recorder-prompter-mirror").onclick = (e) => {
    const active = e.currentTarget.classList.toggle("active");
    e.currentTarget.setAttribute("aria-pressed", active);
    $("#recorder-prompter-text").classList.toggle("mirrored");
    savePreferences();
  };
  $("#recorder-prompter-stage").onscroll = updateProgress;
  $("#recorder-prompter-reset").onclick = () => {
    $("#recorder-prompter-stage").scrollTop = 0;
    nextPause = 0;
    currentSentence = 0;
    document
      .querySelectorAll(".recorder-prompter-word")
      .forEach((s) => s.classList.remove("is-current", "is-read"));
    cancelFinish();
    updateProgress();
  };
  $("#recorder-prompter-exit").onclick = exitFullscreen;
  $("#record-with-prompter").onclick = countAndRecord;
  $("#recorder-prompter-pause").onclick = () => {
    if (!$("#audio-pause")?.disabled) $("#audio-pause").click();
  };
  $("#audio-pause").addEventListener("click", () =>
    setTimeout(() => {
      cancelFinish();
      scrolling ? stopScroll() : startScroll();
      updatePauseButton();
    }, 0),
  );
  $("#audio-stop").addEventListener("click", () => {
    stopScroll();
    cancelFinish();
    exitFullscreen();
    setTimeout(prepareNextTake, 250);
  });
  document.addEventListener("keydown", keys);
}
function keys(e) {
  if (installed && !document.body.contains(installed)) {
    document.removeEventListener("keydown", keys);
    return;
  }
  if (
    $("#recorder-prompter-body")?.hidden ||
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    $("#audio-pause").click();
  }
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const input = $("#recorder-prompter-speed");
    input.value = Math.max(
      0.5,
      Math.min(8, Number(input.value) + (e.key === "ArrowUp" ? 0.25 : -0.25)),
    );
    updateControls();
  }
}
async function countAndRecord() {
  if (!$("#recorder-script").value)
    return alert("Escolha um roteiro antes de gravar.");
  if ($("#audio-start").disabled) return;
  const button = $("#record-with-prompter");
  if ($("#recorder-prompter-voice").checked) {
    button.disabled = true;
    try {
      await ensureVosk();
    } catch (error) {
      button.disabled = false;
      $("#recorder-prompter-status").textContent =
        "Falha ao carregar Vosk · " + (error.message || "erro desconhecido");
      return;
    }
  }
  clearInterval(countdownTimer);
  stopScroll();
  let n = 3,
    screen = $("#recorder-prompter-countdown");
  button.disabled = true;
  screen.hidden = false;
  screen.textContent = n;
  countdownTimer = setInterval(() => {
    if (--n) screen.textContent = n;
    else {
      clearInterval(countdownTimer);
      screen.hidden = true;
      $("#audio-start").click();
      let checks = 0,
        watch = setInterval(() => {
          if ($("#audio-start").disabled) {
            clearInterval(watch);
            startScroll();
          } else if (++checks > 20) {
            clearInterval(watch);
            button.disabled = false;
          }
        }, 100);
    }
  }, 1000);
}
function startScroll() {
  if (scrolling) return;
  if ($("#prompter-fullscreen").checked)
    document.body.classList.add("recorder-prompter-fullscreen");
  scrolling = true;
  $("#record-with-prompter").textContent = "Gravando com roteiro…";
  $(".recorder-prompter").classList.add("is-playing");
  updatePauseButton();
  if ($("#recorder-prompter-voice").checked) startVoice();
  else startFixedScroll();
}
function startFixedScroll() {
  $("#recorder-prompter-status").textContent = "Rolando agora";
  clearInterval(scrollTimer);
  scrollTimer = setInterval(() => {
    const stage = $("#recorder-prompter-stage"),
      now = Date.now();
    if (now < pauseUntil) return;
    stage.scrollTop =
      stage.scrollTop + Number($("#recorder-prompter-speed").value);
    const progress = updateProgress();
    if (
      $("#recorder-prompter-auto-pause").checked &&
      pausePoints[nextPause] != null &&
      progress >= pausePoints[nextPause]
    ) {
      pauseUntil = now + 650;
      nextPause++;
    }
    if (stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 2) {
      stopScroll("Roteiro concluído");
      beginFinish();
    }
  }, 30);
}
function stopScroll(status = "Pausado") {
  clearInterval(scrollTimer);
  scrollTimer = 0;
  stopVoice();
  scrolling = false;
  $(".recorder-prompter")?.classList.remove("is-playing");
  if ($("#recorder-prompter-status"))
    $("#recorder-prompter-status").textContent = status;
  const button = $("#record-with-prompter");
  if (button) {
    button.disabled = $("#audio-start")?.disabled || false;
    button.textContent = $("#audio-start")?.disabled
      ? "Teleprompter pausado"
      : "Gravar com teleprompter";
  }
  updatePauseButton();
}
function updatePauseButton() {
  const button = $("#recorder-prompter-pause"),
    recording = $("#audio-start")?.disabled && !$("#audio-stop")?.disabled;
  if (!button) return;
  button.disabled = !recording;
  button.textContent = scrolling ? "⏸ Pausar gravação" : "▶ Retomar gravação";
  button.classList.toggle("is-paused", recording && !scrolling);
}
function beginFinish() {
  if (finishTimer) return;
  cancelFinish();
  const label = $("#recorder-prompter-finish");
  stopScroll("Roteiro concluído");
  label.hidden = false;
  label.textContent = "Texto concluído · finalizando gravação…";
  finishTimer = setTimeout(() => {
    if ($("#audio-stop") && !$("#audio-stop").disabled)
      $("#audio-stop").click();
    cancelFinish();
  }, 900);
}
function cancelFinish() {
  clearTimeout(finishTimer);
  finishTimer = 0;
  const label = $("#recorder-prompter-finish");
  if (label) label.hidden = true;
}
function exitFullscreen() {
  document.body.classList.remove("recorder-prompter-fullscreen");
}
function prepareNextTake() {
  stopScroll();
  cancelFinish();
  exitFullscreen();
  const stage = $("#recorder-prompter-stage"),
    button = $("#record-with-prompter");
  if (stage) stage.scrollTop = 0;
  if (button) {
    button.disabled = false;
    button.textContent = "Gravar outra versão";
  }
}
new MutationObserver(install).observe(document.documentElement, {
  subtree: true,
  childList: true,
});
install();
