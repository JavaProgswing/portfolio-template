import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

const MotionBox = motion(Box);

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
      "Zinc/Indigo default · 7 alt themes (Catppuccin, Tokyo, Dracula, Nord, etc.)",
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
      "Local Ollama (llama3.2) for the AI chat — no external API keys",
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

const ColophonPage = () => {
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
      <Text fontSize="md" color="gray.400" mb={12} maxW="600px" lineHeight="1.75">
        A meta page about the meta page. Stack, decisions, and easter eggs.
      </Text>

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
