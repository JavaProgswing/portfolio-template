import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";

/**
 * Radial gradient that follows the cursor - subtle ambient effect.
 * Disabled on touch devices (no hover) and when prefers-reduced-motion is set.
 */
const CursorSpotlight = () => {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hasFinePointer || reducedMotion) return;

    setEnabled(true);
    let frame: number | null = null;
    let lastX = 0, lastY = 0;

    const handler = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        setPos({ x: lastX, y: lastY });
        frame = null;
      });
    };

    window.addEventListener("mousemove", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      w="100vw"
      h="100vh"
      pointerEvents="none"
      zIndex={1}
      sx={{
        background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, var(--cursor-glow, rgba(129,140,248,0.06)), transparent 50%)`,
        mixBlendMode: "screen",
        transition: "background 0.1s linear",
      }}
    />
  );
};

export default CursorSpotlight;
