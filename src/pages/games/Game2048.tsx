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
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  ElementType,
} from "react";
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

const MotionDiv = motion.div;
const MotionBox = motion(Box);

const SIZE = 4;
const PAD = 12;
const GAP = 8;
const HS_KEY = "portfolio-2048-highscore";
const WIN_KEY = "portfolio-2048-won";

type Direction = "up" | "down" | "left" | "right";

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  justMerged?: boolean;
}

let TILE_ID = 1;
const nextId = () => TILE_ID++;

// Tile colors: zinc to indigo to gold
const TILE_COLOR: Record<number, { bg: string; fg: string }> = {
  2: { bg: "#27272a", fg: "#e4e4e7" },
  4: { bg: "#3f3f46", fg: "#e4e4e7" },
  8: { bg: "#4338ca", fg: "#fafafa" },
  16: { bg: "#4f46e5", fg: "#fafafa" },
  32: { bg: "#6366f1", fg: "#fafafa" },
  64: { bg: "#818cf8", fg: "#09090b" },
  128: { bg: "#a5b4fc", fg: "#09090b" },
  256: { bg: "#c4b5fd", fg: "#09090b" },
  512: { bg: "#a78bfa", fg: "#09090b" },
  1024: { bg: "#fbbf24", fg: "#09090b" },
  2048: { bg: "#facc15", fg: "#09090b" },
};
const tileColor = (v: number) => TILE_COLOR[v] || { bg: "#f59e0b", fg: "#09090b" };

const VEC: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const inBounds = (x: number, y: number) =>
  x >= 0 && x < SIZE && y >= 0 && y < SIZE;

const emptyGridFrom = (tiles: Tile[]): (Tile | null)[][] => {
  const g: (Tile | null)[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(null)
  );
  tiles.forEach((t) => { g[t.row][t.col] = t; });
  return g;
};

const randomEmptyCell = (tiles: Tile[]): { row: number; col: number } | null => {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};

const spawnTile = (tiles: Tile[]): Tile | null => {
  const cell = randomEmptyCell(tiles);
  if (!cell) return null;
  return {
    id: nextId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: cell.row,
    col: cell.col,
    isNew: true,
  };
};

const initTiles = (): Tile[] => {
  let tiles: Tile[] = [];
  const a = spawnTile(tiles);
  if (a) tiles = [a];
  const b = spawnTile(tiles);
  if (b) tiles = [...tiles, b];
  return tiles;
};

const isStuck = (tiles: Tile[]): boolean => {
  if (tiles.length < SIZE * SIZE) return false;
  const g = emptyGridFrom(tiles);
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c]?.value;
      if (r + 1 < SIZE && g[r + 1][c]?.value === v) return false;
      if (c + 1 < SIZE && g[r][c + 1]?.value === v) return false;
    }
  return true;
};

const Game2048 = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(78);
  const tilesRef = useRef<Tile[]>(initTiles());
  const [tiles, setTiles] = useState<Tile[]>(tilesRef.current);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [scorePulse, setScorePulse] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startAtRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const touch = isTouchDevice();

  // Tick the timer while a game is in progress
  useEffect(() => {
    if (over || won || startAtRef.current === null) return;
    const id = setInterval(() => {
      if (startAtRef.current !== null) setElapsed((Date.now() - startAtRef.current) / 1000);
    }, 200);
    return () => clearInterval(id);
  }, [over, won, scorePulse]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
  const boardBg = useColorModeValue("gray.100", "rgba(255,255,255,0.03)");
  const cellBg = useColorModeValue("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)");

  // Measure cell size
  useLayoutEffect(() => {
    const measure = () => {
      const w = boardRef.current?.offsetWidth || 360;
      setCell((w - PAD * 2 - GAP * (SIZE - 1)) / SIZE);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boardRef.current) ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try {
      const hs = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      if (!isNaN(hs)) setBest(hs);
    } catch { /* ignore */ }
    unlock("2048-played");
  }, []);

  const px = (i: number) => PAD + i * (cell + GAP);

  const sync = (t: Tile[]) => {
    tilesRef.current = t;
    setTiles(t);
  };

  const reset = () => {
    const t = initTiles();
    sync(t);
    setScore(0);
    setWon(false);
    setOver(false);
    setElapsed(0);
    startAtRef.current = null;
    lockRef.current = false;
  };

  // Move
  const move = useCallback((dir: Direction) => {
    if (lockRef.current || over) return;

    const vec = VEC[dir];
    const xs = [0, 1, 2, 3];
    const ys = [0, 1, 2, 3];
    if (vec.x === 1) xs.reverse();
    if (vec.y === 1) ys.reverse();

    const working: Tile[] = tilesRef.current.map((t) => ({ ...t, isNew: false, justMerged: false }));
    const grid = emptyGridFrom(working);
    const removedIds: number[] = [];
    const doubledIds = new Set<number>();
    let moved = false;
    let gained = 0;

    ys.forEach((y) =>
      xs.forEach((x) => {
        const tile = grid[y][x];
        if (!tile) return;

        let cx = x, cy = y;
        let nx = cx + vec.x, ny = cy + vec.y;
        while (inBounds(nx, ny) && !grid[ny][nx]) {
          cx = nx; cy = ny;
          nx += vec.x; ny += vec.y;
        }

        const next = inBounds(nx, ny) ? grid[ny][nx] : null;
        if (next && next.value === tile.value && !doubledIds.has(next.id)) {
          // Merge tile INTO next - tile slides onto next's cell, then removed
          grid[y][x] = null;
          tile.row = next.row;
          tile.col = next.col;
          removedIds.push(tile.id);
          doubledIds.add(next.id);
          gained += next.value * 2;
          moved = true;
        } else {
          if (cx !== x || cy !== y) moved = true;
          grid[y][x] = null;
          grid[cy][cx] = tile;
          tile.row = cy;
          tile.col = cx;
        }
      })
    );

    if (!moved) return;

    // Start the clock on the first real move
    if (startAtRef.current === null) {
      startAtRef.current = Date.now();
      setScorePulse((p) => p + 1); // kick the timer effect to subscribe
    }

    lockRef.current = true;

    // Phase 1: render slide (positions updated, values unchanged)
    sync(working);
    if (gained > 0) {
      setScore((s) => {
        const ns = s + gained;
        if (ns > best) {
          setBest(ns);
          try { localStorage.setItem(HS_KEY, String(ns)); } catch { /* ignore */ }
        }
        if (ns >= 1000) unlock("2048-1k");
        return ns;
      });
      setScorePulse((p) => p + 1);
    }

    // Phase 2: after slide, collapse merges + spawn
    setTimeout(() => {
      let collapsed = working
        .filter((t) => !removedIds.includes(t.id))
        .map((t) =>
          doubledIds.has(t.id)
            ? { ...t, value: t.value * 2, justMerged: true }
            : t
        );

      const spawned = spawnTile(collapsed);
      if (spawned) collapsed = [...collapsed, spawned];

      sync(collapsed);

      // Win check
      if (collapsed.some((t) => t.value >= 2048)) {
        unlock("2048-win");
        try {
          if (!localStorage.getItem(WIN_KEY)) {
            localStorage.setItem(WIN_KEY, "1");
            setWon(true);
          }
        } catch { setWon(true); }
      }
      if (isStuck(collapsed)) setOver(true);

      lockRef.current = false;
    }, 120);
  }, [best, over]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      const map: Record<string, Direction> = {
        ArrowUp: "up", w: "up",
        ArrowDown: "down", s: "down",
        ArrowLeft: "left", a: "left",
        ArrowRight: "right", d: "right",
      };
      const dir = map[e.key] || map[e.key.toLowerCase()];
      if (dir) { e.preventDefault(); move(dir); return; }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  // Touch swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const board = boardRef.current;
    if (!board) return;
    const ts = (e: TouchEvent) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; };
    const te = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const dir: Direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0 ? "right" : "left"
          : dy > 0 ? "down" : "up";
      move(dir);
    };
    board.addEventListener("touchstart", ts, { passive: true });
    board.addEventListener("touchend", te, { passive: true });
    return () => {
      board.removeEventListener("touchstart", ts);
      board.removeEventListener("touchend", te);
    };
  }, [move]);

  const fontFor = (v: number) =>
    v >= 1024 ? cell * 0.32 : v >= 128 ? cell * 0.38 : cell * 0.44;

  return (
    <Box maxW="520px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
      <HStack spacing={4} mb={6}>
        <RouterLink to="/play">
          <Text fontSize="11px" color="brand.400" fontFamily="mono"
            _hover={{ color: "brand.300" }}>← games</Text>
        </RouterLink>
        <RouterLink to="/">
          <Text fontSize="11px" color="gray.600" fontFamily="mono"
            _hover={{ color: "brand.300" }}>home</Text>
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
            <MotionBox key={scorePulse} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.25 }}>
              <Text color="brand.400" fontWeight="700">{score}</Text>
            </MotionBox>
          </HStack>
          <HStack spacing={1.5}>
            <Text color="gray.500">time</Text>
            <Text color="gray.300" fontWeight="700">{fmtTime(elapsed)}</Text>
          </HStack>
          <HStack spacing={1.5}>
            <Icon as={FaTrophy as ElementType} boxSize={3} color="yellow.500" />
            <Text color="gray.500">best</Text>
            <Text color="yellow.400" fontWeight="700">{best}</Text>
          </HStack>
        </HStack>
      </HStack>

      {/* Board */}
      <Box
        ref={boardRef}
        position="relative"
        w="100%"
        maxW="420px"
        mx="auto"
        sx={{ aspectRatio: "1", touchAction: "none" }}
        bg={boardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="14px"
      >
        {/* Static background cells */}
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          return (
            <Box
              key={`bg-${i}`}
              position="absolute"
              left={`${px(c)}px`}
              top={`${px(r)}px`}
              w={`${cell}px`}
              h={`${cell}px`}
              bg={cellBg}
              borderRadius="8px"
            />
          );
        })}

        {/* Animated tiles */}
        <AnimatePresence>
          {tiles.map((t) => {
            const col = tileColor(t.value);
            return (
              <MotionDiv
                key={t.id}
                initial={
                  t.isNew
                    ? { scale: 0, x: px(t.col), y: px(t.row), opacity: 0 }
                    : { x: px(t.col), y: px(t.row) }
                }
                animate={{
                  x: px(t.col),
                  y: px(t.row),
                  scale: t.justMerged ? [1, 1.18, 1] : 1,
                  opacity: 1,
                }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{
                  x: { type: "tween", duration: 0.11, ease: "easeInOut" },
                  y: { type: "tween", duration: 0.11, ease: "easeInOut" },
                  scale: { duration: t.isNew ? 0.18 : 0.2 },
                  opacity: { duration: 0.12 },
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: cell,
                  height: cell,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  background: col.bg,
                  color: col.fg,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: `${fontFor(t.value)}px`,
                  boxShadow: t.value >= 1024 ? `0 0 18px ${col.bg}66` : "none",
                  zIndex: t.justMerged ? 2 : 1,
                }}
              >
                {t.value}
              </MotionDiv>
            );
          })}
        </AnimatePresence>

        {/* Overlays */}
        <AnimatePresence>
          {won && (
            <MotionBox
              position="absolute" inset={0}
              display="flex" alignItems="center" justifyContent="center"
              bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)" borderRadius="14px"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              zIndex={5}
            >
              <Stack spacing={3} align="center">
                <Text fontFamily="mono" fontSize="3xl" color="yellow.400" fontWeight="700">★ 2048</Text>
                <Text fontSize="sm" color="gray.300" fontFamily="mono">you actually did it</Text>
                <Button size="sm" onClick={() => setWon(false)} variant="glow">keep going</Button>
              </Stack>
            </MotionBox>
          )}
          {over && !won && (
            <MotionBox
              position="absolute" inset={0}
              display="flex" alignItems="center" justifyContent="center"
              bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)" borderRadius="14px"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              zIndex={5}
            >
              <Stack spacing={3} align="center">
                <Text fontFamily="mono" fontSize="2xl" color="red.400" fontWeight="700">no moves left</Text>
                <Text fontSize="sm" color="gray.400" fontFamily="mono">
                  score: <Text as="span" color="brand.400" fontWeight="700">{score}</Text>
                </Text>
                <Button size="sm" onClick={reset} variant="glow"
                  leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>new game</Button>
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
          <DPadBtn onClick={() => move("up")} icon={FaChevronUp} ariaLabel="up" />
          <HStack spacing={1}>
            <DPadBtn onClick={() => move("left")} icon={FaChevronLeft} ariaLabel="left" />
            <Button size="sm" onClick={reset} variant="outline" color="gray.500"
              borderColor="rgba(255,255,255,0.14)" fontFamily="mono" fontSize="9px"
              h="44px" w="44px" p={0}
              _hover={{ color: "brand.400", borderColor: "rgba(99,102,241,0.4)" }}>new</Button>
            <DPadBtn onClick={() => move("right")} icon={FaChevronRight} ariaLabel="right" />
          </HStack>
          <DPadBtn onClick={() => move("down")} icon={FaChevronDown} ariaLabel="down" />
        </Stack>
      </Box>

      <Stack spacing={1} mt={6} align="center">
        <HStack fontSize="11px" fontFamily="mono" color="gray.600" spacing={4}>
          <Icon as={FaKeyboard as ElementType} boxSize={3} />
          <Text>{touch ? "swipe or tap D-pad · R restart" : "arrows · WASD · R restart"}</Text>
        </HStack>
        <Text fontSize="10px" color="gray.600" fontFamily="mono">
          1000 pts unlocks an achievement · 2048 tile = legendary
        </Text>
      </Stack>
    </Box>
  );
};

interface DPadProps { onClick: () => void; icon: IconType; ariaLabel: string }
const DPadBtn = ({ onClick, icon: I, ariaLabel }: DPadProps) => (
  <Button
    onClick={onClick}
    onTouchStart={(e) => { e.preventDefault(); onClick(); }}
    size="sm" variant="outline"
    borderColor="rgba(255,255,255,0.14)" color="gray.400" bg="rgba(255,255,255,0.03)"
    h="44px" w="44px" p={0} minW={0}
    _hover={{ color: "brand.400", borderColor: "rgba(99,102,241,0.4)", bg: "rgba(99,102,241,0.08)" }}
    _active={{ bg: "rgba(99,102,241,0.15)" }}
    aria-label={ariaLabel}
  >
    <Icon as={I as ElementType} boxSize={3.5} />
  </Button>
);

export default Game2048;
