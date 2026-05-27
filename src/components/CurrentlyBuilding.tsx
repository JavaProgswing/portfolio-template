import {
  Box,
  Heading,
  Text,
  Stack,
  Badge,
  Link,
  HStack,
  Icon,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { ElementType } from "react";
import { FaExternalLinkAlt, FaCodeBranch } from "react-icons/fa";
import { SiGooglecolab } from "react-icons/si";
import { motion } from "framer-motion";

interface CurrentWork {
  title: string;
  org: string;
  orgUrl: string;
  description: string;
  links: { name: string; link: string }[];
  tags: string[];
  startDate: string;
}

interface Props {
  currentWork: CurrentWork;
}

const MotionBox = motion(Box);

const CurrentlyBuilding = ({ currentWork }: Props) => {
  const cardBorder = useColorModeValue("green.300", "green.700");
  const dotColor = "green.400";

  return (
    <Box maxW="4xl" mx="auto" px={6} py={10}>
      <Heading
        as="h2"
        size="xl"
        mb={10}
        textAlign="center"
        bgGradient="linear(to-r, green.400, cyan.400)"
        bgClip="text"
      >
        Currently Building
      </Heading>

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        p={8}
        borderRadius="2xl"
        layerStyle="glass"
        border="1px solid"
        borderColor={cardBorder}
        boxShadow="0 0 40px rgba(72, 187, 120, 0.08)"
        position="relative"
        overflow="hidden"
        _hover={{
          boxShadow: "0 0 60px rgba(72, 187, 120, 0.15)",
          borderColor: "green.400",
        }}
      >
        {/* Subtle bg decoration */}
        <Box
          position="absolute"
          top="-60px"
          right="-60px"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="green.500"
          opacity={0.03}
          filter="blur(40px)"
          pointerEvents="none"
        />

        {/* Live badge */}
        <HStack spacing={2} mb={5}>
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={dotColor}
            animation="live-dot 2s ease-in-out infinite"
          />
          <Text
            fontSize="xs"
            color="green.400"
            fontWeight="700"
            letterSpacing="0.15em"
            fontFamily="mono"
          >
            NOW · {currentWork.startDate}
          </Text>
        </HStack>

        <HStack spacing={3} mb={3} align="center" flexWrap="wrap">
          <Heading size="lg">{currentWork.title}</Heading>
          <Badge
            colorScheme="yellow"
            variant="subtle"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Icon as={SiGooglecolab as ElementType} mr={1} />
            GSoC 2025
          </Badge>
        </HStack>

        <Link
          href={currentWork.orgUrl}
          isExternal
          color="blue.400"
          fontWeight="600"
          fontSize="md"
          display="inline-flex"
          alignItems="center"
          gap={1}
          mb={5}
          _hover={{ color: "blue.300", textDecoration: "none" }}
        >
          {currentWork.org}
          <Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />
        </Link>

        <Text color="gray.400" lineHeight="1.8" mb={6} fontSize="md">
          {currentWork.description}
        </Text>

        <Wrap spacing={2} mb={6}>
          {currentWork.tags.map((tag) => (
            <WrapItem key={tag}>
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                colorScheme="blue"
                variant="subtle"
                fontFamily="mono"
                fontSize="xs"
              >
                {tag}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>

        <HStack spacing={5} flexWrap="wrap">
          {currentWork.links.map((link) => (
            <Link
              key={link.name}
              href={link.link}
              isExternal
              display="flex"
              alignItems="center"
              gap={2}
              color="gray.400"
              fontSize="sm"
              _hover={{ color: "blue.400" }}
              transition="color 0.2s"
            >
              <Icon as={(link.name === "My Fork" ? FaCodeBranch : FaExternalLinkAlt) as ElementType} boxSize={3.5} />
              {link.name}
            </Link>
          ))}
        </HStack>
      </MotionBox>
    </Box>
  );
};

export default CurrentlyBuilding;
