import { useEffect, useRef } from "react";
import { isFxMuted } from "../lib/fx";
import { DEFAULT_THEME } from "../themes/palettes";
import {
  bell, blip8, bootBeeps, electricZap, glitchSound, mallet, nextNote, pluck, swoosh,
  terminalBeep, thump, typeClick,
} from "../lib/sound";

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
      if (isFxMuted()) return null;
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

/** True while a setup runs for the theme restored on page load (not a user switch). */
let initialRun = false;

// VALORANT - tactical shooter experience
// gunshot, hit markers, kill feed, spike plant, ACE

// TOKYO NIGHT - midnight city ambience
// soft chime clicks, drifting city-light twinkles

const setupTokyonight: SetupFn = (getCtx) => {
  let twinkleInterval: ReturnType<typeof setInterval> | null = null;

  function twinkle() {
    const magenta = Math.random() > 0.6;
    const size = 2 + Math.random() * 2;
    const dot = createEl("div", {
      position: "fixed",
      left: `${5 + Math.random() * 90}%`,
      top: `${45 + Math.random() * 47}%`,
      width: `${size}px`, height: `${size}px`,
      borderRadius: "50%",
      background: magenta ? "#bb9af7" : "#7aa2f7",
      boxShadow: magenta
        ? "0 0 8px rgba(187, 154, 247, 0.7)"
        : "0 0 8px rgba(122, 162, 247, 0.7)",
      pointerEvents: "none", zIndex: "1",
      animation: "fx-twinkle 2.2s ease-out forwards",
    });
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 2300);
  }

  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!isInteractive(t)) return;
    const ctx = getCtx();
    if (ctx) bell(ctx, nextNote("tokyonight", 69, "japanese"), 0.045);
  };

  const ctx = getCtx();
  if (ctx) swoosh(ctx, 540, "sine");

  for (let i = 0; i < 5; i++) setTimeout(twinkle, i * 500);
  twinkleInterval = setInterval(twinkle, 2600 + Math.random() * 1600);

  window.addEventListener("click", onClick);
  return () => {
    window.removeEventListener("click", onClick);
    if (twinkleInterval) clearInterval(twinkleInterval);
    removeAllFxElements();
  };
};

// CYBERPUNK - neon dystopia
// zap clicks, glitch bursts, data rain, BREACH DETECTED

const setupCyberpunk: SetupFn = (getCtx) => {
  let glitchInterval: ReturnType<typeof setInterval> | null = null;
  const rainIntervals: ReturnType<typeof setInterval>[] = [];
  const clickTimes: number[] = [];

  const HEX_CHARS = "0123456789ABCDEF";

  // Data rain - a few columns at varying depth for a live-terminal backdrop
  const RAIN_COLS: { pos: Partial<CSSStyleDeclaration>; opacity: string; speed: number }[] = [
    { pos: { right: "40px" }, opacity: "0.13", speed: 110 },
    { pos: { right: "92px" }, opacity: "0.07", speed: 175 },
    { pos: { left: "32px" }, opacity: "0.09", speed: 140 },
  ];
  RAIN_COLS.forEach(({ pos, opacity, speed }) => {
    const col = createEl("div", {
      position: "fixed", top: "0",
      width: "14px", overflow: "hidden",
      pointerEvents: "none", zIndex: "0",
      height: "100vh", opacity,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "10px", lineHeight: "1.2",
      color: "#00f0ff",
      ...pos,
    });
    document.body.appendChild(col);
    const tick = () => {
      const ch = document.createElement("div");
      ch.textContent = HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
      ch.style.color = Math.random() > 0.7 ? "#fcee0a" : "#00f0ff";
      ch.style.opacity = (0.3 + Math.random() * 0.7).toString();
      col.appendChild(ch);
      while (col.children.length > 80) col.removeChild(col.firstChild!);
    };
    rainIntervals.push(setInterval(tick, speed));
  });

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
    if (ctx) electricZap(ctx, nextNote("cyberpunk", 76, "minor"));

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
    rainIntervals.forEach((id) => clearInterval(id));
    removeAllFxElements();
  };
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
    if (ctx) bell(ctx, nextNote("aurora", 72, "major"), 0.045);
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
  const bootTimers = new Set<ReturnType<typeof setTimeout>>();
  let boot: HTMLElement | null = null;
  let dismissBoot = () => {};

  const scheduleBoot = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      bootTimers.delete(timer);
      callback();
    }, delay);
    bootTimers.add(timer);
    return timer;
  };

  const onBootKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && boot?.isConnected) dismissBoot();
  };

  function showBoot() {
    const ctx = getCtx();
    if (ctx) bootBeeps(ctx);

    boot = createEl("div", {
      position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
      background: "rgba(10, 7, 0, 0.96)",
      pointerEvents: "auto", zIndex: "10001",
      display: "flex", alignItems: "flex-start", justifyContent: "flex-start",
      padding: "40px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "#ffb000",
      opacity: "1", transition: "opacity 0.8s ease-out",
    });
    dismissBoot = () => {
      if (!boot?.isConnected) return;
      for (const timer of bootTimers) clearTimeout(timer);
      bootTimers.clear();
      boot.style.transition = "opacity 180ms ease-out";
      boot.style.opacity = "0";
      scheduleBoot(() => boot?.remove(), 190);
    };
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
    const skip = createEl("button", {
      position: "absolute", top: "20px", right: "20px", padding: "8px 12px",
      border: "1px solid rgba(255,176,0,.4)", borderRadius: "4px",
      background: "rgba(255,176,0,.08)", color: "#ffcf66", cursor: "pointer",
      font: "12px 'JetBrains Mono', monospace",
    }) as HTMLButtonElement;
    skip.type = "button";
    skip.textContent = "Skip intro · Esc";
    skip.setAttribute("aria-label", "Skip Amber CRT intro");
    skip.addEventListener("click", (event) => {
      event.stopPropagation();
      dismissBoot();
    });
    boot.appendChild(skip);
    document.body.appendChild(boot);

    let lineIdx = 0, charIdx = 0, displayed = "";
    function type() {
      if (lineIdx >= lines.length) {
        scheduleBoot(() => dismissBoot(), 700);
        return;
      }
      const cur = lines[lineIdx];
      if (charIdx < cur.length) {
        displayed += cur[charIdx]; charIdx++;
        textBox.textContent = displayed + "█";
        if (ctx && charIdx % 3 === 0) terminalBeep(ctx); // typing clicks
        scheduleBoot(type, 20 + Math.random() * 20);
      } else {
        displayed += "\n"; lineIdx++; charIdx = 0;
        textBox.textContent = displayed + "█";
        scheduleBoot(type, 180);
      }
    }
    scheduleBoot(type, 400);
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

  // Page reloads skip the boot screen; it only plays when you switch to Amber.
  if (!initialRun) {
    showBoot();
    window.addEventListener("keydown", onBootKeyDown);
  }
  flickerInterval = setInterval(doFlicker, 12000 + Math.random() * 18000);

  window.addEventListener("click", onClick);
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  return () => {
    window.removeEventListener("click", onClick);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("keydown", onBootKeyDown);
    for (const timer of bootTimers) clearTimeout(timer);
    bootTimers.clear();
    if (flickerInterval) clearInterval(flickerInterval);
    removeAllFxElements();
  };
};

// INDIGO - clean default, minimal

// Minimal + dark themes: lighter touch than the immersive set, but every
// theme now reacts to clicks and has a small ambient layer.

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTyping = (el: HTMLElement) => !!el.closest("input, textarea, select, [contenteditable='true']");

/** One-shot particle burst at a point, animated with WAAPI (no CSS keyframes needed). */
function burst(x: number, y: number, colors: string[], opts: { n?: number; square?: boolean; spread?: number; size?: number; gravity?: number } = {}) {
  if (reducedMotion()) return;
  const n = opts.n ?? 10;
  for (let i = 0; i < n; i++) {
    const size = (opts.size ?? 5) * (0.6 + Math.random() * 0.8);
    const el = createEl("div", {
      position: "fixed", left: `${x - size / 2}px`, top: `${y - size / 2}px`,
      width: `${size}px`, height: `${size}px`, borderRadius: opts.square ? "1px" : "50%",
      background: colors[i % colors.length], pointerEvents: "none", zIndex: "9998",
    });
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2;
    const r = (opts.spread ?? 50) * (0.5 + Math.random() * 0.8);
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r + (opts.gravity ?? 0);
    el.animate(
      [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 }],
      { duration: 650 + Math.random() * 300, easing: "cubic-bezier(.16,1,.3,1)" }
    ).onfinish = () => el.remove();
  }
}

function ripple(x: number, y: number, color: string, max = 90, width = 2) {
  if (reducedMotion()) return;
  const el = createEl("div", {
    position: "fixed", left: `${x}px`, top: `${y}px`, width: "0px", height: "0px",
    border: `${width}px solid ${color}`, borderRadius: "50%", pointerEvents: "none", zIndex: "9998",
    transform: "translate(-50%, -50%)",
  });
  document.body.appendChild(el);
  el.animate(
    [{ width: "0px", height: "0px", opacity: 0.9 }, { width: `${max}px`, height: `${max}px`, opacity: 0 }],
    { duration: 600, easing: "ease-out" }
  ).onfinish = () => el.remove();
}

/** Something drifting across the viewport: leaves, petals, embers. */
function drifter(opts: { char?: string; color: string; size: number; fromTop: boolean; duration: number; sway: number; glow?: string }) {
  if (reducedMotion() || document.hidden) return;
  const x = Math.random() * 100;
  const el = createEl("div", {
    position: "fixed", left: `${x}vw`, top: opts.fromTop ? "-30px" : "auto", bottom: opts.fromTop ? "auto" : "-20px",
    fontSize: `${opts.size}px`, width: opts.char ? "auto" : `${opts.size}px`, height: opts.char ? "auto" : `${opts.size}px`,
    borderRadius: "50%", background: opts.char ? "transparent" : opts.color, color: opts.color,
    boxShadow: opts.glow || "none", pointerEvents: "none", zIndex: "1", opacity: "0.75", userSelect: "none",
  });
  if (opts.char) el.textContent = opts.char;
  document.body.appendChild(el);
  const dir = opts.fromTop ? 1 : -1;
  const sway = (Math.random() - 0.5) * opts.sway;
  el.animate(
    [
      { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
      { opacity: 0.75, offset: 0.1 },
      { transform: `translate(${sway}px, ${dir * 55}vh) rotate(${dir * 180}deg)`, opacity: 0.6, offset: 0.5 },
      { transform: `translate(${-sway / 2}px, ${dir * 112}vh) rotate(${dir * 360}deg)`, opacity: 0 },
    ],
    { duration: opts.duration * (0.8 + Math.random() * 0.4), easing: "linear" }
  ).onfinish = () => el.remove();
}

interface LiteSpec {
  intro: (ctx: AudioContext) => void;
  onClick: (x: number, y: number, interactive: boolean, ctx: AudioContext | null) => void;
  ambient?: () => void;
  ambientEvery?: number;
}

/** Shared lifecycle so each lite theme is just a spec. */
function liteTheme(spec: LiteSpec): SetupFn {
  return (getCtx) => {
    const ctx = getCtx();
    if (ctx) spec.intro(ctx);
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (isTyping(t)) return;
      const interactive = isInteractive(t);
      spec.onClick(e.clientX, e.clientY, interactive, interactive ? getCtx() : null);
    };
    window.addEventListener("click", onClick);
    let iv: ReturnType<typeof setInterval> | null = null;
    if (spec.ambient) {
      for (let i = 0; i < 3; i++) setTimeout(spec.ambient, 400 + i * 900);
      iv = setInterval(spec.ambient, spec.ambientEvery ?? 3500);
    }
    return () => {
      window.removeEventListener("click", onClick);
      if (iv) clearInterval(iv);
      removeAllFxElements();
    };
  };
}

const setupIndigo = liteTheme({
  intro: (ctx) => swoosh(ctx, 520, "sine"),
  onClick: (x, y, i, ctx) => {
    ripple(x, y, "rgba(129,140,248,.7)", 70);
    if (ctx) mallet(ctx, nextNote("indigo", 72, "major"), 0.05);
    if (i) burst(x, y, ["#818cf8", "#a5b4fc"], { n: 6, spread: 30, size: 4 });
  },
});

const setupRosepine = liteTheme({
  intro: (ctx) => swoosh(ctx, 480, "sine"),
  onClick: (x, y, _i, ctx) => {
    burst(x, y, ["#ebbcba", "#c4a7e7", "#f6c177"], { n: 9, spread: 45, size: 6, gravity: 25 });
    if (ctx) bell(ctx, nextNote("rosepine", 74, "major"), 0.04);
  },
  ambient: () => drifter({ char: "❀", color: "rgba(235,188,186,.55)", size: 12 + Math.random() * 8, fromTop: true, duration: 16000, sway: 160 }),
  ambientEvery: 4200,
});

const setupGruvbox = liteTheme({
  intro: (ctx) => blip8(ctx),
  onClick: (x, y, _i, ctx) => {
    burst(x, y, ["#fabd2f", "#fe8019", "#b8bb26", "#fb4934"], { n: 12, spread: 55, size: 6, square: true, gravity: 30 });
    if (ctx) blip8(ctx, nextNote("gruvbox", 69, "minor"));
  },
});

const setupEvergreen = liteTheme({
  intro: (ctx) => mallet(ctx, 392, 0.05),
  onClick: (x, y, _i, ctx) => {
    burst(x, y, ["#86efac", "#4ade80", "#bbf7d0"], { n: 8, spread: 40, size: 5, gravity: 30 });
    if (ctx) mallet(ctx, nextNote("evergreen", 67, "major"), 0.055);
  },
  ambient: () => drifter({ char: "🍃", color: "#86efac", size: 13 + Math.random() * 6, fromTop: true, duration: 18000, sway: 220 }),
  ambientEvery: 5200,
});

const setupSolarized = liteTheme({
  intro: (ctx) => { mallet(ctx, 440, 0.04); setTimeout(() => mallet(ctx, 660, 0.035), 90); },
  onClick: (x, y, _i, ctx) => {
    ripple(x, y, "rgba(181,137,0,.8)", 80, 2);
    setTimeout(() => ripple(x, y, "rgba(42,161,152,.7)", 120, 1), 90);
    if (ctx) mallet(ctx, nextNote("solarized", 69, "dorian"), 0.05);
  },
});

const setupSunset = liteTheme({
  intro: (ctx) => { [262, 330, 392].forEach((f, i) => setTimeout(() => pluck(ctx, f, "sine", 0.03), i * 110)); },
  onClick: (x, y, _i, ctx) => {
    burst(x, y, ["#ff7a59", "#ffb199", "#c77dff"], { n: 10, spread: 50, size: 5, gravity: -40 });
    if (ctx) pluck(ctx, nextNote("sunset", 64, "dorian"), "sine", 0.05);
  },
  ambient: () => drifter({ color: Math.random() > 0.5 ? "#ff7a59" : "#ffb199", size: 3 + Math.random() * 3, fromTop: false, duration: 12000, sway: 120, glow: "0 0 8px rgba(255,122,89,.7)" }),
  ambientEvery: 1800,
});

const setupMono = liteTheme({
  intro: (ctx) => typeClick(ctx),
  onClick: (x, y, _i, ctx) => {
    const ink = document.body.dataset.mode === "light" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.6)";
    ripple(x, y, ink, 60, 1);
    if (ctx) typeClick(ctx);
  },
});

const setupCrimson: SetupFn = (getCtx) => {
  const base = liteTheme({
    intro: (ctx) => thump(ctx),
    onClick: (x, y, _i, ctx) => {
      ripple(x, y, "rgba(239,68,68,.85)", 110, 3);
      burst(x, y, ["#ef4444", "#f87171"], { n: 6, spread: 35, size: 4 });
      if (ctx) thump(ctx);
    },
  })(getCtx);
  // slow heartbeat vignette
  const vignette = createEl("div", {
    position: "fixed", inset: "0", pointerEvents: "none", zIndex: "0",
    boxShadow: "inset 0 0 160px rgba(239,68,68,.0)", transition: "box-shadow .35s ease",
  });
  document.body.appendChild(vignette);
  const beat = () => {
    if (reducedMotion()) return;
    vignette.style.boxShadow = "inset 0 0 160px rgba(239,68,68,.22)";
    setTimeout(() => { vignette.style.boxShadow = "inset 0 0 160px rgba(239,68,68,0)"; }, 380);
  };
  const iv = setInterval(beat, 5200);
  return () => { clearInterval(iv); base(); };
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
  tokyonight: setupTokyonight,
  solarized: setupSolarized,
  sunset: setupSunset,
  mono: setupMono,
  crimson: setupCrimson,
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

      const setup = THEME_FX[key];
      if (setup && audioRef.current) {
        const audio = audioRef.current;
        let silent = isInitial;
        if (silent) setTimeout(() => { silent = false; }, 800);
        initialRun = isInitial;
        cleanupRef.current = setup(() => (silent ? null : audio.getCtx()));
        initialRun = false;
      }
      prevThemeRef.current = key;
    };

    const onThemeChange = (e: Event) => {
      const key = (e as CustomEvent).detail as string;
      if (key === prevThemeRef.current) return;
      activate(key, false);
    };

    const initial = document.body.dataset.palette || DEFAULT_THEME;
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
