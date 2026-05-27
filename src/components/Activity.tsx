import { useEffect, useState, ElementType, ReactNode } from "react";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import {
  Box,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  Center,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { SiCodeforces, SiLeetcode } from "react-icons/si";
import {
  FaExternalLinkAlt,
  FaStar,
  FaCodeBranch,
  FaClock,
  FaGithub,
} from "react-icons/fa";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FollowItem {
  name: string;
  type: string;
  url: string;
  desc: string;
}

interface ProjectLink { name: string; link: string }
interface Project {
  name: string;
  links: ProjectLink[];
}

interface PortfolioData {
  cp: { codeforces: string; leetcode: string };
  contacts: { id: string; name: string; site: string; link: string }[];
  projects: Project[];
  interests: { areas: string[]; following: FollowItem[] };
}

type Status = "loading" | "ok" | "error";

const MotionBox = motion(Box);

// ── GitHub canonical language colors ──────────────────────────────────────────

const LANG_COLOR: Record<string, string> = {
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572A5",
  java: "#b07219",
  rust: "#dea584",
  go: "#00ADD8",
  "c++": "#f34b7d",
  c: "#555555",
  "c#": "#178600",
  ruby: "#701516",
  php: "#4F5D95",
  swift: "#ffac45",
  kotlin: "#A97BFF",
  html: "#e34c26",
  css: "#563d7c",
  shell: "#89e051",
  vue: "#41b883",
  dart: "#00B4AB",
  scala: "#c22d40",
  zig: "#ec915c",
  lua: "#000080",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getRankColor = (rank: string) => {
  if (!rank) return "gray.400";
  if (rank.includes("grandmaster") || rank.includes("legendary")) return "red.400";
  if (rank.includes("master")) return "orange.400";
  if (rank.includes("candidate")) return "purple.400";
  if (rank.includes("expert")) return "brand.400";
  if (rank.includes("specialist")) return "cyan.400";
  if (rank.includes("pupil")) return "green.400";
  return "gray.400";
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

const timeAgo = (iso: string | null): string => {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/** Extract GitHub username robustly — fall back to project URLs if contacts use a redirect. */
function extractGitHubHandle(data: PortfolioData): string {
  const tryUrl = (url: string): string => {
    if (!url || !url.includes("github.com/")) return "";
    const after = url.split("github.com/")[1];
    if (!after) return "";
    return after.split("/")[0].split("?")[0].split("#")[0];
  };

  const ghContact = data.contacts.find((c) => c.id === "github");
  const fromContact = tryUrl(ghContact?.link || "");
  if (fromContact) return fromContact;

  for (const p of data.projects || []) {
    for (const l of p.links || []) {
      const h = tryUrl(l.link);
      if (h) return h;
    }
  }
  return "";
}

const TYPE_COLOR: Record<string, string> = {
  youtube: "red",
  blog: "purple",
  site: "blue",
  docs: "green",
  podcast: "orange",
};

// ── Reusable sub-components ───────────────────────────────────────────────────

const Caption = ({ children }: { children: ReactNode }) => (
  <Text
    fontSize="10px"
    fontFamily="mono"
    color="gray.500"
    letterSpacing="0.14em"
    mb={3}
    textTransform="uppercase"
  >
    {children}
  </Text>
);

const StatCard = ({
  label,
  value,
  sub,
  icon: I,
  color,
  animate = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: ElementType;
  color: string;
  animate?: boolean;
}) => {
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const animated = useAnimatedNumber(typeof value === "number" ? value : 0);
  const displayValue = animate && typeof value === "number" ? animated : value;
  return (
    <Box
      p={4}
      layerStyle="card"
      border="1px solid"
      borderColor={border}
      borderRadius="10px"
    >
      <HStack spacing={1.5} mb={2}>
        <Icon as={I} boxSize={2.5} color={color} />
        <Text fontSize="10px" color="gray.500" fontFamily="mono" letterSpacing="0.06em">
          {label}
        </Text>
      </HStack>
      <Text fontSize="2xl" fontWeight="700" color={color} lineHeight="1">
        {displayValue}
      </Text>
      <Text fontSize="10px" color="gray.600" fontFamily="mono" mt={1.5}>
        {sub}
      </Text>
    </Box>
  );
};

const LangBar = ({ name, count, pct }: { name: string; count: number; pct: number }) => {
  const color = LANG_COLOR[name.toLowerCase()] || "#a1a1aa";
  return (
    <HStack spacing={3}>
      <HStack spacing={1.5} w="120px" flexShrink={0}>
        <Box w="8px" h="8px" bg={color} borderRadius="full" flexShrink={0} />
        <Text fontSize="12px" fontFamily="mono" isTruncated>{name}</Text>
      </HStack>
      <Box flex={1} h="6px" bg="rgba(255,255,255,0.05)" borderRadius="full" overflow="hidden">
        <MotionBox
          h="100%"
          bg={color}
          borderRadius="full"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </Box>
      <Text
        fontSize="11px"
        color="gray.500"
        fontFamily="mono"
        w="60px"
        textAlign="right"
        flexShrink={0}
      >
        {count} repo{count !== 1 ? "s" : ""}
      </Text>
    </HStack>
  );
};

interface MiniRepo {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

const MiniRepoCard = ({ repo }: { repo: MiniRepo }) => {
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const langColor = LANG_COLOR[repo.language.toLowerCase()] || "#a1a1aa";
  return (
    <Link href={repo.url} isExternal _hover={{ textDecoration: "none" }}>
      <Box
        p={3.5}
        layerStyle="card"
        border="1px solid"
        borderColor={border}
        borderRadius="10px"
        h="100%"
        _hover={{ borderColor: "brand.500" }}
        sx={{ transition: "border-color 0.2s" }}
      >
        <HStack justify="space-between" mb={1.5} align="flex-start">
          <Text fontSize="13px" fontWeight="600" isTruncated flex={1}>
            {repo.name}
          </Text>
          {repo.stars > 0 && (
            <HStack spacing={1} flexShrink={0}>
              <Icon as={FaStar as ElementType} boxSize={2.5} color="yellow.400" />
              <Text fontSize="11px" color="gray.500" fontFamily="mono">
                {repo.stars}
              </Text>
            </HStack>
          )}
        </HStack>
        <Text fontSize="11px" color="gray.500" noOfLines={2} mb={2.5} lineHeight="1.5">
          {repo.description || "—"}
        </Text>
        {repo.language && (
          <HStack spacing={1.5}>
            <Box w="7px" h="7px" bg={langColor} borderRadius="full" />
            <Text fontSize="10px" color="gray.500" fontFamily="mono">
              {repo.language}
            </Text>
          </HStack>
        )}
      </Box>
    </Link>
  );
};

// ── Competitive Panel ─────────────────────────────────────────────────────────

const CompetitivePanel = ({ cfHandle, lcHandle }: { cfHandle: string; lcHandle: string }) => {
  const [cfData, setCfData] = useState<Record<string, unknown> | null>(null);
  const [lcData, setLcData] = useState<Record<string, unknown> | null>(null);
  const [cfStatus, setCfStatus] = useState<Status>("loading");
  const [lcStatus, setLcStatus] = useState<Status>("loading");
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  useEffect(() => {
    if (!cfHandle) { setCfStatus("error"); return; }
    // 5s timeout — Codeforces API can hang
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "OK") { setCfData(d.result[0]); setCfStatus("ok"); }
        else setCfStatus("error");
      })
      .catch(() => setCfStatus("error"))
      .finally(() => clearTimeout(timeout));
    return () => clearTimeout(timeout);
  }, [cfHandle]);

  useEffect(() => {
    if (!lcHandle) { setLcStatus("error"); return; }
    let cancelled = false;

    const validate = (d: Record<string, unknown>) =>
      d && typeof d.totalSolved === "number";

    const tryEndpoints = async () => {
      // 1. Our backend proxy (LeetCode GraphQL server-side, cached 5min)
      try {
        const r = await fetch(`/api/portfolio/leetcode/${lcHandle}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const d = await r.json();
          if (!cancelled && validate(d)) {
            setLcData(d); setLcStatus("ok"); return;
          }
        }
      } catch { /* fall through */ }

      if (cancelled) return;

      // 2. Public mirror fallback (Vercel-hosted, no cold starts)
      try {
        const r = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${lcHandle}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const d = await r.json();
          if (!cancelled && validate(d)) {
            setLcData(d); setLcStatus("ok"); return;
          }
        }
      } catch { /* fall through */ }

      if (!cancelled) setLcStatus("error");
    };

    tryEndpoints();
    return () => { cancelled = true; };
  }, [lcHandle]);

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <MotionBox
        p={5} borderRadius="12px" layerStyle="card" border="1px solid" borderColor={border}
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.4 }}
        _hover={{ borderColor: "brand.500" }}
      >
        <HStack justify="space-between" mb={4}>
          <HStack spacing={2}>
            <Icon as={SiCodeforces as ElementType} color="brand.400" boxSize={4} />
            <Text fontWeight="600" fontSize="sm">Codeforces</Text>
          </HStack>
          <Link href={`https://codeforces.com/profile/${cfHandle}`} isExternal>
            <Badge
              variant="outline"
              borderColor="brand.400"
              color="brand.400"
              fontFamily="mono"
            >
              @{cfHandle}
            </Badge>
          </Link>
        </HStack>
        {cfStatus === "loading" && <Center h="80px"><Spinner size="sm" color="brand.400" /></Center>}
        {cfStatus === "error" && (
          <Link href={`https://codeforces.com/profile/${cfHandle}`} isExternal
            color="brand.400" fontSize="sm" display="flex" alignItems="center" gap={1}>
            View profile <Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />
          </Link>
        )}
        {cfStatus === "ok" && cfData && (
          <Stack spacing={3}>
            <HStack spacing={8}>
              <Stat size="sm">
                <StatLabel color="gray.500" fontSize="xs">Rating</StatLabel>
                <StatNumber color="brand.400" fontSize="xl">{String(cfData.rating ?? "—")}</StatNumber>
                <StatHelpText fontSize="xs" mb={0}>max {String(cfData.maxRating ?? "—")}</StatHelpText>
              </Stat>
              <Stat size="sm">
                <StatLabel color="gray.500" fontSize="xs">Rank</StatLabel>
                <StatNumber fontSize="sm" color={getRankColor(String(cfData.rank ?? ""))} fontWeight="600">
                  {cap(String(cfData.rank ?? "—"))}
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0} color="gray.500">
                  max {cap(String(cfData.maxRank ?? "—"))}
                </StatHelpText>
              </Stat>
            </HStack>
            <Text fontSize="11px" color="gray.500" fontFamily="mono">
              contribution: <Text as="span" color="green.400">+{String(cfData.contribution ?? 0)}</Text>
            </Text>
          </Stack>
        )}
      </MotionBox>

      <MotionBox
        p={5} borderRadius="12px" layerStyle="card" border="1px solid" borderColor={border}
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.08 }}
        _hover={{ borderColor: "yellow.500" }}
      >
        <HStack justify="space-between" mb={4}>
          <HStack spacing={2}>
            <Icon as={SiLeetcode as ElementType} color="yellow.400" boxSize={4} />
            <Text fontWeight="600" fontSize="sm">LeetCode</Text>
          </HStack>
          <Link href={`https://leetcode.com/${lcHandle}`} isExternal>
            <Badge variant="outline" colorScheme="yellow" fontFamily="mono">@{lcHandle}</Badge>
          </Link>
        </HStack>
        {lcStatus === "loading" && <Center h="80px"><Spinner size="sm" color="yellow.400" /></Center>}
        {lcStatus === "error" && (
          <Link href={`https://leetcode.com/${lcHandle}`} isExternal
            color="yellow.400" fontSize="sm" display="flex" alignItems="center" gap={1}>
            View profile <Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />
          </Link>
        )}
        {lcStatus === "ok" && lcData && (
          <Stack spacing={3}>
            <HStack justify="space-between">
              <Stat size="sm">
                <StatLabel color="gray.500" fontSize="xs">Solved</StatLabel>
                <StatNumber color="yellow.400" fontSize="xl">{String(lcData.totalSolved)}</StatNumber>
                {Number(lcData.ranking) > 0 && (
                  <StatHelpText fontSize="xs" mb={0}>
                    rank #{Number(lcData.ranking).toLocaleString()}
                  </StatHelpText>
                )}
              </Stat>
              <HStack spacing={2}>
                {([
                  { l: "E", s: Number(lcData.easySolved), t: Number(lcData.totalEasy), c: "green.400" },
                  { l: "M", s: Number(lcData.mediumSolved), t: Number(lcData.totalMedium), c: "yellow.400" },
                  { l: "H", s: Number(lcData.hardSolved), t: Number(lcData.totalHard), c: "red.400" },
                ] as const).map(({ l, s, t, c }) => (
                  <Stack key={l} align="center" spacing={0.5}>
                    <CircularProgress value={t ? (s / t) * 100 : 0} color={c}
                      size="46px" thickness="7px" trackColor="whiteAlpha.100">
                      <CircularProgressLabel fontSize="9px" fontWeight="700">{s}</CircularProgressLabel>
                    </CircularProgress>
                    <Text fontSize="9px" color="gray.500" fontFamily="mono">{l}</Text>
                  </Stack>
                ))}
              </HStack>
            </HStack>
            {Number(lcData.acceptanceRate) > 0 && (
              <Text fontSize="11px" color="gray.500" fontFamily="mono">
                acceptance: <Text as="span" color="green.400">{Number(lcData.acceptanceRate).toFixed(1)}%</Text>
              </Text>
            )}
          </Stack>
        )}
      </MotionBox>
    </SimpleGrid>
  );
};

// ── OSS Panel ─────────────────────────────────────────────────────────────────

interface OSSEvent {
  repo: string;
  prTitle: string;
  url: string;
  date: string;
  merged: boolean;
}

interface OSSData {
  handle: string;
  totalStars: number;
  totalOwnRepos: number;
  lastActive: string | null;
  topRepos: MiniRepo[];
  languages: { name: string; count: number; pct: number }[];
  externalPRs: OSSEvent[];
}

const OSSPanel = ({ handle }: { handle: string }) => {
  const [data, setData] = useState<OSSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heatmapOK, setHeatmapOK] = useState(true);
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  useEffect(() => {
    if (!handle) { setLoading(false); setError(true); return; }

    Promise.all([
      fetch(`https://api.github.com/users/${handle}/repos?per_page=100&type=owner&sort=updated`)
        .then((r) => r.ok ? r.json() : [])
        .catch(() => []),
      fetch(`https://api.github.com/users/${handle}/events?per_page=100`)
        .then((r) => r.ok ? r.json() : [])
        .catch(() => []),
    ]).then(([reposRaw, eventsRaw]) => {
      const repos = Array.isArray(reposRaw) ? reposRaw : [];
      const events = Array.isArray(eventsRaw) ? eventsRaw : [];

      // Filter to OWN, non-fork, non-archived repos
      const own = repos.filter(
        (r: Record<string, unknown>) =>
          !r.fork && !r.private && !r.archived
      );

      // Total stars from own repos only
      const totalStars = own.reduce(
        (sum, r) => sum + (Number((r as Record<string, unknown>).stargazers_count) || 0),
        0
      );

      // Most recent push
      const lastActive = (own[0] as Record<string, unknown> | undefined)?.pushed_at as string | null
        || null;

      // Top repos: prefer starred, fall back to recent
      const starred = own
        .filter((r) => Number((r as Record<string, unknown>).stargazers_count) > 0)
        .sort(
          (a, b) =>
            Number((b as Record<string, unknown>).stargazers_count) -
            Number((a as Record<string, unknown>).stargazers_count)
        );

      const topSource = starred.length >= 3 ? starred : [...starred, ...own.filter(r => !starred.includes(r))];

      const topRepos: MiniRepo[] = topSource.slice(0, 3).map((r) => {
        const repo = r as Record<string, unknown>;
        return {
          name: String(repo.name),
          description: String(repo.description ?? ""),
          url: String(repo.html_url),
          stars: Number(repo.stargazers_count) || 0,
          language: String(repo.language ?? ""),
        };
      });

      // Language breakdown
      const langCount: Record<string, number> = {};
      own.forEach((r) => {
        const lang = String((r as Record<string, unknown>).language ?? "");
        if (lang) langCount[lang] = (langCount[lang] || 0) + 1;
      });
      const langTotal = Object.values(langCount).reduce((a, b) => a + b, 0);
      const languages = Object.entries(langCount)
        .map(([name, count]) => ({
          name,
          count,
          pct: langTotal > 0 ? Math.round((count / langTotal) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // External PRs
      const externalPRs: OSSEvent[] = events
        .filter((e: Record<string, unknown>) => {
          if (e.type !== "PullRequestEvent") return false;
          const payload = e.payload as Record<string, unknown>;
          if (payload?.action !== "opened") return false;
          const repo = e.repo as Record<string, unknown>;
          if (!repo?.name) return false;
          return String(repo.name).split("/")[0].toLowerCase() !== handle.toLowerCase();
        })
        .slice(0, 6)
        .map((e: Record<string, unknown>) => {
          const pr = ((e.payload as Record<string, unknown>)?.pull_request as Record<string, unknown>) || {};
          return {
            repo: String((e.repo as Record<string, unknown>).name),
            prTitle: String(pr.title || ""),
            url: String(pr.html_url || ""),
            date: new Date(String(e.created_at)).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            merged: Boolean(pr.merged),
          };
        });

      setData({
        handle,
        totalStars,
        totalOwnRepos: own.length,
        lastActive,
        topRepos,
        languages,
        externalPRs,
      });
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [handle]);

  if (loading) return <Center h="160px"><Spinner color="brand.400" /></Center>;

  if (error || !data) {
    return (
      <Box p={5} layerStyle="card" border="1px solid" borderColor={border} borderRadius="10px">
        <HStack spacing={2}>
          <Icon as={FaGithub as ElementType} color="gray.500" />
          <Text fontSize="sm" color="gray.500">
            Couldn't load GitHub data. Check that contacts.github.link points to github.com/yourname or has direct repo links.
          </Text>
        </HStack>
      </Box>
    );
  }

  const hasStarred = data.topRepos.some(r => r.stars > 0);

  return (
    <Stack spacing={8}>
      {/* Stats row */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
        <StatCard
          label="GitHub Stars"
          value={data.totalStars}
          sub={`${data.totalOwnRepos} own repo${data.totalOwnRepos !== 1 ? "s" : ""}`}
          icon={FaStar as ElementType}
          color="yellow.400"
          animate
        />
        <StatCard
          label="External PRs"
          value={data.externalPRs.length}
          sub="last 90 days"
          icon={FaCodeBranch as ElementType}
          color="green.400"
          animate
        />
        <StatCard
          label="Last Active"
          value={timeAgo(data.lastActive)}
          sub="most recent push"
          icon={FaClock as ElementType}
          color="brand.400"
        />
      </SimpleGrid>

      {/* Contribution heatmap */}
      {heatmapOK && (
        <Box>
          <Caption>Contribution Activity</Caption>
          <Box
            layerStyle="card"
            border="1px solid"
            borderColor={border}
            borderRadius="10px"
            p={4}
            overflowX="auto"
            overflowY="hidden"
            sx={{
              "&::-webkit-scrollbar": { height: "4px" },
            }}
          >
            <Image
              src={`https://ghchart.rshah.org/818cf8/${data.handle}`}
              alt={`${data.handle}'s GitHub contributions`}
              minW="700px"
              w="100%"
              opacity={0.92}
              onError={() => setHeatmapOK(false)}
              draggable={false}
            />
          </Box>
        </Box>
      )}

      {/* Top languages */}
      {data.languages.length > 0 && (
        <Box>
          <Caption>Top Languages</Caption>
          <Stack spacing={2.5}>
            {data.languages.map((l) => <LangBar key={l.name} {...l} />)}
          </Stack>
        </Box>
      )}

      {/* Top repos */}
      {data.topRepos.length > 0 && (
        <Box>
          <Caption>{hasStarred ? "Most Starred Own Repos" : "Recent Work"}</Caption>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            {data.topRepos.map((r) => <MiniRepoCard key={r.name} repo={r} />)}
          </SimpleGrid>
        </Box>
      )}

      {/* External PRs */}
      {data.externalPRs.length > 0 && (
        <Box>
          <Caption>Recent External Contributions</Caption>
          <Stack spacing={2}>
            {data.externalPRs.map((pr, i) => (
              <MotionBox
                key={i}
                p={3} borderRadius="10px" layerStyle="card"
                border="1px solid" borderColor={border}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                _hover={{ borderColor: "brand.500" }}
              >
                <HStack justify="space-between" align="flex-start">
                  <Stack spacing={0.5} flex={1} minW={0}>
                    <Text fontSize="11px" color="brand.400" fontFamily="mono" isTruncated>
                      {pr.repo}
                    </Text>
                    <Text fontSize="13px" fontWeight="500" isTruncated>
                      {pr.prTitle}
                    </Text>
                  </Stack>
                  <HStack spacing={2} flexShrink={0}>
                    <Text fontSize="10px" color="gray.500" fontFamily="mono">{pr.date}</Text>
                    <Link href={pr.url} isExternal color="gray.500" _hover={{ color: "brand.400" }}>
                      <Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />
                    </Link>
                  </HStack>
                </HStack>
              </MotionBox>
            ))}
          </Stack>
        </Box>
      )}

      {/* Empty state for PRs only — if everything else worked */}
      {data.externalPRs.length === 0 && data.topRepos.length > 0 && (
        <Text fontSize="xs" color="gray.600" fontFamily="mono" textAlign="center" pt={2}>
          no external PRs in last 90 days · <Link href={`https://github.com/${data.handle}`}
          isExternal color="brand.400">view on github ↗</Link>
        </Text>
      )}
    </Stack>
  );
};

// ── Following Panel ───────────────────────────────────────────────────────────

const FollowingPanel = ({ areas, following }: { areas: string[]; following: FollowItem[] }) => {
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  return (
    <Stack spacing={5}>
      <HStack spacing={2} flexWrap="wrap">
        {areas.map((a) => (
          <Tag key={a} size="sm" colorScheme="purple" variant="subtle">{a}</Tag>
        ))}
      </HStack>
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
        {following.map((item, i) => (
          <Link key={i} href={item.url} isExternal _hover={{ textDecoration: "none" }}>
            <MotionBox
              p={4} borderRadius="10px" layerStyle="card"
              border="1px solid" borderColor={border}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}
              _hover={{ borderColor: "brand.500" }}
            >
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="600">{item.name}</Text>
                <Badge colorScheme={TYPE_COLOR[item.type] ?? "gray"} variant="subtle" fontSize="10px">
                  {item.type}
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">{item.desc}</Text>
            </MotionBox>
          </Link>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  data: PortfolioData;
}

const Activity = ({ data }: Props) => {
  const ghHandle = extractGitHubHandle(data);

  return (
    <Box>
      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Activity
      </Text>
      <Heading size="lg" mb={8}>Beyond Projects</Heading>

      <Tabs variant="line" colorScheme="brand" isLazy>
        <TabList mb={8} borderColor="rgba(255,255,255,0.07)" gap={4}>
          <Tab pb={3}>competitive</Tab>
          <Tab pb={3}>open source</Tab>
          <Tab pb={3}>what i follow</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={0}>
            <CompetitivePanel cfHandle={data.cp.codeforces} lcHandle={data.cp.leetcode} />
          </TabPanel>
          <TabPanel px={0} pt={0}>
            <OSSPanel handle={ghHandle} />
          </TabPanel>
          <TabPanel px={0} pt={0}>
            <FollowingPanel
              areas={data.interests?.areas ?? []}
              following={data.interests?.following ?? []}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Activity;
