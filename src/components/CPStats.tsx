import { useEffect, useState, ElementType } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Badge,
  HStack,
  Spinner,
  Center,
  Link,
  Icon,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { SiCodeforces, SiLeetcode } from "react-icons/si";
import { motion } from "framer-motion";

interface CFUser {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contribution: number;
}

interface LCStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  acceptanceRate: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
}

type Status = "loading" | "ok" | "error";

const MotionBox = motion(Box);

const getRankColor = (rank: string) => {
  if (!rank) return "gray.400";
  if (rank.includes("grandmaster") || rank.includes("legendary")) return "red.400";
  if (rank.includes("international") && rank.includes("master")) return "orange.300";
  if (rank.includes("master")) return "orange.400";
  if (rank.includes("candidate")) return "purple.400";
  if (rank.includes("expert")) return "blue.400";
  if (rank.includes("specialist")) return "cyan.400";
  if (rank.includes("apprentice") || rank.includes("pupil")) return "green.400";
  return "gray.400";
};

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

interface Props {
  cfHandle: string;
  lcHandle: string;
}

const CPStats = ({ cfHandle, lcHandle }: Props) => {
  const [cfData, setCfData] = useState<CFUser | null>(null);
  const [lcData, setLcData] = useState<LCStats | null>(null);
  const [cfStatus, setCfStatus] = useState<Status>("loading");
  const [lcStatus, setLcStatus] = useState<Status>("loading");

  const cardBg = useColorModeValue("white", "transparent");
  const borderCol = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  useEffect(() => {
    if (!cfHandle) {
      setCfStatus("error");
    } else {
      fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "OK" && data.result?.[0]) {
            setCfData(data.result[0]);
            setCfStatus("ok");
          } else {
            setCfStatus("error");
          }
        })
        .catch(() => setCfStatus("error"));
    }

    if (!lcHandle) {
      setLcStatus("error");
    } else {
      fetch(`https://leetcode-stats-api.herokuapp.com/${lcHandle}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "success" && data.totalSolved !== undefined) {
            setLcData(data);
            setLcStatus("ok");
          } else {
            setLcStatus("error");
          }
        })
        .catch(() => setLcStatus("error"));
    }
  }, [cfHandle, lcHandle]);

  return (
    <Box maxW="4xl" mx="auto" px={6} py={10}>
      <Heading
        as="h2"
        size="xl"
        mb={10}
        textAlign="center"
        bgGradient={useColorModeValue(
          "linear(to-r, yellow.600, orange.600)",
          "linear(to-r, yellow.400, orange.400)"
        )}
        bgClip="text"
      >
        Competitive Programming
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Codeforces */}
        <MotionBox
          p={6}
          borderRadius="xl"
          bg={cardBg}
          layerStyle="glass"
          border="1px solid"
          borderColor={borderCol}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          _hover={{ borderColor: "blue.500", boxShadow: "0 0 20px rgba(0,127,255,0.1)" }}
        >
          <HStack justify="space-between" mb={5}>
            <HStack spacing={2}>
              <Icon as={SiCodeforces as ElementType} color="blue.400" boxSize={5} />
              <Heading size="md">Codeforces</Heading>
            </HStack>
            <Link
              href={`https://codeforces.com/profile/${cfHandle}`}
              isExternal
              _hover={{ color: "blue.400" }}
            >
              <Badge
                colorScheme="blue"
                variant="outline"
                fontFamily="mono"
                cursor="pointer"
              >
                @{cfHandle}
              </Badge>
            </Link>
          </HStack>

          {cfStatus === "loading" && (
            <Center h="100px">
              <Spinner color="blue.400" />
            </Center>
          )}
          {cfStatus === "error" && (
            <Stack spacing={2}>
              <Text color="gray.500" fontSize="sm">
                Couldn't load stats.
              </Text>
              <Link
                href={`https://codeforces.com/profile/${cfHandle}`}
                isExternal
                color="blue.400"
                fontSize="sm"
                display="flex"
                alignItems="center"
                gap={1}
              >
                View profile <Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />
              </Link>
            </Stack>
          )}
          {cfStatus === "ok" && cfData && (
            <Stack spacing={4}>
              <HStack spacing={8} align="flex-start">
                <Stat>
                  <StatLabel color="gray.500" fontSize="xs">Rating</StatLabel>
                  <StatNumber color="blue.400" fontSize="2xl">
                    {cfData.rating ?? "—"}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>
                    Max: {cfData.maxRating ?? "—"}
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel color="gray.500" fontSize="xs">Rank</StatLabel>
                  <StatNumber
                    fontSize="lg"
                    color={getRankColor(cfData.rank)}
                    fontWeight="600"
                  >
                    {capitalize(cfData.rank ?? "—")}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0} color="gray.500">
                    Max: {capitalize(cfData.maxRank ?? "—")}
                  </StatHelpText>
                </Stat>
              </HStack>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                contribution:{" "}
                <Text as="span" color="green.400">
                  +{cfData.contribution ?? 0}
                </Text>
              </Text>
            </Stack>
          )}
        </MotionBox>

        {/* LeetCode */}
        <MotionBox
          p={6}
          borderRadius="xl"
          bg={cardBg}
          layerStyle="glass"
          border="1px solid"
          borderColor={borderCol}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          _hover={{ borderColor: "yellow.500", boxShadow: "0 0 20px rgba(236,201,75,0.08)" }}
        >
          <HStack justify="space-between" mb={5}>
            <HStack spacing={2}>
              <Icon as={SiLeetcode as ElementType} color="yellow.400" boxSize={5} />
              <Heading size="md">LeetCode</Heading>
            </HStack>
            <Link
              href={`https://leetcode.com/${lcHandle}`}
              isExternal
              _hover={{ color: "yellow.400" }}
            >
              <Badge
                colorScheme="yellow"
                variant="outline"
                fontFamily="mono"
                cursor="pointer"
              >
                @{lcHandle}
              </Badge>
            </Link>
          </HStack>

          {lcStatus === "loading" && (
            <Center h="100px">
              <Spinner color="yellow.400" />
            </Center>
          )}
          {lcStatus === "error" && (
            <Stack spacing={2}>
              <Text color="gray.500" fontSize="sm">
                Couldn't load stats.
              </Text>
              <Link
                href={`https://leetcode.com/${lcHandle}`}
                isExternal
                color="yellow.400"
                fontSize="sm"
                display="flex"
                alignItems="center"
                gap={1}
              >
                View profile <Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />
              </Link>
            </Stack>
          )}
          {lcStatus === "ok" && lcData && (
            <Stack spacing={4}>
              <HStack spacing={6} align="flex-start" justify="space-between">
                <Stat>
                  <StatLabel color="gray.500" fontSize="xs">Solved</StatLabel>
                  <StatNumber color="yellow.400" fontSize="2xl">
                    {lcData.totalSolved}
                  </StatNumber>
                  {lcData.ranking > 0 && (
                    <StatHelpText fontSize="xs" mb={0}>
                      Rank #{lcData.ranking.toLocaleString()}
                    </StatHelpText>
                  )}
                </Stat>
                <HStack spacing={3}>
                  {[
                    {
                      label: "E",
                      solved: lcData.easySolved,
                      total: lcData.totalEasy,
                      color: "green.400",
                    },
                    {
                      label: "M",
                      solved: lcData.mediumSolved,
                      total: lcData.totalMedium,
                      color: "yellow.400",
                    },
                    {
                      label: "H",
                      solved: lcData.hardSolved,
                      total: lcData.totalHard,
                      color: "red.400",
                    },
                  ].map(({ label, solved, total, color }) => (
                    <Stack key={label} align="center" spacing={1}>
                      <CircularProgress
                        value={total ? (solved / total) * 100 : 0}
                        color={color}
                        size="52px"
                        thickness="7px"
                        trackColor="whiteAlpha.100"
                      >
                        <CircularProgressLabel fontSize="10px" fontWeight="600">
                          {solved}
                        </CircularProgressLabel>
                      </CircularProgress>
                      <Text fontSize="10px" color="gray.500" fontFamily="mono">
                        {label}
                      </Text>
                    </Stack>
                  ))}
                </HStack>
              </HStack>
              {lcData.acceptanceRate > 0 && (
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  acceptance:{" "}
                  <Text as="span" color="green.400">
                    {lcData.acceptanceRate.toFixed(1)}%
                  </Text>
                </Text>
              )}
            </Stack>
          )}
        </MotionBox>
      </SimpleGrid>
    </Box>
  );
};

export default CPStats;
