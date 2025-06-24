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
} from "@chakra-ui/react";
import { FaGithub, FaGlobe, FaExternalLinkAlt } from "react-icons/fa";
import { Info } from "./Intro";
import { IconType } from "react-icons";
import { ElementType } from "react";

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
        {data.projects.map((project, index) => (
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
                        >
                          <Icon as={IconComponent as ElementType} boxSize={4} />
                        </Link>
                      </Tooltip>
                    </WrapItem>
                  ) : null;
                })}
              </Wrap>

              {/* Skills */}
              <Wrap>
                {project.skills.map((skill, idx) => (
                  <WrapItem key={idx}>
                    <Badge
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      colorScheme="blue"
                    >
                      {skill}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Projects;
