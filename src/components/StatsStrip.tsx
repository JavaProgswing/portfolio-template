import { Box, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import { LabConfig, useGithubLab } from "../lib/lab";
import githubStats from "../data/github-stats.json";

const Stat = ({ value, label, to }: { value: number; label: string; to?: string }) => {
  const n = useAnimatedNumber(value);
  const link = to ? { as: RouterLink, to } : {};
  return (
    <Box {...(link as object)} textAlign="center" py={2} borderRadius="12px" display="block"
      _hover={to ? { bg: "var(--surface-strong)", textDecoration: "none" } : undefined} transition="background .2s">
      <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="800" lineHeight="1" className="grad-text">{n}</Text>
      <Text fontFamily="mono" fontSize="11px" color="gray.500" mt={1} textTransform="uppercase" letterSpacing="0.12em">{label}</Text>
    </Box>
  );
};

/**
 * Repos / live sites / posts. Counts come from GitHub at runtime (same data and
 * cache as /lab), so a new repo or deploy shows up without a rebuild. The
 * build-time snapshot is only a fallback while loading or when rate-limited.
 */
const StatsStrip = ({ posts, owner, lab }: { posts: number; owner: string; lab?: LabConfig }) => {
  const gh = useGithubLab(owner, owner, lab || {});
  const repos = gh.profile?.publicRepos ?? (githubStats as { publicRepos: number }).publicRepos;
  const live = gh.repos.filter((r) => r.deployUrl && !r.down && !r.fork).length;
  return (
    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} p={3} borderRadius="16px" layerStyle="card">
      <Stat value={repos} label="public repos" to="/lab" />
      <Stat value={live} label="live sites" to="/lab" />
      <Stat value={posts} label="posts" to="/blog" />
    </Box>
  );
};

export default StatsStrip;
