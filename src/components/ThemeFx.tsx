import { useEffect, useRef } from "react";

/**
 * Immersive theme FX engine v2 - enhanced.
 *
 * Each theme is a complete experience with layered audio, visual effects,
 * interactive behaviors, and hidden easter eggs.
 *
 * Audio: Web Audio API synthesized (zero asset files)
 * Visuals: DOM elements + CSS animations, created/destroyed on theme switch
 *
 * Architecture: theme switch -> cleanup old -> setup new (each returns cleanup fn)
 */

// Audio infrastructure

type GetCtx = () => AudioContext | null;

function createGetCtx(): { getCtx: GetCtx; cleanup: () => void } {
  let ctx: AudioContext | null = null;
  return {
    getCtx: () => {
      if (!ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    },
    cleanup: () => { ctx = null; },
  };
}

// Sound library

function swoosh(ctx: AudioContext, freq: number, type: OscillatorType) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * 0.6, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(freq, now + 0.25);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

/** Valorant: punchy gunshot - layered noise burst + sub bass + transient crack */
function gunshot(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Noise burst (the snap)
  const len = Math.ceil(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * 0.7;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.14, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  const nf = ctx.createBiquadFilter();
  nf.type = "highpass"; nf.frequency.setValueAtTime(1800, now);
  noise.connect(nf).connect(ng).connect(ctx.destination);
  noise.start(now); noise.stop(now + 0.06);
  // Sub bass
  const sub = ctx.createOscillator();
  sub.type = "sine"; sub.frequency.setValueAtTime(80, now);
  sub.frequency.exponentialRampToValueAtTime(25, now + 0.08);
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.18, now);
  sg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  sub.connect(sg).connect(ctx.destination);
  sub.start(now); sub.stop(now + 0.12);
  // Transient crack
  const crack = ctx.createOscillator();
  crack.type = "square"; crack.frequency.setValueAtTime(3500, now);
  crack.frequency.exponentialRampToValueAtTime(800, now + 0.012);
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.07, now);
  cg.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
  crack.connect(cg).connect(ctx.destination);
  crack.start(now); crack.stop(now + 0.025);
}

/** Valorant: ACE fanfare - ascending notes with reverb-like tail */
function aceFanfare(ctx: AudioContext) {
  const now = ctx.currentTime;
  [523, 659, 784, 1047, 1318].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.4);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.45);
  });
}

/** Valorant: spike planted alarm beep */
function spikeBeep(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine"; osc.frequency.setValueAtTime(880, now);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.18);
}

/** Arcane: crystalline hextech chime - 3 harmonics */
function hexChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  [1200, 2400, 3600].forEach((freq, i) => {
    const osc = ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime([0.06, 0.03, 0.015][i], now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + [0.3, 0.2, 0.15][i]);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.02);
    osc.stop(now + [0.3, 0.2, 0.15][i] + 0.02);
  });
}

/** Arcane: deep shimmer resonance */
function shimmerResonance(ctx: AudioContext) {
  const now = ctx.currentTime;
  [200, 400, 600, 800].forEach((freq, i) => {
    const osc = ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.05 + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, now + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.5);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.55);
  });
}

/** Pragmata: clean digital blip with harmonic */
function digitalBlip(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = "square";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.05, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.1);
  // harmonic tail
  const h = ctx.createOscillator(); h.type = "sine";
  h.frequency.setValueAtTime(1760, now + 0.03);
  const hg = ctx.createGain();
  hg.gain.setValueAtTime(0.02, now + 0.03);
  hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  h.connect(hg).connect(ctx.destination);
  h.start(now + 0.03); h.stop(now + 0.14);
}

/** Pragmata: radio static crackle */
function radioStatic(ctx: AudioContext, duration = 0.6) {
  const now = ctx.currentTime;
  const len = Math.ceil(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * 0.3;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass"; f.frequency.setValueAtTime(4000, now); f.Q.setValueAtTime(2, now);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.04, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(now); src.stop(now + duration + 0.01);
}

/** Pragmata: comms channel open chirp */
function commsChirp(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
  osc.frequency.setValueAtTime(1200, now + 0.06);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.04, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.12);
}

/** Cyberpunk: electric zap with buzz */
function electricZap(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(4000, now + 0.03);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.07, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.12);
  // secondary buzz
  const b = ctx.createOscillator(); b.type = "square";
  b.frequency.setValueAtTime(60, now + 0.02);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0.03, now + 0.02);
  bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  b.connect(bg).connect(ctx.destination);
  b.start(now + 0.02); b.stop(now + 0.1);
}

/** Cyberpunk: glitch distortion burst */
function glitchSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator(); osc.type = "square";
    osc.frequency.setValueAtTime(80 + Math.random() * 700, now + i * 0.035);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, now + i * 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.035 + 0.03);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.035); osc.stop(now + i * 0.035 + 0.035);
  }
}

/** Aurora: soft bell chime with shimmer */
function softChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const freq = 600 + Math.random() * 120;
  [freq, freq * 2, freq * 3].forEach((f, i) => {
    const osc = ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime([0.04, 0.02, 0.008][i], now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + [0.5, 0.35, 0.2][i]);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + [0.55, 0.4, 0.25][i]);
  });
}

/** Amber: terminal beep */
function terminalBeep(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = "square";
  osc.frequency.setValueAtTime(1000, now);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.04, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.04);
}

/** Amber: boot sequence ascending beeps */
function bootBeeps(ctx: AudioContext) {
  const now = ctx.currentTime;
  [400, 600, 800, 1200].forEach((freq, i) => {
    const osc = ctx.createOscillator(); osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, now + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.08);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.1);
  });
}

// DOM helpers

function createEl(tag: string, styles: Partial<CSSStyleDeclaration>): HTMLElement {
  const el = document.createElement(tag);
  Object.assign(el.style, styles);
  el.dataset.themefx = "1";
  return el;
}

function removeAllFxElements() {
  document.querySelectorAll("[data-themefx]").forEach((el) => el.remove());
}

function isInteractive(el: HTMLElement): boolean {
  return !!el.closest("button, a, [role='button'], input, .chakra-button, [tabindex]");
}

type SetupFn = (getCtx: GetCtx) => () => void;

// VALORANT - tactical shooter experience
// gunshot, hit markers, kill feed, spike plant, ACE

const setupValorant: SetupFn = (getCtx) => {
  const clickTimes: number[] = [];
  let killCount = 0;
  let spikeEl: HTMLElement | null = null;
  let spikeInterval: ReturnType<typeof setInterval> | null = null;

  const KILL_MESSAGES = [
    "target eliminated",
    "eliminated",
    "one down",
    "neutralized",
    "confirmed kill",
  ];

  function showKillFeed() {
    killCount++;
    const msg = KILL_MESSAGES[Math.floor(Math.random() * KILL_MESSAGES.length)];

    const feed = createEl("div", {
      position: "fixed",
      top: `${70 + ((killCount - 1) % 4) * 36}px`,
      right: "16px",
      padding: "6px 14px",
      borderRadius: "3px",
      background: "rgba(15, 25, 35, 0.92)",
      border: "1px solid rgba(255, 70, 85, 0.3)",
      borderLeft: "3px solid #ff4655",
      color: "#ece8e1",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "10px",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      pointerEvents: "none",
      zIndex: "10001",
      animation: "fx-killfeed-in 2.5s ease-out forwards",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });
    feed.innerHTML = `
      <span style="color: #ff4655; font-weight: 700;">✕</span>
      <span>${msg}</span>
      <span style="color: rgba(236,232,225,0.3); margin-left: 4px;">#${killCount}</span>
    `;
    document.body.appendChild(feed);
    setTimeout(() => feed.remove(), 2600);
  }

  function showSpike() {
    if (spikeEl) return;
    const ctx = getCtx();
    if (ctx) spikeBeep(ctx);

    spikeEl = createEl("div", {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      background: "#ff4655",
      animation: "fx-spike-pulse 1s ease-in-out infinite",
      pointerEvents: "none",
      zIndex: "10001",
    });

    const label = document.createElement("div");
    Object.assign(label.style, {
      position: "absolute",
      top: "-20px",
      left: "50%",
      transform: "translateX(-50%)",
      color: "#ff4655",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "8px",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      opacity: "0.7",
    });
    label.textContent = "SPIKE PLANTED";
    spikeEl.appendChild(label);
    document.body.appendChild(spikeEl);

    // Spike beeps accelerating
    let beepDelay = 1000;
    function nextBeep() {
      if (!spikeEl) return;
      const c = getCtx();
      if (c) spikeBeep(c);
      beepDelay = Math.max(200, beepDelay * 0.85);
      spikeInterval = setTimeout(nextBeep, beepDelay);
    }
    spikeInterval = setTimeout(nextBeep, beepDelay);

    // Auto-remove after 8s
    setTimeout(() => {
      if (spikeEl) { spikeEl.remove(); spikeEl = null; }
      if (spikeInterval) { clearTimeout(spikeInterval); spikeInterval = null; }
    }, 8000);
  }

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) gunshot(ctx);

    // Hit marker
    const marker = createEl("div", {
      position: "fixed",
      left: `${e.clientX - 12}px`,
      top: `${e.clientY - 12}px`,
      width: "24px",
      height: "24px",
      pointerEvents: "none",
      zIndex: "10000",
      animation: "fx-hit-marker 0.3s ease-out forwards",
    });
    marker.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
      <line x1="3" y1="3" x2="9" y2="9" stroke="#ff4655" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="15" y1="3" x2="21" y2="9" stroke="#ff4655" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="3" y1="21" x2="9" y2="15" stroke="#ff4655" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="15" y1="21" x2="21" y2="15" stroke="#ff4655" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
    document.body.appendChild(marker);
    setTimeout(() => marker.remove(), 350);

    // Kill feed
    showKillFeed();

    // Track for ACE (5 clicks in 3s)
    const now = Date.now();
    clickTimes.push(now);
    while (clickTimes.length > 5) clickTimes.shift();

    if (clickTimes.length === 5 && now - clickTimes[0] < 3000) {
      clickTimes.length = 0;
      // ACE!
      const ace = createEl("div", {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "80px",
        fontWeight: "900",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#ff4655",
        textShadow: "0 0 40px rgba(255, 70, 85, 0.6), 0 0 80px rgba(255, 70, 85, 0.3), 0 4px 20px rgba(0,0,0,0.5)",
        letterSpacing: "0.4em",
        pointerEvents: "none",
        zIndex: "10002",
        animation: "fx-ace-flash 1.5s ease-out forwards",
        userSelect: "none",
      });
      ace.textContent = "ACE";
      document.body.appendChild(ace);
      if (ctx) aceFanfare(ctx);

      // Edge flash
      const flash = createEl("div", {
        position: "fixed",
        top: "0", left: "0", right: "0", bottom: "0",
        pointerEvents: "none", zIndex: "10001",
        boxShadow: "inset 0 0 120px rgba(255, 70, 85, 0.2)",
        opacity: "1", transition: "opacity 1.2s ease-out",
      });
      document.body.appendChild(flash);
      requestAnimationFrame(() => { flash.style.opacity = "0"; });
      setTimeout(() => { ace.remove(); flash.remove(); }, 1600);

      // Spike plant after ACE
      setTimeout(showSpike, 2000);
    }
  };

  // Activation
  const ctx = getCtx();
  if (ctx) swoosh(ctx, 460, "square");

  window.addEventListener("click", onClick);
  return () => {
    window.removeEventListener("click", onClick);
    if (spikeInterval) clearTimeout(spikeInterval);
    spikeEl = null;
    removeAllFxElements();
  };
};

// ARCANE - hextech crystalline experience
// chimes, floating particles, hex ripple, POW POW

const setupArcane: SetupFn = (getCtx) => {
  const clickTimes: number[] = [];

  // Particle container
  const particles = createEl("div", {
    position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
    pointerEvents: "none", zIndex: "0", overflow: "hidden",
  });
  document.body.appendChild(particles);

  function spawnParticle() {
    const isGold = Math.random() > 0.45;
    const x = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 60;
    const size = 2 + Math.random() * 4;
    const duration = 7 + Math.random() * 7;
    const p = document.createElement("div");
    p.dataset.themefx = "1";
    Object.assign(p.style, {
      position: "absolute", bottom: "-10px", left: `${x}%`,
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      background: isGold
        ? "radial-gradient(circle, #ddc07a, #c8aa6e)"
        : "radial-gradient(circle, #6fcfff, #1e90ff)",
      boxShadow: isGold
        ? "0 0 8px rgba(200, 170, 110, 0.6)"
        : "0 0 8px rgba(30, 144, 255, 0.6)",
      animation: `fx-float-up ${duration}s linear forwards`,
      pointerEvents: "none",
    });
    p.style.setProperty("--fx-drift", `${drift}px`);
    particles.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000 + 100);
  }

  for (let i = 0; i < 10; i++) setTimeout(() => spawnParticle(), i * 400);
  const particleInterval = setInterval(spawnParticle, 2000);

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) hexChime(ctx);

    // Hexagonal ripple at click
    const hex = createEl("div", {
      position: "fixed",
      left: `${e.clientX - 24}px`, top: `${e.clientY - 24}px`,
      width: "48px", height: "48px",
      pointerEvents: "none", zIndex: "10000",
      animation: "fx-hex-ripple 0.6s ease-out forwards",
    });
    hex.innerHTML = `<svg width="48" height="48" viewBox="0 0 48 48">
      <polygon points="24,2 44,14 44,34 24,46 4,34 4,14" fill="none"
        stroke="rgba(30,144,255,0.5)" stroke-width="1.5"/>
      <polygon points="24,8 38,17 38,31 24,40 10,31 10,17" fill="none"
        stroke="rgba(200,170,110,0.3)" stroke-width="1"/>
    </svg>`;
    document.body.appendChild(hex);
    setTimeout(() => hex.remove(), 650);

    // Track for POW POW (3 rapid in 1.5s)
    const now = Date.now();
    clickTimes.push(now);
    while (clickTimes.length > 3) clickTimes.shift();
    if (clickTimes.length === 3 && now - clickTimes[0] < 1500) {
      clickTimes.length = 0;
      if (ctx) shimmerResonance(ctx);
      const pow = createEl("div", {
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "36px", fontWeight: "800",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#c8aa6e",
        textShadow: "0 0 24px rgba(200, 170, 110, 0.5), 0 0 50px rgba(30, 144, 255, 0.3)",
        pointerEvents: "none", zIndex: "10001",
        animation: "fx-ace-flash 1s ease-out forwards",
        userSelect: "none", letterSpacing: "0.15em",
      });
      pow.textContent = "POW POW!";
      document.body.appendChild(pow);
      setTimeout(() => pow.remove(), 1100);
    }
  };

  const ctx = getCtx();
  if (ctx) swoosh(ctx, 560, "sine");

  window.addEventListener("click", onClick);
  return () => {
    window.removeEventListener("click", onClick);
    clearInterval(particleInterval);
    removeAllFxElements();
  };
};

// PRAGMATA - deep space mission control
// companion hologram, HUD brackets, scan sweep, comms, transmission

const setupPragmata: SetupFn = (getCtx) => {
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let scanInterval: ReturnType<typeof setInterval> | null = null;
  let interferenceInterval: ReturnType<typeof setInterval> | null = null;
  let companionRAF: number | null = null;
  let transmissionShown = false;

  // HUD corner brackets
  const corners = [
    { top: "12px", left: "12px", borderTop: "2px solid", borderLeft: "2px solid" },
    { top: "12px", right: "12px", borderTop: "2px solid", borderRight: "2px solid" },
    { bottom: "12px", left: "12px", borderBottom: "2px solid", borderLeft: "2px solid" },
    { bottom: "12px", right: "12px", borderBottom: "2px solid", borderRight: "2px solid" },
  ];
  corners.forEach((pos) => {
    const bracket = createEl("div", {
      position: "fixed",
      width: "24px", height: "24px",
      pointerEvents: "none", zIndex: "10000",
      borderColor: "rgba(0, 212, 255, 0.2)",
      animation: "fx-hud-fadein 1s ease-out forwards",
      ...pos,
    });
    document.body.appendChild(bracket);
  });

  // Floating companion hologram
  const companion = createEl("div", {
    position: "fixed",
    width: "20px", height: "20px",
    pointerEvents: "none", zIndex: "9999",
    animation: "fx-companion-pulse 3s ease-in-out infinite",
    transition: "left 0.4s ease-out, top 0.4s ease-out",
    left: "-100px", top: "-100px",
  });
  companion.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" style="animation: fx-companion-rotate 8s linear infinite;">
    <polygon points="10,1 18,6 18,14 10,19 2,14 2,6" fill="none"
      stroke="rgba(0,212,255,0.5)" stroke-width="1"/>
    <polygon points="10,5 14,8 14,12 10,15 6,12 6,8" fill="none"
      stroke="rgba(0,212,255,0.3)" stroke-width="0.5"/>
    <circle cx="10" cy="10" r="1.5" fill="rgba(0,212,255,0.6)"/>
  </svg>`;
  document.body.appendChild(companion);

  // Companion follows cursor with delay
  let mouseX = -100, mouseY = -100;
  let compX = -100, compY = -100;

  function updateCompanion() {
    compX += (mouseX + 30 - compX) * 0.06;
    compY += (mouseY - 20 - compY) * 0.06;
    companion.style.left = `${compX}px`;
    companion.style.top = `${compY}px`;
    companionRAF = requestAnimationFrame(updateCompanion);
  }
  companionRAF = requestAnimationFrame(updateCompanion);

  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    resetIdle();
  };

  // Coordinate readout near cursor
  const coordLabel = createEl("div", {
    position: "fixed",
    pointerEvents: "none", zIndex: "9998",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "8px",
    color: "rgba(0, 212, 255, 0.25)",
    letterSpacing: "0.05em",
    left: "-100px", top: "-100px",
    transition: "left 0.3s ease-out, top 0.3s ease-out",
  });
  document.body.appendChild(coordLabel);

  let coordFrame = 0;
  const onMouseMoveCoord = (e: MouseEvent) => {
    coordFrame++;
    if (coordFrame % 6 !== 0) return; // throttle
    coordLabel.style.left = `${e.clientX + 24}px`;
    coordLabel.style.top = `${e.clientY + 16}px`;
    coordLabel.textContent = `${e.clientX.toString().padStart(4, "0")} : ${e.clientY.toString().padStart(4, "0")}`;
  };

  // Scan sweep
  function doScanSweep() {
    const line = createEl("div", {
      position: "fixed", left: "0", right: "0", height: "2px",
      background: "linear-gradient(90deg, transparent 5%, rgba(0, 212, 255, 0.4) 30%, rgba(0, 212, 255, 0.8) 50%, rgba(0, 212, 255, 0.4) 70%, transparent 95%)",
      boxShadow: "0 0 12px rgba(0, 212, 255, 0.25), 0 0 2px rgba(0, 212, 255, 0.5)",
      pointerEvents: "none", zIndex: "10000",
      animation: "fx-scan-sweep 3s linear forwards",
    });
    document.body.appendChild(line);
    const ctx = getCtx();
    if (ctx) commsChirp(ctx);
    setTimeout(() => line.remove(), 3200);
  }

  // Signal interference
  function doInterference() {
    const band = createEl("div", {
      position: "fixed", left: "0", right: "0", height: "4px",
      background: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 212, 255, 0.08) 2px, rgba(0, 212, 255, 0.08) 4px)",
      pointerEvents: "none", zIndex: "10000",
      animation: "fx-signal-interference 1.5s linear forwards",
      opacity: "0.5",
    });
    document.body.appendChild(band);
    const ctx = getCtx();
    if (ctx) radioStatic(ctx, 0.2);
    setTimeout(() => band.remove(), 1600);
  }

  // Transmission notification
  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(showTransmission, 30000);
  }

  function showTransmission() {
    if (transmissionShown) return;
    transmissionShown = true;
    const ctx = getCtx();
    if (ctx) { commsChirp(ctx); setTimeout(() => radioStatic(getCtx()!, 0.3), 150); }

    const notif = createEl("div", {
      position: "fixed", top: "80px", right: "20px",
      padding: "14px 20px", borderRadius: "4px",
      border: "1px solid rgba(0, 212, 255, 0.3)",
      background: "rgba(5, 5, 8, 0.92)",
      backdropFilter: "blur(10px)",
      color: "#00d4ff",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11px", letterSpacing: "0.08em",
      pointerEvents: "none", zIndex: "10001",
      animation: "fx-transmission-in 8s ease-in-out forwards",
      boxShadow: "0 0 24px rgba(0, 212, 255, 0.12), inset 0 0 20px rgba(0, 212, 255, 0.03)",
      maxWidth: "280px",
    });
    notif.innerHTML = `
      <div style="color: rgba(232, 232, 240, 0.4); font-size: 9px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.14em;">
        <span style="color: rgba(0, 212, 255, 0.6);">▸</span> INCOMING TRANSMISSION
      </div>
      <div style="color: #e8e8f0; margin-bottom: 4px;">Signal acquired · sector 7G</div>
      <div style="color: rgba(0, 212, 255, 0.4); font-size: 9px; margin-bottom: 2px;">freq: 2.4GHz · str: ████░░ · lat: ██.████</div>
      <div style="color: rgba(232, 232, 240, 0.2); font-size: 9px; border-top: 1px solid rgba(0, 212, 255, 0.1); padding-top: 6px; margin-top: 6px;">
        "The stars are not yet ready."
      </div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 8200);
  }

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) digitalBlip(ctx);
    resetIdle();
  };

  // Activation
  const ctx = getCtx();
  if (ctx) {
    swoosh(ctx, 680, "sine");
    setTimeout(() => { const c = getCtx(); if (c) radioStatic(c, 0.3); }, 300);
  }

  // Periodic effects
  scanInterval = setInterval(doScanSweep, 22000 + Math.random() * 8000);
  interferenceInterval = setInterval(doInterference, 35000 + Math.random() * 15000);
  setTimeout(doScanSweep, 2500);
  resetIdle();

  window.addEventListener("click", onClick);
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("mousemove", onMouseMoveCoord, { passive: true });

  return () => {
    window.removeEventListener("click", onClick);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mousemove", onMouseMoveCoord);
    if (idleTimer) clearTimeout(idleTimer);
    if (scanInterval) clearInterval(scanInterval);
    if (interferenceInterval) clearInterval(interferenceInterval);
    if (companionRAF) cancelAnimationFrame(companionRAF);
    removeAllFxElements();
  };
};

// CYBERPUNK - neon dystopia
// zap clicks, glitch bursts, data rain, BREACH DETECTED

const setupCyberpunk: SetupFn = (getCtx) => {
  let glitchInterval: ReturnType<typeof setInterval> | null = null;
  let dataRainInterval: ReturnType<typeof setInterval> | null = null;
  const clickTimes: number[] = [];

  // Data rain column
  const rainCol = createEl("div", {
    position: "fixed", top: "0", right: "40px",
    width: "14px",
    overflow: "hidden",
    pointerEvents: "none", zIndex: "0",
    height: "100vh", opacity: "0.12",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px", lineHeight: "1.2",
    color: "#00f0ff",
  });
  document.body.appendChild(rainCol);

  const HEX_CHARS = "0123456789ABCDEF";
  function addRainChar() {
    const ch = document.createElement("div");
    ch.textContent = HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
    ch.style.color = Math.random() > 0.7 ? "#fcee0a" : "#00f0ff";
    ch.style.opacity = (0.3 + Math.random() * 0.7).toString();
    rainCol.appendChild(ch);
    // Keep only last 80 characters
    while (rainCol.children.length > 80) rainCol.removeChild(rainCol.firstChild!);
  }
  dataRainInterval = setInterval(addRainChar, 120);

  function doGlitch() {
    const ctx = getCtx();
    if (ctx) glitchSound(ctx);
    const overlay = createEl("div", {
      position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
      pointerEvents: "none", zIndex: "10000",
      background: "rgba(252, 238, 10, 0.03)",
      mixBlendMode: "difference",
      animation: "fx-glitch 0.2s steps(6) forwards",
    });
    const rSplit = createEl("div", {
      position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
      pointerEvents: "none", zIndex: "10000",
      boxShadow: "inset 4px 0 0 rgba(0, 240, 255, 0.1), inset -4px 0 0 rgba(252, 238, 10, 0.1)",
      opacity: "1", transition: "opacity 0.2s",
    });
    document.body.appendChild(overlay);
    document.body.appendChild(rSplit);
    setTimeout(() => { rSplit.style.opacity = "0"; }, 60);
    setTimeout(() => { overlay.remove(); rSplit.remove(); }, 250);
  }

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) electricZap(ctx);

    // Neon spark at click
    const spark = createEl("div", {
      position: "fixed",
      left: `${e.clientX - 3}px`, top: `${e.clientY - 3}px`,
      width: "6px", height: "6px", borderRadius: "50%",
      background: "#fcee0a",
      boxShadow: "0 0 8px #fcee0a, 0 0 16px rgba(0, 240, 255, 0.3)",
      pointerEvents: "none", zIndex: "10000",
      opacity: "1", transform: "scale(1)",
      transition: "all 0.3s ease-out",
    });
    document.body.appendChild(spark);
    requestAnimationFrame(() => { spark.style.transform = "scale(3)"; spark.style.opacity = "0"; });
    setTimeout(() => spark.remove(), 350);

    // Track for BREACH DETECTED (4 rapid in 2s)
    const now = Date.now();
    clickTimes.push(now);
    while (clickTimes.length > 4) clickTimes.shift();
    if (clickTimes.length === 4 && now - clickTimes[0] < 2000) {
      clickTimes.length = 0;
      doGlitch();
      const breach = createEl("div", {
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "28px", fontWeight: "900",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#fcee0a",
        textShadow: "0 0 12px rgba(252, 238, 10, 0.6), 0 0 40px rgba(0, 240, 255, 0.3), 2px 2px 0 rgba(0, 240, 255, 0.2), -2px -2px 0 rgba(252, 238, 10, 0.2)",
        pointerEvents: "none", zIndex: "10002",
        animation: "fx-ace-flash 1.5s ease-out forwards",
        userSelect: "none", letterSpacing: "0.2em", textTransform: "uppercase",
      });
      breach.textContent = "// BREACH DETECTED";
      document.body.appendChild(breach);
      setTimeout(() => breach.remove(), 1600);
    }
  };

  const ctx = getCtx();
  if (ctx) swoosh(ctx, 380, "sawtooth");
  glitchInterval = setInterval(doGlitch, 25000 + Math.random() * 20000);

  window.addEventListener("click", onClick);
  return () => {
    window.removeEventListener("click", onClick);
    if (glitchInterval) clearInterval(glitchInterval);
    if (dataRainInterval) clearInterval(dataRainInterval);
    removeAllFxElements();
  };
};

// EVERGREEN - deep forest + sage green (clean, no FX)

const setupEvergreen: SetupFn = (getCtx) => {
  const ctx = getCtx();
  if (ctx) swoosh(ctx, 500, "sine");
  return () => {};
};

// ROSÉ PINE - soft rose aesthetic (clean, no FX)

const setupRosepine: SetupFn = (getCtx) => {
  const ctx = getCtx();
  if (ctx) swoosh(ctx, 580, "sine");
  return () => {};
};

// GRUVBOX - warm yellow retro (clean, no FX)

const setupGruvbox: SetupFn = (getCtx) => {
  const ctx = getCtx();
  if (ctx) swoosh(ctx, 440, "triangle");
  return () => {};
};

// AURORA - northern lights serenity
// bell chimes, shooting stars, cursor sparkles

const setupAurora: SetupFn = (getCtx) => {
  let starInterval: ReturnType<typeof setInterval> | null = null;

  function shootingStar() {
    const x = 15 + Math.random() * 65;
    const y = 3 + Math.random() * 20;
    const star = createEl("div", {
      position: "fixed", left: `${x}%`, top: `${y}%`,
      height: "2px", width: "2px",
      background: "linear-gradient(90deg, rgba(34, 211, 238, 0.9), rgba(52, 211, 153, 0.4), transparent)",
      borderRadius: "1px",
      boxShadow: "0 0 6px rgba(34, 211, 238, 0.5), 0 0 2px white",
      pointerEvents: "none", zIndex: "1",
      animation: "fx-shooting-star-long 1.8s linear forwards",
    });
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 1900);
  }

  let lastSparkle = 0;
  const onMouseMove = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastSparkle < 120) return;
    lastSparkle = now;
    if (Math.random() > 0.35) return;

    const sparkle = createEl("div", {
      position: "fixed",
      left: `${e.clientX + (Math.random() - 0.5) * 24}px`,
      top: `${e.clientY + (Math.random() - 0.5) * 24}px`,
      width: "3px", height: "3px", borderRadius: "50%",
      background: Math.random() > 0.5 ? "#22d3ee" : "#34d399",
      boxShadow: `0 0 6px ${Math.random() > 0.5 ? "rgba(34,211,238,0.5)" : "rgba(52,211,153,0.5)"}`,
      pointerEvents: "none", zIndex: "1",
      opacity: "0.8", transition: "all 1s ease-out",
    });
    document.body.appendChild(sparkle);
    requestAnimationFrame(() => {
      sparkle.style.opacity = "0";
      sparkle.style.transform = `translateY(-25px) scale(0)`;
    });
    setTimeout(() => sparkle.remove(), 1100);
  };

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) softChime(ctx);
  };

  const ctx = getCtx();
  if (ctx) swoosh(ctx, 600, "sine");

  starInterval = setInterval(shootingStar, 15000 + Math.random() * 15000);
  setTimeout(shootingStar, 4000);

  window.addEventListener("click", onClick);
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  return () => {
    window.removeEventListener("click", onClick);
    window.removeEventListener("mousemove", onMouseMove);
    if (starInterval) clearInterval(starInterval);
    removeAllFxElements();
  };
};

// AMBER CRT - retro terminal nostalgia
// beeps, boot sequence, scanlines, CRT flicker, phosphor afterglow

const setupAmber: SetupFn = (getCtx) => {
  let flickerInterval: ReturnType<typeof setInterval> | null = null;

  function showBoot() {
    const ctx = getCtx();
    if (ctx) bootBeeps(ctx);

    const boot = createEl("div", {
      position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
      background: "rgba(10, 7, 0, 0.96)",
      pointerEvents: "none", zIndex: "10001",
      display: "flex", alignItems: "flex-start", justifyContent: "flex-start",
      padding: "40px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "#ffb000",
      opacity: "1", transition: "opacity 0.8s ease-out",
    });
    const lines = [
      "BIOS v1.0.3 · 640K CONVENTIONAL MEMORY",
      "CHECKING HARDWARE ···· OK",
      "CHECKING DISPLAY ····· OK",
      "LOADING portfolio.sys ···· OK",
      `DATE: ${new Date().toLocaleDateString()} · ${new Date().toLocaleTimeString()}`,
      "",
      "C:\\> READY._",
    ];
    const textBox = document.createElement("pre");
    textBox.style.cssText = "margin:0;line-height:1.8;color:#ffb000;text-shadow:0 0 6px rgba(255,176,0,0.35);";
    boot.appendChild(textBox);
    document.body.appendChild(boot);

    let lineIdx = 0, charIdx = 0, displayed = "";
    function type() {
      if (lineIdx >= lines.length) {
        setTimeout(() => { boot.style.opacity = "0"; setTimeout(() => boot.remove(), 800); }, 700);
        return;
      }
      const cur = lines[lineIdx];
      if (charIdx < cur.length) {
        displayed += cur[charIdx]; charIdx++;
        textBox.textContent = displayed + "█";
        if (ctx && charIdx % 3 === 0) terminalBeep(ctx); // typing clicks
        setTimeout(type, 20 + Math.random() * 20);
      } else {
        displayed += "\n"; lineIdx++; charIdx = 0;
        textBox.textContent = displayed + "█";
        setTimeout(type, 180);
      }
    }
    setTimeout(type, 400);
  }

  function doFlicker() {
    const overlay = createEl("div", {
      position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
      pointerEvents: "none", zIndex: "9999",
      background: "rgba(10, 7, 0, 0.12)",
      animation: "fx-crt-flicker 0.3s linear forwards",
    });
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 350);
  }

  // Phosphor afterglow trail on mouse
  let lastGlow = 0;
  const onMouseMove = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastGlow < 60) return;
    lastGlow = now;
    const glow = createEl("div", {
      position: "fixed",
      left: `${e.clientX - 4}px`, top: `${e.clientY - 4}px`,
      width: "8px", height: "8px", borderRadius: "50%",
      background: "rgba(255, 176, 0, 0.15)",
      pointerEvents: "none", zIndex: "1",
      animation: "fx-phosphor-fade 0.6s ease-out forwards",
    });
    document.body.appendChild(glow);
    setTimeout(() => glow.remove(), 650);
  };

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) terminalBeep(ctx);
  };

  showBoot();
  flickerInterval = setInterval(doFlicker, 12000 + Math.random() * 18000);

  window.addEventListener("click", onClick);
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  return () => {
    window.removeEventListener("click", onClick);
    window.removeEventListener("mousemove", onMouseMove);
    if (flickerInterval) clearInterval(flickerInterval);
    removeAllFxElements();
  };
};

// INDIGO - clean default, minimal

const setupIndigo: SetupFn = (getCtx) => {
  const ctx = getCtx();
  if (ctx) swoosh(ctx, 520, "sine");
  return () => {};
};

// Registry + main component

const THEME_FX: Record<string, SetupFn> = {
  indigo: setupIndigo,
  rosepine: setupRosepine,
  gruvbox: setupGruvbox,
  evergreen: setupEvergreen,
  cyberpunk: setupCyberpunk,
  aurora: setupAurora,
  amber: setupAmber,
  valorant: setupValorant,
  arcane: setupArcane,
  pragmata: setupPragmata,
};

const ThemeFx = () => {
  const cleanupRef = useRef<(() => void) | null>(null);
  const prevThemeRef = useRef<string | null>(null);
  const audioRef = useRef<ReturnType<typeof createGetCtx> | null>(null);

  useEffect(() => {
    audioRef.current = createGetCtx();

    const activate = (key: string, isInitial: boolean) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      removeAllFxElements();

      if (isInitial) { prevThemeRef.current = key; return; }

      const setup = THEME_FX[key];
      if (setup && audioRef.current) {
        cleanupRef.current = setup(audioRef.current.getCtx);
      }
      prevThemeRef.current = key;
    };

    const onThemeChange = (e: Event) => {
      const key = (e as CustomEvent).detail as string;
      if (key === prevThemeRef.current) return;
      activate(key, false);
    };

    const initial = document.body.dataset.theme || "indigo";
    activate(initial, true);

    window.addEventListener("themechange", onThemeChange);
    return () => {
      window.removeEventListener("themechange", onThemeChange);
      if (cleanupRef.current) cleanupRef.current();
      removeAllFxElements();
      if (audioRef.current) audioRef.current.cleanup();
    };
  }, []);

  return null;
};

export default ThemeFx;
