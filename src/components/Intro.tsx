import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Stack,
  Tag,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { getTechIcon } from "../services/getTechIcon";
import { useEffect, useState, ElementType } from "react";
import { motion } from "framer-motion";
import { FaChevronDown, FaExternalLinkAlt } from "react-icons/fa";

export interface Info {
  name: string;
  image: string;
  tags: string[];
  languages: string[];
  frameworks: {
    frontend: { name: string; id: string; desc: string; link: string }[];
    backend: { name: string; id: string; desc: string; link: string }[];
    databases: { name: string; id: string; desc: string; link: string }[];
    misc: { name: string; id: string; desc: string; link: string }[];
  };
  projects: {
    name: string; description: string; type: string;
    links: { name: string; link: string }[];
    skills: string[];
  }[];
  contacts: { id: string; name: string; site: string; link: string }[];
  journey: {
    title: string;
    company: string;
    date: string;
    description: string;
    evidence?: { name: string; url: string }[];
  }[];
  desc: string;
  desc_brief: string;
}

interface CurrentWorkData {
  title: string;
  org: string;
  orgUrl: string;
  startDate: string;
}

interface Props {
  data: Info;
  currentWork?: CurrentWorkData;
  resumeUrl?: string;
  onScrollDown?: () => void;
}

const MotionBox = motion(Box);
const MotionImage = motion(Image);
const MotionStack = motion(Stack);

const Intro = ({ data, currentWork, resumeUrl, onScrollDown }: Props) => {
  const { isOpen, onToggle } = useDisclosure();
  const [displayedText, setDisplayedText] = useState(data.desc_brief);

  // Hoist - never call inside loops/maps
  const skillCardBg    = useColorModeValue("gray.100", "rgba(255,255,255,0.04)");
  const skillCardBorder = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const cursorColor    = useColorModeValue("gray.500", "gray.500");

  useEffect(() => {
    if (!isOpen) { setDisplayedText(data.desc_brief); return; }

    let index = 0;
    let current = "";
    setDisplayedText("");

    const id = setInterval(() => {
      if (index < data.desc.length) {
        current += data.desc.charAt(index);
        setDisplayedText(current);
        index++;
      } else {
        clearInterval(id);
      }
    }, 14);

    return () => clearInterval(id);
  }, [isOpen, data.desc, data.desc_brief]);

  return (
    <Box w="100%">
      {/* Hero */}
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        gap={{ base: 8, md: 12 }}
        mb={14}
      >
        {/* Avatar */}
        <Box position="relative" flexShrink={0} alignSelf={{ base: "center", md: "flex-start" }} mt={{ md: 1 }}>
          <Box
            position="absolute" top="50%" left="50%"
            transform="translate(-50%, -50%)"
            w="160px" h="160px" borderRadius="full"
            bg="brand.500" filter="blur(40px)" opacity={0.25} zIndex={0}
          />
          <MotionImage
            src={data.image} alt={data.name}
            borderRadius="full" boxSize="120px" objectFit="cover"
            shadow="xl" position="relative" zIndex={1}
            border="1px solid rgba(255,255,255,0.1)"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            whileHover={{ scale: 1.04 }}
          />
        </Box>

        {/* Text */}
        <MotionStack
          spacing={4}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          flex={1}
        >
          <Box>
            <Text fontSize="12px" color="brand.400" fontFamily="mono"
              fontWeight="600" letterSpacing="0.12em" mb={1.5}>
              &gt;&nbsp;hello world
            </Text>
            <Heading
              fontSize={{ base: "3xl", md: "4xl" }}
              bgGradient="linear(to-br, gray.100, gray.400)"
              bgClip="text"
              lineHeight="1.15"
            >
              {data.name}
            </Heading>
          </Box>

          <HStack spacing={1.5} flexWrap="wrap">
            {data.tags.map(tag => (
              <Tag key={tag} size="sm" colorScheme="purple" variant="subtle" fontSize="11px">
                {tag}
              </Tag>
            ))}
          </HStack>

          <Text fontSize="sm" color="gray.400" lineHeight="1.8" whiteSpace="pre-wrap" maxW="480px">
            {displayedText}
            <Text as="span" ml="1px" color={cursorColor}
              fontWeight="bold" animation="blink 1s steps(2, start) infinite">|</Text>
          </Text>

          <HStack spacing={3} flexWrap="wrap">
            <Button onClick={onToggle} size="xs" variant="link" colorScheme="purple"
              fontFamily="mono" fontSize="11px">
              {isOpen ? "↑ less" : "↓ more"}
            </Button>
            {resumeUrl && (
              <Button
                as="a"
                href={resumeUrl}
                size="xs"
                variant="outline"
                borderColor="rgba(255,255,255,0.14)"
                color="gray.400"
                fontFamily="mono"
                fontSize="11px"
                px={2.5}
                h="22px"
                _hover={{
                  color: "gray.100",
                  borderColor: "rgba(255,255,255,0.3)",
                  bg: "rgba(255,255,255,0.05)",
                }}
              >
                resume ↗
              </Button>
            )}
          </HStack>

          {/* Compact "Now" status */}
          {currentWork && (
            <MotionBox
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              display="inline-flex"
              alignItems="center"
              gap={3}
              p={3}
              borderRadius="10px"
              bg="rgba(255,255,255,0.03)"
              border="1px solid rgba(255,255,255,0.07)"
              maxW="fit-content"
              _hover={{ borderColor: "rgba(99,102,241,0.3)" }}
              sx={{ transition: "border-color 0.2s" }}
            >
              <Box
                w="7px" h="7px" borderRadius="full" bg="green.400"
                flexShrink={0} animation="live-dot 2s ease-in-out infinite"
              />
              <Box>
                <Text fontSize="10px" color="green.400" fontFamily="mono"
                  fontWeight="700" letterSpacing="0.14em">
                  NOW · {currentWork.startDate}
                </Text>
                <HStack spacing={1} align="center">
                  <Text fontSize="sm" fontWeight="600">{currentWork.title}</Text>
                  <Text fontSize="xs" color="gray.500">·</Text>
                  <Text
                    as="a" href={currentWork.orgUrl} target="_blank" rel="noopener noreferrer"
                    fontSize="xs" color="brand.400" _hover={{ color: "brand.300" }}
                    display="inline-flex" alignItems="center" gap={1}
                  >
                    {currentWork.org}
                    <Icon as={FaExternalLinkAlt as ElementType} boxSize={2.5} />
                  </Text>
                </HStack>
              </Box>
            </MotionBox>
          )}
        </MotionStack>
      </Flex>

      {/* Tools */}
      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        {/* Languages - pill chips, primary highlighted */}
        <Text fontSize="10px" fontFamily="mono" color="gray.600"
          letterSpacing="0.16em" mb={4} textTransform="uppercase">
          Languages
        </Text>
        <Wrap spacing={2} mb={9}>
          {data.languages.map((lang, i) => {
            const { icon: IC, label } = getTechIcon(lang);
            const primary = i === 0;
            return (
              <WrapItem key={lang}>
                <Tooltip
                  label={primary ? `${label} · primary` : label}
                  hasArrow fontSize="11px"
                >
                  <MotionBox
                    display="flex" alignItems="center" gap={2}
                    px={3.5} py={1.5}
                    bg={primary ? "rgba(99,102,241,0.08)" : skillCardBg}
                    border="1px solid"
                    borderColor={primary ? "rgba(99,102,241,0.4)" : skillCardBorder}
                    borderRadius="full" cursor="default"
                    whileHover={{ y: -2 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.04 * i }}
                  >
                    {IC && <Icon as={IC as ElementType} boxSize={3.5} />}
                    <Text fontSize="12px" fontWeight="500">{label}</Text>
                    {primary && (
                      <Text
                        fontSize="9px" color="brand.400" fontFamily="mono"
                        fontWeight="700" letterSpacing="0.08em" ml={-0.5}
                      >
                        ★
                      </Text>
                    )}
                  </MotionBox>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>

        {/* Frameworks - grouped by category */}
        <Text fontSize="10px" fontFamily="mono" color="gray.600"
          letterSpacing="0.16em" mb={5} textTransform="uppercase">
          Frameworks & Tools
        </Text>
        <Stack spacing={3.5}>
          {[
            { key: "frontend", label: "Frontend", items: data.frameworks.frontend },
            { key: "backend",  label: "Backend",  items: data.frameworks.backend },
            { key: "data",     label: "Data",     items: data.frameworks.databases },
            { key: "tools",    label: "Tools",    items: data.frameworks.misc },
          ]
            .filter((g) => g.items.length > 0)
            .map((g, gi) => (
              <Flex
                key={g.key}
                gap={{ base: 2, md: 4 }}
                align={{ base: "flex-start", md: "center" }}
                wrap={{ base: "wrap", md: "nowrap" }}
              >
                <Text
                  fontSize="9px" fontFamily="mono" color="gray.600"
                  letterSpacing="0.16em" textTransform="uppercase"
                  w={{ base: "auto", md: "70px" }}
                  flexShrink={0}
                  pt={{ base: 0, md: 0 }}
                >
                  {g.label}
                </Text>
                <Wrap spacing={1.5} flex={1}>
                  {g.items.map((fw, i) => {
                    const { icon: IC } = getTechIcon(fw.id);
                    return (
                      <WrapItem key={fw.id}>
                        <Tooltip label={fw.desc} hasArrow fontSize="11px">
                          <MotionBox
                            display="flex" alignItems="center" gap={1.5}
                            px={2.5} py={1.5}
                            bg={skillCardBg} border="1px solid" borderColor={skillCardBorder}
                            borderRadius="md" cursor="default"
                            whileHover={{ y: -1, borderColor: "rgba(99,102,241,0.35)" }}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 * i + gi * 0.05 + 0.15 }}
                          >
                            {IC && <Icon as={IC as ElementType} boxSize={3} />}
                            <Text fontSize="11px" fontFamily="mono">{fw.name}</Text>
                          </MotionBox>
                        </Tooltip>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </Flex>
            ))}
        </Stack>
      </MotionBox>

      {/* Scroll cue */}
      {onScrollDown && (
        <MotionBox textAlign="center" mt={12}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <Box as="button" onClick={onScrollDown}
            display="inline-flex" flexDirection="column" alignItems="center" gap={1}
            color="gray.600" _hover={{ color: "brand.400" }} transition="color 0.2s">
            <Text fontSize="10px" fontFamily="mono" letterSpacing="0.1em">scroll</Text>
            <MotionBox animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
              <Icon as={FaChevronDown as ElementType} boxSize={3} />
            </MotionBox>
          </Box>
        </MotionBox>
      )}
    </Box>
  );
};

export default Intro;
