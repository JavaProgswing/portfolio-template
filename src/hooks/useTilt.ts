import { useRef, useCallback } from "react";

/**
 * Subtle 3D tilt effect tracking the cursor.
 * Returns ref + handlers to spread on a card.
 *
 * Usage:
 *   const tilt = useTilt();
 *   <Box ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
 */
export function useTilt(maxRotation = 5) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      // Disable on touch devices
      if (!window.matchMedia("(pointer: fine)").matches) return;

      const rect = el.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;
      const rotY = (xPct - 0.5) * maxRotation * 2;
      const rotX = (0.5 - yPct) * maxRotation * 2;

      el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      el.style.transition = "transform 0.08s ease-out";
    },
    [maxRotation]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.transition = "transform 0.4s ease-out";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
