import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";

const COLORS = ["#818cf8", "#a5b4fc", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#f43f5e"];

interface ConfettiProps {
  trigger: number; // increment to fire
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
}

const Confetti = ({ trigger }: ConfettiProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const count = 35;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const burst: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: trigger * 1000 + i,
      x: w * 0.5 + (Math.random() - 0.5) * 80,
      y: h * 0.5,
      vx: (Math.random() - 0.5) * 800,
      vy: -Math.random() * 700 - 200,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 4,
      rotation: Math.random() * 720 - 360,
    }));
    setParticles(burst);

    // Cleanup after animation
    const id = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(id);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <Box position="fixed" inset="0" pointerEvents="none" zIndex={9999}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, rotate: 0, opacity: 1 }}
          animate={{
            x: p.x + p.vx,
            y: p.y + p.vy + 800, // gravity
            rotate: p.rotation,
            opacity: 0,
          }}
          transition={{ duration: 2, ease: [0.2, 0.6, 0.4, 1] }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 1,
            top: 0,
            left: 0,
          }}
        />
      ))}
    </Box>
  );
};

export default Confetti;
