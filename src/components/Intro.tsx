import {
  Box,
  Button,
  Fade,
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

export interface Info {
  name: string;
  image: string;
  tags: string[];
  languages: string[];
  frameworks: {
    frontend: { name: string; id: string; desc: string; link: string }[];
    backend: { name: string; id: string; desc: string; link: string }[];
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
  desc: string;
  desc_brief: string;
}
interface Props {
  data: Info;
  onScrollDown?: () => void;
}

const Intro = ({ data, onScrollDown }: Props) => {
  const { isOpen, onToggle } = useDisclosure();

  const [displayedText, setDisplayedText] = useState(data.desc_brief);

  useEffect(() => {
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
        <Image
          src={data.image}
          alt={data.name}
          borderRadius="full"
          boxSize="150px"
          objectFit="cover"
          shadow="lg"
        />

        {/* Text Section */}
        <Stack spacing={4} textAlign={{ base: "center", md: "left" }} maxW="lg">
          <Heading fontSize={{ base: "2xl", md: "3xl" }}>
            Hi, I'm {data.name}
          </Heading>

          <Text fontSize="md" whiteSpace="pre-wrap">
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
        </Stack>
      </Flex>

      <Box textAlign="center">
        <Box w="full" display="flex" justifyContent="center" mt={8}>
          <Heading size="sm" mb={4} textAlign="center">
            Tools I Work With
          </Heading>
        </Box>
        {/* Languages */}
        <Heading size="xs" mt={4} mb={2}>
          Languages
        </Heading>
        <Wrap justify="center">
          {data.languages.map((lang) => {
            const { icon: IconComponent, label } = getTechIcon(lang);
            return (
              <WrapItem key={lang}>
                <Tooltip label={label} hasArrow>
                  <Stack spacing={1} align="center" px={2} py={1}>
                    <Icon as={IconComponent} boxSize={6} />
                    <Text fontSize="xs">{label}</Text>
                  </Stack>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>

        {/* Frameworks */}
        <Heading size="xs" mt={6} mb={2}>
          Frameworks & Libraries
        </Heading>
        <Wrap justify="center">
          {[...data.frameworks.frontend, ...data.frameworks.backend].map(
            (fw) => {
              const { icon: IconComponent, label } = getTechIcon(fw.id);
              return (
                <WrapItem key={fw.id}>
                  <Tooltip label={fw.desc} hasArrow>
                    <Stack spacing={1} align="center" px={2} py={1}>
                      <Icon as={IconComponent} boxSize={6} />
                      <Text fontSize="xs">{fw.name}</Text>
                    </Stack>
                  </Tooltip>
                </WrapItem>
              );
            }
          )}
        </Wrap>
      </Box>
    </Box>
  );
};

export default Intro;
