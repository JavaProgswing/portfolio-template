import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Input,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlay, FaPause, FaRedo, FaTrophy } from "react-icons/fa";
import { unlock } from "../lib/achievements";

const MotionBox = motion(Box);

// ── Game constants ───────────────────────────────────────────────────────────

const GRID = 22;
const CELL = 22;
const CANVAS = GRID * CELL;
const COLORS = {
  bg: "#09090b",
  grid: "rgba(255,255,255,0.025)",
  snake: "#a5b4fc",      // brand.300
  snakeHead: "#6366f1",  // brand.500
  food: "#4ade80",       // green
  border: "rgba(255,255,255,0.08)",
};

type Direction = "up" | "down" | "left" | "right";
type Point = { x: number; y: number };

const OPPOSITES: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};

const DIR_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const HS_KEY = "portfolio-snake-highscore";

// ── Snake game component ─────────────────────────────────────────────────────

const PlayPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }],
    dir: "right" as Direction,
    nextDir: "right" as Direction,
    food: { x: 15, y: 11 },
    growBy: 0,
    lastStep: 0,
    speed: 130, // ms per step
    alive: true,
  });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  // ── Load high score ────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const hs = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      if (!isNaN(hs)) setHighScore(hs);
    } catch { /* ignore */ }
    unlock("snake-played");
  }, []);

  // ── Place food in random empty cell ────────────────────────────────────────
  const placeFood = () => {
    const s = stateRef.current;
    const occupied = new Set(s.snake.map((p) => `${p.x},${p.y}`));
    let f: Point;
    do {
      f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (occupied.has(`${f.x},${f.y}`));
    s.food = f;
  };

  // ── Reset / start ──────────────────────────────────────────────────────────
  const reset = () => {
    stateRef.current = {
      snake: [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }],
      dir: "right",
      nextDir: "right",
      food: { x: 15, y: 11 },
      growBy: 0,
      lastStep: 0,
      speed: 130,
      alive: true,
    };
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
    placeFood();
  };

  // ── Step ───────────────────────────────────────────────────────────────────
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

    // Self collision
    if (s.snake.some((p) => p.x === newHead.x && p.y === newHead.y)) {
      s.alive = false;
      setGameOver(true);
      // High score update
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

    // Food
    if (newHead.x === s.food.x && newHead.y === s.food.y) {
      s.growBy += 1;
      setScore((sc) => sc + 10);
      placeFood();
      // Speed up slightly per food
      s.speed = Math.max(60, s.speed - 3);
    }

    if (s.growBy > 0) s.growBy -= 1;
    else s.snake.pop();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS, CANVAS);

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, CANVAS);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(CANVAS, i * CELL + 0.5);
      ctx.stroke();
    }

    // Food (pulsing)
    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    const foodSize = CELL - 6 - pulse * 2;
    const foodPad = (CELL - foodSize) / 2;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.roundRect(
      s.food.x * CELL + foodPad,
      s.food.y * CELL + foodPad,
      foodSize,
      foodSize,
      4
    );
    ctx.fill();

    // Snake
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
      const pad = 2;
      ctx.beginPath();
      ctx.roundRect(
        p.x * CELL + pad,
        p.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        i === 0 ? 6 : 4
      );
      ctx.fill();
    });
  };

  // ── Main loop ──────────────────────────────────────────────────────────────
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

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow typing in inputs (suggestion form)
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const dirs: Record<string, Direction> = {
        ArrowUp: "up", w: "up",
        ArrowDown: "down", s: "down",
        ArrowLeft: "left", a: "left",
        ArrowRight: "right", d: "right",
      };
      const key = e.key.toLowerCase();
      const dir = dirs[e.key] || dirs[key];
      if (dir) {
        e.preventDefault();
        const cur = stateRef.current.dir;
        if (OPPOSITES[cur] !== dir) stateRef.current.nextDir = dir;
        if (!started) reset();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (gameOver) reset();
        else if (started) setPaused((p) => !p);
        else reset();
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, gameOver]);

  // ── Touch (mobile swipe) ───────────────────────────────────────────────────
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
      const cur = stateRef.current.dir;
      if (OPPOSITES[cur] !== dir) stateRef.current.nextDir = dir;
      if (!started) reset();
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
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <HStack justify="space-between" align="flex-end" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Mini-Game
          </Text>
          <Heading size="lg">Snake</Heading>
        </Box>
        <HStack spacing={4} fontFamily="mono" fontSize="13px">
          <HStack spacing={1.5}>
            <Text color="gray.500">score</Text>
            <Text color="brand.400" fontWeight="700">{score}</Text>
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

        {/* Overlay: start prompt */}
        {!started && !gameOver && (
          <Box position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.85)" backdropFilter="blur(4px)">
            <Stack spacing={3} align="center">
              <Text fontFamily="mono" fontSize="sm" color="gray.300">
                press <Text as="code" color="brand.400">space</Text> or any arrow key
              </Text>
              <Text fontFamily="mono" fontSize="11px" color="gray.500">
                arrows or wasd · space to pause · r to restart
              </Text>
              <Button size="sm" onClick={reset} variant="glow"
                leftIcon={<Icon as={FaPlay as ElementType} boxSize={3} />}>
                start
              </Button>
            </Stack>
          </Box>
        )}

        {/* Overlay: paused */}
        {paused && started && !gameOver && (
          <Box position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.7)" backdropFilter="blur(2px)">
            <Stack spacing={2} align="center">
              <Icon as={FaPause as ElementType} color="brand.400" boxSize={6} />
              <Text fontFamily="mono" fontSize="xs" color="gray.400">paused</Text>
            </Stack>
          </Box>
        )}

        {/* Overlay: game over */}
        {gameOver && (
          <MotionBox position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.88)" backdropFilter="blur(4px)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Stack spacing={3} align="center">
              <Text fontFamily="mono" fontSize="2xl" color="red.400" fontWeight="700">
                game over
              </Text>
              <HStack spacing={4} fontFamily="mono" fontSize="sm">
                <Text color="gray.400">score: <Text as="span" color="brand.400" fontWeight="700">{score}</Text></Text>
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

      <Text fontSize="10px" color="gray.600" fontFamily="mono" textAlign="center" mt={3}>
        score 50 / 100 unlocks achievements · type <Text as="code" color="brand.400">achievements</Text> in /console
      </Text>

      {/* Suggestion form */}
      <SuggestionForm />
    </Box>
  );
};

// ── Suggestion form (only renders if backend is reachable) ───────────────────

const SuggestionForm = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const toast = useToast();
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  useEffect(() => {
    fetch("/api/portfolio/health", { signal: AbortSignal.timeout(3000) })
      .then((r) => setAvailable(r.ok))
      .catch(() => setAvailable(false));
  }, []);

  if (available === false) return null;

  const submit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "anonymous",
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("failed");
      unlock("suggester");
      setName(""); setMessage("");
      toast({
        title: "✓ thanks for the suggestion",
        description: "moderated before publishing",
        status: "success",
        duration: 3000,
        position: "bottom-left",
        variant: "subtle",
      });
    } catch {
      toast({
        title: "couldn't submit",
        description: "backend offline?",
        status: "error",
        duration: 3000,
        position: "bottom-left",
        variant: "subtle",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box mt={10}>
      <Text fontSize="10px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={3} textTransform="uppercase">
        Got Feedback?
      </Text>
      <Text fontSize="sm" color="gray.400" mb={4} maxW="500px" lineHeight="1.7">
        Spotted a bug, want a feature, or have a thought about the site? Suggestions are
        moderated before anything ships.
      </Text>
      <Box p={4} layerStyle="card" border="1px solid" borderColor={border} borderRadius="12px">
        <Stack spacing={3}>
          <Input
            placeholder="name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            size="sm"
            isDisabled={submitting}
          />
          <Textarea
            placeholder="your suggestion…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            size="sm"
            rows={3}
            resize="vertical"
            isDisabled={submitting}
          />
          <HStack justify="space-between">
            <Text fontSize="11px" color="gray.600" fontFamily="mono">
              {message.length}/500
            </Text>
            <Button
              onClick={submit}
              size="sm"
              variant="glow"
              isLoading={submitting}
              isDisabled={!message.trim()}
            >
              send
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
};

export default PlayPage;
