import {
  Box,
  Flex,
  HStack,
  Link,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

interface Props {
  name: string;
  resumeUrl?: string;
}

/**
 * Minimal footer. The 5 page links got moved into the command palette (⌘K) —
 * which is itself an easter egg the footer now subtly advertises. Less clutter,
 * more discovery.
 */
const Footer = ({ name }: Props) => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const textColor = useColorModeValue("gray.600", "gray.500");
  const subtleColor = useColorModeValue("gray.500", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.800");
  const kbdBg = useColorModeValue("gray.100", "rgba(255,255,255,0.05)");
  const kbdBorder = useColorModeValue("gray.300", "rgba(255,255,255,0.1)");

  return (
    <Box
      w="100%"
      borderTop="1px solid"
      borderColor={borderColor}
      py={4}
      px={6}
      mt={10}
    >
      <Flex
        justify="space-between"
        align="center"
        flexWrap="wrap"
        gap={3}
        maxW="780px"
        mx="auto"
      >
        <Text fontSize="13px" color={textColor}>
          © 2025 {name}
        </Text>

        {/* ⌘K hint — central discovery point */}
        <HStack
          as={RouterLink}
          to="/console"
          spacing={2.5}
          fontFamily="mono"
          fontSize="11px"
          color={subtleColor}
          _hover={{ color: "brand.400" }}
          sx={{ transition: "color 0.15s" }}
          title="press ⌘K (or Ctrl+K) anywhere for quick actions · also: this footer hint opens the interactive console"
        >
          <HStack spacing={1}>
            <Text>press</Text>
            <Text
              as="kbd"
              px={1.5} py={0.5}
              border="1px solid"
              borderColor={kbdBorder}
              borderRadius="4px"
              bg={kbdBg}
              fontSize="10px"
              color="gray.400"
              fontWeight="600"
            >
              ⌘K
            </Text>
            <Text>for quick actions</Text>
          </HStack>
          <Text color={borderColor} display={{ base: "none", sm: "inline" }}>·</Text>
          <Text display={{ base: "none", sm: "inline" }}>
            <Text as="span" color="brand.400">❯</Text>
            <Text as="span" animation="blink 1.2s steps(2, start) infinite">_</Text>
          </Text>
        </HStack>

        <Text fontSize="13px" color={textColor} fontFamily="mono">
          {time}
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
