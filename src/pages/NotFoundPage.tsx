import { Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { unlock } from "../lib/achievements";

const MotionBox = motion(Box);

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => { unlock("got-404"); }, []);

  return (
    <Box minH="calc(100vh - 60px)" display="flex" alignItems="center" justifyContent="center" px={6}>
      <Stack spacing={6} align="center" textAlign="center">
        <MotionBox
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Text
            fontSize={{ base: "100px", md: "160px" }}
            fontFamily="mono"
            fontWeight="700"
            lineHeight="1"
            bgGradient="linear(to-br, brand.400, brand.600)"
            bgClip="text"
            letterSpacing="-0.04em"
          >
            404
          </Text>
        </MotionBox>

        <Stack spacing={1}>
          <Heading size="md" color="gray.200">page not found</Heading>
          <Text fontSize="sm" color="gray.500" fontFamily="mono">
            <Text as="span" color="gray.600">tried:</Text>{" "}
            <Text as="code" color="brand.400">{location.pathname}</Text>
          </Text>
        </Stack>

        <Text fontSize="xs" color="gray.600" maxW="320px" lineHeight="1.7">
          this isn't a real page. but you're welcome to look around.
        </Text>

        <HStack spacing={3} pt={2}>
          <Button as={RouterLink} to="/" size="sm" variant="glow">
            ↩ home
          </Button>
          <Button as={RouterLink} to="/console" size="sm" variant="outline"
            borderColor="rgba(255,255,255,0.14)" color="gray.400" fontFamily="mono"
            _hover={{ color: "gray.100", borderColor: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" }}>
            try console
          </Button>
        </HStack>

        <Text fontSize="10px" color="gray.700" fontFamily="mono" pt={4}>
          press <Text as="code" color="gray.500">?</Text> for shortcuts ·{" "}
          <Text as="code" color="gray.500">⌘K</Text> for command palette
        </Text>
      </Stack>
    </Box>
  );
};

export default NotFoundPage;
