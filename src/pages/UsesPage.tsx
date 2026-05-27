import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

const MotionBox = motion(Box);

interface UseItem { name: string; desc: string }
interface UsesData {
  [category: string]: UseItem[];
}

const HumanLabels: Record<string, string> = {
  desk: "Desk · Hardware",
  editor: "Editor & IDE",
  terminal: "Terminal",
  daily: "Daily Apps",
  languages: "Languages in Practice",
  fonts: "Fonts",
};

const UsesPage = ({ data }: { data: { uses?: UsesData; name: string } }) => {
  const uses = data.uses;

  return (
    <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }} py={20}>
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Uses
      </Text>
      <Heading size="lg" mb={3}>What I Use</Heading>
      <Text fontSize="md" color="gray.400" mb={12} maxW="600px" lineHeight="1.75">
        Tools, hardware, and software I reach for daily. Inspired by{" "}
        <Text as="a" href="https://uses.tech" target="_blank" rel="noopener"
          color="brand.400" _hover={{ color: "brand.300" }}>
          uses.tech
        </Text>.
      </Text>

      {!uses && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          (Configure your stack in <Text as="code" color="brand.400">me.ts → uses</Text>)
        </Text>
      )}

      <Stack spacing={10}>
        {uses && Object.entries(uses).map(([category, items], i) => (
          <MotionBox
            key={category}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Text fontSize="10px" fontFamily="mono" color="gray.500"
              letterSpacing="0.16em" mb={4} textTransform="uppercase">
              {HumanLabels[category] || category}
            </Text>
            <Stack spacing={3}>
              {items.map(item => (
                <HStack key={item.name} align="flex-start" spacing={4}>
                  <Box w="6px" h="6px" borderRadius="full" bg="brand.400" mt="9px" flexShrink={0} />
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="gray.100">
                      {item.name}
                    </Text>
                    <Text fontSize="sm" color="gray.400" lineHeight="1.6">
                      {item.desc}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </Stack>
          </MotionBox>
        ))}
      </Stack>
    </Box>
  );
};

export default UsesPage;
