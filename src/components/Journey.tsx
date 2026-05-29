import {
  Box,
  Heading,
  HStack,
  Icon,
  Link,
  Stack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ElementType } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Info } from "./Intro";

interface Props {
  data: Info;
}

const MotionBox = motion(Box);

const Journey = ({ data }: Props) => {
  const dotBorder = useColorModeValue("brand.500", "brand.400");
  const lineColor = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
  const dotInner = useColorModeValue("#fafafa", "#09090b");

  return (
    <Box>
      <Text
        fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase"
      >
        Experience
      </Text>
      <Heading size="lg" mb={10}>My Journey</Heading>

      <Box position="relative" pl={7}>
        {/* Vertical line */}
        <Box
          position="absolute"
          left="6px"
          top="8px"
          bottom="0"
          width="1px"
          bg={lineColor}
        />

        <Stack spacing={0}>
          {data.journey.map((item, index) => (
            <MotionBox
              key={index}
              position="relative"
              pb={index < data.journey.length - 1 ? 10 : 0}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {/* Timeline dot */}
              <Box
                position="absolute"
                left="-28px"
                top="5px"
                w="13px"
                h="13px"
                borderRadius="full"
                border="2px solid"
                borderColor={dotBorder}
                bg={index === 0 ? "brand.500" : dotInner}
                zIndex={1}
              />

              <Stack spacing={1.5}>
                <Text
                  fontSize="11px"
                  color="gray.500"
                  fontFamily="mono"
                  letterSpacing="0.05em"
                >
                  {item.date}
                </Text>

                <Heading size="sm" lineHeight="1.3">
                  {item.title}
                </Heading>

                <Text
                  fontSize="sm"
                  color="brand.400"
                  fontWeight="600"
                >
                  {item.company}
                </Text>

                <Text
                  fontSize="sm"
                  color="gray.400"
                  lineHeight="1.75"
                  maxW="580px"
                >
                  {item.description}
                </Text>

                {item.evidence && item.evidence.length > 0 && (
                  <HStack spacing={2} pt={1} flexWrap="wrap">
                    {item.evidence.map(e => (
                      <Link
                        key={e.name}
                        href={e.url}
                        isExternal
                        _hover={{ textDecoration: "none" }}
                      >
                        <Tag
                          size="sm"
                          variant="subtle"
                          colorScheme="gray"
                          cursor="pointer"
                          _hover={{ colorScheme: "blue", bg: "rgba(99,102,241,0.12)", color: "brand.400" }}
                          transition="all 0.15s"
                        >
                          <Icon as={FaExternalLinkAlt as ElementType} mr={1} boxSize={2.5} />
                          {e.name}
                        </Tag>
                      </Link>
                    ))}
                  </HStack>
                )}
              </Stack>
            </MotionBox>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Journey;
