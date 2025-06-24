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
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import { FaGithub, FaGlobe, FaExternalLinkAlt } from "react-icons/fa";
import { Info } from "./Intro";

interface Props {
  data: Info;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "github":
      return FaGithub;
    case "vercel":
      return FaGlobe;
    default:
      return FaExternalLinkAlt;
  }
};

const Projects = ({ data }: Props) => {
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.300", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.300");

  return (
    <Box maxW="6xl" mx="auto" px={6} py={10}>
      <Heading size="lg" mb={6} textAlign="center">
        Projects
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {data.projects.map((project, index) => {
          const IconComponent = getIconForType(project.type);

          return (
            <Box
              key={index}
              p={5}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              bg={cardBg}
              shadow="sm"
              transition="all 0.2s"
              _hover={{ shadow: "md" }}
            >
              <Stack spacing={3}>
                <Heading size="md">{project.name}</Heading>

                <Text fontSize="sm" color={textColor}>
                  {project.description}
                </Text>

                {/* Links */}
                <HStack spacing={3} wrap="wrap">
                  {project.links.map((link, idx) =>
                    link.link ? (
                      <Tooltip key={idx} label={link.name} hasArrow>
                        <Link href={link.link} isExternal>
                          <Icon as={IconComponent} boxSize={4} />
                        </Link>
                      </Tooltip>
                    ) : null
                  )}
                </HStack>

                {/* Skills */}
                <Box>
                  {project.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      mr={2}
                      mb={1}
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      colorScheme="blue"
                    >
                      {skill}
                    </Badge>
                  ))}
                </Box>
              </Stack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default Projects;
