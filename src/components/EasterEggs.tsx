import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";

const KONAMI = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

const TYPED_TRIGGERS: Record<string, () => void> = {};

/**
 * Mounts global keyboard listeners for easter eggs.
 *
 * Active triggers:
 *  - Konami code (↑↑↓↓←→←→ba) → toast + brand color swaps to neon green for 8s
 *  - Type "matrix"   → same as Konami
 *  - Type "rainbow"  → cycles brand colors briefly
 *
 * Easter egg state is communicated via body classes:
 *  - body.konami-active        → brand color → neon green
 *  - body.rainbow-active       → brand color cycles through hue rotations
 */
const EasterEggs = () => {
  const toast = useToast();

  useEffect(() => {
    let keyBuf: string[] = [];
    let typeBuf = "";
    let typeTimer: number | null = null;

    const triggerMatrix = () => {
      if (document.body.classList.contains("konami-active")) return;
      document.body.classList.add("konami-active");
      toast({
        title: "🎮 you found the secret",
        description: "matrix mode · 8s",
        status: "success",
        duration: 3500,
        position: "bottom-left",
        variant: "subtle",
      });
      setTimeout(() => document.body.classList.remove("konami-active"), 8000);
    };

    const triggerRainbow = () => {
      if (document.body.classList.contains("rainbow-active")) return;
      document.body.classList.add("rainbow-active");
      toast({
        title: "🌈 rainbow mode",
        description: "6s",
        status: "info",
        duration: 3000,
        position: "bottom-left",
        variant: "subtle",
      });
      setTimeout(() => document.body.classList.remove("rainbow-active"), 6000);
    };

    TYPED_TRIGGERS.matrix = triggerMatrix;
    TYPED_TRIGGERS.rainbow = triggerRainbow;

    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in form fields
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      // Konami arrow sequence
      keyBuf.push(e.key);
      if (keyBuf.length > KONAMI.length) keyBuf.shift();
      if (
        keyBuf.length === KONAMI.length &&
        KONAMI.every((k, i) => keyBuf[i]?.toLowerCase() === k.toLowerCase())
      ) {
        keyBuf = [];
        triggerMatrix();
      }

      // Typed-word triggers
      if (/^[a-zA-Z]$/.test(e.key)) {
        typeBuf += e.key.toLowerCase();
        if (typeBuf.length > 12) typeBuf = typeBuf.slice(-12);

        for (const word of Object.keys(TYPED_TRIGGERS)) {
          if (typeBuf.endsWith(word)) {
            typeBuf = "";
            TYPED_TRIGGERS[word]();
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
    };
  }, [toast]);

  return null;
};

export default EasterEggs;
