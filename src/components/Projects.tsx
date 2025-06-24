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
} from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";
import { Info } from "./Intro"; // Adjust import path if needed

interface Props {
  data: Info;
}

const Projects = ({ data }: Props) => {
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.300", "gray.700");

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
              <Heading size="md" display="flex" alignItems="center" gap={2}>
                {project.name}
                {project.github && (
                  <Link href={project.github} isExternal>
                    <Icon as={FaGithub} boxSize={4} />
                  </Link>
                )}
              </Heading>

              <Text
                fontSize="sm"
                color={useColorModeValue("gray.600", "gray.300")}
              >
                {project.description}
              </Text>

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
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Projects;
