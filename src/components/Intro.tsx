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
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { ElementType } from "react";

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
    name: string;
    description: string;
    type: string;
    links: { name: string; link: string }[];
    skills: string[];
  }[];
  contacts: {
    id: string;
    name: string;
    site: string;
    link: string;
  }[];
  journey: {
    title: string;
    company: string;
    date: string;
    description: string;
  }[];
  desc: string;
  desc_brief: string;
}

interface Props {
  data: Info;
  onScrollDown?: () => void;
}

const MotionBox = motion(Box);
const MotionImage = motion(Image);
const MotionStack = motion(Stack);

const Intro = ({ data, onScrollDown }: Props) => {
  const { isOpen, onToggle } = useDisclosure();
  const [displayedText, setDisplayedText] = useState(data.desc_brief);

  // Hoisted — never call useColorModeValue inside a loop or map
  const skillCardBg = useColorModeValue("gray.100", "rgba(255,255,255,0.05)");
  const skillCardBorder = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const cursorColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText(data.desc_brief);
      return;
    }

    const targetText = data.desc;
    let index = 0;
    let currentText = "";
    setDisplayedText("");

    const interval = setInterval(() => {
      if (index < targetText.length) {
        currentText += targetText.charAt(index);
        setDisplayedText(currentText);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [isOpen, data.desc, data.desc_brief]);

  return (
    <Box maxW="5xl" mx="auto" px={6} py={10}>
      {/* Hero */}
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="center"
        gap={10}
        mb={14}
      >
        {/* Profile image */}
        <Box position="relative" flexShrink={0}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w="170px"
            h="170px"
            bg="blue.500"
            borderRadius="full"
            filter="blur(44px)"
            opacity={0.35}
            zIndex={0}
          />
          <MotionImage
            src={data.image}
            alt={data.name}
            borderRadius="full"
            boxSize="155px"
            objectFit="cover"
            shadow="2xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            position="relative"
            zIndex={1}
            border="2px solid"
            borderColor="whiteAlpha.150"
          />
        </Box>

        {/* Text */}
        <MotionStack
          spacing={4}
          textAlign={{ base: "center", md: "left" }}
          maxW="lg"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Box>
            <Text
              fontSize="sm"
              color="blue.400"
              fontFamily="mono"
              fontWeight="600"
              letterSpacing="0.12em"
              mb={1}
            >
              &gt; hello world
            </Text>
            <Heading
              fontSize={{ base: "3xl", md: "5xl" }}
              bgGradient="linear(to-r, blue.400, purple.400)"
              bgClip="text"
              lineHeight="1.15"
              letterSpacing="-0.02em"
            >
              {data.name}
            </Heading>
          </Box>

          {/* Tags */}
          <HStack spacing={2} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
            {data.tags.map((tag) => (
              <Tag
                key={tag}
                size="sm"
                colorScheme="blue"
                variant="subtle"
                fontFamily="mono"
                fontSize="xs"
                borderRadius="full"
              >
                {tag}
              </Tag>
            ))}
          </HStack>

          <Text
            fontSize="md"
            whiteSpace="pre-wrap"
            lineHeight="1.8"
            color="gray.400"
          >
            {displayedText}
            <Text
              as="span"
              ml="1px"
              color={cursorColor}
              fontWeight="bold"
              animation="blink 1s steps(2, start) infinite"
            >
              |
            </Text>
          </Text>

          <Button
            onClick={onToggle}
            size="sm"
            variant="link"
            colorScheme="blue"
            alignSelf={{ base: "center", md: "flex-start" }}
            fontFamily="mono"
            fontSize="xs"
          >
            {isOpen ? "↑ show less" : "↓ show more"}
          </Button>
        </MotionStack>
      </Flex>

      {/* Tools grid */}
      <MotionBox
        textAlign="center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <Heading
          size="sm"
          mb={8}
          textAlign="center"
          fontFamily="mono"
          color="gray.500"
          letterSpacing="0.15em"
        >
          TOOLS I WORK WITH
        </Heading>

        <Text
          fontSize="10px"
          color="gray.600"
          fontFamily="mono"
          letterSpacing="0.12em"
          mb={3}
        >
          LANGUAGES
        </Text>
        <Wrap justify="center" spacing={3} mb={8}>
          {data.languages.map((lang, index) => {
            const { icon: IconComponent, label } = getTechIcon(lang);
            return (
              <WrapItem key={lang}>
                <Tooltip label={label} hasArrow fontSize="xs">
                  <MotionBox
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={1.5}
                    px={4}
                    py={3}
                    bg={skillCardBg}
                    border="1px solid"
                    borderColor={skillCardBorder}
                    borderRadius="xl"
                    cursor="default"
                    whileHover={{ y: -4, borderColor: "rgba(0,127,255,0.35)" }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    {IconComponent && (
                      <Icon as={IconComponent as ElementType} boxSize={7} />
                    )}
                    <Text fontSize="xs" fontWeight="500" fontFamily="mono">
                      {label}
                    </Text>
                  </MotionBox>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>

        <Text
          fontSize="10px"
          color="gray.600"
          fontFamily="mono"
          letterSpacing="0.12em"
          mb={3}
        >
          FRAMEWORKS & LIBRARIES
        </Text>
        <Wrap justify="center" spacing={3}>
          {[
            ...data.frameworks.frontend,
            ...data.frameworks.backend,
            ...data.frameworks.databases,
            ...data.frameworks.misc,
          ].map((fw, index) => {
            const { icon: IconComponent, label } = getTechIcon(fw.id);
            return (
              <WrapItem key={fw.id}>
                <Tooltip label={fw.desc} hasArrow fontSize="xs">
                  <MotionBox
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={1.5}
                    px={4}
                    py={3}
                    bg={skillCardBg}
                    border="1px solid"
                    borderColor={skillCardBorder}
                    borderRadius="xl"
                    cursor="default"
                    whileHover={{ y: -4, borderColor: "rgba(0,127,255,0.35)" }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index + 0.2 }}
                  >
                    {IconComponent && (
                      <Icon as={IconComponent as ElementType} boxSize={7} />
                    )}
                    <Text fontSize="xs" fontWeight="500" fontFamily="mono">
                      {fw.name}
                    </Text>
                  </MotionBox>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>
      </MotionBox>

      {/* Scroll cue */}
      {onScrollDown && (
        <MotionBox
          textAlign="center"
          mt={14}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Box
            as="button"
            onClick={onScrollDown}
            display="inline-flex"
            flexDirection="column"
            alignItems="center"
            gap={1}
            color="gray.600"
            _hover={{ color: "blue.400" }}
            transition="color 0.2s"
          >
            <Text fontSize="10px" fontFamily="mono" letterSpacing="0.1em">
              scroll
            </Text>
            <MotionBox
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <Icon as={FaChevronDown as ElementType} boxSize={3} />
            </MotionBox>
          </Box>
        </MotionBox>
      )}
    </Box>
  );
};

export default Intro;
