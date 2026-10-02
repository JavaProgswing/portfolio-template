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
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState, ElementType } from "react";
import { FaPalette, FaCheck, FaVolumeUp, FaVolumeMute, FaMagic, FaBolt } from "react-icons/fa";
import { isFxMuted, setFxMuted } from "../lib/fx";
import {
  THEMES,
  applyTheme,
  resolveInitialTheme,
  isMinimalTheme,
} from "../themes/palettes";
import { unlock } from "../lib/achievements";

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


export function useFxMuted(): boolean {
  const [muted, setMuted] = useState(isFxMuted);
  useEffect(() => {
    const on = (e: Event) => setMuted((e as CustomEvent<boolean>).detail);
    window.addEventListener("fxmutechange", on);
    return () => window.removeEventListener("fxmutechange", on);
  }, []);
  return muted;
}

/** Compact navbar speaker toggle for theme sounds. */
export const SoundToggle = () => {
  const muted = useFxMuted();
  return (
    <Button
      onClick={() => setFxMuted(!muted)} size="xs" variant="outline" borderColor="var(--border-strong)"
      color={muted ? "gray.500" : "gray.400"} borderRadius="md" px={2} h="22px" minW="22px"
      aria-label={muted ? "Unmute theme sounds" : "Mute theme sounds"} title={muted ? "Unmute theme sounds" : "Mute theme sounds"}
      _hover={{ color: "brand.400", borderColor: "brand.500" }}
    >
      <Icon as={(muted ? FaVolumeMute : FaVolumeUp) as ElementType} boxSize={2.5} />
    </Button>
  );
};

const ThemeSwitcher = () => {
  const [current, setCurrent] = useState<string>(() => resolveInitialTheme());
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
  const muted = useFxMuted();

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
    applyTheme(key, true);
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
          color="fg.muted"
          borderRadius="md"
          px={2}
          h="22px"
          minW="22px"
          aria-label="Switch theme"
          _hover={{
            color: "fg.strong",
            borderColor: "rgba(255,255,255,0.3)",
            bg: "rgba(255,255,255,0.05)",
          }}
        >
          <Icon as={FaPalette as ElementType} boxSize={2.5} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg="var(--bg-base)"
        borderColor="var(--border-strong)"
        boxShadow="0 12px 36px rgba(0,0,0,0.5)"
        w="316px"
        maxW="calc(100vw - 16px)"
        _focus={{ outline: "none", boxShadow: "0 12px 36px rgba(0,0,0,0.5)" }}
      >
        <PopoverArrow bg="var(--bg-base)" />
        <PopoverBody p={2} maxH="min(70vh, 480px)" overflowY="auto">
          <HStack justify="space-between" px={1} pt={1} pb={2} mb={1} borderBottom="1px solid var(--border)">
            <HStack spacing={2.5} fontFamily="mono" fontSize="9px" color="gray.500">
              <HStack spacing={1}><Icon as={FaVolumeUp as ElementType} boxSize={2.5} /><Text color="inherit">sound</Text></HStack>
              <HStack spacing={1}><Icon as={FaMagic as ElementType} boxSize={2.5} /><Text color="inherit">ambient</Text></HStack>
              <HStack spacing={1}><Icon as={FaBolt as ElementType} boxSize={2.5} /><Text color="inherit">immersive</Text></HStack>
            </HStack>
            <Button size="xs" variant="ghost" h="22px" px={2} fontFamily="mono" fontSize="10px"
              color={muted ? "gray.500" : "brand.400"} onClick={() => setFxMuted(!muted)}
              leftIcon={<Icon as={(muted ? FaVolumeMute : FaVolumeUp) as ElementType} boxSize={3} />}>
              {muted ? "muted" : "sound on"}
            </Button>
          </HStack>
          {[
            { label: "Light & dark", items: THEMES.filter((t) => isMinimalTheme(t.key)) },
            { label: "Dark only", items: THEMES.filter((t) => !isMinimalTheme(t.key)) },
          ].map((group) => (
            <Box key={group.label} mb={2}>
              <Text fontSize="9px" color="gray.500" fontFamily="mono" letterSpacing="0.14em" mb={1.5} px={1} pt={1} textTransform="uppercase">
                {group.label}
              </Text>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                {group.items.map((t) => {
                  const active = current === t.key;
                  return (
                    <Box
                      key={t.key}
                      as="button"
                      type="button"
                      title={t.desc}
                      onClick={() => handlePick(t.key)}
                      p={2}
                      borderRadius="md"
                      textAlign="left"
                      cursor="pointer"
                      bg={active ? "var(--surface-strong)" : "var(--surface)"}
                      border="1px solid"
                      borderColor={active ? "brand.400" : "var(--border)"}
                      _hover={{ borderColor: "brand.500" }}
                      transition="border-color 0.15s"
                    >
                      <HStack spacing={0} borderRadius="sm" overflow="hidden" mb={1.5} h="16px">
                        {t.swatch.map((c, i) => (
                          <Box key={i} flex={1} h="100%" bg={c} />
                        ))}
                      </HStack>
                      <HStack justify="space-between" spacing={1}>
                        <Text fontSize="xs" fontWeight="600" isTruncated>{t.name}</Text>
                        <HStack spacing={1} color={active ? "brand.400" : "gray.500"} flexShrink={0}>
                          {t.fx.immersive && <Icon as={FaBolt as ElementType} boxSize={2.5} aria-label="immersive" />}
                          {t.fx.ambient && <Icon as={FaMagic as ElementType} boxSize={2.5} aria-label="ambient visuals" />}
                          {t.fx.sound && <Icon as={(muted ? FaVolumeMute : FaVolumeUp) as ElementType} boxSize={2.5} aria-label="sound" opacity={muted ? 0.5 : 1} />}
                          {active && <Icon as={FaCheck as ElementType} boxSize={2.5} />}
                        </HStack>
                      </HStack>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeSwitcher;
