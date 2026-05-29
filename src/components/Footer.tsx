import {
  Box,
  Flex,
  HStack,
  Icon,
  Link,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { ElementType, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FaPenNib } from "react-icons/fa";

interface Props {
  name: string;
  resumeUrl?: string;
}

/**
 * Minimal footer. Two distinct clickable bits:
 *   1. "press ⌘K for quick actions" -> fires `open-command-palette` event
 *   2. `❯_` blinking cursor -> navigates to /console
 *
 * Both are exposed as easter-egg entry points without crowding the footer.
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

  const openPalette = () =>
    window.dispatchEvent(new Event("open-command-palette"));

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

        <HStack spacing={3} fontFamily="mono" fontSize="11px">
          {/* ⌘K - opens command palette */}
          <Tooltip
            label="open quick actions"
            hasArrow
            fontSize="10px"
            placement="top"
          >
            <HStack
              as="button"
              onClick={openPalette}
              spacing={1.5}
              color={subtleColor}
              _hover={{ color: "brand.400" }}
              sx={{ transition: "color 0.15s" }}
              cursor="pointer"
            >
              <Text>press</Text>
              <Text
                as="kbd"
                px={1.5}
                py={0.5}
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
          </Tooltip>

          <Text color={borderColor}>·</Text>

          {/* Guestbook - sign the wall */}
          <Tooltip
            label="sign the guestbook"
            hasArrow
            fontSize="10px"
            placement="top"
          >
            <Link
              as={RouterLink}
              to="/guestbook"
              display="inline-flex"
              alignItems="center"
              gap={1}
              color={subtleColor}
              _hover={{ color: "brand.400", textDecoration: "none" }}
            >
              <Icon as={FaPenNib as ElementType} boxSize={2.5} />
              <Text as="span">guestbook</Text>
            </Link>
          </Tooltip>

          <Text
            color={borderColor}
            display={{ base: "none", sm: "inline" }}
          >
            ·
          </Text>

          {/* Console cursor - opens /console */}
          <Tooltip
            label="open interactive console"
            hasArrow
            fontSize="10px"
            placement="top"
          >
            <Link
              as={RouterLink}
              to="/console"
              display={{ base: "none", sm: "inline-flex" }}
              alignItems="center"
              color={subtleColor}
              _hover={{ color: "brand.400", textDecoration: "none" }}
            >
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
          </Tooltip>
        </HStack>

        <Text fontSize="13px" color={textColor} fontFamily="mono">
          {time}
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
