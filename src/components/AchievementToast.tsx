import { Box, HStack, Stack, Text, Icon, useColorModeValue } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, ElementType } from "react";
import { FaTrophy, FaTimes } from "react-icons/fa";
import { ACHIEVEMENTS, getStats } from "../lib/achievements";

const MotionBox = motion(Box);

interface Notif {
  id: number;
  key: string;
  label: string;
  hint: string;
  found: number;
  total: number;
}

/**
 * Themed achievement-unlock notification. Replaces the plain Chakra toast used
 * before. Queues multiple unlocks, shows one at a time, slides in/out with
 * brand glow + trophy icon + progress count.
 */
const AchievementToast = () => {
  const [queue, setQueue] = useState<Notif[]>([]);
  const [active, setActive] = useState<Notif | null>(null);
  const cardBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(17,17,24,0.95)");
  const textColor = useColorModeValue("gray.800", "gray.100");

  useEffect(() => {
    const onUnlock = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const key = detail?.key;
      if (!key) return;
      const ach = ACHIEVEMENTS.find((a) => a.key === key);
      if (!ach) return;
      const stats = getStats();
      setQueue((q) => [
        ...q,
        {
          id: Date.now() + Math.random(),
          key,
          label: ach.label,
          hint: ach.hint,
          found: stats.found,
          total: stats.total,
        },
      ]);
    };
    window.addEventListener("achievement-unlock", onUnlock);
    return () => window.removeEventListener("achievement-unlock", onUnlock);
  }, []);

  // Process queue
  useEffect(() => {
    if (active || queue.length === 0) return;
    const next = queue[0];
    setQueue((q) => q.slice(1));
    setActive(next);
    const id = setTimeout(() => setActive(null), 4800);
    return () => clearTimeout(id);
  }, [queue, active]);

  const dismiss = () => setActive(null);

  return (
    <Box
      position="fixed"
      top={{ base: "16px", md: "80px" }}
      right={{ base: "12px", md: "20px" }}
      zIndex={1500}
      pointerEvents="none"
      maxW="340px"
      w={{ base: "calc(100vw - 24px)", md: "340px" }}
    >
      <AnimatePresence mode="wait">
        {active && (
          <MotionBox
            key={active.id}
            initial={{ opacity: 0, y: -20, scale: 0.92, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={dismiss}
            pointerEvents="auto"
            cursor="pointer"
            bg={cardBg}
            backdropFilter="blur(16px)"
            border="1px solid"
            borderColor="brand.400"
            borderRadius="14px"
            boxShadow="0 12px 40px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.15)"
            overflow="hidden"
            position="relative"
          >
            {/* Sparkle accent */}
            <MotionBox
              position="absolute"
              top={0} left={0} right={0}
              h="2px"
              bgGradient="linear(to-r, transparent, brand.400, purple.400, transparent)"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Subtle radial glow */}
            <Box
              position="absolute"
              top="-30px" right="-30px"
              w="120px" h="120px"
              borderRadius="full"
              bg="brand.500"
              opacity={0.12}
              filter="blur(30px)"
              pointerEvents="none"
            />

            <HStack spacing={3} p={3.5} align="flex-start">
              {/* Trophy icon */}
              <MotionBox
                initial={{ rotate: -20, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                flexShrink={0}
                w="40px"
                h="40px"
                borderRadius="10px"
                bgGradient="linear(135deg, brand.400, purple.500)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 14px rgba(99,102,241,0.45)"
              >
                <Icon as={FaTrophy as ElementType} color="white" boxSize={4} />
              </MotionBox>

              <Stack spacing={0.5} flex={1} minW={0}>
                <HStack spacing={1.5}>
                  <Text
                    fontSize="9px"
                    fontFamily="mono"
                    fontWeight="700"
                    color="brand.400"
                    letterSpacing="0.18em"
                    textTransform="uppercase"
                  >
                    ✦ achievement unlocked
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color={textColor}
                  lineHeight="1.3"
                >
                  {active.label}
                </Text>
                <Text
                  fontSize="11px"
                  color="gray.500"
                  lineHeight="1.45"
                  noOfLines={2}
                >
                  {active.hint}
                </Text>

                {/* Progress bar */}
                <Box mt={1.5}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="9px" color="gray.500" fontFamily="mono">
                      progress
                    </Text>
                    <Text fontSize="9px" color="brand.400" fontFamily="mono" fontWeight="700">
                      {active.found}/{active.total}
                    </Text>
                  </HStack>
                  <Box
                    h="3px"
                    bg="rgba(255,255,255,0.06)"
                    borderRadius="full"
                    overflow="hidden"
                  >
                    <MotionBox
                      h="100%"
                      bgGradient="linear(to-r, brand.500, purple.400)"
                      borderRadius="full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round((active.found / active.total) * 100)}%`,
                      }}
                      transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                    />
                  </Box>
                </Box>
              </Stack>

              <Icon
                as={FaTimes as ElementType}
                boxSize={2.5}
                color="gray.600"
                cursor="pointer"
                _hover={{ color: "gray.300" }}
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
              />
            </HStack>

            {/* Bottom hint */}
            <Box
              px={3.5} pb={2}
              borderTop="1px solid rgba(255,255,255,0.05)"
              pt={1.5}
              mt={-1}
            >
              <Text fontSize="9px" color="gray.600" fontFamily="mono" textAlign="center">
                <Text as="code" color="brand.400">/console → achievements</Text> · click to dismiss
              </Text>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default AchievementToast;
