// Theme sound engine. Everything is synthesized (no audio files) and routed
// through one bus per AudioContext: gentle low-pass -> compressor -> master,
// with a short reverb send. That shared room is what makes separate blips
// sound like one instrument instead of raw oscillators.

interface Bus { dry: GainNode; wet: GainNode }
const buses = new WeakMap<AudioContext, Bus>();

function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function bus(ctx: AudioContext): Bus {
  const existing = buses.get(ctx);
  if (existing) return existing;
  const master = ctx.createGain();
  master.gain.value = 0.7;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.2;
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 7000;
  tone.connect(comp).connect(master).connect(ctx.destination);

  const dry = ctx.createGain();
  dry.connect(tone);
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 1.6, 3);
  const wet = ctx.createGain();
  wet.gain.value = 1;
  const wetLevel = ctx.createGain();
  wetLevel.gain.value = 0.28;
  wet.connect(verb).connect(wetLevel).connect(tone);

  const b = { dry, wet };
  buses.set(ctx, b);
  return b;
}

/** Connect a node to the bus with a given reverb amount (0..1). */
function send(ctx: AudioContext, node: AudioNode, reverb = 0.3) {
  const b = bus(ctx);
  node.connect(b.dry);
  if (reverb > 0) {
    const g = ctx.createGain();
    g.gain.value = reverb;
    node.connect(g).connect(b.wet);
  }
}

interface Voice {
  type?: OscillatorType;
  attack?: number;
  decay?: number;
  gain?: number;
  detune?: number; // cents between the two oscillators
  reverb?: number;
  octave?: boolean; // add a quiet octave-up partial for sparkle
  at?: number; // delay in seconds
}

/** A soft two-oscillator voice with an exponential tail. The basic building block. */
export function tone(ctx: AudioContext, freq: number, v: Voice = {}) {
  const t = ctx.currentTime + (v.at || 0);
  const attack = v.attack ?? 0.008;
  const decay = v.decay ?? 0.45;
  const peak = v.gain ?? 0.06;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  send(ctx, env, v.reverb ?? 0.3);
  const partials: [number, number][] = [[freq, 1]];
  if (v.detune) partials.push([freq * Math.pow(2, v.detune / 1200), 0.6]);
  if (v.octave) partials.push([freq * 2, 0.25]);
  for (const [f, level] of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = v.type || "sine";
    osc.frequency.setValueAtTime(f, t);
    g.gain.value = level;
    osc.connect(g).connect(env);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  }
}

/** Filtered noise: ticks, breaths, static. */
export function noise(ctx: AudioContext, o: { filter?: BiquadFilterType; freq?: number; q?: number; decay?: number; gain?: number; reverb?: number; at?: number } = {}) {
  const t = ctx.currentTime + (o.at || 0);
  const decay = o.decay ?? 0.05;
  const len = Math.ceil(ctx.sampleRate * (decay + 0.02));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = o.filter || "bandpass";
  f.frequency.value = o.freq ?? 2500;
  f.Q.value = o.q ?? 1.2;
  const env = ctx.createGain();
  env.gain.setValueAtTime(o.gain ?? 0.08, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(f).connect(env);
  send(ctx, env, o.reverb ?? 0.15);
  src.start(t);
}

// ---------------------------------------------------------------------------
// Musical scales: consecutive clicks walk the scale so they form a phrase.

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 7, 9, 12, 14, 16], // major pentatonic
  minor: [0, 3, 5, 7, 10, 12, 15, 17], // minor pentatonic
  dorian: [0, 2, 3, 7, 9, 12, 14, 15],
  japanese: [0, 1, 5, 7, 8, 12, 13, 17], // in-sen
};
const walkers = new Map<string, { i: number; dir: number; last: number }>();

/** Next note for a theme: a gentle random walk up and down its scale. */
export function nextNote(key: string, root: number, scale: keyof typeof SCALES = "major"): number {
  const steps = SCALES[scale];
  const w = walkers.get(key) || { i: 2, dir: 1, last: 0 };
  // Pause for a while and the phrase restarts near the root.
  if (Date.now() - w.last > 2500) { w.i = 1 + Math.floor(Math.random() * 2); w.dir = 1; }
  if (Math.random() < 0.25) w.dir *= -1;
  w.i += w.dir;
  if (w.i >= steps.length - 1 || w.i <= 0) w.dir *= -1;
  w.i = Math.max(0, Math.min(steps.length - 1, w.i));
  w.last = Date.now();
  walkers.set(key, w);
  return midi(root + steps[w.i]);
}

// ---------------------------------------------------------------------------
// Named sounds used by the themes.

/** Soft rising whoosh used when a theme is switched in. */
export function swoosh(ctx: AudioContext, freq: number, type: OscillatorType = "sine") {
  tone(ctx, freq, { type, gain: 0.035, decay: 0.5, reverb: 0.5 });
  tone(ctx, freq * 1.5, { type: "sine", gain: 0.025, decay: 0.6, reverb: 0.6, at: 0.07 });
  noise(ctx, { filter: "bandpass", freq: 1800, q: 0.7, decay: 0.35, gain: 0.025, reverb: 0.4 });
}

/** Wooden mallet: warm, short, a hint of sparkle. */
export function mallet(ctx: AudioContext, freq: number, gain = 0.06) {
  tone(ctx, freq, { type: "triangle", gain, decay: 0.42, reverb: 0.3, octave: true });
  noise(ctx, { filter: "highpass", freq: 3000, decay: 0.012, gain: 0.03, reverb: 0 });
}

/** Glassy bell with inharmonic partials and a long tail. */
export function bell(ctx: AudioContext, freq: number, gain = 0.05) {
  tone(ctx, freq, { gain, decay: 1.2, reverb: 0.55 });
  tone(ctx, freq * 2.76, { gain: gain * 0.35, decay: 0.6, reverb: 0.55 });
  tone(ctx, freq * 5.4, { gain: gain * 0.12, decay: 0.3, reverb: 0.55 });
}

/** Mellow synth pluck for darker themes. */
export function pluck(ctx: AudioContext, freq: number, type: OscillatorType = "triangle", gain = 0.05) {
  tone(ctx, freq, { type, gain, decay: 0.35, detune: 7, reverb: 0.3 });
}

export const softChime = (ctx: AudioContext, freq = 1046) => bell(ctx, freq, 0.04);

/** Felt-damped low pulse (Crimson). */
export function thump(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.16);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.14, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  osc.connect(env);
  send(ctx, env, 0.2);
  osc.start(t);
  osc.stop(t + 0.3);
  noise(ctx, { filter: "lowpass", freq: 600, decay: 0.05, gain: 0.05, reverb: 0.1 });
}

/** Typewriter key: a short tick with a tiny body thunk. */
export function typeClick(ctx: AudioContext) {
  noise(ctx, { filter: "bandpass", freq: 3200 + Math.random() * 800, q: 2, decay: 0.022, gain: 0.09, reverb: 0.05 });
  tone(ctx, 180, { type: "sine", gain: 0.03, attack: 0.002, decay: 0.05, reverb: 0 });
}

/** Two-note chiptune blip, softened with a triangle. */
export function blip8(ctx: AudioContext, freq = 660) {
  tone(ctx, freq, { type: "square", gain: 0.018, attack: 0.002, decay: 0.07, reverb: 0.15 });
  tone(ctx, freq * 1.5, { type: "triangle", gain: 0.03, attack: 0.002, decay: 0.1, reverb: 0.15, at: 0.055 });
}

/** CRT terminal beep: quiet, rounded square wave. */
export function terminalBeep(ctx: AudioContext) {
  tone(ctx, 880 + Math.random() * 40, { type: "square", gain: 0.012, attack: 0.002, decay: 0.04, reverb: 0.05 });
}

export function bootBeeps(ctx: AudioContext) {
  [523, 659, 784, 1046].forEach((f, i) => tone(ctx, f, { type: "triangle", gain: 0.035, decay: 0.16, reverb: 0.35, at: i * 0.11 }));
}

/** Cyberpunk click: bright FM-ish zap, short and not harsh. */
export function electricZap(ctx: AudioContext, freq = 1200) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.09);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(4000, t);
  f.frequency.exponentialRampToValueAtTime(600, t + 0.1);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.035, t + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(f).connect(env);
  send(ctx, env, 0.25);
  osc.start(t);
  osc.stop(t + 0.14);
}

/** Digital glitch: a few stuttered noise grains. */
export function glitchSound(ctx: AudioContext) {
  for (let i = 0; i < 4; i++) {
    noise(ctx, { filter: "bandpass", freq: 800 + Math.random() * 3000, q: 4, decay: 0.03, gain: 0.05, reverb: 0.1, at: i * 0.035 });
  }
}
