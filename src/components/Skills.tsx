import { Box, Heading, SimpleGrid, Tag } from "@chakra-ui/react";

const skills = [
  "Java Spring Boot",
  "JavaFX",
  "Python Quart",
  "Python Flask",
  "Python FastAPI",
  "Tailwind CSS",
  "Chakra UI",
  "React",
];

const Skills = () => (
  <Box>
    <Heading size="lg" mb={4}>
      Skills
    </Heading>
    <SimpleGrid columns={[2, null, 3]} spacing={3}>
      {skills.map((skill) => (
        <Tag key={skill} size="lg" colorScheme="purple" px={4} py={2}>
          {skill}
        </Tag>
      ))}
    </SimpleGrid>
  </Box>
);
export default Skills;
