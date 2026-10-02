import { Box, Flex, Heading, HStack, Icon, Link, Tag, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ElementType, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FaBriefcase, FaCode, FaExternalLinkAlt, FaGraduationCap, FaTrophy, FaUsers } from "react-icons/fa";
import { Info } from "./Intro";
import { CERTIFICATES } from "./Certificates";

type Kind = "education" | "work" | "project" | "community" | "award";

export interface JourneyItem {
  title: string;
  company: string;
  date: string; // "2024 – Present", "2023", "Mar 2026"...
  description: string;
  /** Optional; inferred from the organisation name when omitted. */
  type?: Exclude<Kind, "award">;
  evidence?: { name: string; url: string }[];
}

interface Entry {
  kind: Kind;
  title: string;
  org: string;
  when: string;
  description?: string;
  links: { name: string; url: string; internal?: boolean }[];
  ongoing: boolean;
  sortKey: number; // year * 12 + month, for ordering
  badge?: string;
}

const KIND: Record<Kind, { icon: unknown; label: string }> = {
  education: { icon: FaGraduationCap, label: "Education" },
  work: { icon: FaBriefcase, label: "Work" },
  project: { icon: FaCode, label: "Building" },
  community: { icon: FaUsers, label: "Community" },
  award: { icon: FaTrophy, label: "Milestone" },
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Latest year (+ month if present) mentioned in a free-form date; "Present" sorts first. */
function sortKeyOf(date: string): { key: number; ongoing: boolean } {
  if (/present|now|current/i.test(date)) return { key: Number.MAX_SAFE_INTEGER, ongoing: true };
  const years = [...date.matchAll(/(19|20)\d{2}/g)].map((m) => Number(m[0]));
  const month = MONTHS.findIndex((m) => date.toLowerCase().includes(m));
  const y = years.length ? Math.max(...years) : 0;
  return { key: y * 12 + Math.max(0, month), ongoing: false };
}

const inferKind = (org: string): Kind =>
  /universit|institut|college|school|academy/i.test(org) ? "education"
    : /club|community|chapter|society|open source/i.test(org) ? "community"
      : "project";

const isWin = (r?: string) => !!r && /1st|2nd|3rd|first|second|third|winner|prize|top|finalist/i.test(r);

const formatYm = (d: string) => {
  const [y, m] = d.split("-").map(Number);
  return m ? `${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} ${y}` : String(y);
};

const MotionBox = motion(Box);

/**
 * Timeline of journey entries from me.ts plus featured hackathon wins from
 * certificates.json, so new results show up here without editing two places.
 * Ongoing entries come first, then everything newest-first.
 */
const Journey = ({ data }: { data: Info }) => {
  const entries = useMemo<Entry[]>(() => {
    const fromJourney: Entry[] = (data.journey || []).map((j: JourneyItem) => {
      const { key, ongoing } = sortKeyOf(j.date);
      return {
        kind: j.type || inferKind(j.company),
        title: j.title,
        org: j.company,
        when: j.date,
        description: j.description,
        links: j.evidence || [],
        ongoing,
        sortKey: key,
      };
    });
    const fromCerts: Entry[] = CERTIFICATES
      .filter((c) => c.category === "hackathon" && (c.featured || isWin(c.result)))
      .map((c) => {
        const [y, m] = c.date.split("-").map(Number);
        return {
          kind: "award" as Kind,
          title: c.title,
          org: c.issuer,
          when: formatYm(c.date),
          description: c.description,
          links: [
            ...(c.file ? [{ name: "certificate", url: c.file }] : []),
            ...(c.url ? [{ name: "verify", url: c.url }] : []),
          ],
          ongoing: false,
          sortKey: y * 12 + (m ? m - 1 : 0),
          badge: c.result,
        };
      });
    return [...fromJourney, ...fromCerts].sort((a, b) => b.sortKey - a.sortKey);
  }, [data.journey]);

  if (!entries.length) return null;

  const counts = entries.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] || 0) + 1 }), {});

  return (
    <Box>
      <Text fontSize="11px" fontFamily="mono" color="fg.subtle" letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Journey
      </Text>
      <Flex justify="space-between" align="flex-end" mb={10} gap={3} wrap="wrap">
        <Heading size="lg">How I got here</Heading>
        <HStack spacing={3} fontFamily="mono" fontSize="11px" color="fg.subtle" wrap="wrap">
          {(Object.keys(KIND) as Kind[]).filter((k) => counts[k]).map((k) => (
            <HStack key={k} spacing={1.5}>
              <Icon
                as={KIND[k].icon as ElementType}
                boxSize={2.5}
                color="var(--journey-kind-color, var(--chakra-colors-brand-400))"
                data-journey-kind={k}
              />
              <Text color="inherit">{counts[k]} {KIND[k].label.toLowerCase()}{counts[k] > 1 && k !== "education" && k !== "work" ? "s" : ""}</Text>
            </HStack>
          ))}
        </HStack>
      </Flex>

      <Box position="relative" pl={{ base: 10, md: 12 }}>
        {/* spine: brand at the top, fading into the past */}
        <Box position="absolute" left={{ base: "15px", md: "19px" }} top="6px" bottom="6px" w="2px" borderRadius="full"
          bg="var(--journey-spine, linear-gradient(to bottom, rgba(var(--brand-rgb),0.8), var(--border)))" />

        {entries.map((e, i) => {
          const IconC = KIND[e.kind].icon as ElementType;
          const win = isWin(e.badge);
          return (
            <MotionBox
              key={`${e.title}-${e.when}`}
              position="relative"
              mb={i < entries.length - 1 ? 6 : 0}
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* node */}
              <Box
                position="absolute" left={{ base: "-40px", md: "-48px" }} top="14px"
                w={{ base: "32px", md: "40px" }} h={{ base: "32px", md: "40px" }} borderRadius="full"
                display="grid" placeItems="center" zIndex={1}
                data-journey-kind={e.kind}
                bg={`rgba(var(--journey-kind-rgb, var(--brand-rgb)), ${e.ongoing || win ? "0.88" : "0.12"})`}
                color={e.ongoing || win ? "var(--bg-base)" : "var(--journey-kind-color, var(--chakra-colors-brand-400))"}
                border="2px solid" borderColor="var(--journey-kind-color, var(--chakra-colors-brand-400))"
                boxShadow={e.ongoing ? "0 0 0 6px rgba(var(--journey-kind-rgb, var(--brand-rgb)),0.16)" : undefined}
                sx={e.ongoing ? { animation: "live-dot 2.4s ease-in-out infinite" } : undefined}
              >
                <IconC size={14} />
              </Box>

              <Box p={{ base: 4, md: 5 }} borderRadius="14px" layerStyle="card" className="lift">
                <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap" mb={1.5}>
                  <HStack spacing={2} fontFamily="mono" fontSize="11px" color="fg.subtle">
                    <Text color="inherit">{e.when}</Text>
                    <Text color="inherit">·</Text>
                    <Text color="inherit">{KIND[e.kind].label}</Text>
                  </HStack>
                  {e.ongoing && (
                    <Tag size="sm" colorScheme="green" variant="subtle" fontSize="10px">now</Tag>
                  )}
                  {e.badge && (
                    <Tag size="sm" colorScheme={win ? "purple" : "gray"} variant={win ? "solid" : "subtle"} fontSize="10px">{e.badge}</Tag>
                  )}
                </Flex>
                <Heading size="sm" lineHeight="1.35">{e.title}</Heading>
                <Text fontSize="sm" color="brand.400" fontWeight="600" mt={0.5}>{e.org}</Text>
                {e.description && (
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.75" mt={2} maxW="600px">{e.description}</Text>
                )}
                {e.links.length > 0 && (
                  <HStack spacing={2} pt={3} flexWrap="wrap">
                    {e.links.map((l) => (
                      <Link key={l.name + l.url} href={l.url} isExternal _hover={{ textDecoration: "none" }}>
                        <Tag size="sm" variant="subtle" colorScheme="gray" cursor="pointer" fontFamily="mono" fontSize="10px"
                          _hover={{ bg: "rgba(var(--brand-rgb),0.12)", color: "brand.400" }} transition="all 0.15s">
                          <Icon as={FaExternalLinkAlt as ElementType} mr={1.5} boxSize={2} />
                          {l.name}
                        </Tag>
                      </Link>
                    ))}
                  </HStack>
                )}
              </Box>
            </MotionBox>
          );
        })}
      </Box>

      {CERTIFICATES.length > 0 && (
        <Text as={RouterLink} to="/certificates" display="inline-block" mt={6} fontFamily="mono" fontSize="12px" color="brand.400">
          all certificates & hackathons →
        </Text>
      )}
    </Box>
  );
};

export default Journey;
