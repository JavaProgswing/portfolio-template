import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Tag,
  Link,
  Icon,
  useColorModeValue,
  Tooltip,
  Wrap,
  WrapItem,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { FaGithub, FaGlobe, FaStar, FaCodeBranch, FaExternalLinkAlt } from "react-icons/fa";
import { Info } from "./Intro";
import { ElementType } from "react";
import { motion } from "framer-motion";
import reposData from "../data/repos.json";
import { useTilt } from "../hooks/useTilt";

interface PinnedProject {
  name: string;
  description: string;
  repoUrl?: string;
  prUrl?: string;
  homepage?: string;
  language?: string;
  badge?: string;
  skills?: string[];
}

interface Props {
  data: Info & { pinnedProjects?: PinnedProject[] };
}

interface FetchedRepo {
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  pushedAt: string;
  score: number;
}

interface LegacyProject {
  name: string;
  description: string;
  type: string;
  links: { name: string; link: string }[];
  skills: string[];
}

const getTypeIcon = (name: string): ElementType => {
  const n = name.toLowerCase();
  if (n === "github") return FaGithub as ElementType;
  if (n === "live" || n === "vercel" || n === "website") return FaGlobe as ElementType;
  return FaExternalLinkAlt as ElementType;
};

const LANG_COLOR: Record<string, string> = {
  java: "orange",
  python: "blue",
  typescript: "cyan",
  javascript: "yellow",
  rust: "orange",
  "c#": "purple",
  go: "cyan",
  html: "orange",
  css: "blue",
};

const MotionBox = motion(Box);

// ── Fetched repo card (with tilt) ─────────────────────────────────────────────

const FetchedRepoCard = ({ repo, index, border }: { repo: FetchedRepo; index: number; border: string }) => {
  const tilt = useTilt(4);
  return (
    <MotionBox
      ref={tilt.ref as React.RefObject<HTMLDivElement>}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      p={5} borderRadius="12px" layerStyle="card"
      border="1px solid" borderColor={border}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      _hover={{ borderColor: "brand.500", boxShadow: "0 8px 24px rgba(99,102,241,0.18)" }}
      display="flex" flexDirection="column"
      sx={{ transformStyle: "preserve-3d" }}
    >
      <Stack spacing={3} flex={1}>
        <HStack justify="space-between" align="flex-start">
          <Text fontWeight="600" fontSize="sm" isTruncated flex={1}>{repo.name}</Text>
          <HStack spacing={3} flexShrink={0}>
            {repo.homepage && (
              <Tooltip label="Live demo" hasArrow fontSize="xs">
                <Link href={repo.homepage} isExternal color="gray.500" _hover={{ color: "brand.400" }}>
                  <Icon as={FaGlobe as ElementType} boxSize={3.5} />
                </Link>
              </Tooltip>
            )}
            <Link href={repo.url} isExternal color="gray.500" _hover={{ color: "brand.400" }}>
              <Icon as={FaGithub as ElementType} boxSize={3.5} />
            </Link>
          </HStack>
        </HStack>

        <Text fontSize="xs" color="gray.400" lineHeight="1.7" flex={1}>
          {repo.description || "No description."}
        </Text>

        <HStack justify="space-between" align="center" mt="auto" pt={1}>
          <HStack spacing={3}>
            {repo.stars > 0 && (
              <HStack spacing={1}>
                <Icon as={FaStar as ElementType} boxSize={3} color="yellow.400" />
                <Text fontSize="11px" color="gray.500" fontFamily="mono">{repo.stars}</Text>
              </HStack>
            )}
            {repo.forks > 0 && (
              <HStack spacing={1}>
                <Icon as={FaCodeBranch as ElementType} boxSize={3} color="gray.500" />
                <Text fontSize="11px" color="gray.500" fontFamily="mono">{repo.forks}</Text>
              </HStack>
            )}
          </HStack>
          {repo.language && (
            <Badge
              colorScheme={LANG_COLOR[repo.language.toLowerCase()] ?? "gray"}
              variant="subtle" fontSize="10px"
            >
              {repo.language}
            </Badge>
          )}
        </HStack>
      </Stack>
    </MotionBox>
  );
};

// ── Legacy (me.ts) project card (with tilt) ───────────────────────────────────

const LegacyProjectCard = ({ project, index, border }: { project: LegacyProject; index: number; border: string }) => {
  const tilt = useTilt(4);
  return (
    <MotionBox
      ref={tilt.ref as React.RefObject<HTMLDivElement>}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      p={5} borderRadius="12px" layerStyle="card"
      border="1px solid" borderColor={border}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      _hover={{ borderColor: "brand.500", boxShadow: "0 8px 24px rgba(99,102,241,0.18)" }}
      display="flex" flexDirection="column"
      sx={{ transformStyle: "preserve-3d" }}
    >
      <Stack spacing={3} flex={1}>
        <HStack justify="space-between" align="flex-start">
          <Text fontWeight="600" fontSize="sm" flex={1}>{project.name}</Text>
          <HStack spacing={2} flexShrink={0}>
            {project.links.map((l) =>
              l.link ? (
                <Tooltip key={l.name} label={l.name} hasArrow fontSize="xs">
                  <Link href={l.link} isExternal color="gray.500" _hover={{ color: "brand.400" }}>
                    <Icon as={getTypeIcon(l.name)} boxSize={3.5} />
                  </Link>
                </Tooltip>
              ) : null
            )}
          </HStack>
        </HStack>

        <Text fontSize="xs" color="gray.400" lineHeight="1.7" flex={1}>
          {project.description}
        </Text>

        <Wrap spacing={1.5} mt="auto" pt={1}>
          {project.skills.map((s) => (
            <WrapItem key={s}>
              <Tag size="sm" colorScheme="gray" variant="subtle" fontSize="10px">{s}</Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Stack>
    </MotionBox>
  );
};

// ── Pinned card ──────────────────────────────────────────────────────────────

interface PinnedCardProps {
  project: PinnedProject;
  index: number;
  border: string;
}

const PinnedCard = ({ project, index, border }: PinnedCardProps) => {
  const tiltRef = useTilt();
  const langColor = (() => {
    const map: Record<string, string> = {
      java: "#b07219", python: "#3572A5", typescript: "#3178c6",
      javascript: "#f1e05a", rust: "#dea584", "c#": "#178600",
      go: "#00ADD8", c: "#555555", "c++": "#f34b7d",
    };
    return map[(project.language || "").toLowerCase()] || "#a1a1aa";
  })();

  return (
    <MotionBox
      ref={tiltRef}
      p={5}
      borderRadius="12px"
      layerStyle="card"
      border="1px solid"
      borderColor="brand.500"
      boxShadow="0 0 24px rgba(99,102,241,0.18)"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      sx={{ transition: "border-color 0.2s, box-shadow 0.2s" }}
      _hover={{
        borderColor: "brand.400",
        boxShadow: "0 0 32px rgba(99,102,241,0.28)",
      }}
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      {/* Subtle radial glow */}
      <Box
        position="absolute" top="-30px" right="-30px"
        w="120px" h="120px"
        borderRadius="full" bg="brand.500"
        opacity={0.08} filter="blur(40px)" pointerEvents="none"
      />

      <Stack spacing={3} flex={1}>
        <HStack justify="space-between" align="flex-start">
          <HStack spacing={2}>
            {project.badge && (
              <Badge
                bgGradient="linear(to-r, brand.500, purple.500)"
                color="white" fontSize="10px"
                px={2} py={0.5} borderRadius="full"
              >
                {project.badge}
              </Badge>
            )}
          </HStack>
          <HStack spacing={3}>
            {project.homepage && (
              <Tooltip label="live demo" hasArrow fontSize="xs">
                <Link href={project.homepage} isExternal color="gray.500"
                  _hover={{ color: "brand.400" }}>
                  <Icon as={FaGlobe as ElementType} boxSize={3.5} />
                </Link>
              </Tooltip>
            )}
            {project.repoUrl && (
              <Tooltip label="repository" hasArrow fontSize="xs">
                <Link href={project.repoUrl} isExternal color="gray.500"
                  _hover={{ color: "brand.400" }}>
                  <Icon as={FaGithub as ElementType} boxSize={3.5} />
                </Link>
              </Tooltip>
            )}
          </HStack>
        </HStack>

        <Text fontWeight="700" fontSize="sm" lineHeight="1.3">
          {project.name}
        </Text>

        <Text fontSize="xs" color="gray.400" lineHeight="1.65" flex={1}>
          {project.description}
        </Text>

        {project.prUrl && (
          <Link
            href={project.prUrl}
            isExternal
            fontSize="11px"
            color="brand.400"
            fontFamily="mono"
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            _hover={{ color: "brand.300", textDecoration: "underline" }}
          >
            <Icon as={FaCodeBranch as ElementType} boxSize={2.5} />
            view PR →
          </Link>
        )}

        <HStack justify="space-between" align="center" mt="auto" pt={2}>
          {project.language && (
            <HStack spacing={1.5}>
              <Box w="7px" h="7px" bg={langColor} borderRadius="full" />
              <Text fontSize="10px" color="gray.500" fontFamily="mono">
                {project.language}
              </Text>
            </HStack>
          )}
          {project.skills && project.skills.length > 0 && (
            <Wrap spacing={1} justify="flex-end">
              {project.skills.slice(0, 3).map((s) => (
                <WrapItem key={s}>
                  <Tag size="sm" colorScheme="gray" variant="subtle" fontSize="9px">
                    {s}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </HStack>
      </Stack>
    </MotionBox>
  );
};

const Projects = ({ data }: Props) => {
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const fetchedRepos = (reposData as { repos: FetchedRepo[] }).repos;
  const useFetched = fetchedRepos.length > 0;
  const pinned = data.pinnedProjects || [];

  return (
    <Box>
      <HStack justify="space-between" align="flex-end" mb={8}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Projects
          </Text>
          <Heading size="lg">What I've Built</Heading>
        </Box>
        {useFetched && (
          <Tooltip label="Ranked by stars, recency, deployment & description quality" hasArrow fontSize="xs">
            <Text fontSize="11px" color="gray.600" fontFamily="mono" cursor="default">
              auto-ranked ↑
            </Text>
          </Tooltip>
        )}
      </HStack>

      {/* Pinned projects (rendered first when configured in me.ts → pinnedProjects) */}
      {pinned.length > 0 && (
        <Box mb={6}>
          <Text fontSize="10px" fontFamily="mono" color="brand.400"
            letterSpacing="0.16em" mb={3} textTransform="uppercase">
            ★ pinned
          </Text>
          <SimpleGrid columns={{ base: 1, md: pinned.length === 1 ? 1 : 2 }} spacing={4}>
            {pinned.map((p, i) => (
              <PinnedCard key={p.name} project={p} index={i} border={border} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {useFetched
          ? fetchedRepos.map((repo, i) => (
              <FetchedRepoCard key={repo.name} repo={repo} index={i} border={border} />
            ))
          : data.projects.map((project, i) => (
              <LegacyProjectCard key={i} project={project} index={i} border={border} />
            ))}
      </SimpleGrid>
    </Box>
  );
};

export default Projects;
