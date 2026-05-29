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
import { useEffect, useRef, useState, ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { IconType } from "react-icons";
import {
  FaPlay,
  FaPause,
  FaRedo,
  FaTrophy,
  FaChevronUp,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaKeyboard,
} from "react-icons/fa";
import { unlock } from "../../lib/achievements";
import { isTouchDevice } from "./common";

const MotionBox = motion(Box);

const GRID = 22;
const CELL = 20;
const LOGICAL = GRID * CELL; // 440 logical px
const FOOD = "#4ade80";
const HEAD_RGB = [129, 140, 248]; // brand.400
const TAIL_RGB = [67, 56, 202]; // brand.700
const HS_KEY = "portfolio-snake-highscore";

type Direction = "up" | "down" | "left" | "right";
type Point = { x: number; y: number };
interface Ripple { x: number; y: number; t: number }

const OPPOSITE: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};
const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

const lerpColor = (a: number[], b: number[], t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

interface GameState {
  snake: Point[];
  dir: Direction;
  nextDir: Direction;
  food: Point;
  growBy: number;
  speed: number;
  alive: boolean;
  started: boolean;
  paused: boolean;
  ripple: Ripple | null;
  diedAt: number;
}

const freshState = (): GameState => ({
  snake: [{ x: 8, y: 11 }, { x: 7, y: 11 }, { x: 6, y: 11 }],
  dir: "right",
  nextDir: "right",
  food: { x: 15, y: 11 },
  growBy: 0,
  speed: 130,
  alive: true,
  started: false,
  paused: false,
  ripple: null,
  diedAt: 0,
});

const SnakeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<GameState>(freshState());

  // UI mirror state (drives overlays/stats; the game loop reads stRef, not these)
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [scorePulse, setScorePulse] = useState(0);
  const touch = isTouchDevice();

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  useEffect(() => {
    try {
      const hs = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      if (!isNaN(hs)) setHighScore(hs);
    } catch { /* ignore */ }
    unlock("snake-played");
  }, []);

  const placeFood = (st: GameState) => {
    const occ = new Set(st.snake.map((p) => `${p.x},${p.y}`));
    let f: Point;
    do {
      f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (occ.has(`${f.x},${f.y}`));
    st.food = f;
  };

  // Begin a new game. Optional first direction (from the key/swipe that started it).
  const begin = (firstDir?: Direction) => {
    const st = freshState();
    st.started = true;
    if (firstDir && OPPOSITE[st.dir] !== firstDir) {
      st.dir = firstDir;
      st.nextDir = firstDir;
    }
    placeFood(st);
    stRef.current = st;
    setScore(0);
    setLength(3);
    setOver(false);
    setPaused(false);
    setStarted(true);
  };

  const setDir = (dir: Direction) => {
    const st = stRef.current;
    if (!st.started || st.alive === false) {
      begin(dir);
      return;
    }
    // Prevent reversing into self (compare against the last committed dir)
    if (OPPOSITE[st.dir] !== dir) st.nextDir = dir;
  };

  const togglePause = () => {
    const st = stRef.current;
    if (st.alive === false) { begin(); return; }
    if (!st.started) { begin(); return; }
    st.paused = !st.paused;
    setPaused(st.paused);
  };

  const die = (st: GameState) => {
    st.alive = false;
    st.diedAt = performance.now();
    setOver(true);
    setScore((sc) => {
      if (sc > highScore) {
        setHighScore(sc);
        try { localStorage.setItem(HS_KEY, String(sc)); } catch { /* ignore */ }
      }
      if (sc >= 50) unlock("snake-50");
      if (sc >= 100) unlock("snake-100");
      return sc;
    });
  };

  const step = (st: GameState) => {
    st.dir = st.nextDir;
    const d = DELTA[st.dir];
    const head = st.snake[0];
    const nh: Point = { x: head.x + d.x, y: head.y + d.y };

    // Wall = death (no wrap)
    if (nh.x < 0 || nh.x >= GRID || nh.y < 0 || nh.y >= GRID) { die(st); return; }
    // Self = death
    if (st.snake.some((p) => p.x === nh.x && p.y === nh.y)) { die(st); return; }

    st.snake.unshift(nh);

    if (nh.x === st.food.x && nh.y === st.food.y) {
      st.growBy += 1;
      st.ripple = { x: st.food.x, y: st.food.y, t: performance.now() };
      st.speed = Math.max(60, st.speed - 3);
      placeFood(st);
      setScore((sc) => sc + 10);
      setScorePulse((p) => p + 1);
      setLength(st.snake.length);
    }

    if (st.growBy > 0) st.growBy -= 1;
    else st.snake.pop();
  };

  // Single stable render+tick loop (reads refs, never re-subscribes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Crisp canvas: backing store scaled by devicePixelRatio
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = LOGICAL * dpr;
    canvas.height = LOGICAL * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const st = stRef.current;

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, LOGICAL, LOGICAL);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID; i++) {
        const o = i * CELL + 0.5;
        ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o, LOGICAL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, o); ctx.lineTo(LOGICAL, o); ctx.stroke();
      }

      // Walls
      const deadFlash = !st.alive && now - st.diedAt < 600;
      const wp = deadFlash ? 1 - (now - st.diedAt) / 600 : 0;
      ctx.strokeStyle = deadFlash
        ? `rgba(248,113,113,${0.4 + wp * 0.6})`
        : "rgba(129,140,248,0.22)";
      ctx.lineWidth = deadFlash ? 3 + wp * 4 : 2;
      ctx.strokeRect(1, 1, LOGICAL - 2, LOGICAL - 2);

      // Eat ripple
      if (st.ripple) {
        const age = (now - st.ripple.t) / 400;
        if (age < 1) {
          ctx.beginPath();
          ctx.arc(st.ripple.x * CELL + CELL / 2, st.ripple.y * CELL + CELL / 2, age * CELL * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(74,222,128,${(1 - age) * 0.6})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else st.ripple = null;
      }

      // Food
      const pulse = (Math.sin(now / 300) + 1) / 2;
      ctx.save();
      ctx.shadowColor = FOOD;
      ctx.shadowBlur = 8 + pulse * 6;
      ctx.fillStyle = FOOD;
      const fs = CELL - 6 - pulse * 2;
      const fp = (CELL - fs) / 2;
      ctx.beginPath();
      ctx.roundRect(st.food.x * CELL + fp, st.food.y * CELL + fp, fs, fs, 4);
      ctx.fill();
      ctx.restore();

      // Snake - gradient head to tail
      const len = st.snake.length;
      st.snake.forEach((p, i) => {
        const t = len > 1 ? i / (len - 1) : 0;
        ctx.fillStyle = lerpColor(HEAD_RGB, TAIL_RGB, t);
        if (deadFlash) ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(now / 70));
        const pad = i === 0 ? 1.5 : 2;
        ctx.beginPath();
        ctx.roundRect(p.x * CELL + pad, p.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, i === 0 ? 6 : 4);
        ctx.fill();
        if (i === 0) {
          // Two eyes shifted toward the direction of travel
          ctx.fillStyle = "#09090b";
          const e = CELL * 0.12;
          const cx = p.x * CELL + CELL / 2;
          const cy = p.y * CELL + CELL / 2;
          const dx = DELTA[st.dir].x, dy = DELTA[st.dir].y;
          const fwd = CELL * 0.18; // forward offset
          const sep = CELL * 0.2;  // perpendicular separation
          // perpendicular axis
          const px = dy, py = dx;
          ctx.beginPath();
          ctx.arc(cx + dx * fwd + px * sep, cy + dy * fwd + py * sep, e, 0, Math.PI * 2);
          ctx.arc(cx + dx * fwd - px * sep, cy + dy * fwd - py * sep, e, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const st = stRef.current;
      if (st.started && st.alive && !st.paused) {
        if (now - last >= st.speed) {
          step(st);
          last = now;
        }
      } else {
        last = now; // keep timer fresh while idle/paused
      }
      draw(now);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      if (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA") return;
      const map: Record<string, Direction> = {
        ArrowUp: "up", w: "up", ArrowDown: "down", s: "down",
        ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right",
      };
      const dir = map[e.key] || map[e.key.toLowerCase()];
      if (dir) { e.preventDefault(); setDir(dir); return; }
      if (e.key === " ") { e.preventDefault(); togglePause(); }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); begin(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore]);

  // Touch swipe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; };
    const te = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    };
    canvas.addEventListener("touchstart", ts, { passive: true });
    canvas.addEventListener("touchend", te, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", ts);
      canvas.removeEventListener("touchend", te);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box maxW="780px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
      <HStack spacing={4} mb={6}>
        <RouterLink to="/play">
          <Text fontSize="11px" color="brand.400" fontFamily="mono" _hover={{ color: "brand.300" }}>← games</Text>
        </RouterLink>
        <RouterLink to="/">
          <Text fontSize="11px" color="gray.600" fontFamily="mono" _hover={{ color: "brand.300" }}>home</Text>
        </RouterLink>
      </HStack>

      <HStack justify="space-between" align="flex-end" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Mini-Game · Snake
          </Text>
          <Heading size="lg">slither</Heading>
        </Box>
        <HStack spacing={4} fontFamily="mono" fontSize="13px">
          <HStack spacing={1.5}>
            <Text color="gray.500">score</Text>
            <MotionBox key={scorePulse} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.25 }}>
              <Text color="brand.400" fontWeight="700">{score}</Text>
            </MotionBox>
          </HStack>
          <HStack spacing={1.5}>
            <Text color="gray.500">len</Text>
            <Text color="gray.300" fontWeight="700">{length}</Text>
          </HStack>
          <HStack spacing={1.5}>
            <Icon as={FaTrophy as ElementType} boxSize={3} color="yellow.500" />
            <Text color="gray.500">best</Text>
            <Text color="yellow.400" fontWeight="700">{highScore}</Text>
          </HStack>
        </HStack>
      </HStack>

      {/* Canvas */}
      <Box
        position="relative"
        borderRadius="12px"
        border="1px solid"
        borderColor={border}
        overflow="hidden"
        bg="#09090b"
        mx="auto"
        w="100%"
        maxW={`${LOGICAL}px`}
        sx={{ aspectRatio: "1" }}
        boxShadow={started && !over && !paused ? "0 0 24px rgba(99,102,241,0.18)" : "none"}
      >
        <Box
          as="canvas"
          ref={canvasRef}
          display="block"
          w="100%"
          h="100%"
          sx={{ touchAction: "none", imageRendering: "auto" }}
        />

        {/* NOT STARTED */}
        {!started && !over && (
          <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)">
            <Stack spacing={4} align="center" maxW="320px" px={4}>
              <MotionBox animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                <Text fontFamily="mono" fontSize="md" fontWeight="700"
                  color="brand.400" letterSpacing="0.2em" textAlign="center">
                  ▶ WAITING TO START
                </Text>
              </MotionBox>
              <Text fontFamily="mono" fontSize="13px" color="gray.300" textAlign="center" lineHeight="1.7">
                {touch ? "tap a direction below or swipe to begin" : "press space or any arrow key"}
              </Text>
              <Button size="md" onClick={() => begin()} variant="glow"
                leftIcon={<Icon as={FaPlay as ElementType} boxSize={3} />}>
                start
              </Button>
              <Text fontFamily="mono" fontSize="10px" color="gray.600" textAlign="center" lineHeight="1.8">
                {touch ? "swipe inside grid · D-pad below" : "↑↓←→ or WASD · space pause · R restart"}
              </Text>
              <Text fontFamily="mono" fontSize="10px" color="red.300" textAlign="center">
                ⚠ hit a wall or yourself = game over
              </Text>
            </Stack>
          </Box>
        )}

        {/* Paused */}
        {paused && started && !over && (
          <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.75)" backdropFilter="blur(2px)">
            <Stack spacing={2} align="center">
              <Icon as={FaPause as ElementType} color="brand.400" boxSize={8} />
              <Text fontFamily="mono" fontSize="sm" color="gray.300" fontWeight="600">paused</Text>
              <Text fontFamily="mono" fontSize="10px" color="gray.500">space to resume</Text>
            </Stack>
          </Box>
        )}

        {/* Game over */}
        {over && (
          <MotionBox position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Stack spacing={3} align="center">
              <Text fontFamily="mono" fontSize="2xl" color="red.400" fontWeight="700">game over</Text>
              <HStack spacing={4} fontFamily="mono" fontSize="sm">
                <Text color="gray.400">score: <Text as="span" color="brand.400" fontWeight="700">{score}</Text></Text>
                {score === highScore && score > 0 && <Text color="yellow.400">★ new best</Text>}
              </HStack>
              <Button size="sm" onClick={() => begin()} variant="glow"
                leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>
                play again
              </Button>
            </Stack>
          </MotionBox>
        )}
      </Box>

      {/* D-pad */}
      <Box mt={5} mx="auto" w="fit-content">
        <Text fontSize="10px" color="gray.600" fontFamily="mono"
          textAlign="center" mb={2} display={{ base: "block", md: "none" }}>
          tap to play
        </Text>
        <Stack spacing={1} align="center">
          <DPadBtn onClick={() => setDir("up")} icon={FaChevronUp} ariaLabel="up" />
          <HStack spacing={1}>
            <DPadBtn onClick={() => setDir("left")} icon={FaChevronLeft} ariaLabel="left" />
            <Button size="sm" onClick={togglePause} variant="ghost" color="gray.500"
              fontFamily="mono" fontSize="10px" h="44px" w="44px" p={0}>
              {!started ? "▶" : paused ? "▶" : "⏸"}
            </Button>
            <DPadBtn onClick={() => setDir("right")} icon={FaChevronRight} ariaLabel="right" />
          </HStack>
          <DPadBtn onClick={() => setDir("down")} icon={FaChevronDown} ariaLabel="down" />
        </Stack>
      </Box>

      <Stack spacing={1} mt={6} align="center">
        <HStack fontSize="11px" fontFamily="mono" color="gray.600" spacing={4}>
          <Icon as={FaKeyboard as ElementType} boxSize={3} />
          <Text>arrows · WASD · space pause · R restart</Text>
        </HStack>
        <Text fontSize="10px" color="gray.600" fontFamily="mono">
          walls = death · score 50 / 100 unlocks achievements
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

export default SnakeGame;
