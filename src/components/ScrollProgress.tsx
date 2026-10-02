import { motion, useScroll, useSpring } from "framer-motion";

/** Thin brand-coloured bar pinned to the top that fills as the page scrolls. */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: "0% 50%",
        background: "linear-gradient(90deg, var(--chakra-colors-brand-300), var(--chakra-colors-brand-500))",
        zIndex: 300,
        pointerEvents: "none",
      }}
    />
  );
};

export default ScrollProgress;
