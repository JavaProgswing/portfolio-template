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
import { motion } from "framer-motion";
import { FaTrophy, FaRedo } from "react-icons/fa";
import { unlock } from "../../lib/achievements";

const MotionBox = motion(Box);
const STREAK_KEY = "portfolio-wordle-streak";

// 5-letter tech words
const WORDS = [
  "react", "redis", "cache", "stack", "queue", "array", "async", "bytes",
  "regex", "swift", "token", "mutex", "scope", "proxy", "fetch", "build",
  "merge", "shell", "pixel", "debug", "click", "mouse", "ascii", "graph",
  "model", "embed", "parse", "slice", "yield", "await", "class", "super",
  "props", "hooks", "state", "route", "axios", "babel", "linux", "emacs",
  "scala", "macro", "float", "infer", "trait", "union", "deque", "nginx",
  "flask", "patch",
];

const ROWS = 6;
const LEN = 5;
type Cell = "" | "correct" | "present" | "absent";

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const scoreGuess = (guess: string, answer: string): Cell[] => {
  const res: Cell[] = Array(LEN).fill("absent");
  const a = answer.split("");
  const counts: Record<string, number> = {};
  for (const c of a) counts[c] = (counts[c] || 0) + 1;
  // pass 1: correct
  for (let i = 0; i < LEN; i++) {
    if (guess[i] === a[i]) { res[i] = "correct"; counts[guess[i]]--; }
  }
  // pass 2: present
  for (let i = 0; i < LEN; i++) {
    if (res[i] === "correct") continue;
    if (counts[guess[i]] > 0) { res[i] = "present"; counts[guess[i]]--; }
  }
  return res;
};

const CELL_COLOR: Record<Cell, { bg: string; border: string; fg: string }> = {
  "": { bg: "transparent", border: "rgba(255,255,255,0.15)", fg: "inherit" },
  correct: { bg: "#22c55e", border: "#22c55e", fg: "#06210f" },
  present: { bg: "#eab308", border: "#eab308", fg: "#241c02" },
  absent: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)", fg: "#71717a" },
};

const WordleGame = () => {
  const [answer, setAnswer] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [done, setDone] = useState<"win" | "lose" | null>(null);
  const [streak, setStreak] = useState(0);
  const [shakeRow, setShakeRow] = useState(-1);
  const [keyStates, setKeyStates] = useState<Record<string, Cell>>({});

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  const newGame = useCallback(() => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrent("");
    setDone(null);
    setKeyStates({});
    setShakeRow(-1);
  }, []);

  useEffect(() => {
    newGame();
    try {
      const s = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
      if (!isNaN(s)) setStreak(s);
    } catch { /* ignore */ }
    unlock("wordle-played");
  }, [newGame]);

  const submit = useCallback(() => {
    if (current.length !== LEN) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(-1), 400);
      return;
    }
    const g = current.toLowerCase();
    const states = scoreGuess(g, answer);
    // update keyboard states (upgrade priority: correct > present > absent)
    setKeyStates((prev) => {
      const next = { ...prev };
      g.split("").forEach((ch, i) => {
        const s = states[i];
        const cur = next[ch];
        if (s === "correct" || (s === "present" && cur !== "correct") || (!cur)) next[ch] = s;
      });
      return next;
    });

    const newGuesses = [...guesses, g];
    setGuesses(newGuesses);
    setCurrent("");

    if (g === answer) {
      setDone("win");
      unlock("wordle-win");
      setStreak((s) => {
        const ns = s + 1;
        try { localStorage.setItem(STREAK_KEY, String(ns)); } catch { /* ignore */ }
        if (ns >= 3) unlock("wordle-streak");
        return ns;
      });
    } else if (newGuesses.length >= ROWS) {
      setDone("lose");
      setStreak(0);
      try { localStorage.setItem(STREAK_KEY, "0"); } catch { /* ignore */ }
    }
  }, [current, guesses, answer]);

  const typeKey = useCallback((k: string) => {
    if (done) return;
    if (k === "enter") { submit(); return; }
    if (k === "back") { setCurrent((c) => c.slice(0, -1)); return; }
    if (/^[a-z]$/.test(k) && current.length < LEN) setCurrent((c) => c + k);
  }, [current, done, submit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      if (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA") return;
      if (e.key === "Enter") typeKey("enter");
      else if (e.key === "Backspace") typeKey("back");
      else if (/^[a-zA-Z]$/.test(e.key)) typeKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeKey]);

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
            Mini-Game · Wordle
          </Text>
          <Heading size="lg">tech wordle</Heading>
        </Box>
        <HStack spacing={1.5} fontFamily="mono" fontSize="13px">
          <Icon as={FaTrophy as ElementType} boxSize={3} color="yellow.500" />
          <Text color="gray.500">streak</Text>
          <Text color="yellow.400" fontWeight="700">{streak}</Text>
        </HStack>
      </HStack>

      {/* Grid */}
      <Stack spacing={1.5} align="center" mb={6}>
        {Array.from({ length: ROWS }).map((_, r) => {
          const guess = guesses[r];
          const isCurrentRow = r === guesses.length && !done;
          const states = guess ? scoreGuess(guess, answer) : [];
          return (
            <MotionBox
              key={r}
              display="flex"
              gap="6px"
              animate={shakeRow === r ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {Array.from({ length: LEN }).map((_, c) => {
                const ch = guess ? guess[c] : isCurrentRow ? current[c] : "";
                const st: Cell = guess ? states[c] : "";
                const col = CELL_COLOR[st];
                return (
                  <MotionBox
                    key={c}
                    w={{ base: "52px", sm: "58px" }}
                    h={{ base: "52px", sm: "58px" }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="2px solid"
                    borderColor={ch && st === "" ? "rgba(255,255,255,0.3)" : col.border}
                    bg={col.bg}
                    color={col.fg}
                    borderRadius="6px"
                    fontFamily="mono"
                    fontWeight="700"
                    fontSize="2xl"
                    textTransform="uppercase"
                    initial={guess ? { rotateX: 0 } : false}
                    animate={guess ? { rotateX: [90, 0] } : {}}
                    transition={{ duration: 0.3, delay: c * 0.08 }}
                  >
                    {ch || ""}
                  </MotionBox>
                );
              })}
            </MotionBox>
          );
        })}
      </Stack>

      {/* Result */}
      {done && (
        <MotionBox textAlign="center" mb={5}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {done === "win" ? (
            <Text fontFamily="mono" color="green.400" fontWeight="700" fontSize="lg">
              solved in {guesses.length} · nice
            </Text>
          ) : (
            <Text fontFamily="mono" color="red.400" fontWeight="700" fontSize="lg">
              answer: <Text as="span" color="yellow.400" textTransform="uppercase">{answer}</Text>
            </Text>
          )}
          <Button mt={3} size="sm" variant="glow" onClick={newGame}
            leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>
            new word
          </Button>
        </MotionBox>
      )}

      {/* Keyboard */}
      <Stack spacing={1.5} align="center">
        {KEY_ROWS.map((row, ri) => (
          <HStack key={ri} spacing={1}>
            {ri === 2 && (
              <KeyBtn label="enter" wide onClick={() => typeKey("enter")} state="" />
            )}
            {row.split("").map((k) => (
              <KeyBtn key={k} label={k} onClick={() => typeKey(k)} state={keyStates[k] || ""} />
            ))}
            {ri === 2 && (
              <KeyBtn label="⌫" wide onClick={() => typeKey("back")} state="" />
            )}
          </HStack>
        ))}
      </Stack>

      <Text mt={6} textAlign="center" fontSize="10px" color="gray.600" fontFamily="mono">
        guess the 5-letter dev term · 3-win streak unlocks an achievement
      </Text>
    </Box>
  );
};

const KeyBtn = ({
  label, onClick, state, wide,
}: { label: string; onClick: () => void; state: Cell; wide?: boolean }) => {
  const col = CELL_COLOR[state];
  const isColored = state !== "";
  return (
    <Button
      onClick={onClick}
      size="sm"
      minW={wide ? "44px" : { base: "28px", sm: "32px" }}
      h="44px"
      px={wide ? 2 : 0}
      fontFamily="mono"
      fontSize={wide ? "10px" : "13px"}
      textTransform="uppercase"
      fontWeight="600"
      bg={isColored ? col.bg : "rgba(255,255,255,0.06)"}
      color={isColored ? col.fg : "gray.200"}
      borderRadius="5px"
      _hover={{ bg: isColored ? col.bg : "rgba(255,255,255,0.12)" }}
      _active={{ transform: "scale(0.94)" }}
    >
      {label}
    </Button>
  );
};

export default WordleGame;
