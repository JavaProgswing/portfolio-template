import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState, useCallback, ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
import {
  FaRedo,
  FaTrophy,
  FaKeyboard,
  FaChevronUp,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { unlock } from "../../lib/achievements";
import { isTouchDevice } from "./common";

const MotionBox = motion(Box);

const SIZE = 4;
const HS_KEY = "portfolio-2048-highscore";
const WIN_KEY = "portfolio-2048-won";

type Direction = "up" | "down" | "left" | "right";
type Grid = number[][];

// Tile colors — zinc/indigo/yellow progression
const TILE_COLOR: Record<number, { bg: string; fg: string }> = {
  0:    { bg: "rgba(255,255,255,0.04)", fg: "transparent" },
  2:    { bg: "#27272a", fg: "#e4e4e7" },
  4:    { bg: "#3f3f46", fg: "#e4e4e7" },
  8:    { bg: "#4338ca", fg: "#fafafa" },
  16:   { bg: "#4f46e5", fg: "#fafafa" },
  32:   { bg: "#6366f1", fg: "#fafafa" },
  64:   { bg: "#818cf8", fg: "#09090b" },
  128:  { bg: "#a5b4fc", fg: "#09090b" },
  256:  { bg: "#c4b5fd", fg: "#09090b" },
  512:  { bg: "#a78bfa", fg: "#09090b" },
  1024: { bg: "#fbbf24", fg: "#09090b" },
  2048: { bg: "#facc15", fg: "#09090b" },
  4096: { bg: "#f59e0b", fg: "#09090b" },
};

const tileColor = (v: number) =>
  TILE_COLOR[v] || { bg: "#f59e0b", fg: "#09090b" };

// ── Game logic ───────────────────────────────────────────────────────────────

const emptyGrid = (): Grid =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const addRandomTile = (g: Grid): Grid => {
  const empty: [number, number][] = [];
  g.forEach((row, r) =>
    row.forEach((v, c) => { if (v === 0) empty.push([r, c]); })
  );
  if (empty.length === 0) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const ng = g.map((row) => [...row]);
  ng[r][c] = Math.random() < 0.9 ? 2 : 4;
  return ng;
};

/** Slide + merge a single row left. Returns new row + gained score. */
const slideRow = (row: number[]): { row: number[]; gained: number } => {
  const filtered = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      out.push(merged);
      gained += merged;
      i += 2;
    } else {
      out.push(filtered[i]);
      i += 1;
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
};

const move = (g: Grid, dir: Direction): { grid: Grid; gained: number; moved: boolean } => {
  let working = g.map((row) => [...row]);
  let gained = 0;

  // Normalize to "slide left" by rotating
  const rotate = (grid: Grid): Grid => {
    const out: Grid = emptyGrid();
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        out[c][SIZE - 1 - r] = grid[r][c];
    return out;
  };

  // Number of CW rotations to make any direction = left
  const rots = { left: 0, up: 3, right: 2, down: 1 }[dir];
  for (let i = 0; i < rots; i++) working = rotate(working);

  // Slide each row left
  const newGrid = working.map((row) => {
    const { row: out, gained: g2 } = slideRow(row);
    gained += g2;
    return out;
  });

  // Rotate back
  let result = newGrid;
  for (let i = 0; i < (4 - rots) % 4; i++) result = rotate(result);

  // Detect movement
  let moved = false;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (result[r][c] !== g[r][c]) moved = true;

  return { grid: result, gained, moved };
};

const hasWon = (g: Grid): boolean =>
  g.some((row) => row.some((v) => v >= 2048));

const isStuck = (g: Grid): boolean => {
  // Any empty cell → not stuck
  if (g.some((row) => row.some((v) => v === 0))) return false;
  // Any adjacent merge possible
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c];
      if (r + 1 < SIZE && g[r + 1][c] === v) return false;
      if (c + 1 < SIZE && g[r][c + 1] === v) return false;
    }
  return true;
};

const initGrid = (): Grid => addRandomTile(addRandomTile(emptyGrid()));

// ── Component ────────────────────────────────────────────────────────────────

const Game2048 = () => {
  const [grid, setGrid] = useState<Grid>(() => initGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [won, setWon] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [scorePulse, setScorePulse] = useState(0);
  const touch = isTouchDevice();

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
  const gridBg = useColorModeValue("gray.100", "rgba(255,255,255,0.03)");

  useEffect(() => {
    try {
      const hs = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      if (!isNaN(hs)) setHighScore(hs);
    } catch { /* ignore */ }
    unlock("2048-played");
  }, []);

  const reset = () => {
    setGrid(initGrid());
    setScore(0);
    setWon(false);
    setStuck(false);
  };

  const apply = useCallback(
    (dir: Direction) => {
      if (stuck) return;
      const { grid: ng, gained, moved } = move(grid, dir);
      if (!moved) return;
      const withTile = addRandomTile(ng);
      setGrid(withTile);
      const newScore = score + gained;
      setScore(newScore);
      if (gained > 0) setScorePulse((p) => p + 1);

      if (newScore > highScore) {
        setHighScore(newScore);
        try { localStorage.setItem(HS_KEY, String(newScore)); } catch { /* ignore */ }
      }

      // Achievements
      if (newScore >= 1000) unlock("2048-1k");
      if (hasWon(withTile)) {
        unlock("2048-win");
        try {
          if (!localStorage.getItem(WIN_KEY)) {
            localStorage.setItem(WIN_KEY, "1");
            setWon(true);
          }
        } catch { setWon(true); }
      }

      if (isStuck(withTile)) setStuck(true);
    },
    [grid, score, highScore, stuck]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const dirs: Record<string, Direction> = {
        ArrowUp: "up", w: "up",
        ArrowDown: "down", s: "down",
        ArrowLeft: "left", a: "left",
        ArrowRight: "right", d: "right",
      };
      const key = e.key.toLowerCase();
      const dir = dirs[e.key] || dirs[key];
      if (dir) { e.preventDefault(); apply(dir); return; }

      if (e.key.toLowerCase() === "r") { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apply]);

  // Touch swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY;
    };
    const te = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const dir: Direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0 ? "right" : "left"
          : dy > 0 ? "down" : "up";
      apply(dir);
    };
    const board = document.getElementById("g2048-board");
    if (!board) return;
    board.addEventListener("touchstart", ts, { passive: true });
    board.addEventListener("touchend", te, { passive: true });
    return () => {
      board.removeEventListener("touchstart", ts);
      board.removeEventListener("touchend", te);
    };
  }, [apply]);

  return (
    <Box maxW="560px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
      <HStack spacing={4} mb={6}>
        <RouterLink to="/play">
          <Text fontSize="11px" color="brand.400" fontFamily="mono"
            _hover={{ color: "brand.300" }}>
            ← games
          </Text>
        </RouterLink>
        <RouterLink to="/">
          <Text fontSize="11px" color="gray.600" fontFamily="mono"
            _hover={{ color: "brand.300" }}>
            home
          </Text>
        </RouterLink>
      </HStack>

      <HStack justify="space-between" align="flex-end" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Mini-Game · 2048
          </Text>
          <Heading size="lg">merge to 2048</Heading>
        </Box>
        <HStack spacing={4} fontFamily="mono" fontSize="13px">
          <HStack spacing={1.5}>
            <Text color="gray.500">score</Text>
            <MotionBox
              key={scorePulse}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.25 }}
            >
              <Text color="brand.400" fontWeight="700">{score}</Text>
            </MotionBox>
          </HStack>
          <HStack spacing={1.5}>
            <Icon as={FaTrophy as ElementType} boxSize={3} color="yellow.500" />
            <Text color="gray.500">best</Text>
            <Text color="yellow.400" fontWeight="700">{highScore}</Text>
          </HStack>
        </HStack>
      </HStack>

      {/* Board */}
      <Box
        id="g2048-board"
        position="relative"
        p={3}
        bg={gridBg}
        border="1px solid"
        borderColor={border}
        borderRadius="12px"
        sx={{ touchAction: "none" }}
      >
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${SIZE}, 1fr)`}
          gap={2}
        >
          {grid.flat().map((v, i) => {
            const c = tileColor(v);
            const isBig = v >= 1024;
            return (
              <MotionBox
                key={`${i}-${v}`}
                aspectRatio="1"
                bg={c.bg}
                borderRadius="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
                fontSize={
                  v === 0 ? "0" :
                  v >= 1024 ? { base: "lg", md: "xl" } :
                  v >= 128 ? { base: "xl", md: "2xl" } :
                  { base: "2xl", md: "3xl" }
                }
                color={c.fg}
                initial={v !== 0 ? { scale: 0.7, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                boxShadow={isBig ? `0 0 16px ${c.bg}55` : "none"}
              >
                {v !== 0 && v}
              </MotionBox>
            );
          })}
        </Box>

        {/* Overlays */}
        <AnimatePresence>
          {won && (
            <MotionBox
              position="absolute" inset={3}
              display="flex" alignItems="center" justifyContent="center"
              bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)"
              borderRadius="8px"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <Stack spacing={3} align="center">
                <Text fontFamily="mono" fontSize="3xl" color="yellow.400" fontWeight="700">
                  ★ 2048
                </Text>
                <Text fontSize="sm" color="gray.300" fontFamily="mono">
                  you actually did it
                </Text>
                <Button size="sm" onClick={() => setWon(false)} variant="glow">
                  keep going
                </Button>
              </Stack>
            </MotionBox>
          )}
          {stuck && !won && (
            <MotionBox
              position="absolute" inset={3}
              display="flex" alignItems="center" justifyContent="center"
              bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)"
              borderRadius="8px"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <Stack spacing={3} align="center">
                <Text fontFamily="mono" fontSize="2xl" color="red.400" fontWeight="700">
                  no moves left
                </Text>
                <Text fontSize="sm" color="gray.400" fontFamily="mono">
                  score: <Text as="span" color="brand.400" fontWeight="700">{score}</Text>
                </Text>
                <Button size="sm" onClick={reset} variant="glow"
                  leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>
                  new game
                </Button>
              </Stack>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>

      {/* D-pad */}
      <Box mt={5} mx="auto" w="fit-content">
        <Text fontSize="10px" color="gray.600" fontFamily="mono"
          textAlign="center" mb={2} display={{ base: "block", md: "none" }}>
          tap to slide
        </Text>
        <Stack spacing={1} align="center">
          <DPadBtn onClick={() => apply("up")} icon={FaChevronUp} ariaLabel="up" />
          <HStack spacing={1}>
            <DPadBtn onClick={() => apply("left")} icon={FaChevronLeft} ariaLabel="left" />
            <Button
              size="sm" onClick={reset}
              variant="outline" color="gray.500"
              borderColor="rgba(255,255,255,0.14)"
              fontFamily="mono" fontSize="9px"
              h="44px" w="44px" p={0}
              _hover={{ color: "brand.400", borderColor: "rgba(99,102,241,0.4)" }}
            >
              new
            </Button>
            <DPadBtn onClick={() => apply("right")} icon={FaChevronRight} ariaLabel="right" />
          </HStack>
          <DPadBtn onClick={() => apply("down")} icon={FaChevronDown} ariaLabel="down" />
        </Stack>
      </Box>

      <Stack spacing={1} mt={6} align="center">
        <HStack fontSize="11px" fontFamily="mono" color="gray.600" spacing={4}>
          <Icon as={FaKeyboard as ElementType} boxSize={3} />
          <Text>{touch ? "swipe or tap D-pad · R to restart" : "arrows · WASD · R restart"}</Text>
        </HStack>
        <Text fontSize="10px" color="gray.600" fontFamily="mono">
          1000 pts unlocks an achievement · 2048 tile = legendary
        </Text>
      </Stack>
    </Box>
  );
};

interface DPadProps {
  onClick: () => void;
  icon: IconType;
  ariaLabel: string;
}

const DPadBtn = ({ onClick, icon: I, ariaLabel }: DPadProps) => (
  <Button
    onClick={onClick}
    onTouchStart={(e) => { e.preventDefault(); onClick(); }}
    size="sm"
    variant="outline"
    borderColor="rgba(255,255,255,0.14)"
    color="gray.400"
    bg="rgba(255,255,255,0.03)"
    h="44px" w="44px" p={0} minW={0}
    _hover={{
      color: "brand.400",
      borderColor: "rgba(99,102,241,0.4)",
      bg: "rgba(99,102,241,0.08)",
    }}
    _active={{ bg: "rgba(99,102,241,0.15)" }}
    aria-label={ariaLabel}
  >
    <Icon as={I as ElementType} boxSize={3.5} />
  </Button>
);

export default Game2048;
