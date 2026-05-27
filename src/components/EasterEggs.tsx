import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { unlock } from "../lib/achievements";

const KONAMI = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

/**
 * Mounts global keyboard + visibility listeners for easter eggs.
 *
 * Behaviors:
 *  - Konami code (↑↑↓↓←→←→ba) → matrix mode (8s neon green)
 *  - Typed words: "matrix" / "rainbow" / "coffee" / "pizza" / "vim" / "bug" / "sudo"
 *  - Vim nav: "gg" → top, "G" → bottom
 *  - Triple Escape → close all (chat, popovers, modal)
 *  - "/" → focus the AI chat input
 *  - Tab blur → title plays peek-a-boo after 5s
 *  - Night owl: shows toast if visit is 3–6 AM local
 *  - Visit /console, /404, sign guestbook, etc. → unlock achievements
 *  - Achievement unlock → subtle toast
 *
 * State stored in localStorage via src/lib/achievements.ts.
 */
const EasterEggs = () => {
  const toast = useToast();

  // Achievement notifications are handled by AchievementToast component.
  // EasterEggs only fires `unlock()` — listening + rendering lives elsewhere.

  // ── Effect triggers ────────────────────────────────────────────────────────
  useEffect(() => {
    let keyBuf: string[] = [];
    let typeBuf = "";
    let typeTimer: number | null = null;
    let gWaiting = false;
    let gTimer: number | null = null;
    let escTimes: number[] = [];

    const triggerMatrix = () => {
      if (!document.body.classList.contains("konami-active")) {
        document.body.classList.add("konami-active");
        setTimeout(() => document.body.classList.remove("konami-active"), 8000);
      }
      unlock("matrix");
    };

    const triggerRainbow = () => {
      if (!document.body.classList.contains("rainbow-active")) {
        document.body.classList.add("rainbow-active");
        setTimeout(() => document.body.classList.remove("rainbow-active"), 6000);
      }
      unlock("rainbow");
    };

    const typedEffects: Record<string, () => void> = {
      matrix: triggerMatrix,
      rainbow: triggerRainbow,
      coffee: () => {
        unlock("coffee");
        toast({
          title: "☕ caffeinated",
          description: "go drink some water too",
          status: "info",
          duration: 2500,
          position: "bottom-left",
          variant: "subtle",
        });
      },
      pizza: () => {
        unlock("pizza");
        toast({
          title: "🍕 slice of life",
          description: "pineapple is acceptable",
          status: "info",
          duration: 2500,
          position: "bottom-left",
          variant: "subtle",
        });
      },
      vim: () => {
        unlock("vim");
        toast({
          title: ":wq",
          description: "press esc, then :wq to exit",
          status: "info",
          duration: 2500,
          position: "bottom-left",
          variant: "subtle",
        });
      },
      bug: () => {
        unlock("bug");
        toast({
          title: "🐛 logged",
          description: "won't reproduce locally",
          status: "warning",
          duration: 2500,
          position: "bottom-left",
          variant: "subtle",
        });
      },
      sudo: () => {
        toast({
          title: "[sudo] permission denied",
          description: "this incident will be reported",
          status: "error",
          duration: 2500,
          position: "bottom-left",
          variant: "subtle",
        });
      },
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

      // Konami arrow sequence (works even from form fields — uses only arrow keys + b/a)
      keyBuf.push(e.key);
      if (keyBuf.length > KONAMI.length) keyBuf.shift();
      if (
        keyBuf.length === KONAMI.length &&
        KONAMI.every((k, i) => keyBuf[i]?.toLowerCase() === k.toLowerCase())
      ) {
        keyBuf = [];
        triggerMatrix();
        unlock("konami");
        return;
      }

      // The rest only fire outside input fields
      if (inField) return;

      // ── Triple Escape: close everything ─────────────────────────────────
      if (e.key === "Escape") {
        const now = Date.now();
        escTimes = escTimes.filter((t) => now - t < 800);
        escTimes.push(now);
        if (escTimes.length >= 3) {
          escTimes = [];
          // Dispatch a synthetic event other components listen to
          window.dispatchEvent(new Event("close-all"));
          // Reset any active body classes
          document.body.classList.remove("konami-active", "rainbow-active");
          unlock("triple-esc");
        }
      }

      // ── `/` → focus AI chat ─────────────────────────────────────────────
      if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event("focus-ai-chat"));
      }

      // ── Vim nav ─────────────────────────────────────────────────────────
      // `G` (shift+g) → scroll bottom
      if (e.key === "G" && e.shiftKey) {
        e.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        unlock("vim-nav");
        gWaiting = false;
        return;
      }
      // `g` → wait for second `g`
      if (e.key === "g" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (gWaiting) {
          // second g — scroll to top
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          unlock("vim-nav");
          gWaiting = false;
          if (gTimer) window.clearTimeout(gTimer);
        } else {
          gWaiting = true;
          if (gTimer) window.clearTimeout(gTimer);
          gTimer = window.setTimeout(() => { gWaiting = false; }, 800);
        }
        return;
      }

      // ── Typed-word triggers ─────────────────────────────────────────────
      if (/^[a-zA-Z]$/.test(e.key)) {
        typeBuf = (typeBuf + e.key.toLowerCase()).slice(-16);
        for (const word of Object.keys(typedEffects)) {
          if (typeBuf.endsWith(word)) {
            typeBuf = "";
            typedEffects[word]();
            break;
          }
        }
        if (typeTimer !== null) window.clearTimeout(typeTimer);
        typeTimer = window.setTimeout(() => { typeBuf = ""; }, 1500);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (typeTimer !== null) window.clearTimeout(typeTimer);
      if (gTimer !== null) window.clearTimeout(gTimer);
    };
  }, [toast]);

  // ── Tab blur peek-a-boo ────────────────────────────────────────────────────
  useEffect(() => {
    const originalTitle = document.title;
    let timer: number | null = null;

    const onVisibility = () => {
      if (document.hidden) {
        timer = window.setTimeout(() => {
          document.title = "👀 come back";
        }, 5000);
      } else {
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
        document.title = originalTitle;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // ── Night owl (00:00–06:00 local — relaxed window) ────────────────────────
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      const id = window.setTimeout(() => {
        document.body.classList.add("night-owl");
        unlock("night-owl");
      }, 2000);
      return () => window.clearTimeout(id);
    }
  }, []);

  return null;
};

export default EasterEggs;
