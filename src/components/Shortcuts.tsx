import {
  Box,
  HStack,
  Icon,
  Input,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState, ElementType } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaSearch,
  FaPalette,
  FaGithub,
  FaLinkedin,
  FaQuestion,
  FaTerminal,
  FaBook,
  FaTools,
  FaCalendarDay,
  FaInfoCircle,
  FaPenNib,
  FaFilePdf,
} from "react-icons/fa";
import { THEMES, applyTheme } from "../themes/palettes";
import { unlock } from "../lib/achievements";

// ── Keyboard Shortcuts Modal (triggered by `?`) ──────────────────────────────

interface ShortcutGroup {
  label: string;
  items: { keys: string[]; desc: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    label: "Navigation",
    items: [
      { keys: ["g", "h"], desc: "Go to home" },
      { keys: ["g", "j"], desc: "Go to journey" },
      { keys: ["g", "p"], desc: "Go to projects" },
      { keys: ["g", "a"], desc: "Go to activity" },
      { keys: ["g", "w"], desc: "Go to writing" },
    ],
  },
  {
    label: "Actions",
    items: [
      { keys: ["?"], desc: "Show this help" },
      { keys: ["⌘", "K"], desc: "Open command palette" },
      { keys: ["Esc"], desc: "Close modal / chat" },
    ],
  },
  {
    label: "Hidden",
    items: [
      { keys: ["↑↑↓↓←→←→ba"], desc: "Activate matrix mode" },
      { keys: ["type 'matrix'"], desc: "Same as Konami code" },
      { keys: ["type 'rainbow'"], desc: "Hue cycle for 6s" },
      { keys: ["5× click logo"], desc: "Confetti burst" },
    ],
  },
];

export const ShortcutsModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpen();
        unlock("shortcuts");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.6)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#0f0f10"
        border="1px solid rgba(255,255,255,0.08)"
        borderRadius="xl"
        boxShadow="0 24px 64px rgba(0,0,0,0.6)"
      >
        <ModalBody p={5}>
          <HStack spacing={2} mb={4}>
            <Icon as={FaQuestion as ElementType} color="brand.400" boxSize={3} />
            <Text fontSize="sm" fontWeight="600">
              Keyboard Shortcuts
            </Text>
            <Text fontSize="10px" color="gray.500" fontFamily="mono" ml="auto">
              press <Kbd fontSize="9px">Esc</Kbd> to close
            </Text>
          </HStack>

          <Stack spacing={4}>
            {SHORTCUTS.map((group) => (
              <Box key={group.label}>
                <Text
                  fontSize="10px"
                  color="gray.500"
                  fontFamily="mono"
                  letterSpacing="0.14em"
                  mb={2}
                  textTransform="uppercase"
                >
                  {group.label}
                </Text>
                <Stack spacing={1.5}>
                  {group.items.map((s, i) => (
                    <HStack key={i} justify="space-between" py={1}>
                      <Text fontSize="13px" color="gray.300">
                        {s.desc}
                      </Text>
                      <HStack spacing={1}>
                        {s.keys.map((k, j) => (
                          <Kbd
                            key={j}
                            fontSize="10px"
                            bg="rgba(255,255,255,0.05)"
                            borderColor="rgba(255,255,255,0.1)"
                            color="gray.300"
                          >
                            {k}
                          </Kbd>
                        ))}
                      </HStack>
                    </HStack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ── G-prefix navigation (g→h, g→p, etc.) ─────────────────────────────────────

const SECTION_KEYS: Record<string, string> = {
  h: "home",
  j: "journey",
  p: "projects",
  a: "activity",
  w: "writing",
};

export const GNavigator = () => {
  useEffect(() => {
    let waiting = false;
    let timer: number | null = null;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "g" && !waiting) {
        waiting = true;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => { waiting = false; }, 1200);
        return;
      }
      if (waiting && SECTION_KEYS[e.key.toLowerCase()]) {
        const id = SECTION_KEYS[e.key.toLowerCase()];
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        waiting = false;
        if (timer) { window.clearTimeout(timer); timer = null; }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
};

// ── Command Palette (triggered by cmd+k / ctrl+k) ────────────────────────────

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: ElementType;
  group: string;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  contacts?: { id: string; name: string; link: string }[];
}

export const CommandPalette = ({ contacts = [] }: CommandPaletteProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigate to a section. If we're not on the home page, route there first.
  const scrollTo = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for HomePage to mount, then scroll
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    onClose();
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      { id: "go-home",     group: "Navigate", icon: FaArrowUp as ElementType,    label: "Home",      action: () => scrollTo("home") },
      { id: "go-journey",  group: "Navigate", icon: FaArrowDown as ElementType,  label: "Journey",   action: () => scrollTo("journey") },
      { id: "go-projects", group: "Navigate", icon: FaArrowDown as ElementType,  label: "Projects",  action: () => scrollTo("projects") },
      { id: "go-activity", group: "Navigate", icon: FaArrowDown as ElementType,  label: "Activity",  action: () => scrollTo("activity") },
      { id: "go-writing",  group: "Navigate", icon: FaArrowDown as ElementType,  label: "Writing",   action: () => scrollTo("writing") },
    ];

    const pages: Command[] = [
      { id: "page-uses",      group: "Pages", icon: FaTools as ElementType,       label: "Uses · what I use day-to-day", hint: "/uses",      action: () => goTo("/uses") },
      { id: "page-now",       group: "Pages", icon: FaCalendarDay as ElementType, label: "Now · what I'm doing",         hint: "/now",       action: () => goTo("/now") },
      { id: "page-colophon",  group: "Pages", icon: FaInfoCircle as ElementType,  label: "Colophon · how this site was built", hint: "/colophon", action: () => goTo("/colophon") },
      { id: "page-console",   group: "Pages", icon: FaTerminal as ElementType,    label: "Console · interactive terminal", hint: "/console",  action: () => goTo("/console") },
      { id: "page-guestbook", group: "Pages", icon: FaPenNib as ElementType,      label: "Guestbook · sign the wall",    hint: "/guestbook", action: () => goTo("/guestbook") },
      { id: "page-resume",    group: "Pages", icon: FaFilePdf as ElementType,     label: "Resume · view CV",            hint: "/resume",    action: () => goTo("/resume") },
    ];

    const themeCmds: Command[] = THEMES.map((t) => ({
      id: `theme-${t.key}`,
      group: "Theme",
      icon: FaPalette as ElementType,
      label: `Switch to ${t.name}`,
      hint: t.desc,
      action: () => { applyTheme(t.key); onClose(); },
      keywords: `theme color palette ${t.name} ${t.desc}`,
    }));

    const linkCmds: Command[] = contacts.map((c) => {
      const lower = c.id.toLowerCase();
      const iconMap: Record<string, ElementType> = {
        github: FaGithub as ElementType,
        linkedin: FaLinkedin as ElementType,
      };
      return {
        id: `link-${c.id}`,
        group: "Links",
        icon: iconMap[lower] || FaSearch as ElementType,
        label: `Open ${c.name}`,
        action: () => openLink(c.link),
        keywords: c.name,
      };
    });

    const triggers: Command[] = [
      {
        id: "trigger-matrix",
        group: "Easter Eggs",
        icon: FaPalette as ElementType,
        label: "Activate Matrix mode",
        hint: "8 seconds of neon green",
        action: () => {
          document.body.classList.add("konami-active");
          setTimeout(() => document.body.classList.remove("konami-active"), 8000);
          onClose();
        },
      },
      {
        id: "trigger-rainbow",
        group: "Easter Eggs",
        icon: FaPalette as ElementType,
        label: "Activate Rainbow mode",
        hint: "6 seconds hue cycle",
        action: () => {
          document.body.classList.add("rainbow-active");
          setTimeout(() => document.body.classList.remove("rainbow-active"), 6000);
          onClose();
        },
      },
    ];

    return [...nav, ...pages, ...themeCmds, ...linkCmds, ...triggers];
  }, [contacts, onClose, navigate, location.pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.group} ${c.hint || ""} ${c.keywords || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  // Close palette + modal on the global "close-all" event (triple Esc)
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("close-all", handler);
    return () => window.removeEventListener("close-all", handler);
  }, [onClose]);

  // Global key listener for cmd+k
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else { setQuery(""); setSelectedIdx(0); onOpen(); unlock("command-pal"); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // Reset selection when filter changes
  useEffect(() => { setSelectedIdx(0); }, [query]);

  // Arrow nav + enter
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[selectedIdx]?.action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, filtered, selectedIdx]);

  // Group filtered commands
  const grouped = useMemo(() => {
    const out: Record<string, Command[]> = {};
    filtered.forEach((c) => {
      if (!out[c.group]) out[c.group] = [];
      out[c.group].push(c);
    });
    return out;
  }, [filtered]);

  let flatIdx = 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.6)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#0f0f10"
        border="1px solid rgba(255,255,255,0.08)"
        borderRadius="xl"
        boxShadow="0 24px 64px rgba(0,0,0,0.6)"
        maxH="70vh"
        overflow="hidden"
      >
        <ModalBody p={0}>
          <HStack px={4} py={3} borderBottom="1px solid rgba(255,255,255,0.06)">
            <Icon as={FaSearch as ElementType} color="gray.500" boxSize={3} />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              variant="unstyled"
              fontSize="sm"
              color="gray.100"
              _placeholder={{ color: "gray.600" }}
            />
            <Kbd fontSize="9px" bg="rgba(255,255,255,0.05)" borderColor="rgba(255,255,255,0.1)" color="gray.500">
              Esc
            </Kbd>
          </HStack>

          <Box maxH="50vh" overflowY="auto" py={1}>
            {filtered.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={6} fontFamily="mono">
                no results for "{query}"
              </Text>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <Box key={group} py={1}>
                  <Text
                    px={4} py={1.5}
                    fontSize="9px"
                    color="gray.600"
                    fontFamily="mono"
                    letterSpacing="0.14em"
                    textTransform="uppercase"
                  >
                    {group}
                  </Text>
                  {items.map((c) => {
                    const isSelected = flatIdx === selectedIdx;
                    const myIdx = flatIdx++;
                    return (
                      <HStack
                        key={c.id}
                        as="button"
                        onClick={() => c.action()}
                        onMouseEnter={() => setSelectedIdx(myIdx)}
                        w="full"
                        px={4} py={2}
                        spacing={3}
                        bg={isSelected ? "rgba(99,102,241,0.12)" : "transparent"}
                        borderLeft="2px solid"
                        borderColor={isSelected ? "brand.400" : "transparent"}
                        textAlign="left"
                        cursor="pointer"
                      >
                        <Icon as={c.icon} boxSize={3} color={isSelected ? "brand.400" : "gray.500"} flexShrink={0} />
                        <Box flex={1} minW={0}>
                          <Text fontSize="13px" color="gray.100" isTruncated>
                            {c.label}
                          </Text>
                          {c.hint && (
                            <Text fontSize="10px" color="gray.600" fontFamily="mono" isTruncated>
                              {c.hint}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    );
                  })}
                </Box>
              ))
            )}
          </Box>

          <HStack
            px={4} py={2}
            borderTop="1px solid rgba(255,255,255,0.06)"
            spacing={4}
            fontSize="10px"
            color="gray.600"
            fontFamily="mono"
          >
            <HStack spacing={1}>
              <Kbd fontSize="9px" bg="rgba(255,255,255,0.05)" borderColor="rgba(255,255,255,0.1)">↑↓</Kbd>
              <Text>navigate</Text>
            </HStack>
            <HStack spacing={1}>
              <Kbd fontSize="9px" bg="rgba(255,255,255,0.05)" borderColor="rgba(255,255,255,0.1)">↵</Kbd>
              <Text>select</Text>
            </HStack>
            <Text ml="auto">{filtered.length} commands</Text>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
