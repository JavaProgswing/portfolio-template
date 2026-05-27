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
const CELL = 22;
const CANVAS = GRID * CELL;
const COLORS = {
  bg: "#09090b",
  grid: "rgba(255,255,255,0.025)",
  snake: "#a5b4fc",
  snakeHead: "#6366f1",
  food: "#4ade80",
};

type Direction = "up" | "down" | "left" | "right";
type Point = { x: number; y: number };

const OPPOSITES: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};
const DIR_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const HS_KEY = "portfolio-snake-highscore";

const SnakeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }],
    dir: "right" as Direction,
    nextDir: "right" as Direction,
    food: { x: 15, y: 11 },
    growBy: 0,
    speed: 130,
    alive: true,
  });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
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

  const placeFood = () => {
    const s = stateRef.current;
    const occupied = new Set(s.snake.map((p) => `${p.x},${p.y}`));
    let f: Point;
    do {
      f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (occupied.has(`${f.x},${f.y}`));
    s.food = f;
  };

  const reset = () => {
    stateRef.current = {
      snake: [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }],
      dir: "right",
      nextDir: "right",
      food: { x: 15, y: 11 },
      growBy: 0,
      speed: 130,
      alive: true,
    };
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
    placeFood();
  };

  const changeDir = (dir: Direction) => {
    const cur = stateRef.current.dir;
    if (OPPOSITES[cur] !== dir) stateRef.current.nextDir = dir;
    if (!started) reset();
  };

  const step = () => {
    const s = stateRef.current;
    if (!s.alive) return;

    s.dir = s.nextDir;
    const d = DIR_DELTA[s.dir];
    const head = s.snake[0];
    const newHead: Point = {
      x: (head.x + d.x + GRID) % GRID,
      y: (head.y + d.y + GRID) % GRID,
    };

    if (s.snake.some((p) => p.x === newHead.x && p.y === newHead.y)) {
      s.alive = false;
      setGameOver(true);
      setScore((sc) => {
        if (sc > highScore) {
          setHighScore(sc);
          try { localStorage.setItem(HS_KEY, String(sc)); } catch { /* ignore */ }
        }
        if (sc >= 50) unlock("snake-50");
        if (sc >= 100) unlock("snake-100");
        return sc;
      });
      return;
    }

    s.snake.unshift(newHead);

    if (newHead.x === s.food.x && newHead.y === s.food.y) {
      s.growBy += 1;
      setScore((sc) => sc + 10);
      setScorePulse((p) => p + 1);
      placeFood();
      s.speed = Math.max(60, s.speed - 3);
    }

    if (s.growBy > 0) s.growBy -= 1;
    else s.snake.pop();
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS, CANVAS);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, CANVAS); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5); ctx.lineTo(CANVAS, i * CELL + 0.5); ctx.stroke();
    }

    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    const foodSize = CELL - 6 - pulse * 2;
    const foodPad = (CELL - foodSize) / 2;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.roundRect(
      s.food.x * CELL + foodPad,
      s.food.y * CELL + foodPad,
      foodSize, foodSize, 4
    );
    ctx.fill();

    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
      const pad = 2;
      ctx.beginPath();
      ctx.roundRect(
        p.x * CELL + pad, p.y * CELL + pad,
        CELL - pad * 2, CELL - pad * 2,
        i === 0 ? 6 : 4
      );
      ctx.fill();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!started || paused || gameOver) {
        draw(ctx);
        return;
      }
      const s = stateRef.current;
      if (now - last >= s.speed) {
        step();
        last = now;
      }
      draw(ctx);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, paused, gameOver]);

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
      if (dir) { e.preventDefault(); changeDir(dir); return; }

      if (e.key === " ") {
        e.preventDefault();
        if (gameOver) reset();
        else if (started) setPaused((p) => !p);
        else reset();
      }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, gameOver]);

  // Touch swipe (alternative to D-pad)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
      changeDir(dir);
    };
    canvas.addEventListener("touchstart", ts, { passive: true });
    canvas.addEventListener("touchend", te, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", ts);
      canvas.removeEventListener("touchend", te);
    };
  }, [started]);

  return (
    <Box maxW="780px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
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
            Mini-Game · Snake
          </Text>
          <Heading size="lg">slither</Heading>
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

      {/* Canvas */}
      <Box
        position="relative"
        borderRadius="12px"
        border="1px solid"
        borderColor={border}
        overflow="hidden"
        bg={COLORS.bg}
        mx="auto"
        w="fit-content"
        maxW="100%"
        boxShadow={started && !gameOver && !paused ? "0 0 24px rgba(99,102,241,0.18)" : "none"}
        sx={{ transition: "box-shadow 0.4s" }}
      >
        <Box
          as="canvas"
          ref={canvasRef}
          width={CANVAS}
          height={CANVAS}
          display="block"
          maxW="100%"
          sx={{ touchAction: "none" }}
        />

        {/* Big overlay: NOT STARTED */}
        {!started && !gameOver && (
          <Box position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)">
            <Stack spacing={4} align="center" maxW="320px" px={4}>
              <MotionBox
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Text fontFamily="mono" fontSize="md" fontWeight="700"
                  color="brand.400" letterSpacing="0.2em" textAlign="center">
                  ▶ WAITING TO START
                </Text>
              </MotionBox>
              <Text fontFamily="mono" fontSize="13px" color="gray.300" textAlign="center" lineHeight="1.7">
                {touch
                  ? "tap a direction below or swipe to begin"
                  : "press space or any arrow key"}
              </Text>
              <Button size="md" onClick={reset} variant="glow"
                leftIcon={<Icon as={FaPlay as ElementType} boxSize={3} />}>
                start
              </Button>
              <Text fontFamily="mono" fontSize="10px" color="gray.600" textAlign="center" lineHeight="1.8">
                {touch ? "swipe inside grid · D-pad below" : "↑↓←→ or WASD · space pause · R restart"}
              </Text>
            </Stack>
          </Box>
        )}

        {/* Paused */}
        {paused && started && !gameOver && (
          <Box position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.75)" backdropFilter="blur(2px)">
            <Stack spacing={2} align="center">
              <Icon as={FaPause as ElementType} color="brand.400" boxSize={8} />
              <Text fontFamily="mono" fontSize="sm" color="gray.300" fontWeight="600">paused</Text>
              <Text fontFamily="mono" fontSize="10px" color="gray.500">
                space to resume
              </Text>
            </Stack>
          </Box>
        )}

        {/* Game over */}
        {gameOver && (
          <MotionBox position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.92)" backdropFilter="blur(4px)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Stack spacing={3} align="center">
              <Text fontFamily="mono" fontSize="2xl" color="red.400" fontWeight="700">
                game over
              </Text>
              <HStack spacing={4} fontFamily="mono" fontSize="sm">
                <Text color="gray.400">
                  score:{" "}
                  <Text as="span" color="brand.400" fontWeight="700">{score}</Text>
                </Text>
                {score === highScore && score > 0 && (
                  <Text color="yellow.400">★ new best</Text>
                )}
              </HStack>
              <Button size="sm" onClick={reset} variant="glow"
                leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>
                play again
              </Button>
            </Stack>
          </MotionBox>
        )}
      </Box>

      {/* D-pad — always shown on touch, optional on desktop */}
      {(touch || true) && (
        <Box mt={5} mx="auto" w="fit-content">
          <Text fontSize="10px" color="gray.600" fontFamily="mono"
            textAlign="center" mb={2} display={{ base: "block", md: "none" }}>
            tap to play
          </Text>
          <Stack spacing={1} align="center">
            <DPadBtn onClick={() => changeDir("up")} icon={FaChevronUp} ariaLabel="up" />
            <HStack spacing={1}>
              <DPadBtn onClick={() => changeDir("left")} icon={FaChevronLeft} ariaLabel="left" />
              <Button
                size="sm"
                onClick={() => {
                  if (gameOver) reset();
                  else if (started) setPaused((p) => !p);
                  else reset();
                }}
                variant="ghost"
                color="gray.500"
                fontFamily="mono"
                fontSize="10px"
                h="44px" w="44px"
                p={0}
              >
                {!started ? "▶" : paused ? "▶" : "⏸"}
              </Button>
              <DPadBtn onClick={() => changeDir("right")} icon={FaChevronRight} ariaLabel="right" />
            </HStack>
            <DPadBtn onClick={() => changeDir("down")} icon={FaChevronDown} ariaLabel="down" />
          </Stack>
        </Box>
      )}

      <Stack spacing={1} mt={6} align="center">
        <HStack fontSize="11px" fontFamily="mono" color="gray.600" spacing={4}>
          <Icon as={FaKeyboard as ElementType} boxSize={3} />
          <Text>arrows · WASD · space pause · R restart</Text>
        </HStack>
        <Text fontSize="10px" color="gray.600" fontFamily="mono">
          score 50 / 100 unlocks achievements
        </Text>
      </Stack>
    </Box>
  );
};

// ── D-pad button ─────────────────────────────────────────────────────────────

interface DPadProps {
  onClick: () => void;
  icon: IconType;
  ariaLabel: string;
}

const DPadBtn = ({ onClick, icon: I, ariaLabel }: DPadProps) => {
  return (
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
};

export default SnakeGame;
