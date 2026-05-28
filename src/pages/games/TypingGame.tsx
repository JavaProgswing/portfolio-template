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
import { useEffect, useRef, useState, ElementType, KeyboardEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { IconType } from "react-icons";
import { FaRedo, FaTrophy, FaBolt, FaBullseye } from "react-icons/fa";
import { unlock } from "../../lib/achievements";

const MotionBox = motion(Box);
const HS_KEY = "portfolio-typing-bestwpm";

// Dev-flavored snippets — quotes + code. Kept short so a round is ~15-30s.
const SNIPPETS = [
  "premature optimization is the root of all evil",
  "there are only two hard things: cache invalidation and naming things",
  "talk is cheap, show me the code",
  "it works on my machine is not a deployment strategy",
  "the best error message is the one that never shows up",
  "code is read more often than it is written",
  "first make it work, then make it right, then make it fast",
  "any sufficiently advanced bug is indistinguishable from a feature",
  "weeks of coding can save you hours of planning",
  "a user interface is like a joke; if you have to explain it, it is not that good",
  "simplicity is the soul of efficiency",
  "deleted code is debugged code",
  "the cloud is just someone else's computer",
  "git commit, git push, git blame, git regret",
];

type Phase = "idle" | "typing" | "done";

const TypingGame = () => {
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [bestWpm, setBestWpm] = useState(0);
  const [errors, setErrors] = useState(0);
  const [cheesed, setCheesed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
  const dimText = useColorModeValue("gray.400", "gray.600");
  const baseText = useColorModeValue("gray.500", "gray.500");

  const pickSnippet = () =>
    SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];

  useEffect(() => {
    setTarget(pickSnippet());
    try {
      const b = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      if (!isNaN(b)) setBestWpm(b);
    } catch { /* ignore */ }
    unlock("typing-played");
  }, []);

  // Live timer while typing
  useEffect(() => {
    if (phase !== "typing") return;
    const id = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 100);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const reset = () => {
    setTarget(pickSnippet());
    setTyped("");
    setPhase("idle");
    setElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCheesed(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const finish = (finalTyped: string) => {
    const secs = Math.max(0.5, (Date.now() - startTime) / 1000);
    // WPM = (chars / 5) / minutes
    const words = finalTyped.length / 5;
    const finalWpm = Math.round(words / (secs / 60));
    let wrong = 0;
    for (let i = 0; i < finalTyped.length; i++) {
      if (finalTyped[i] !== target[i]) wrong++;
    }
    const acc = Math.round(((finalTyped.length - wrong) / finalTyped.length) * 100);
    setWpm(finalWpm);
    setAccuracy(acc);
    setPhase("done");

    // Anti-cheese: high WPM with garbage accuracy = key-spam. No best, no real
    // achievements — but a cheeky one for the effort.
    const legit = acc >= 70;
    if (!legit && finalWpm >= 60) {
      setCheesed(true);
      unlock("type-cheese");
      return;
    }
    setCheesed(false);

    if (legit && finalWpm > bestWpm) {
      setBestWpm(finalWpm);
      try { localStorage.setItem(HS_KEY, String(finalWpm)); } catch { /* ignore */ }
    }
    if (legit && finalWpm >= 40) unlock("typing-40");
    if (legit && finalWpm >= 80) unlock("typing-80");
  };

  const onChange = (val: string) => {
    if (phase === "done") return;
    if (phase === "idle" && val.length > 0) {
      setPhase("typing");
      setStartTime(Date.now());
    }
    // Clamp to target length
    const clipped = val.slice(0, target.length);
    setTyped(clipped);

    // Count live errors
    let wrong = 0;
    for (let i = 0; i < clipped.length; i++) if (clipped[i] !== target[i]) wrong++;
    setErrors(wrong);

    if (clipped.length === target.length) {
      finish(clipped);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && phase === "done") reset();
    if (e.key === "Tab") { e.preventDefault(); reset(); }
  };

  const liveWpm =
    phase === "typing" && elapsed > 0
      ? Math.round((typed.length / 5) / (elapsed / 60))
      : 0;

  const focusInput = () => inputRef.current?.focus();

  return (
    <Box maxW="780px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
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
            Mini-Game · Typing
          </Text>
          <Heading size="lg">type:race</Heading>
        </Box>
        <HStack spacing={4} fontFamily="mono" fontSize="13px">
          <HStack spacing={1.5}>
            <Icon as={FaBolt as ElementType} boxSize={3} color="brand.400" />
            <Text color="gray.500">wpm</Text>
            <Text color="brand.400" fontWeight="700">
              {phase === "done" ? wpm : liveWpm}
            </Text>
          </HStack>
          <HStack spacing={1.5}>
            <Icon as={FaTrophy as ElementType} boxSize={3} color="yellow.500" />
            <Text color="gray.500">best</Text>
            <Text color="yellow.400" fontWeight="700">{bestWpm}</Text>
          </HStack>
        </HStack>
      </HStack>

      {/* Typing surface */}
      <Box
        ref={containerRef}
        onClick={focusInput}
        position="relative"
        p={{ base: 5, md: 8 }}
        borderRadius="14px"
        layerStyle="card"
        border="1px solid"
        borderColor={phase === "typing" ? "brand.500" : border}
        cursor="text"
        sx={{ transition: "border-color 0.3s" }}
        minH="160px"
        boxShadow={phase === "typing" ? "0 0 24px rgba(99,102,241,0.12)" : "none"}
      >
        {/* Hidden input captures keystrokes */}
        <Box
          as="input"
          ref={inputRef}
          value={typed}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          position="absolute"
          opacity={0}
          w="1px"
          h="1px"
          aria-label="typing input"
        />

        {/* Rendered snippet with per-char coloring */}
        <Text
          fontFamily="mono"
          fontSize={{ base: "lg", md: "2xl" }}
          lineHeight="1.8"
          letterSpacing="0.02em"
          userSelect="none"
        >
          {target.split("").map((ch, i) => {
            const typedCh = typed[i];
            const isCurrent = i === typed.length;
            let color = baseText;
            let bg = "transparent";
            if (typedCh != null) {
              color = typedCh === ch ? "green.400" : "red.400";
              if (typedCh !== ch) bg = "rgba(248,113,113,0.12)";
            }
            return (
              <Text
                as="span"
                key={i}
                color={color}
                bg={bg}
                borderRadius="2px"
                position="relative"
                borderLeft={isCurrent && phase !== "done" ? "2px solid" : "2px solid transparent"}
                borderLeftColor={isCurrent && phase !== "done" ? "brand.400" : "transparent"}
                sx={
                  isCurrent && phase !== "done"
                    ? { animation: "blink 1s steps(2, start) infinite" }
                    : undefined
                }
              >
                {ch === " " ? " " : ch}
              </Text>
            );
          })}
        </Text>

        {phase === "idle" && (
          <Text mt={5} fontFamily="mono" fontSize="11px" color={dimText}>
            start typing to begin · timer starts on first key
          </Text>
        )}
      </Box>

      {/* Live stats while typing */}
      {phase === "typing" && (
        <HStack mt={4} spacing={6} fontFamily="mono" fontSize="11px" color="gray.500" justify="center">
          <Text>{elapsed.toFixed(1)}s</Text>
          <Text>{typed.length}/{target.length}</Text>
          <Text color={errors > 0 ? "red.400" : "gray.500"}>{errors} errors</Text>
        </HStack>
      )}

      {/* Results */}
      {phase === "done" && (
        <MotionBox
          mt={5}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          p={5}
          borderRadius="12px"
          layerStyle="card"
          border="1px solid"
          borderColor={cheesed ? "orange.400" : "brand.500"}
        >
          {cheesed && (
            <Box mb={4} textAlign="center">
              <Text fontFamily="mono" fontSize="sm" color="orange.300" fontWeight="700">
                tryna cheese the game huh? 🧀
              </Text>
              <Text fontFamily="mono" fontSize="11px" color="gray.500" mt={1}>
                key-spam detected — no best score for you. type it properly.
              </Text>
            </Box>
          )}
          <HStack spacing={8} justify="center" flexWrap="wrap">
            <Stat icon={FaBolt} label="wpm" value={`${wpm}`}
              color={cheesed ? "gray.500" : "brand.400"}
              note={!cheesed && wpm === bestWpm && wpm > 0 ? "★ new best" : ""} />
            <Stat icon={FaBullseye} label="accuracy" value={`${accuracy}%`}
              color={accuracy >= 95 ? "green.400" : accuracy >= 80 ? "yellow.400" : "red.400"} />
            <Stat icon={FaRedo} label="errors" value={`${errors}`} color="gray.300" />
          </HStack>
          <HStack justify="center" mt={5}>
            <Button size="sm" variant="glow" onClick={reset}
              leftIcon={<Icon as={FaRedo as ElementType} boxSize={3} />}>
              again
            </Button>
          </HStack>
          <Text mt={3} textAlign="center" fontSize="10px" color="gray.600" fontFamily="mono">
            enter or tab to retry · 40 / 80 wpm (≥70% acc) unlock achievements
          </Text>
        </MotionBox>
      )}

      {phase !== "done" && (
        <Text mt={6} textAlign="center" fontSize="10px" color="gray.600" fontFamily="mono">
          tab to skip · click box if cursor stops blinking
        </Text>
      )}
    </Box>
  );
};

const Stat = ({
  icon: I, label, value, color, note,
}: { icon: IconType; label: string; value: string; color: string; note?: string }) => (
  <Stack align="center" spacing={0.5}>
    <HStack spacing={1.5} color="gray.500">
      <Icon as={I as ElementType} boxSize={2.5} />
      <Text fontSize="10px" fontFamily="mono" letterSpacing="0.1em" textTransform="uppercase">
        {label}
      </Text>
    </HStack>
    <Text fontSize="3xl" fontWeight="700" color={color} fontFamily="mono" lineHeight="1">
      {value}
    </Text>
    {note && <Text fontSize="10px" color="yellow.400" fontFamily="mono">{note}</Text>}
  </Stack>
);

export default TypingGame;
