import { Box, Text } from "@chakra-ui/react";

/** Infinite horizontal ticker. Pauses on hover, static for reduced-motion. */
const Marquee = ({ items }: { items: string[] }) => {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <Box
      overflow="hidden" py={3} role="presentation"
      sx={{
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        "@keyframes marquee": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "&:hover > div": { animationPlayState: "paused" },
        "@media (prefers-reduced-motion: reduce)": { "& > div": { animation: "none !important" } },
      }}
    >
      <Box display="flex" w="max-content" gap={3} animation={`marquee ${Math.max(24, items.length * 3)}s linear infinite`}>
        {row.map((t, i) => (
          <Text key={i} as="span" px={4} py={1.5} borderRadius="full" border="1px solid var(--border)" bg="var(--surface)"
            fontFamily="mono" fontSize="12px" color="fg.muted" whiteSpace="nowrap">
            {t}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

export default Marquee;
