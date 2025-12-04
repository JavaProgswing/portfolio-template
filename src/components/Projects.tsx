import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Badge,
  Link,
  Icon,
  useColorModeValue,
  Tooltip,
  Wrap,
  WrapItem,
  Flex,
} from "@chakra-ui/react";
import { FaGithub, FaGlobe, FaExternalLinkAlt } from "react-icons/fa";
import { Info } from "./Intro";
import { IconType } from "react-icons";
import { ElementType } from "react";
import { motion } from "framer-motion";

interface Props {
  data: Info;
}

const getIconForType = (type: string): IconType => {
  switch (type.toLowerCase()) {
    case "github":
      return FaGithub;
    case "vercel":
      return FaGlobe;
    default:
      return FaExternalLinkAlt;
  }
};

const MotionBox = motion(Box);

const container = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const Projects = ({ data }: Props) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("gray.800", "white");

  return (
    <Box maxW="6xl" mx="auto" px={6} py={10}>
      <Heading
        as="h2"
        size="xl"
        mb={10}
        textAlign="center"
        bgGradient="linear(to-r, blue.400, purple.500)"
        bgClip="text"
      >
        Featured Projects
      </Heading>
      <SimpleGrid
        as={motion.div}
        columns={{ base: 1, md: 2, lg: 3 }}
        spacing={8}
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {data.projects.map((project, index) => (
          <MotionBox
            key={index}
            variants={item}
            p={6}
            borderRadius="xl"
            layerStyle="glass"
            position="relative"
            overflow="hidden"
            transition={{ duration: 0.3 }}
            whileHover={{
              y: -10,
              boxShadow: "0 0 20px rgba(66, 153, 225, 0.4)",
              borderColor: "blue.400",
            }}
          >
            <Stack spacing={4} height="100%">
              <Flex justify="space-between" align="center">
                <Heading size="md" color={headingColor} noOfLines={1}>
                  {project.name}
                </Heading>
                <Wrap>
                  {project.links.map((link, idx) => {
                    const IconComponent = getIconForType(project.type);
                    return link.link ? (
                      <WrapItem key={idx}>
                        <Tooltip label={link.name} hasArrow>
                          <Link
                            href={link.link}
                            isExternal
                            aria-label={link.name}
                            _hover={{ color: "blue.400" }}
                          >
                            <Icon
                              as={IconComponent as ElementType}
                              boxSize={5}
                            />
                          </Link>
                        </Tooltip>
                      </WrapItem>
                    ) : null;
                  })}
                </Wrap>
              </Flex>

              <Text fontSize="sm" color={textColor} flex="1">
                {project.description}
              </Text>

              {/* Skills */}
              <Wrap mt="auto">
                {project.skills.map((skill, idx) => (
                  <WrapItem key={idx}>
                    <Badge
                      px={2}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      colorScheme="blue"
                      variant="subtle"
                    >
                      {skill}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            </Stack>
          </MotionBox>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Projects;
