import { useEffect, useRef, useState } from "react";

/**
 * Canvas matrix rain — only renders when `body.konami-active` is set.
 * Stops animation when class is removed (saves CPU).
 */
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  // Watch for body class change
  useEffect(() => {
    const check = () => setActive(document.body.classList.contains("konami-active"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const FONT_SIZE = 14;
    const cols = Math.floor(canvas.width / FONT_SIZE);
    const drops: number[] = new Array(cols).fill(0).map(() => Math.random() * -20);
    const chars = "アァカサタナハマヤラワン0123456789ABCDEF<>/{}[];".split("");

    let raf: number;

    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(9, 9, 11, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

      for (let i = 0; i < cols; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * FONT_SIZE;
        // Head is bright, body fades
        ctx.fillStyle = "#a4ffb4";
        ctx.fillText(ch, i * FONT_SIZE, y);
        if (drops[i] > 1) {
          ctx.fillStyle = "rgba(0, 255, 65, 0.6)";
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * FONT_SIZE, y - FONT_SIZE);
        }
        if (y > canvas.height && Math.random() > 0.97) drops[i] = 0;
        drops[i] += 0.6;
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2,
        pointerEvents: "none",
        opacity: 0.7,
      }}
    />
  );
};

export default MatrixRain;
