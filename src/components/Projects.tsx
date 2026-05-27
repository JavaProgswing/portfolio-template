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

interface Props {
  data: Info;
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

const Projects = ({ data }: Props) => {
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const fetchedRepos = (reposData as { repos: FetchedRepo[] }).repos;
  const useFetched = fetchedRepos.length > 0;

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
          <Tooltip label="Ranked by stars, deployment, complexity & description quality" hasArrow fontSize="xs">
            <Text fontSize="11px" color="gray.600" fontFamily="mono" cursor="default">
              auto-ranked ↑
            </Text>
          </Tooltip>
        )}
      </HStack>

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
