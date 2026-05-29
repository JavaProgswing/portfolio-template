import {
  Box,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { unlock } from "../lib/achievements";

const MotionBox = motion(Box);
const MotionText = motion(Text);

// Random pool of "lost in the void" taglines
const TAGLINES = [
  "you wandered into the void",
  "off the map. and into the static.",
  "this URL doesn't exist in any timeline",
  "404 — nothing here but vibes and dust",
  "the page is on vacation. without WiFi.",
  "you broke the matrix. quietly.",
  "even Google doesn't know this page",
  "page.exe has stopped responding",
  "you reached the edge of the internet",
  "this is fine. (it's not.)",
  "the cake was a lie",
  "well now we're in uncharted territory",
  "lost between commits",
  "the path you took was a hallucination",
];

const GLITCH_CHARS = "█▓▒░╳◢◣◤◥▌▐▀▄░▒";

// Random integer in [a, b]
const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

const NotFoundPage = () => {
  const location = useLocation();
  const [digits, setDigits] = useState<string>("...");
  const [tagline] = useState<string>(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
  );
  const [coords] = useState<{ lat: string; lng: string; depth: string }>(() => ({
    lat: `${rand(-89, 89)}.${rand(100, 999)}`,
    lng: `${rand(-179, 179)}.${rand(100, 999)}`,
    depth: `${rand(-9999, -100)}m`,
  }));
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax (subtle)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 25 });
  const sy = useSpring(my, { stiffness: 150, damping: 25 });
  const transX = useTransform(sx, [-1, 1], [-8, 8]);
  const transY = useTransform(sy, [-1, 1], [-8, 8]);
  // Compass arrow rotates to "point home" - always rotates toward upper-left
  const compassAngle = useTransform(
    [sx, sy],
    ([x, y]: number[]) => {
      // Aim toward (-1, -1) i.e. top-left of viewport
      const tx = -1 - x;
      const ty = -1 - y;
      return (Math.atan2(ty, tx) * 180) / Math.PI;
    }
  );

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mx.set(x);
    my.set(y);
  };

  // Click ripple
  const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 800);
  };

  // Glitch settle: digits cycle randomly for 800ms, then settle on 404
  useEffect(() => {
    unlock("got-404");
    let raf = 0;
    let count = 0;
    const ticks = 14;
    const tick = () => {
      count += 1;
      if (count <= ticks) {
        setDigits(
          Array.from({ length: 3 }, () =>
            Math.random() < 0.4
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : String(Math.floor(Math.random() * 10))
          ).join("")
        );
        raf = window.setTimeout(tick, 60) as unknown as number;
      } else {
        setDigits("404");
      }
    };
    tick();
    return () => clearTimeout(raf);
  }, []);

  // Random flicker on settled digits (one digit briefly glitches)
  useEffect(() => {
    if (digits !== "404") return;
    const id = setInterval(() => {
      if (Math.random() < 0.18) {
        const idx = rand(0, 2);
        const orig = "404";
        const glitched =
          orig.slice(0, idx) +
          GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] +
          orig.slice(idx + 1);
        setDigits(glitched);
        setTimeout(() => setDigits("404"), 70);
      }
    }, 1400);
    return () => clearInterval(id);
  }, [digits]);

  const bgGrid = useColorModeValue(
    "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
  );

  return (
    <Box
      ref={containerRef}
      onMouseMove={onMouseMove}
      onClick={onClick}
      position="relative"
      minH="calc(100dvh - 60px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
      overflow="hidden"
      cursor="crosshair"
      sx={{
        backgroundImage: bgGrid,
        backgroundSize: "32px 32px",
      }}
    >
      {/* Click ripples */}
      {ripples.map((r) => (
        <MotionBox
          key={r.id}
          position="absolute"
          left={`${r.x}px`}
          top={`${r.y}px`}
          w="8px"
          h="8px"
          borderRadius="full"
          bg="brand.400"
          pointerEvents="none"
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 12, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transform: "translate(-50%, -50%)" }}
        />
      ))}

      {/* Coordinates ribbon */}
      <Box
        position="absolute"
        top="40px"
        left="50%"
        transform="translateX(-50%)"
        fontFamily="mono"
        fontSize="10px"
        color="gray.600"
        letterSpacing="0.15em"
        textAlign="center"
      >
        <HStack spacing={4}>
          <Text>lat <Text as="span" color="brand.400">{coords.lat}</Text></Text>
          <Text>lng <Text as="span" color="brand.400">{coords.lng}</Text></Text>
          <Text>depth <Text as="span" color="brand.400">{coords.depth}</Text></Text>
        </HStack>
      </Box>

      <Stack spacing={6} align="center" textAlign="center" pointerEvents="auto">
        {/* Glitching 404 */}
        <MotionBox
          style={{ x: transX, y: transY }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Text
            fontSize={{ base: "108px", md: "180px" }}
            fontFamily="mono"
            fontWeight="700"
            lineHeight="1"
            bgGradient="linear(to-br, brand.400, purple.500, pink.400)"
            bgClip="text"
            letterSpacing="-0.05em"
            sx={{
              textShadow: "0 0 60px rgba(99,102,241,0.4)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {digits}
          </Text>
        </MotionBox>

        {/* Tagline */}
        <MotionText
          fontSize="md"
          color="gray.300"
          fontFamily="mono"
          maxW="420px"
          lineHeight="1.7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {tagline}
        </MotionText>

        {/* Breadcrumb */}
        <Stack spacing={1} fontSize="11px" color="gray.500" fontFamily="mono">
          <Text>
            <Text as="span" color="gray.700">tried:</Text>{" "}
            <Text as="code" color="brand.400">{location.pathname}</Text>
          </Text>
          <Text fontSize="10px" color="gray.700">
            (this URL doesn't route to anything)
          </Text>
        </Stack>

        {/* Compass - visual flair, always points roughly home */}
        <MotionBox
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
          position="relative"
          w="80px"
          h="80px"
          borderRadius="full"
          border="1px solid"
          borderColor="rgba(255,255,255,0.1)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(255,255,255,0.02)"
        >
          {/* Compass marks */}
          {[0, 90, 180, 270].map((deg, i) => (
            <Box
              key={deg}
              position="absolute"
              top="50%"
              left="50%"
              w="2px"
              h="6px"
              bg="rgba(255,255,255,0.15)"
              transform={`translate(-50%, -50%) rotate(${deg}deg) translateY(-32px)`}
              transformOrigin="center"
            />
          ))}
          <Text
            position="absolute"
            top="6px"
            fontSize="8px"
            fontFamily="mono"
            color="gray.600"
          >
            N
          </Text>
          {/* Pointing arrow */}
          <MotionBox
            style={{ rotate: compassAngle }}
            w="3px"
            h="50px"
            position="absolute"
            top="50%"
            left="50%"
            transformOrigin="50% 100%"
            mt="-50px"
            ml="-1.5px"
          >
            <Box
              w="0"
              h="0"
              borderLeft="6px solid transparent"
              borderRight="6px solid transparent"
              borderBottom="14px solid"
              borderBottomColor="brand.400"
              position="absolute"
              top="-4px"
              left="-4.5px"
            />
            <Box w="3px" h="46px" bg="brand.400" position="absolute" top="10px" borderRadius="full" />
          </MotionBox>
          {/* Center dot */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            w="6px"
            h="6px"
            borderRadius="full"
            bg="brand.500"
            transform="translate(-50%, -50%)"
            boxShadow="0 0 8px rgba(99,102,241,0.8)"
            zIndex={2}
          />
        </MotionBox>

        <Text fontSize="10px" color="gray.600" fontFamily="mono">
          ← compass points home
        </Text>

        {/* Actions */}
        <HStack spacing={3} pt={2}>
          <Button as={RouterLink} to="/" size="sm" variant="glow">
            ↩ go home
          </Button>
          <Button
            as={RouterLink}
            to="/console"
            size="sm"
            variant="outline"
            borderColor="rgba(255,255,255,0.14)"
            color="gray.400"
            fontFamily="mono"
            _hover={{
              color: "gray.100",
              borderColor: "rgba(255,255,255,0.3)",
              bg: "rgba(255,255,255,0.05)",
            }}
          >
            console
          </Button>
        </HStack>

        <Text fontSize="9px" color="gray.700" fontFamily="mono" pt={6} letterSpacing="0.1em">
          click anywhere · move mouse · feel something
        </Text>
      </Stack>

      {/* Corner labels for flavor */}
      <Text
        position="absolute"
        bottom="20px"
        left="20px"
        fontSize="9px"
        fontFamily="mono"
        color="gray.700"
        letterSpacing="0.15em"
      >
        ERR_PAGE_NOT_FOUND
      </Text>
      <Text
        position="absolute"
        bottom="20px"
        right="20px"
        fontSize="9px"
        fontFamily="mono"
        color="gray.700"
        letterSpacing="0.15em"
      >
        sector_404 · void
      </Text>
    </Box>
  );
};

export default NotFoundPage;
