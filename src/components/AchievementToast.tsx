import { Box, HStack, Stack, Text, Icon, useColorModeValue } from "@chakra-ui/react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState, ElementType } from "react";
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

// Display durations
const SOLO_MS = 4200;   // when nothing else is queued
const RUSH_MS = 900;    // when more are waiting, drain fast

const AchievementToast = () => {
  const [queue, setQueue] = useState<Notif[]>([]);
  const [active, setActive] = useState<Notif | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const shake = useAnimationControls();

  const cardBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(17,17,24,0.96)");
  const textColor = useColorModeValue("gray.800", "gray.100");

  // Enqueue on unlock
  useEffect(() => {
    const onUnlock = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (!key) return;
      const ach = ACHIEVEMENTS.find((a) => a.key === key);
      if (!ach) return;
      const stats = getStats();
      setQueue((q) => [
        ...q,
        { id: Date.now() + Math.random(), key, label: ach.label, hint: ach.hint, found: stats.found, total: stats.total },
      ]);
    };
    window.addEventListener("achievement-unlock", onUnlock);
    return () => window.removeEventListener("achievement-unlock", onUnlock);
  }, []);

  // Promote next from queue when idle
  useEffect(() => {
    if (active || queue.length === 0) return;
    setActive(queue[0]);
    setQueue((q) => q.slice(1));
  }, [queue, active]);

  // Manage dismissal timer + shake when more are stacked
  useEffect(() => {
    if (!active) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);

    const hasMore = queue.length > 0;
    if (hasMore) {
      // Shake to signal "more incoming", then dismiss fast
      shake.start({
        x: [0, -7, 7, -5, 5, -2, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }
    timerRef.current = window.setTimeout(
      () => setActive(null),
      hasMore ? RUSH_MS : SOLO_MS
    );

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [active, queue.length, shake]);

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
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            pointerEvents="auto"
          >
            {/* Shake layer */}
            <MotionBox
              animate={shake}
              onClick={dismiss}
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
              {/* Sparkle sweep */}
              <MotionBox
                position="absolute"
                top={0} left={0} right={0}
                h="2px"
                bgGradient="linear(to-r, transparent, brand.400, purple.400, transparent)"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              {/* Radial glow */}
              <Box
                position="absolute" top="-30px" right="-30px"
                w="120px" h="120px" borderRadius="full"
                bg="brand.500" opacity={0.12} filter="blur(30px)"
                pointerEvents="none"
              />

              {/* Auto-dismiss progress bar (visual timer) */}
              <MotionBox
                key={`bar-${active.id}-${queue.length}`}
                position="absolute"
                bottom={0} left={0}
                h="2px"
                bg="brand.400"
                opacity={0.5}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: (queue.length > 0 ? RUSH_MS : SOLO_MS) / 1000, ease: "linear" }}
              />

              <HStack spacing={3} p={3.5} align="flex-start">
                <MotionBox
                  initial={{ rotate: -20, scale: 0.6 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.12, type: "spring", stiffness: 220 }}
                  flexShrink={0}
                  w="40px" h="40px" borderRadius="10px"
                  bgGradient="linear(135deg, brand.400, purple.500)"
                  display="flex" alignItems="center" justifyContent="center"
                  boxShadow="0 4px 14px rgba(99,102,241,0.45)"
                >
                  <Icon as={FaTrophy as ElementType} color="white" boxSize={4} />
                </MotionBox>

                <Stack spacing={0.5} flex={1} minW={0}>
                  <Text
                    fontSize="9px" fontFamily="mono" fontWeight="700"
                    color="brand.400" letterSpacing="0.18em" textTransform="uppercase"
                  >
                    ✦ achievement unlocked
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={textColor} lineHeight="1.3">
                    {active.label}
                  </Text>
                  <Text fontSize="11px" color="gray.500" lineHeight="1.45" noOfLines={2}>
                    {active.hint}
                  </Text>

                  <HStack justify="space-between" mt={1.5}>
                    <Text fontSize="9px" color="gray.500" fontFamily="mono">progress</Text>
                    <Text fontSize="9px" color="brand.400" fontFamily="mono" fontWeight="700">
                      {active.found}/{active.total}
                    </Text>
                  </HStack>
                  <Box h="3px" bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
                    <MotionBox
                      h="100%"
                      bgGradient="linear(to-r, brand.500, purple.400)"
                      borderRadius="full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((active.found / active.total) * 100)}%` }}
                      transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                    />
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
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default AchievementToast;
