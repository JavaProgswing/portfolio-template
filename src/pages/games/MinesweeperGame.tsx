import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaRedo, FaFlag, FaBomb, FaTrophy } from "react-icons/fa";
import { unlock } from "../../lib/achievements";
import { isTouchDevice } from "./common";

const MotionBox = motion(Box);
const COLS = 10;
const ROWS = 10;
const MINES = 15;
const BEST_KEY = "portfolio-mines-best";

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adj: number;
}

const NUM_COLOR = ["", "#60a5fa", "#4ade80", "#f87171", "#a78bfa", "#fb923c", "#22d3ee", "#e4e4e7", "#a1a1aa"];

const makeEmpty = (): Cell[][] =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
  );

const neighbors = (r: number, c: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push([nr, nc]);
    }
  return out;
};

const MinesweeperGame = () => {
  const [grid, setGrid] = useState<Cell[][]>(makeEmpty);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState<"win" | "lose" | null>(null);
  const [flags, setFlags] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState(0);
  const startAtRef = useRef<number | null>(null);
  const touch = isTouchDevice();

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
  const hiddenBg = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const revealedBg = useColorModeValue("gray.50", "rgba(255,255,255,0.02)");

  useEffect(() => {
    try {
      const b = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
      if (!isNaN(b)) setBest(b);
    } catch { /* ignore */ }
    unlock("mines-played");
  }, []);

  useEffect(() => {
    if (!started || over) return;
    const id = setInterval(() => {
      if (startAtRef.current) setElapsed(Math.floor((Date.now() - startAtRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [started, over]);

  const reset = () => {
    setGrid(makeEmpty());
    setStarted(false);
    setOver(null);
    setFlags(0);
    setElapsed(0);
    startAtRef.current = null;
  };

  // Place mines avoiding first cell + its neighbors
  const placeMines = (g: Cell[][], sr: number, sc: number) => {
    const safe = new Set<string>([`${sr},${sc}`, ...neighbors(sr, sc).map(([r, c]) => `${r},${c}`)]);
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (g[r][c].mine || safe.has(`${r},${c}`)) continue;
      g[r][c].mine = true;
      placed++;
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        g[r][c].adj = neighbors(r, c).filter(([nr, nc]) => g[nr][nc].mine).length;
  };

  const floodReveal = (g: Cell[][], r: number, c: number) => {
    const stack: [number, number][] = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const cell = g[cr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.adj === 0 && !cell.mine) {
        neighbors(cr, cc).forEach(([nr, nc]) => {
          if (!g[nr][nc].revealed) stack.push([nr, nc]);
        });
      }
    }
  };

  const checkWin = (g: Cell[][]): boolean => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!g[r][c].mine && !g[r][c].revealed) return false;
    return true;
  };

  const reveal = (r: number, c: number) => {
    if (over) return;
    const cell = grid[r][c];
    if (cell.flagged) return;

    const g = grid.map((row) => row.map((x) => ({ ...x })));

    if (!started) {
      placeMines(g, r, c);
      setStarted(true);
      startAtRef.current = Date.now();
    }

    if (g[r][c].mine) {
      // lose - reveal all mines
      g.forEach((row) => row.forEach((x) => { if (x.mine) x.revealed = true; }));
      setGrid(g);
      setOver("lose");
      return;
    }

    floodReveal(g, r, c);
    setGrid(g);

    if (checkWin(g)) {
      setOver("win");
      unlock("mines-win");
      const t = Math.floor((Date.now() - (startAtRef.current || Date.now())) / 1000);
      if (best === 0 || t < best) {
        setBest(t);
        try { localStorage.setItem(BEST_KEY, String(t)); } catch { /* ignore */ }
      }
    }
  };

  const toggleFlag = (r: number, c: number) => {
    if (over) return;
    const cell = grid[r][c];
    if (cell.revealed) return;
    const g = grid.map((row) => row.map((x) => ({ ...x })));
    g[r][c].flagged = !g[r][c].flagged;
    setGrid(g);
    setFlags((f) => f + (g[r][c].flagged ? 1 : -1));
  };

  const onCellClick = (r: number, c: number) => {
    if (flagMode) toggleFlag(r, c);
    else reveal(r, c);
  };

  return (
    <Box maxW="480px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
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
            Mini-Game · Minesweeper
          </Text>
          <Heading size="lg">sweep</Heading>
        </Box>
        <HStack spacing={4} fontFamily="mono" fontSize="13px">
          <HStack spacing={1.5}>
            <Icon as={FaBomb as ElementType} boxSize={3} color="gray.400" />
            <Text color="gray.300" fontWeight="700">{MINES - flags}</Text>
          </HStack>
          <HStack spacing={1.5}>
            <Text color="gray.500">time</Text>
            <Text color="brand.400" fontWeight="700">{elapsed}s</Text>
          </HStack>
          {best > 0 && (
            <HStack spacing={1.5}>
              <Icon as={FaTrophy as ElementType} boxSize={3} color="yellow.500" />
              <Text color="yellow.400" fontWeight="700">{best}s</Text>
            </HStack>
          )}
        </HStack>
      </HStack>

      {/* Board */}
      <Box position="relative" mx="auto" w="fit-content"
        p={2} borderRadius="12px" layerStyle="card" border="1px solid" borderColor={border}>
        <SimpleGrid columns={COLS} spacing="3px">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const showNum = cell.revealed && !cell.mine && cell.adj > 0;
              return (
                <Box
                  key={`${r}-${c}`}
                  as="button"
                  onClick={() => onCellClick(r, c)}
                  onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); toggleFlag(r, c); }}
                  w={{ base: "30px", sm: "34px" }}
                  h={{ base: "30px", sm: "34px" }}
                  borderRadius="4px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontFamily="mono"
                  fontWeight="700"
                  fontSize="sm"
                  bg={cell.revealed ? (cell.mine ? "rgba(248,113,113,0.25)" : revealedBg) : hiddenBg}
                  color={showNum ? NUM_COLOR[cell.adj] : "inherit"}
                  border="1px solid"
                  borderColor={cell.revealed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)"}
                  _hover={!cell.revealed && !over ? { bg: "rgba(99,102,241,0.15)" } : {}}
                  sx={{ transition: "background 0.1s" }}
                >
                  {cell.flagged && !cell.revealed && (
                    <Icon as={FaFlag as ElementType} boxSize={2.5} color="orange.400" />
                  )}
                  {cell.revealed && cell.mine && (
                    <Icon as={FaBomb as ElementType} boxSize={2.5} color="red.400" />
                  )}
                  {showNum && cell.adj}
                </Box>
              );
            })
          )}
        </SimpleGrid>

        {over && (
          <MotionBox position="absolute" inset={0} display="flex"
            alignItems="center" justifyContent="center"
            bg="rgba(9,9,11,0.9)" backdropFilter="blur(4px)" borderRadius="12px"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Stack spacing={3} align="center">
              <Text fontFamily="mono" fontSize="2xl" fontWeight="700"
                color={over === "win" ? "green.400" : "red.400"}>
                {over === "win" ? "cleared!" : "boom 💥"}
              </Text>
              {over === "win" && <Text fontFamily="mono" fontSize="sm" color="gray.400">in {elapsed}s</Text>}
              <Button size="sm" variant="glow" onClick={reset}
                leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>
                new board
              </Button>
            </Stack>
          </MotionBox>
        )}
      </Box>

      {/* Controls */}
      <HStack justify="center" mt={5} spacing={3}>
        <Button
          size="sm"
          onClick={() => setFlagMode((f) => !f)}
          variant={flagMode ? "solid" : "outline"}
          colorScheme={flagMode ? "orange" : undefined}
          borderColor={flagMode ? undefined : "rgba(255,255,255,0.14)"}
          color={flagMode ? "white" : "gray.400"}
          fontFamily="mono"
          fontSize="11px"
          leftIcon={<Icon as={FaFlag as ElementType} boxSize={2.5} />}
        >
          flag mode {flagMode ? "on" : "off"}
        </Button>
        <Button size="sm" variant="outline" onClick={reset}
          borderColor="rgba(255,255,255,0.14)" color="gray.400" fontFamily="mono" fontSize="11px"
          leftIcon={<Icon as={FaRedo as ElementType} boxSize={2.5} />}>
          reset
        </Button>
      </HStack>

      <Text mt={5} textAlign="center" fontSize="10px" color="gray.600" fontFamily="mono">
        {touch ? "tap to reveal · flag mode to mark" : "click reveal · right-click flag · first click is safe"}
      </Text>
    </Box>
  );
};

export default MinesweeperGame;
