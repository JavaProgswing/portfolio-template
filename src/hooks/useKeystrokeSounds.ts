import { useCallback, useRef, useEffect } from "react";

/**
 * Synthesizes realistic mechanical-keyboard click sounds using
 * the Web Audio API. No audio files required.
 *
 * Returns a `playKeystroke` function that accepts an optional key
 * name to choose the right sound variant.
 */

let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

type KeyVariant = "key" | "enter" | "backspace" | "space";

function classify(key?: string): KeyVariant {
  if (!key) return "key";
  switch (key) {
    case "Enter":
      return "enter";
    case "Backspace":
    case "Delete":
      return "backspace";
    case " ":
      return "space";
    default:
      return "key";
  }
}

// Slight randomisation for natural feel
function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

/** Create a short click / tap sound via oscillator + noise burst */
function synthesize(ctx: AudioContext, variant: KeyVariant, volume: number) {
  const now = ctx.currentTime;

  // --- master gain ---
  const master = ctx.createGain();
  master.gain.setValueAtTime(volume, now);
  master.connect(ctx.destination);

  // --- profile per variant ---
  const profiles: Record<
    KeyVariant,
    { freq: number; dur: number; noiseDur: number; noiseVol: number }
  > = {
    key: {
      freq: jitter(1800, 400),
      dur: 0.035,
      noiseDur: 0.025,
      noiseVol: 0.06,
    },
    enter: {
      freq: jitter(600, 100),
      dur: 0.06,
      noiseDur: 0.04,
      noiseVol: 0.10,
    },
    backspace: {
      freq: jitter(1200, 200),
      dur: 0.04,
      noiseDur: 0.03,
      noiseVol: 0.07,
    },
    space: {
      freq: jitter(400, 80),
      dur: 0.055,
      noiseDur: 0.04,
      noiseVol: 0.09,
    },
  };

  const p = profiles[variant];

  // --- click oscillator (short sine/triangle ping) ---
  const osc = ctx.createOscillator();
  osc.type = variant === "enter" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(p.freq, now);
  osc.frequency.exponentialRampToValueAtTime(p.freq * 0.4, now + p.dur);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.18, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);

  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(now);
  osc.stop(now + p.dur + 0.01);

  // --- noise burst (white noise for the tactile "snap") ---
  const bufferLen = Math.ceil(ctx.sampleRate * p.noiseDur);
  const noiseBuffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferLen; i++) {
    channel[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;

  // Bandpass filter to shape the noise
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(jitter(3000, 800), now);
  filter.Q.setValueAtTime(1.2, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(p.noiseVol, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + p.noiseDur);

  noiseSrc.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noiseSrc.start(now);
  noiseSrc.stop(now + p.noiseDur + 0.01);
}

export interface UseKeystrokeSoundsOptions {
  /** Master volume 0-1, default 0.5 */
  volume?: number;
  /** Disable sounds entirely */
  muted?: boolean;
}

export function useKeystrokeSounds(opts: UseKeystrokeSoundsOptions = {}) {
  const { volume = 0.5, muted = false } = opts;
  const ctxRef = useRef<AudioContext | null>(null);

  // Lazily initialise on first interaction (required by autoplay policy)
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = getAudioCtx();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playKeystroke = useCallback(
    (key?: string) => {
      if (muted) return;
      try {
        const ctx = ensureCtx();
        const variant = classify(key);
        synthesize(ctx, variant, volume);
      } catch {
        // Silently ignore - audio is non-critical
      }
    },
    [muted, volume, ensureCtx]
  );

  // Cleanup: don't close the shared context, but drop the ref
  useEffect(() => {
    return () => {
      ctxRef.current = null;
    };
  }, []);

  return { playKeystroke };
}
