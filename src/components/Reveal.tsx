import { Box, BoxProps } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

const MotionBox = motion(Box);

interface Props extends Omit<BoxProps, "transition"> {
  children: ReactNode;
  delay?: number;
  y?: number;
}

/** Fade + rise into view once. Respects reduced-motion via framer's global setting in CSS (no-op distance). */
const Reveal = ({ children, delay = 0, y = 28, ...rest }: Props) => (
  <MotionBox
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    {...(rest as object)}
  >
    {children}
  </MotionBox>
);

export default Reveal;
