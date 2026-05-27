import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState, ElementType } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGamepad, FaArrowRight } from "react-icons/fa";
import { unlock } from "../lib/achievements";

const MotionBox = motion(Box);

interface GameCard {
  slug: string;
  label: string;
  blurb: string;
  emoji: string;
  difficulty: "easy" | "medium" | "hard";
}

const GAMES: GameCard[] = [
  {
    slug: "snake",
    label: "Snake",
    blurb: "Eat, grow, don't bite yourself. Speed ramps with length.",
    emoji: "🐍",
    difficulty: "easy",
  },
  {
    slug: "2048",
    label: "2048",
    blurb: "Slide tiles. Merge matching numbers. Reach 2048 — or beyond.",
    emoji: "🔢",
    difficulty: "medium",
  },
];

const DIFF_COLOR: Record<string, string> = {
  easy: "green.400",
  medium: "yellow.400",
  hard: "red.400",
};

// ── Selector ────────────────────────────────────────────────────────────────

const PlayPage = () => {
  const navigate = useNavigate();
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  return (
    <Box maxW="780px" mx="auto" px={{ base: 4, md: 8 }} py={12}>
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <HStack spacing={3} mb={3}>
        <Icon as={FaGamepad as ElementType} boxSize={5} color="brand.400" />
        <Text fontSize="11px" fontFamily="mono" color="gray.500"
          letterSpacing="0.14em" textTransform="uppercase">
          Mini-Games
        </Text>
      </HStack>
      <Heading size="lg" mb={3}>Take a break</Heading>
      <Text fontSize="md" color="gray.400" mb={10} maxW="540px" lineHeight="1.75">
        Pick one. Keyboard or touch — both work. High scores save locally.
      </Text>

      {/* Game cards */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={12}>
        {GAMES.map((g, i) => (
          <MotionBox
            key={g.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            whileHover={{ y: -3 }}
            onClick={() => navigate(`/play/${g.slug}`)}
            cursor="pointer"
            p={6} borderRadius="12px"
            layerStyle="card"
            border="1px solid" borderColor={border}
            sx={{ transition: "border-color 0.2s, box-shadow 0.2s" }}
            _hover={{
              borderColor: "brand.500",
              boxShadow: "0 0 24px rgba(99,102,241,0.12)",
            }}
          >
            <HStack justify="space-between" mb={2}>
              <Text fontSize="3xl">{g.emoji}</Text>
              <Text fontSize="9px" fontFamily="mono"
                color={DIFF_COLOR[g.difficulty]} letterSpacing="0.14em"
                textTransform="uppercase">
                {g.difficulty}
              </Text>
            </HStack>
            <Heading size="md" mb={2}>{g.label}</Heading>
            <Text fontSize="sm" color="gray.400" lineHeight="1.6" mb={4}>
              {g.blurb}
            </Text>
            <HStack
              color="brand.400" fontSize="11px" fontFamily="mono"
              spacing={1.5}
            >
              <Text>play</Text>
              <Icon as={FaArrowRight as ElementType} boxSize={2.5} />
            </HStack>
          </MotionBox>
        ))}
      </SimpleGrid>

      {/* Suggestion form */}
      <SuggestionForm />
    </Box>
  );
};

// ── Suggestion form ─────────────────────────────────────────────────────────

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
    <Box>
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
