import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Image,
  Stack,
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
    links: {
      name: string;
      link: string;
    }[];
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

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText(data.desc_brief);
      return;
    }

    const targetText = isOpen ? data.desc : data.desc_brief;

    let index = 0;
    let currentText = "";

    setDisplayedText(""); // Clear displayed text first

    const interval = setInterval(() => {
      if (index < targetText.length) {
        currentText += targetText.charAt(index);
        setDisplayedText(currentText);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 17);

    return () => clearInterval(interval);
  }, [isOpen, data.desc, data.desc_brief]);

  return (
    <Box maxW="5xl" mx="auto" px={6} py={10}>
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="center"
        gap={10}
        mb={12}
      >
        {/* Profile Image */}
        <Box position="relative">
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            width="160px"
            height="160px"
            bg="blue.500"
            borderRadius="full"
            filter="blur(40px)"
            opacity={0.5}
            zIndex={0}
          />
          <MotionImage
            src={data.image}
            alt={data.name}
            borderRadius="full"
            boxSize="150px"
            objectFit="cover"
            shadow="2xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            position="relative"
            zIndex={1}
            border="2px solid"
            borderColor="whiteAlpha.200"
          />
        </Box>

        {/* Text Section */}
        <MotionStack
          spacing={4}
          textAlign={{ base: "center", md: "left" }}
          maxW="lg"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Heading
            fontSize={{ base: "2xl", md: "4xl" }}
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
          >
            Hi, I'm {data.name}
          </Heading>

          <Text fontSize="lg" whiteSpace="pre-wrap" lineHeight="tall">
            {displayedText}
            <Text
              as="span"
              ml="1"
              color={useColorModeValue("gray.600", "gray.400")}
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
          >
            {isOpen ? "Show Less" : "Show More"}
          </Button>
        </MotionStack>
      </Flex>

      <MotionBox
        textAlign="center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Box w="full" display="flex" justifyContent="center" mt={8}>
          <Heading size="md" mb={6} textAlign="center">
            Tools I Work With
          </Heading>
        </Box>
        {/* Languages */}
        <Heading size="sm" mt={4} mb={4} color="gray.500">
          LANGUAGES
        </Heading>
        <Wrap justify="center" spacing={4}>
          {data.languages.map((lang, index) => {
            const { icon: IconComponent, label } = getTechIcon(lang);
            return (
              <WrapItem key={lang}>
                <Tooltip label={label} hasArrow>
                  <MotionBox
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                    px={4}
                    py={3}
                    bg={useColorModeValue("gray.100", "gray.800")}
                    borderRadius="lg"
                    cursor="pointer"
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    {IconComponent && (
                      <Icon
                        as={IconComponent as React.ElementType}
                        boxSize={8}
                      />
                    )}
                    <Text fontSize="sm" fontWeight="medium">
                      {label}
                    </Text>
                  </MotionBox>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>

        {/* Frameworks */}
        <Heading size="sm" mt={8} mb={4} color="gray.500">
          FRAMEWORKS & LIBRARIES
        </Heading>
        <Wrap justify="center" spacing={4}>
          {[
            ...data.frameworks.frontend,
            ...data.frameworks.backend,
            ...data.frameworks.databases,
            ...data.frameworks.misc,
          ].map((fw, index) => {
            const { icon: IconComponent, label } = getTechIcon(fw.id);
            return (
              <WrapItem key={fw.id}>
                <Tooltip label={fw.desc} hasArrow>
                  <MotionBox
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                    px={4}
                    py={3}
                    bg={useColorModeValue("gray.100", "gray.800")}
                    borderRadius="lg"
                    cursor="pointer"
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index + 0.3 }}
                  >
                    {IconComponent && (
                      <Icon
                        as={IconComponent as React.ElementType}
                        boxSize={8}
                      />
                    )}
                    <Text fontSize="sm" fontWeight="medium">
                      {fw.name}
                    </Text>
                  </MotionBox>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>
      </MotionBox>
    </Box>
  );
};

export default Intro;
