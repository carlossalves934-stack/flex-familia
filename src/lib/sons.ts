// Efeitos gerados na hora com Web Audio: nenhum arquivo de som para baixar.
export function criarSons(somLigado: () => boolean) {
  let ctx: AudioContext | null = null;
  const pronto = () => {
    if (!somLigado()) return null;
    try { ctx ??= new AudioContext(); } catch { return null; }
    return ctx;
  };
  const tom = (c: AudioContext, freq: number, ini: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.18) => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t + ini);
    g.gain.linearRampToValueAtTime(vol, t + ini + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + ini + dur);
    o.connect(g).connect(c.destination);
    o.start(t + ini); o.stop(t + ini + dur + 0.05);
  };
  const ruido = (c: AudioContext, dur: number, freq: number, vol: number) => {
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start();
  };
  return {
    pop() { const c = pronto(); if (c) { tom(c, 660, 0, 0.12); tom(c, 990, 0.05, 0.12); } },
    papel() { const c = pronto(); if (c) ruido(c, 0.35, 2400, 0.5); },
    carimbo() { const c = pronto(); if (c) { tom(c, 110, 0, 0.25, 'triangle', 0.4); ruido(c, 0.12, 400, 0.7); } },
    festa() { const c = pronto(); if (c) [523, 659, 784, 1047].forEach((f, i) => tom(c, f, i * 0.11, 0.3, 'triangle', 0.15)); },
  };
}
