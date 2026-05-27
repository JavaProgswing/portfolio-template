import {
  Box,
  Button,
  HStack,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState, ElementType } from "react";
import { FaPalette, FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import {
  THEMES,
  applyTheme,
  resolveInitialTheme,
} from "../themes/palettes";
import { unlock, getStats } from "../lib/achievements";

const TRIED_KEY = "portfolio-themes-tried";

function recordThemeTry(key: string) {
  try {
    const raw = localStorage.getItem(TRIED_KEY);
    const tried: Set<string> = new Set(raw ? JSON.parse(raw) : []);
    tried.add(key);
    localStorage.setItem(TRIED_KEY, JSON.stringify([...tried]));
    if (tried.size >= THEMES.length) unlock("all-themes");
  } catch {
    // ignore
  }
}

const MotionBox = motion(Box);

const ThemeSwitcher = () => {
  const [current, setCurrent] = useState<string>(() => resolveInitialTheme());
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();

  // Apply initial theme on mount + react to external changes (URL param etc.)
  useEffect(() => {
    applyTheme(current);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail && detail !== current) setCurrent(detail);
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, [current]);

  const handlePick = (key: string) => {
    setCurrent(key);
    applyTheme(key);
    recordThemeTry(key);
  };

  // Also record the initial theme as "tried" on mount
  useEffect(() => { recordThemeTry(current); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="bottom-end"
      trigger="click"
      gutter={8}
    >
      <PopoverTrigger>
        <Button
          onClick={onToggle}
          size="xs"
          variant="outline"
          borderColor="rgba(255,255,255,0.14)"
          color="gray.400"
          borderRadius="md"
          px={2}
          h="22px"
          minW="22px"
          aria-label="Switch theme"
          _hover={{
            color: "gray.100",
            borderColor: "rgba(255,255,255,0.3)",
            bg: "rgba(255,255,255,0.05)",
          }}
        >
          <Icon as={FaPalette as ElementType} boxSize={2.5} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg="#0f0f10"
        borderColor="rgba(255,255,255,0.1)"
        boxShadow="0 12px 36px rgba(0,0,0,0.6)"
        w="260px"
        _focus={{ outline: "none", boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}
      >
        <PopoverArrow bg="#0f0f10" />
        <PopoverBody p={2}>
          <Text
            fontSize="9px"
            color="gray.500"
            fontFamily="mono"
            letterSpacing="0.14em"
            mb={2}
            px={2}
            pt={1}
            textTransform="uppercase"
          >
            Theme
          </Text>
          <Stack spacing={0.5}>
            {THEMES.map((t) => {
              const active = current === t.key;
              return (
                <MotionBox
                  key={t.key}
                  as="button"
                  onClick={() => handlePick(t.key)}
                  px={2}
                  py={2}
                  borderRadius="md"
                  textAlign="left"
                  bg={active ? "rgba(255,255,255,0.06)" : "transparent"}
                  _hover={{ bg: "rgba(255,255,255,0.04)" }}
                  whileHover={{ x: 2 }}
                  sx={{ transition: "background 0.15s" }}
                  cursor="pointer"
                  border="1px solid"
                  borderColor={active ? "rgba(255,255,255,0.1)" : "transparent"}
                >
                  <HStack justify="space-between">
                    <HStack spacing={2.5}>
                      <HStack spacing={0} borderRadius="sm" overflow="hidden" flexShrink={0}>
                        {t.swatch.map((c, i) => (
                          <Box key={i} w="14px" h="14px" bg={c} />
                        ))}
                      </HStack>
                      <Box>
                        <Text fontSize="xs" fontWeight="600" color="gray.100">
                          {t.name}
                        </Text>
                        <Text fontSize="10px" color="gray.500" fontFamily="mono">
                          {t.desc}
                        </Text>
                      </Box>
                    </HStack>
                    {active && (
                      <Icon as={FaCheck as ElementType} boxSize={2.5} color="brand.400" />
                    )}
                  </HStack>
                </MotionBox>
              );
            })}
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeSwitcher;
