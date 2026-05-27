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

const Footer = ({ name, resumeUrl }: Props) => {
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

  const textColor = useColorModeValue("gray.600", "gray.400");
  const subtleColor = useColorModeValue("gray.500", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      w="100%"
      borderTop="1px solid"
      borderColor={borderColor}
      py={6}
      px={6}
      mt={10}
    >
      {/* Top row: subtle links */}
      <Flex justify="center" mb={4} flexWrap="wrap" gap={4}>
        <HStack
          spacing={3}
          fontFamily="mono"
          fontSize="11px"
          color={subtleColor}
        >
          {resumeUrl && (
            <Link
              as={RouterLink}
              to="/resume"
              _hover={{ color: "brand.400", textDecoration: "none" }}
            >
              resume
            </Link>
          )}
          <Text color={borderColor}>·</Text>
          <Link
            as={RouterLink}
            to="/uses"
            _hover={{ color: "brand.400", textDecoration: "none" }}
          >
            uses
          </Link>
          <Text color={borderColor}>·</Text>
          <Link
            as={RouterLink}
            to="/now"
            _hover={{ color: "brand.400", textDecoration: "none" }}
          >
            now
          </Link>
          <Text color={borderColor}>·</Text>
          <Link
            as={RouterLink}
            to="/colophon"
            _hover={{ color: "brand.400", textDecoration: "none" }}
          >
            colophon
          </Link>
          {/* Subtle guestbook link — discoverable but not loud */}
          <Text color={borderColor}>·</Text>
          <Link
            as={RouterLink}
            to="/guestbook"
            _hover={{ color: "brand.400", textDecoration: "none" }}
            opacity={0.7}
          >
            sign
          </Link>
        </HStack>
      </Flex>

      {/* Bottom row: copyright + console hint + time */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <Text fontSize="sm" color={textColor}>
          Made by {name} © 2025 – Present. All rights reserved.
        </Text>

        <HStack spacing={3}>
          {/* Console hint — clickable terminal cursor */}
          <Link
            as={RouterLink}
            to="/console"
            fontFamily="mono"
            fontSize="11px"
            color={subtleColor}
            _hover={{ color: "brand.400", textDecoration: "none" }}
            title="open interactive console"
          >
            ~/visitor{" "}
            <Text as="span" color="brand.400">
              ❯
            </Text>
            <Text
              as="span"
              animation="blink 1.2s steps(2, start) infinite"
            >
              _
            </Text>
          </Link>
          <Text fontSize="sm" color={textColor}>
            {time}
          </Text>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Footer;
