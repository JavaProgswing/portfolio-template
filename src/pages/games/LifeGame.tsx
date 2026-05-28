import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { IconType } from "react-icons";
import { FaPlay, FaPause, FaStepForward, FaTrash, FaRandom } from "react-icons/fa";
import { unlock } from "../../lib/achievements";

const COLS = 50;
const ROWS = 32;
const ALIVE = "#818cf8";
const DEAD = "#0d0d12";

type Grid = Uint8Array; // flat ROWS*COLS

const idx = (r: number, c: number) => r * COLS + c;

const emptyGrid = (): Grid => new Uint8Array(ROWS * COLS);

const randomGrid = (): Grid => {
  const g = emptyGrid();
  for (let i = 0; i < g.length; i++) g[i] = Math.random() < 0.28 ? 1 : 0;
  return g;
};

const nextGen = (g: Grid): Grid => {
  const n = emptyGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let live = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = (r + dr + ROWS) % ROWS; // toroidal wrap
          const cc = (c + dc + COLS) % COLS;
          live += g[idx(rr, cc)];
        }
      const alive = g[idx(r, c)];
      n[idx(r, c)] = alive ? (live === 2 || live === 3 ? 1 : 0) : (live === 3 ? 1 : 0);
    }
  }
  return n;
};

// Presets stamped near center
const stampGlider = (g: Grid, r0: number, c0: number) => {
  [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]].forEach(([r, c]) => {
    g[idx((r0 + r) % ROWS, (c0 + c) % COLS)] = 1;
  });
};
const stampPulsar = (g: Grid, r0: number, c0: number) => {
  const pts = [2, 3, 4, 8, 9, 10];
  const set = (r: number, c: number) => { g[idx((r0 + r + ROWS) % ROWS, (c0 + c + COLS) % COLS)] = 1; };
  pts.forEach((i) => {
    set(0, i); set(5, i); set(7, i); set(12, i);
    set(i, 0); set(i, 5); set(i, 7); set(i, 12);
  });
};

const LifeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>(randomGrid());
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState(0);
  const [pop, setPop] = useState(0);
  const [speed, setSpeed] = useState(8); // gens/sec
  const [cell, setCell] = useState(11);
  const paintingRef = useRef<0 | 1 | null>(null);

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  useEffect(() => { unlock("life-played"); }, []);

  // Measure cell size to fit container width
  useEffect(() => {
    const measure = () => {
      const w = canvasRef.current?.parentElement?.offsetWidth || 560;
      setCell(Math.max(6, Math.floor(w / COLS)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gridRef.current;
    ctx.fillStyle = DEAD;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (g[idx(r, c)]) {
          count++;
          ctx.fillStyle = ALIVE;
          ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
        }
      }
    setPop(count);
  };

  // Redraw when cell size changes
  useEffect(() => { draw(); /* eslint-disable-next-line */ }, [cell]);

  // Generation loop
  useEffect(() => {
    if (!running) return;
    const interval = 1000 / speed;
    const id = setInterval(() => {
      gridRef.current = nextGen(gridRef.current);
      setGen((x) => x + 1);
      draw();
    }, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, cell]);

  const cellFromEvent = (clientX: number, clientY: number): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const c = Math.floor(((clientX - rect.left) * scaleX) / cell);
    const r = Math.floor(((clientY - rect.top) * scaleY) / cell);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return [r, c];
  };

  const paint = (r: number, c: number, val: 0 | 1) => {
    gridRef.current[idx(r, c)] = val;
    draw();
  };

  const onDown = (e: React.MouseEvent) => {
    const pos = cellFromEvent(e.clientX, e.clientY);
    if (!pos) return;
    const [r, c] = pos;
    const val: 0 | 1 = gridRef.current[idx(r, c)] ? 0 : 1;
    paintingRef.current = val;
    paint(r, c, val);
  };
  const onMove = (e: React.MouseEvent) => {
    if (paintingRef.current === null) return;
    const pos = cellFromEvent(e.clientX, e.clientY);
    if (!pos) return;
    paint(pos[0], pos[1], paintingRef.current);
  };
  const onUp = () => { paintingRef.current = null; };

  const onTouch = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const pos = cellFromEvent(t.clientX, t.clientY);
    if (!pos) return;
    paint(pos[0], pos[1], 1);
  };

  const reset = (g: Grid) => {
    gridRef.current = g;
    setGen(0);
    draw();
  };

  const step = () => {
    gridRef.current = nextGen(gridRef.current);
    setGen((x) => x + 1);
    draw();
  };

  return (
    <Box maxW="640px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
      <HStack spacing={4} mb={6}>
        <RouterLink to="/play">
          <Text fontSize="11px" color="brand.400" fontFamily="mono" _hover={{ color: "brand.300" }}>← games</Text>
        </RouterLink>
        <RouterLink to="/">
          <Text fontSize="11px" color="gray.600" fontFamily="mono" _hover={{ color: "brand.300" }}>home</Text>
        </RouterLink>
      </HStack>

      <HStack justify="space-between" align="flex-end" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Toy · Cellular Automaton
          </Text>
          <Heading size="lg">game of life</Heading>
        </Box>
        <HStack spacing={4} fontFamily="mono" fontSize="13px">
          <HStack spacing={1.5}>
            <Text color="gray.500">gen</Text>
            <Text color="brand.400" fontWeight="700">{gen}</Text>
          </HStack>
          <HStack spacing={1.5}>
            <Text color="gray.500">pop</Text>
            <Text color="gray.300" fontWeight="700">{pop}</Text>
          </HStack>
        </HStack>
      </HStack>

      {/* Canvas */}
      <Box borderRadius="12px" overflow="hidden" border="1px solid" borderColor={border} bg={DEAD}>
        <Box
          as="canvas"
          ref={canvasRef}
          width={COLS * cell}
          height={ROWS * cell}
          display="block"
          w="100%"
          sx={{ touchAction: "none", cursor: "crosshair", imageRendering: "pixelated" }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onTouch}
          onTouchMove={onTouch}
        />
      </Box>

      {/* Controls */}
      <Stack spacing={4} mt={5}>
        <HStack justify="center" spacing={2} flexWrap="wrap">
          <Button size="sm" variant="glow" onClick={() => setRunning((r) => !r)}
            leftIcon={<Icon as={(running ? FaPause : FaPlay) as ElementType} boxSize={3} />}>
            {running ? "pause" : "play"}
          </Button>
          <CtrlBtn onClick={step} icon={FaStepForward} label="step" />
          <CtrlBtn onClick={() => { setRunning(false); reset(emptyGrid()); }} icon={FaTrash} label="clear" />
          <CtrlBtn onClick={() => reset(randomGrid())} icon={FaRandom} label="random" />
        </HStack>

        <HStack justify="center" spacing={2} flexWrap="wrap">
          <Text fontSize="10px" fontFamily="mono" color="gray.600">presets:</Text>
          <PresetBtn label="glider" onClick={() => { const g = emptyGrid(); stampGlider(g, 2, 2); reset(g); }} />
          <PresetBtn label="pulsar" onClick={() => { const g = emptyGrid(); stampPulsar(g, ROWS / 2 - 6, COLS / 2 - 6); reset(g); }} />
          <PresetBtn label="glider gun" onClick={() => { const g = emptyGrid(); GLIDER_GUN.forEach(([r, c]) => { g[idx(r + 2, c + 2)] = 1; }); reset(g); }} />
        </HStack>

        <HStack justify="center" spacing={3} maxW="280px" mx="auto">
          <Text fontSize="10px" fontFamily="mono" color="gray.600" whiteSpace="nowrap">speed {speed}/s</Text>
          <Slider min={1} max={30} value={speed} onChange={setSpeed} colorScheme="purple">
            <SliderTrack><SliderFilledTrack /></SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>
        </HStack>
      </Stack>

      <Text mt={5} textAlign="center" fontSize="10px" color="gray.600" fontFamily="mono">
        click/drag to draw cells · toroidal grid · B3/S23 rules
      </Text>
    </Box>
  );
};

// Gosper glider gun coordinates (relative)
const GLIDER_GUN: [number, number][] = [
  [5, 1], [5, 2], [6, 1], [6, 2],
  [5, 11], [6, 11], [7, 11], [4, 12], [8, 12], [3, 13], [9, 13], [3, 14], [9, 14],
  [6, 15], [4, 16], [8, 16], [5, 17], [6, 17], [7, 17], [6, 18],
  [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22], [2, 23], [6, 23],
  [1, 25], [2, 25], [6, 25], [7, 25],
  [3, 35], [4, 35], [3, 36], [4, 36],
];

const CtrlBtn = ({ onClick, icon: I, label }: { onClick: () => void; icon: IconType; label: string }) => (
  <Button size="sm" variant="outline" onClick={onClick}
    borderColor="rgba(255,255,255,0.14)" color="gray.400" fontFamily="mono" fontSize="11px"
    leftIcon={<Icon as={I as ElementType} boxSize={2.5} />}
    _hover={{ color: "gray.100", borderColor: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" }}>
    {label}
  </Button>
);

const PresetBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <Button size="xs" variant="ghost" onClick={onClick} color="brand.400" fontFamily="mono" fontSize="10px"
    _hover={{ bg: "rgba(99,102,241,0.1)" }}>
    {label}
  </Button>
);

export default LifeGame;
