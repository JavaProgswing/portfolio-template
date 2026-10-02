import { Box, Heading, HStack, Icon, SimpleGrid, Stack, Tag, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { ElementType } from "react";
import { FaDatabase, FaGamepad, FaPalette, FaServer } from "react-icons/fa";
import { DEFAULT_THEME, THEMES } from "../themes/palettes";

const MotionBox = motion(Box);

interface Homelab {
  headline: string;
  intro: string;
  specs: { label: string; value: string }[];
  notes?: string[];
}

interface Props {
  data?: { homelab?: Homelab };
}

const STACK = ["React 18", "TypeScript", "Vite", "Chakra UI", "Framer Motion", "Web Audio API", "FastAPI", "SQLite / Postgres", "nginx"];

const defaultTheme = THEMES.find((t) => t.key === DEFAULT_THEME)?.name;

/** What's in the codebase. Personal hosting details come from `homelab` in me.ts. */
const PARTS: { icon: unknown; title: string; body: string }[] = [
  {
    icon: FaDatabase,
    title: "Content",
    body: "Everything personal lives in me.ts and a few JSON files (certificates, extra live sites). Repos, live deployments and repo counts come from the GitHub API at runtime, so new work shows up without a rebuild.",
  },
  {
    icon: FaPalette,
    title: "Themes",
    body: `${THEMES.length} themes (${defaultTheme} by default), each with its own type, texture and click effects. Sounds are synthesized in the browser with the Web Audio API: no audio files, and one mute switch.`,
  },
  {
    icon: FaServer,
    title: "Backend",
    body: "A small FastAPI service for the guestbook, blog ratings and comments, Spotify now-playing and the AI chat. The Gemini API key and Spotify token stay server-side.",
  },
  {
    icon: FaGamepad,
    title: "Extras",
    body: "A /lab desktop for live projects, a /console shell, mini-games and hidden achievements. Press ? for shortcuts or ⌘K for the command palette.",
  },
];

const ColophonPage = ({ data }: Props) => {
  const homelab = data?.homelab;

  return (
    <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 14, md: 20 }}>
      <Text as={RouterLink} to="/" fontSize="11px" color="brand.400" fontFamily="mono" display="inline-block" mb={6}>
        ← back to home
      </Text>

      <Text fontSize="11px" fontFamily="mono" color="fg.subtle" letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Colophon
      </Text>
      <Heading size="lg" mb={3}>How this site is built</Heading>
      <Text fontSize="md" color="fg.muted" mb={8} maxW="600px" lineHeight="1.75">
        The stack, what each part does, and the machine it runs on.
      </Text>

      <Wrap spacing={2} mb={10}>
        {STACK.map((s) => (
          <WrapItem key={s}>
            <Tag size="md" variant="subtle" colorScheme="purple" fontFamily="mono" fontSize="11px">{s}</Tag>
          </WrapItem>
        ))}
      </Wrap>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={12}>
        {PARTS.map((p, i) => (
          <MotionBox
            key={p.title}
            p={5} borderRadius="14px" layerStyle="card" className="lift"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <HStack spacing={2.5} mb={2}>
              <Icon as={p.icon as ElementType} color="brand.400" boxSize={3.5} />
              <Heading size="sm">{p.title}</Heading>
            </HStack>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.7">{p.body}</Text>
          </MotionBox>
        ))}
      </SimpleGrid>

      {homelab && (
        <MotionBox
          p={{ base: 5, md: 6 }} borderRadius="14px" layerStyle="card"
          border="1px solid" borderColor="rgba(var(--brand-rgb),0.35)"
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <HStack spacing={2.5} mb={3}>
            <Icon as={FaServer as ElementType} color="brand.400" boxSize={3.5} />
            <Text fontSize="10px" fontFamily="mono" color="brand.400" letterSpacing="0.16em" textTransform="uppercase">
              Running on
            </Text>
          </HStack>
          <Heading size="md" mb={2} lineHeight="1.3">{homelab.headline}</Heading>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7" mb={5} maxW="560px">{homelab.intro}</Text>
          <Stack spacing={2.5}>
            {homelab.specs.map((s) => (
              <HStack key={s.label} align="flex-start" spacing={4}>
                <Text fontSize="10px" fontFamily="mono" color="fg.subtle" letterSpacing="0.1em" textTransform="uppercase"
                  w={{ base: "90px", md: "110px" }} flexShrink={0} pt="2px">
                  {s.label}
                </Text>
                <Text fontSize="13px" color="fg.body" lineHeight="1.6">{s.value}</Text>
              </HStack>
            ))}
          </Stack>
          {homelab.notes && homelab.notes.length > 0 && (
            <Stack spacing={2} mt={5} pt={4} borderTop="1px solid var(--border)">
              {homelab.notes.map((n, i) => (
                <Text key={i} fontSize="13px" color="fg.muted" lineHeight="1.65">{n}</Text>
              ))}
            </Stack>
          )}
        </MotionBox>
      )}
    </Box>
  );
};

export default ColophonPage;
