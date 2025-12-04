import { Box, Heading, Text, Stack, Flex, Circle, useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Info } from "./Intro";

interface Props {
  data: Info;
}

const MotionBox = motion(Box);

const Journey = ({ data }: Props) => {
  const lineColor = useColorModeValue("gray.300", "gray.700");
  const circleBg = useColorModeValue("white", "gray.900");
  const circleBorder = useColorModeValue("blue.500", "blue.400");

  return (
    <Box maxW="4xl" mx="auto" px={6} py={20}>
      <Heading
        as="h2"
        size="xl"
        mb={12}
        textAlign="center"
        bgGradient="linear(to-r, blue.400, purple.500)"
        bgClip="text"
      >
        My Journey
      </Heading>

      <Stack spacing={0} position="relative">
        {/* Vertical Line */}
        <Box
          position="absolute"
          left={{ base: "20px", md: "50%" }}
          top="0"
          bottom="0"
          width="2px"
          bg={lineColor}
          transform={{ base: "none", md: "translateX(-50%)" }}
          zIndex={0}
        />

        {data.journey.map((item, index) => {
          const isEven = index % 2 === 0;
          return (
            <Flex
              key={index}
              mb={10}
              justifyContent={{ base: "flex-start", md: isEven ? "flex-end" : "flex-start" }}
              alignItems="center"
              position="relative"
              flexDirection={{ base: "row", md: isEven ? "row-reverse" : "row" }}
            >
              {/* Timeline Dot */}
              <Circle
                size="40px"
                bg={circleBg}
                border="4px solid"
                borderColor={circleBorder}
                position="absolute"
                left={{ base: "0", md: "50%" }}
                transform={{ base: "none", md: "translateX(-50%)" }}
                zIndex={1}
                boxShadow="0 0 10px rgba(66, 153, 225, 0.6)"
              />

              {/* Content Card */}
              <MotionBox
                width={{ base: "calc(100% - 60px)", md: "45%" }}
                ml={{ base: "60px", md: isEven ? "0" : "auto" }}
                mr={{ base: "0", md: isEven ? "auto" : "0" }}
                p={6}
                borderRadius="xl"
                layerStyle="glass"
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                _hover={{
                  borderColor: "blue.400",
                  boxShadow: "0 0 20px rgba(66, 153, 225, 0.2)",
                }}
              >
                <Text fontSize="sm" color="blue.400" fontWeight="bold" mb={1}>
                  {item.date}
                </Text>
                <Heading size="md" mb={2}>
                  {item.title}
                </Heading>
                <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={3}>
                  {item.company}
                </Text>
                <Text fontSize="sm" color="gray.400">
                  {item.description}
                </Text>
              </MotionBox>
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
};

export default Journey;
