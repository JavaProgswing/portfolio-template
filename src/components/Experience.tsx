import {
  Box,
  Heading,
  HStack,
  Icon,
  Link,
  Stack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ElementType } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const MotionBox = motion(Box);

export interface ExperienceItem {
  role: string;
  company: string;
  companyUrl?: string;
  date: string;
  location?: string;
  description: string;
  skills?: string[];
}

/**
 * Work experience (internships / jobs) section.
 * Renders nothing when `experience` is empty/undefined, so a fresh portfolio
 * with no internships yet simply hides the section.
 */
const Experience = ({ experience }: { experience?: ExperienceItem[] }) => {
  const cardBg = useColorModeValue("rgba(0,0,0,0.02)", "rgba(255,255,255,0.02)");
  const cardBorder = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");

  if (!experience || experience.length === 0) return null;

  return (
    <Box>
      <Text
        fontSize="11px"
        fontFamily="mono"
        color="gray.500"
        letterSpacing="0.14em"
        mb={2}
        textTransform="uppercase"
      >
        Work
      </Text>
      <Heading size="lg" mb={10}>
        Experience
      </Heading>

      <Stack spacing={4}>
        {experience.map((item, i) => (
          <MotionBox
            key={i}
            p={5}
            borderRadius="lg"
            border="1px solid"
            borderColor={cardBorder}
            bg={cardBg}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            _hover={{ borderColor: "brand.400" }}
            sx={{ transition: "border-color 0.2s ease" }}
          >
            <HStack justify="space-between" align="start" flexWrap="wrap" spacing={2}>
              <Box>
                <Heading size="sm" lineHeight="1.3">
                  {item.role}
                </Heading>
                {item.companyUrl ? (
                  <Link
                    href={item.companyUrl}
                    isExternal
                    fontSize="sm"
                    color="brand.400"
                    fontWeight="600"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {item.company}
                    <Icon as={FaExternalLinkAlt as ElementType} ml={1.5} boxSize={2.5} />
                  </Link>
                ) : (
                  <Text fontSize="sm" color="brand.400" fontWeight="600">
                    {item.company}
                  </Text>
                )}
              </Box>

              <Stack spacing={0.5} align="end">
                <Text
                  fontSize="11px"
                  color="gray.500"
                  fontFamily="mono"
                  letterSpacing="0.05em"
                >
                  {item.date}
                </Text>
                {item.location && (
                  <Text fontSize="11px" color="gray.600" fontFamily="mono">
                    {item.location}
                  </Text>
                )}
              </Stack>
            </HStack>

            <Text fontSize="sm" color="gray.400" lineHeight="1.75" mt={3} maxW="640px">
              {item.description}
            </Text>

            {item.skills && item.skills.length > 0 && (
              <HStack spacing={2} pt={3} flexWrap="wrap">
                {item.skills.map((s) => (
                  <Tag
                    key={s}
                    size="sm"
                    variant="subtle"
                    colorScheme="gray"
                    fontFamily="mono"
                    fontSize="10px"
                  >
                    {s}
                  </Tag>
                ))}
              </HStack>
            )}
          </MotionBox>
        ))}
      </Stack>
    </Box>
  );
};

export default Experience;
