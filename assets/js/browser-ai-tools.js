import {
  analyzeMedia,
  recognizePortuguese,
  createMicVAD,
  cleanRecordedAudio,
  removeEdgeSilence,
} from "./browser-ai-runtime.js?v=20260831-vad-runtime-122-1";

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) => {
  const node = document.createElement("span");
  node.textContent = value ?? "";
  return node.innerHTML;
};
function trackSummary(track) {
  const values = [
    track.Format,
    track.Width && track.Height ? track.Width + "×" + track.Height : "",
    track.FrameRate ? track.FrameRate + " fps" : "",
    track.SamplingRate ? Math.round(track.SamplingRate / 1000) + " kHz" : "",
    track.Channels ? track.Channels + " canais" : "",
    track.BitRate ? Math.round(track.BitRate / 1000) + " kbps" : "",
  ];
  return values.filter(Boolean).join(" · ");
}
async function inspectConverterFile(file, panel) {
  panel.hidden = false;
  panel.innerHTML = "<b>Analisando mídia localmente…</b>";
  try {
    const result = await analyzeMedia(file);
    const tracks = result.media?.track || [];
    panel.innerHTML =
      "<header><b>Detalhes do arquivo</b><span>NO NAVEGADOR</span></header>" +
      tracks.map((track) =>
        "<p><strong>" + esc(track["@type"] || "Faixa") + "</strong> " +
        esc(trackSummary(track)) + "</p>",
      ).join("");
    if (file.type.startsWith("image/")) {
      const button = document.createElement("button");
      button.className = "btn ghost";
      button.type = "button";
      button.textContent = "Extrair texto da imagem";
      const output = document.createElement("textarea");
      output.placeholder = "O texto reconhecido aparecerá aqui.";
      output.hidden = true;
      button.onclick = async () => {
        button.disabled = true;
        button.textContent = "Preparando OCR…";
        try {
          const data = await recognizePortuguese(file, (event) => {
            if (event.progress)
              button.textContent = "Lendo imagem · " +
                Math.round(event.progress * 100) + "%";
          });
          output.hidden = false;
          output.value = data.text.trim();
          button.textContent = "Texto extraído";
        } catch (error) {
          button.textContent = error.message || "Falha no OCR";
        } finally {
          button.disabled = false;
        }
      };
      panel.append(button, output);
    }
  } catch (error) {
    panel.innerHTML = "<b>Não foi possível analisar:</b> " + esc(error.message);
  }
}
function mountConverter() {
  const input = $("#converter-file");
  if (!input || input.dataset.browserAi) return;
  input.dataset.browserAi = "1";
  const panel = document.createElement("section");
  panel.className = "browser-ai-file-info";
  panel.hidden = true;
  $("#converter-drop").insertAdjacentElement("afterend", panel);
  input.addEventListener("change", () => {
    if (input.files[0]) inspectConverterFile(input.files[0], panel);
  });
}
let silenceDetector;
async function prepareSilenceDetector(toggle, status) {
  if (silenceDetector) return silenceDetector;
  status.textContent = "Preparando detecção de silêncio…";
  silenceDetector = await createMicVAD({
    redemptionMs: 3000,
    minSpeechMs: 250,
    preSpeechPadMs: 250,
    onSpeechStart: () => {
      if (toggle.checked) status.textContent = "Voz detectada";
    },
    onSpeechEnd: () => {
      if (toggle.checked && !$("#audio-stop")?.disabled && !$("#audio-pause")?.disabled) {
        status.textContent = "Silêncio detectado · finalizando gravação";
        $("#audio-stop").click();
      }
    },
  });
  status.textContent = "Pronto para parar após alguns segundos de silêncio.";
  return silenceDetector;
}
function mountRecorderActions() {
  const info = $("#recorder-capture-info");
  if (!info || $("#recorder-stop-on-silence")) return;
  const control = document.createElement("label");
  control.className = "recorder-smart-action";
  control.innerHTML = "<input id='recorder-stop-on-silence' type='checkbox'><span><b>Parar após silêncio</b><small id='recorder-silence-status'>Finaliza quando você terminar de falar.</small></span>";
  info.insertAdjacentElement("afterend", control);
  const toggle = $("input", control), status = $("#recorder-silence-status");
  toggle.onchange = async () => {
    if (!toggle.checked) {
      silenceDetector?.pause();
      status.textContent = "Desativado.";
      return;
    }
    toggle.disabled = true;
    try {
      await prepareSilenceDetector(toggle, status);
      if (!$("#audio-stop")?.disabled) silenceDetector.start();
    } catch (error) {
      toggle.checked = false;
      status.textContent = error.message || "Não foi possível ativar.";
    } finally {
      toggle.disabled = false;
    }
  };
  $("#audio-start").addEventListener("click", () => {
    if (!toggle.checked) return;
    setTimeout(() => {
      if (!$("#audio-stop")?.disabled) silenceDetector?.start();
    }, 250);
  });
  $("#audio-pause").addEventListener("click", () => {
    setTimeout(() => {
      const paused = ($("#recorder-main-state")?.textContent || "")
        .toLocaleLowerCase("pt-BR")
        .includes("pausada");
      if (!paused && $("#audio-start")?.disabled && !$("#audio-stop")?.disabled)
        silenceDetector?.start();
      else silenceDetector?.pause();
    }, 0);
  });
  $("#audio-stop").addEventListener("click", () => silenceDetector?.pause());
}
function mountFinishedActions() {
  const finished = $("#recorder-finished");
  if (!finished || $("#recording-smart-tools")) return;
  const panel = document.createElement("section");
  panel.id = "recording-smart-tools";
  panel.className = "recording-smart-tools";
  panel.innerHTML = `<header><div><span>AJUSTES RÁPIDOS</span><h3>Melhorar esta gravação</h3></div><small>Processado neste navegador</small></header><div class="recording-smart-buttons"><button type="button" data-smart-action="clean"><b>Limpar ruído</b><span>Reduz sons constantes do ambiente</span></button><button type="button" data-smart-action="trim"><b>Remover silêncios</b><span>Corta apenas o começo e o final</span></button></div><p id="recording-smart-status">Escolha uma ação para começar.</p>`;
  finished.append(panel);
  panel.onclick = async (event) => {
    const button = event.target.closest("[data-smart-action]");
    if (!button || button.disabled) return;
    const bridge = window.ShoplabAudioBridge,
      file = bridge?.getRecordedFile?.(),
      status = $("#recording-smart-status");
    if (!file) {
      status.textContent = "Finalize uma gravação antes de usar esta ação.";
      return;
    }
    panel.querySelectorAll("[data-smart-action]").forEach((item) => item.disabled = true);
    try {
      if (button.dataset.smartAction === "clean") {
        status.textContent = "Limpando ruído…";
        const blob = await cleanRecordedAudio(file, (progress) => {
          status.textContent = "Limpando ruído · " + Math.round(progress * 100) + "%";
        });
        bridge.useProcessedFile(new File([blob], "gravacao-limpa.wav", { type: blob.type }));
        status.textContent = "Ruído reduzido. Ouça a gravação atualizada.";
      }
      if (button.dataset.smartAction === "trim") {
        status.textContent = "Localizando começo e final da fala…";
        const blob = await removeEdgeSilence(file);
        bridge.useProcessedFile(new File([blob], "gravacao-sem-silencios.wav", { type: blob.type }));
        status.textContent = "Silêncios do começo e do final removidos.";
      }
    } catch (error) {
      status.textContent = error.message || "Não foi possível concluir a ação.";
    } finally {
      panel.querySelectorAll("[data-smart-action]").forEach((item) => item.disabled = false);
    }
  };
}
const observer = new MutationObserver(() => {
  mountConverter();
  mountRecorderActions();
  mountFinishedActions();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
mountConverter();
mountRecorderActions();
mountFinishedActions();
