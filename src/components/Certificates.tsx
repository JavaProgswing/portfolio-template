import { Badge, Box, Button, Flex, Heading, HStack, Icon, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { ElementType, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowRight, FaCheckCircle, FaFileAlt, FaTrophy } from "react-icons/fa";
import certificatesData from "../data/certificates.json";

export interface Certificate {
  title: string;
  issuer: string;
  date: string; // YYYY-MM
  category: "hackathon" | "certification" | "other" | string;
  result?: string;
  featured?: boolean;
  description?: string;
  file?: string; // path under public/, e.g. /certificates/x.pdf
  url?: string; // public verification link
}

export const CERTIFICATES: Certificate[] = (certificatesData as { certificates: Certificate[] }).certificates || [];

const MotionBox = motion(Box);

const LABELS: Record<string, string> = { hackathon: "Hackathons", certification: "Certifications", other: "Other" };
const isWin = (r?: string) => !!r && /1st|2nd|3rd|first|second|third|winner|prize|top|finalist/i.test(r);

const formatDate = (d: string) => {
  const [y, m] = d.split("-").map(Number);
  if (!y) return d;
  return m ? new Date(y, m - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : String(y);
};

/** Featured first, then wins, then newest. */
const rank = (a: Certificate, b: Certificate) =>
  Number(!!b.featured) - Number(!!a.featured) ||
  Number(isWin(b.result)) - Number(isWin(a.result)) ||
  b.date.localeCompare(a.date);

const CertCard = ({ c, i }: { c: Certificate; i: number }) => (
  <MotionBox
    initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
    p={4} borderRadius="12px" layerStyle="card" className="lift" display="flex" flexDirection="column" gap={2}
  >
    <Flex justify="space-between" align="flex-start" gap={3}>
      <HStack spacing={2.5} align="flex-start" minW={0}>
        <Box mt="2px" color={isWin(c.result) ? "brand.400" : "fg.subtle"} flexShrink={0}>
          <Icon as={(c.category === "hackathon" ? FaTrophy : FaCheckCircle) as ElementType} boxSize={3.5} />
        </Box>
        <Box minW={0}>
          <Text fontWeight="600" fontSize="sm" lineHeight="1.35">{c.title}</Text>
          <Text color="fg.muted" fontSize="xs">{c.issuer} · {formatDate(c.date)}</Text>
        </Box>
      </HStack>
      {c.result && (
        <Badge colorScheme={isWin(c.result) ? "purple" : "gray"} variant={isWin(c.result) ? "solid" : "subtle"} flexShrink={0} fontSize="10px">
          {c.result}
        </Badge>
      )}
    </Flex>
    {c.description && <Text color="fg.body" fontSize="xs" lineHeight="1.6">{c.description}</Text>}
    {(c.file || c.url) && (
      <HStack spacing={3} mt="auto" pt={1} fontFamily="mono" fontSize="11px">
        {c.file && (
          <Box as="a" href={c.file} target="_blank" rel="noopener noreferrer" color="brand.400" display="inline-flex" alignItems="center" gap={1.5}>
            <Icon as={FaFileAlt as ElementType} boxSize={2.5} /> view certificate
          </Box>
        )}
        {c.url && (
          <Box as="a" href={c.url} target="_blank" rel="noopener noreferrer" color="fg.muted" _hover={{ color: "brand.400" }}>
            verify ↗
          </Box>
        )}
      </HStack>
    )}
  </MotionBox>
);

interface Props {
  /** Show only this many (featured first) plus a link to /certificates. */
  limit?: number;
  heading?: string;
}

const Certificates = ({ limit, heading = "Certificates & hackathons" }: Props) => {
  const categories = useMemo(() => [...new Set(CERTIFICATES.map((c) => c.category))], []);
  const [filter, setFilter] = useState<string>("all");
  if (!CERTIFICATES.length) return null;

  const sorted = [...CERTIFICATES].sort(rank);
  const shown = (filter === "all" ? sorted : sorted.filter((c) => c.category === filter)).slice(0, limit ?? Infinity);
  const wins = CERTIFICATES.filter((c) => isWin(c.result)).length;

  return (
    <Box>
      <Flex justify="space-between" align="flex-end" mb={4} gap={3} wrap="wrap">
        <Box>
          <Heading size="md">{heading}</Heading>
          <Text fontSize="xs" color="fg.muted" fontFamily="mono" mt={1}>
            {CERTIFICATES.length} total{wins ? ` · ${wins} podium / top finishes` : ""}
          </Text>
        </Box>
        {!limit && categories.length > 1 && (
          <Wrap spacing={1.5}>
            {["all", ...categories].map((k) => (
              <WrapItem key={k}>
                <Button size="xs" fontFamily="mono" variant={filter === k ? "solid" : "ghost"} colorScheme={filter === k ? "purple" : undefined}
                  onClick={() => setFilter(k)}>
                  {k === "all" ? "all" : (LABELS[k] || k).toLowerCase()}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Flex>

      <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
        {shown.map((c, i) => <CertCard key={`${c.issuer}-${c.title}`} c={c} i={i} />)}
      </Box>

      {limit && CERTIFICATES.length > limit && (
        <Button as={RouterLink} to="/certificates" mt={4} size="sm" variant="ghost" fontFamily="mono" fontSize="12px" color="brand.400"
          rightIcon={<Icon as={FaArrowRight as ElementType} boxSize={3} />}>
          all {CERTIFICATES.length} certificates
        </Button>
      )}
    </Box>
  );
};

export default Certificates;
