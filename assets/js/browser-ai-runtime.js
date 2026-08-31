import { SHOPLAB_CONFIG as C } from "./config.js";

const key = (value) =>
  C.API_BASE_URL + "/media/" + encodeURIComponent("system/browser-ai/" + value);

export const BROWSER_AI_ASSETS = Object.freeze({
  mediainfo: key("mediainfo/0.3.7/index.min.js"),
  mediainfoWasm: key("mediainfo/0.3.7/MediaInfoModule.wasm"),
  rnnoise: key("rnnoise/2025.1.5/rnnoise.js"),
  ort: key("onnx/1.29.0/ort.min.js"),
  ortWasm: key("onnx/1.29.0/ort-wasm-simd-threaded.wasm"),
  vad: key("vad/0.0.30/bundle.min.js"),
  vadWorklet: key("vad/0.0.30/vad.worklet.bundle.min.js"),
  vadModel: key("vad/0.0.30/silero_vad_v5.onnx"),
  tesseract: key("tesseract/7.0.0/tesseract.min.js"),
  tesseractWorker: key("tesseract/7.0.0/worker.min.js"),
  tesseractCore: key("tesseract/7.0.0/tesseract-core-simd-lstm.wasm.js"),
  tesseractLang: key("tesseract/lang"),
});

const pending = new Map();
function once(name, factory) {
  if (!pending.has(name))
    pending.set(
      name,
      Promise.resolve()
        .then(factory)
        .catch((error) => {
          pending.delete(name);
          throw error;
        }),
    );
  return pending.get(name);
}
function script(name, src, ready) {
  if (ready()) return Promise.resolve();
  return once(name, () => new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.crossOrigin = "anonymous";
    tag.onload = resolve;
    tag.onerror = () => reject(new Error("Não foi possível carregar " + name));
    document.head.append(tag);
  }));
}

export async function analyzeMedia(file) {
  const module = await once("mediainfo", () => import(BROWSER_AI_ASSETS.mediainfo));
  const mediaInfo = await module.mediaInfoFactory({
    locateFile: () => BROWSER_AI_ASSETS.mediainfoWasm,
  });
  try {
    return await mediaInfo.analyzeData(
      () => file.size,
      async (size, offset) =>
        new Uint8Array(await file.slice(offset, offset + size).arrayBuffer()),
    );
  } finally {
    mediaInfo.close();
  }
}

export async function recognizePortuguese(image, onProgress = () => {}) {
  await script("Tesseract", BROWSER_AI_ASSETS.tesseract, () => window.Tesseract);
  const worker = await window.Tesseract.createWorker("por", 1, {
    workerPath: BROWSER_AI_ASSETS.tesseractWorker,
    corePath: BROWSER_AI_ASSETS.tesseractCore,
    langPath: BROWSER_AI_ASSETS.tesseractLang,
    logger: onProgress,
  });
  try {
    const result = await worker.recognize(image);
    return result.data;
  } finally {
    await worker.terminate();
  }
}

export async function loadRNNoise() {
  const module = await once("rnnoise", () => import(BROWSER_AI_ASSETS.rnnoise));
  return module.Rnnoise.load();
}

async function decodeMono(file, sampleRate = 48000) {
  const context = new AudioContext();
  try {
    const source = await context.decodeAudioData(await file.arrayBuffer());
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(source.duration * sampleRate),
      sampleRate,
    );
    const node = offline.createBufferSource();
    node.buffer = source;
    node.connect(offline.destination);
    node.start();
    const rendered = await offline.startRendering();
    return new Float32Array(rendered.getChannelData(0));
  } finally {
    await context.close();
  }
}
function wav(samples, sampleRate = 48000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const text = (offset, value) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, samples.length * 2, true);
  for (let i = 0, offset = 44; i < samples.length; i++, offset += 2) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, value < 0 ? value * 32768 : value * 32767, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
export async function cleanRecordedAudio(file, onProgress = () => {}) {
  const samples = await decodeMono(file), engine = await loadRNNoise(),
    state = engine.createDenoiseState(), frameSize = engine.frameSize,
    output = new Float32Array(samples.length);
  try {
    for (let offset = 0; offset < samples.length; offset += frameSize) {
      const frame = new Float32Array(frameSize),
        length = Math.min(frameSize, samples.length - offset);
      for (let i = 0; i < length; i++) frame[i] = samples[offset + i] * 32768;
      state.processFrame(frame);
      for (let i = 0; i < length; i++) output[offset + i] = frame[i] / 32768;
      if (offset % (frameSize * 100) === 0) {
        onProgress(offset / samples.length);
        await new Promise(requestAnimationFrame);
      }
    }
  } finally {
    state.destroy();
  }
  onProgress(1);
  return wav(output);
}
export async function removeEdgeSilence(file, threshold = 0.012) {
  const samples = await decodeMono(file), windowSize = 960, padding = 9600;
  let start = 0, end = samples.length;
  const level = (offset) => {
    let sum = 0, count = 0;
    for (let i = offset; i < Math.min(samples.length, offset + windowSize); i++) {
      sum += samples[i] * samples[i]; count++;
    }
    return Math.sqrt(sum / Math.max(1, count));
  };
  while (start < end && level(start) < threshold) start += windowSize;
  while (end > start && level(Math.max(0, end - windowSize)) < threshold) end -= windowSize;
  start = Math.max(0, start - padding); end = Math.min(samples.length, end + padding);
  return wav(samples.slice(start, end));
}
export async function loadSileroVAD() {
  await script("detector de voz", BROWSER_AI_ASSETS.vad, () => window.vad);
  return window.vad;
}

export async function createMicVAD(options = {}) {
  const vad = await loadSileroVAD();
  const mediaBase = C.API_BASE_URL + "/media/vad-runtime-122/";
  return vad.MicVAD.new({
    model: "v5",
    baseAssetPath: mediaBase,
    onnxWASMBasePath: mediaBase,
    ortConfig: (ort) => {
      ort.env.wasm.wasmPaths = mediaBase;
      ort.env.logLevel = "error";
    },
    ...options,
  });
}

window.ShoplabBrowserAI = {
  assets: BROWSER_AI_ASSETS,
  analyzeMedia,
  recognizePortuguese,
  loadRNNoise,
  loadSileroVAD,
  createMicVAD,
  cleanRecordedAudio,
  removeEdgeSilence,
};
