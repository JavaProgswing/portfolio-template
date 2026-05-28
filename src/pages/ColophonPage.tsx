import {
  Box,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { ElementType } from "react";
import { FaServer, FaWrench } from "react-icons/fa";

const MotionBox = motion(Box);

interface HomelabSpec { label: string; value: string }
interface Homelab {
  headline: string;
  intro: string;
  specs: HomelabSpec[];
  notes: string[];
}

interface Props {
  data?: { homelab?: Homelab };
}

const SECTIONS = [
  {
    label: "Stack",
    items: [
      "React 18 + TypeScript + Vite",
      "Chakra UI v2 for components",
      "Framer Motion for animations",
      "react-router-dom for routing",
      "Native Canvas for particles + matrix rain",
    ],
  },
  {
    label: "Design",
    items: [
      "Inter (body) + JetBrains Mono (code/mono labels)",
      "Zinc/Indigo default · 9 alt themes (Ros\u00e9 Pine, Gruvbox, Evergreen, Cyberpunk, Aurora, Amber CRT, Valorant, Arcane, Pragmata)",
      "780px max content width — single-column document feel",
      "Dark-first · respects prefers-color-scheme",
    ],
  },
  {
    label: "Backend",
    items: [
      "Self-hosted FastAPI on the same Ubuntu box that serves nginx",
      "SQLite for guestbook + visitor count",
      "Spotify now-playing proxy (keeps refresh token server-side)",
      "Gemma 3 via Gemini API (proxied server-side so the API key stays private)",
    ],
  },
  {
    label: "Data Source",
    items: [
      "Single me.ts file is the source of truth — name, projects, journey, contacts, blogs",
      "Repos auto-fetched + scored from GitHub API (npm run fetch-repos)",
      "CP stats from Codeforces + leetcode-stats-api (5s timeout, graceful fallback)",
      "OSS contributions from GitHub Events API (last 90 days)",
    ],
  },
  {
    label: "Interactive Touches",
    items: [
      "Cursor spotlight tracking · themed per palette",
      "3D tilt on project cards · disabled on touch devices",
      "Animated counters with easeOutQuart",
      "Confetti on 5x logo click within 3 seconds",
      "Konami code (↑↑↓↓←→←→ba) → Matrix rain for 8 seconds",
      "Type 'matrix' or 'rainbow' anywhere",
      "g→[h/j/p/a/w] keyboard navigation",
      "? for shortcuts modal · ⌘K for command palette",
    ],
  },
  {
    label: "Hosting",
    items: [
      "nginx + Let's Encrypt on Ubuntu",
      "Static dist/ served from nginx html root",
      "SPA fallback: try_files $uri /index.html for client routes",
      "API proxied to 127.0.0.1:27012 via /api/portfolio/",
    ],
  },
  {
    label: "Performance",
    items: [
      "Mobile: particle count halved, frame-skipped to ~30 FPS",
      "Reduced-motion preference respected throughout",
      "Aggressive Cache-Control for static assets",
    ],
  },
];

const ColophonPage = ({ data }: Props) => {
  const homelab = data?.homelab;
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  return (
    <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }} py={20}>
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Colophon
      </Text>
      <Heading size="lg" mb={3}>How This Site Was Built</Heading>
      <Text fontSize="md" color="gray.400" mb={10} maxW="600px" lineHeight="1.75">
        A meta page about the meta page. Stack, decisions, and the hardware it all runs on.
      </Text>

      {/* Homelab — "running on" hero block */}
      {homelab && (
        <MotionBox
          mb={12}
          p={{ base: 5, md: 6 }}
          borderRadius="14px"
          layerStyle="card"
          border="1px solid"
          borderColor="brand.500"
          boxShadow="0 0 32px rgba(99,102,241,0.1)"
          position="relative"
          overflow="hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            position="absolute" top="-40px" right="-40px"
            w="160px" h="160px" borderRadius="full"
            bg="brand.500" opacity={0.08} filter="blur(40px)" pointerEvents="none"
          />

          <HStack spacing={2.5} mb={3}>
            <Icon as={FaServer as ElementType} color="brand.400" boxSize={4} />
            <Text fontSize="10px" fontFamily="mono" color="brand.400"
              letterSpacing="0.16em" textTransform="uppercase">
              Running On
            </Text>
          </HStack>

          <Heading size="md" mb={2} lineHeight="1.3">{homelab.headline}</Heading>
          <Text fontSize="sm" color="gray.400" lineHeight="1.7" mb={5} maxW="560px">
            {homelab.intro}
          </Text>

          {/* Specs as label/value rows */}
          <Stack spacing={2.5} mb={5}>
            {homelab.specs.map((s) => (
              <HStack key={s.label} align="flex-start" spacing={4}>
                <Text
                  fontSize="10px" fontFamily="mono" color="gray.500"
                  letterSpacing="0.1em" textTransform="uppercase"
                  w={{ base: "90px", md: "110px" }} flexShrink={0} pt="2px"
                >
                  {s.label}
                </Text>
                <Text fontSize="13px" color="gray.300" lineHeight="1.6">
                  {s.value}
                </Text>
              </HStack>
            ))}
          </Stack>

          {/* Battle scars */}
          {homelab.notes.length > 0 && (
            <Box pt={4} borderTop="1px solid" borderColor={border}>
              <HStack spacing={2} mb={2.5}>
                <Icon as={FaWrench as ElementType} color="orange.400" boxSize={3} />
                <Text fontSize="10px" fontFamily="mono" color="orange.400"
                  letterSpacing="0.14em" textTransform="uppercase">
                  Battle Scars
                </Text>
              </HStack>
              <Stack spacing={2}>
                {homelab.notes.map((n, i) => (
                  <Text key={i} fontSize="13px" color="gray.400" lineHeight="1.65"
                    pl={4} borderLeft="1px solid" borderColor="rgba(251,146,60,0.3)">
                    {n}
                  </Text>
                ))}
              </Stack>
            </Box>
          )}
        </MotionBox>
      )}

      <Stack spacing={10}>
        {SECTIONS.map((section, i) => (
          <MotionBox key={section.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}>
            <Text fontSize="10px" fontFamily="mono" color="gray.500"
              letterSpacing="0.16em" mb={3} textTransform="uppercase">
              {section.label}
            </Text>
            <Stack spacing={2}>
              {section.items.map((item, j) => (
                <Text key={j} fontSize="sm" color="gray.300" lineHeight="1.7" pl={4}
                  borderLeft="1px solid" borderColor="rgba(255,255,255,0.08)">
                  {item}
                </Text>
              ))}
            </Stack>
          </MotionBox>
        ))}
      </Stack>
    </Box>
  );
};

export default ColophonPage;
