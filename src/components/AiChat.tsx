import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useRef, useEffect, ElementType } from "react";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import { unlock } from "../lib/achievements";
import { motion, AnimatePresence } from "framer-motion";

type Role = "user" | "assistant" | "system";
interface Message { role: Role; content: string }

// Types - kept minimal for system-prompt construction

interface Contact { id: string; name: string; site: string; link: string }
interface Framework { name: string; id: string; desc: string; link: string }
interface Project {
  name: string;
  description: string;
  links: { name: string; link: string }[];
  skills: string[];
}
interface BlogPost {
  title: string; date: string; readTime: string;
  excerpt: string; tags: string[];
}
interface JourneyEntry {
  title: string; company: string; date: string; description: string;
  evidence?: { name: string; url: string }[];
}
interface FollowItem { name: string; type: string; url: string; desc: string }

interface PortfolioData {
  name: string;
  desc: string;
  tags: string[];
  languages: string[];
  frameworks: {
    frontend: Framework[]; backend: Framework[];
    databases: Framework[]; misc: Framework[];
  };
  projects: Project[];
  contacts: Contact[];
  journey: JourneyEntry[];
  blogs: BlogPost[];
  cp: { codeforces: string; leetcode: string };
  currentWork: {
    title: string; org: string; description: string;
    tags: string[]; startDate: string;
    links: { name: string; link: string }[];
  };
  interests?: { areas: string[]; following: FollowItem[] };
  resumeUrl?: string;
}

// System prompt builder

function buildSystemPrompt(data: PortfolioData): string {
  const firstName = data.name.split(" ")[0];

  const allFrameworks = [
    ...data.frameworks.frontend,
    ...data.frameworks.backend,
    ...data.frameworks.databases,
    ...data.frameworks.misc,
  ].map((f) => f.name).join(", ");

  const journeyStr = data.journey
    .map((j) => {
      const ev = j.evidence?.length
        ? `\n      Evidence: ${j.evidence.map((e) => `${e.name} (${e.url})`).join("; ")}`
        : "";
      return `  • [${j.date}] ${j.title} at ${j.company}\n      ${j.description}${ev}`;
    })
    .join("\n\n");

  const projectsStr = data.projects
    .map((p) => {
      const links = p.links.map((l) => `${l.name}=${l.link}`).join(", ");
      return `  • ${p.name}: ${p.description}\n      Tech: ${p.skills.join(", ")}\n      Links: ${links}`;
    })
    .join("\n\n");

  const blogsStr = data.blogs
    .map(
      (b) =>
        `  • "${b.title}" (${b.date}, ${b.readTime}, tags: ${b.tags.join("/")})\n      ${b.excerpt}`
    )
    .join("\n\n");

  const cw = data.currentWork;
  const cwLinks = cw.links.map((l) => `${l.name}=${l.link}`).join(", ");
  const cwStr = `${cw.title} at ${cw.org} (since ${cw.startDate})\n  ${cw.description}\n  Stack: ${cw.tags.join(", ")}\n  Links: ${cwLinks}`;

  const interestsAreas = data.interests?.areas?.join(", ") || "n/a";
  const followingStr =
    data.interests?.following
      ?.map((f) => `  • ${f.name} [${f.type}]: ${f.desc}`)
      .join("\n") || "  • (none configured)";

  const github = data.contacts.find((c) => c.id === "github")?.link || "";
  const linkedin = data.contacts.find((c) => c.id === "linkedin")?.link || "";

  return `You are an AI assistant embedded in ${data.name}'s personal portfolio website. You know ${firstName} well — their work, projects, journey, and what they care about.

# Response rules

- Speak about ${firstName} in third person. Don't pretend to be them.
- Be direct, specific, and honest. Cite actual project names and details.
- Keep responses to 2-4 sentences unless the user asks for depth.
- If you don't know something, say so plainly. Don't fabricate.
- Use ${firstName} (first name), not the full name in every sentence.

# About ${data.name}

${data.desc}

Tags: ${data.tags.join(" · ")}
GitHub: ${github}
LinkedIn: ${linkedin}
${data.resumeUrl ? `Resume: ${data.resumeUrl} (also viewable at /resume on this site)` : ""}

# Current Focus

${cwStr}

# Technical Stack

Languages: ${data.languages.join(", ")} — primary: ${data.languages[0]}
Frameworks & Tools: ${allFrameworks}

# Journey

${journeyStr}

# Projects (${data.projects.length} total)

${projectsStr}

# Competitive Programming

  Codeforces: ${data.cp.codeforces}
  LeetCode: ${data.cp.leetcode}

# Interests

Areas: ${interestsAreas}

Sources ${firstName} follows:
${followingStr}

# Writing

${blogsStr}

# Example Responses

User: "What's the most impressive thing ${firstName} has built?"
You: "Probably Valorant Narrator — a JavaFX app that hijacks team comms with TTS voices using AWS Polly and Windows TTS. Live demo at valnarrator.vercel.app."

User: "How do I contact ${firstName}?"
You: "Icons in the top-right navbar — GitHub, LinkedIn, Twitter, Spotify. LinkedIn is best for professional outreach."

User: "What's ${firstName} working on now?"
You: "GSoC 2025 with LenovoLegionToolkit — adding OS-level automation actions in C#/WPF."
`;
}

// Backend endpoints

const CHAT_ENDPOINT = "/api/portfolio/chat";
const STATUS_ENDPOINT = "/api/portfolio/chat/status";

const MotionBox = motion(Box);

interface Props {
  data: PortfolioData;
}

const AiChat = ({ data }: Props) => {
  const firstName = data.name.split(" ")[0];

  const { isOpen, onToggle, onClose } = useDisclosure();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey! I know all about ${firstName}'s work. Ask me about projects, skills, or what's being built.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [scrollHidden, setScrollHidden] = useState(false);
  const [kbInset, setKbInset] = useState(0);   // on-screen keyboard height (px)
  const [vvHeight, setVvHeight] = useState(0);  // visualViewport height (px)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panelBg = useColorModeValue("white", "#111118");
  const borderCol = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
  const aiBubbleBg = useColorModeValue("gray.100", "rgba(255,255,255,0.06)");

  // Detect backend chat availability
  useEffect(() => {
    fetch(STATUS_ENDPOINT, { signal: AbortSignal.timeout(4000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.available) {
          setAvailable(true);
          setModel(d.model || null);
        } else {
          setAvailable(false);
        }
      })
      .catch(() => setAvailable(false));
  }, []);

  // Scroll-hide FAB
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;
        if (Math.abs(delta) > 8) {
          if (delta > 0 && currentY > 250) setScrollHidden(true);
          else if (delta < 0) setScrollHidden(false);
          lastY = currentY;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track on-screen keyboard via visualViewport so the panel rides above it
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
      setVvHeight(vv.height);
    };
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep latest message visible when the keyboard opens/closes
  useEffect(() => {
    if (isOpen && kbInset > 0) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [kbInset, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // External event triggers
  useEffect(() => {
    const onFocus = () => {
      if (!isOpen) onToggle();
      setTimeout(() => inputRef.current?.focus(), 200);
    };
    const onCloseAll = () => { if (isOpen) onClose(); };
    window.addEventListener("focus-ai-chat", onFocus);
    window.addEventListener("close-all", onCloseAll);
    return () => {
      window.removeEventListener("focus-ai-chat", onFocus);
      window.removeEventListener("close-all", onCloseAll);
    };
  }, [isOpen, onToggle, onClose]);

  // Send + stream
  const sendMessage = async () => {
    if (!input.trim() || loading || !available) return;

    const userMsg = input.trim();
    setInput("");
    unlock("ai-chat");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const payload = {
        messages: [
          { role: "system" as Role, content: buildSystemPrompt(data) },
          ...messages.filter((m) => m.role !== "system").slice(-8),
          { role: "user" as Role, content: userMsg },
        ],
      };

      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = `${res.status}`;
        try {
          const errBody = await res.json();
          detail = errBody.detail || detail;
        } catch { /* ignore */ }
        throw new Error(detail);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("no_reader");

      let fullText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              fullText += parsed.content;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: fullText },
              ]);
            }
            // {"done": true} signals end - handled by stream close
          } catch (e) {
            if ((e as Error).message?.includes("gemini")) throw e;
            // Partial JSON, ignore
          }
        }
      }

      if (!fullText) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "(empty response)" },
        ]);
      }
    } catch (err) {
      const msg = (err as Error).message || "unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: msg.includes("429")
            ? "Rate limited — try again in an hour."
            : msg.includes("503") || msg.includes("not configured")
            ? "Chat isn't configured. Tell the admin to set GEMINI_API_KEY."
            : `Backend error: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fabVisible = isOpen || !scrollHidden;

  return (
    <>
      <AnimatePresence>
        {fabVisible && (
          <MotionBox
            key="fab"
            position="fixed"
            bottom={6}
            right={{ base: 4, md: 6 }}
            zIndex={1000}
            initial={{ opacity: 0, y: 60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <MotionBox whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
              <Tooltip
                label={
                  available === false
                    ? "AI chat offline (backend not configured)"
                    : isOpen
                    ? "Close chat"
                    : `Ask AI about ${firstName}`
                }
                placement="left"
                hasArrow
              >
                <Button
                  onClick={onToggle}
                  borderRadius="full"
                  w="52px"
                  h="52px"
                  minW="52px"
                  bg="brand.500"
                  color="white"
                  boxShadow="0 0 24px rgba(99,102,241,0.5)"
                  _hover={{ bg: "brand.400", boxShadow: "0 0 36px rgba(99,102,241,0.7)" }}
                  p={0}
                  position="relative"
                >
                  <Icon as={(isOpen ? FaTimes : FaRobot) as ElementType} boxSize={5} />
                  {available === true && !isOpen && (
                    <Box
                      position="absolute"
                      top="1px"
                      right="1px"
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg="green.400"
                      border="2px solid"
                      borderColor="brand.500"
                    />
                  )}
                </Button>
              </Tooltip>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <MotionBox
            key="panel"
            position="fixed"
            bottom={kbInset > 0 ? `${kbInset + 12}px` : "76px"}
            right={{ base: 4, md: 6 }}
            w={{ base: "calc(100vw - 32px)", sm: "380px" }}
            h={{ base: "min(72dvh, 480px)", sm: "480px" }}
            maxH={kbInset > 0 ? `${Math.max(240, vvHeight - 24)}px` : "calc(100dvh - 96px)"}
            bg={panelBg}
            border="1px solid"
            borderColor={borderCol}
            borderRadius="2xl"
            boxShadow="0 24px 64px rgba(0,0,0,0.5)"
            zIndex={999}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <Box
              px={4} py={3}
              bgGradient="linear(to-r, brand.600, purple.600)"
              flexShrink={0}
            >
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <Icon as={FaRobot as ElementType} color="white" boxSize={4} />
                  <Text fontWeight="600" color="white" fontSize="sm">
                    Ask about {firstName}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <HStack spacing={1.5}>
                    <Box
                      w="7px" h="7px" borderRadius="full"
                      bg={
                        available === null ? "yellow.300"
                        : available ? "green.300"
                        : "red.300"
                      }
                      animation={available ? "live-dot 2s ease-in-out infinite" : undefined}
                    />
                    <Text fontSize="10px" color="whiteAlpha.800" fontFamily="mono">
                      {available === null ? "connecting…" : available ? "online" : "offline"}
                    </Text>
                  </HStack>
                  <IconButton
                    aria-label="Close"
                    icon={<Icon as={FaTimes as ElementType} />}
                    size="xs" variant="ghost"
                    color="whiteAlpha.700"
                    _hover={{ color: "white", bg: "whiteAlpha.200" }}
                    onClick={onClose}
                  />
                </HStack>
              </HStack>
            </Box>

            {/* Messages */}
            <Box flex={1} overflowY="auto" p={4}>
              <Stack spacing={3}>
                {messages.map((msg, i) => (
                  <Flex
                    key={i}
                    justify={msg.role === "user" ? "flex-end" : "flex-start"}
                  >
                    <Box
                      maxW="82%"
                      px={3} py={2}
                      borderRadius="xl"
                      borderBottomRightRadius={msg.role === "user" ? "sm" : "xl"}
                      borderBottomLeftRadius={msg.role === "assistant" ? "sm" : "xl"}
                      bg={msg.role === "user" ? "brand.500" : aiBubbleBg}
                      color={msg.role === "user" ? "white" : "inherit"}
                      fontSize="sm" lineHeight="1.6"
                      whiteSpace="pre-wrap"
                      border={
                        msg.role === "assistant"
                          ? "1px solid rgba(255,255,255,0.07)"
                          : "none"
                      }
                    >
                      {msg.content}
                      {loading &&
                        i === messages.length - 1 &&
                        msg.role === "assistant" &&
                        msg.content === "" && (
                          <Text as="span" animation="blink 1s steps(2, start) infinite">
                            ▋
                          </Text>
                        )}
                    </Box>
                  </Flex>
                ))}
                <div ref={messagesEndRef} />
              </Stack>
            </Box>

            {/* Input */}
            <Box px={3} py={3} borderTop="1px solid" borderColor={borderCol} flexShrink={0}>
              {available === false ? (
                <Stack spacing={1} py={1}>
                  <Text fontSize="xs" color="gray.500" textAlign="center" fontFamily="mono">
                    chat is offline
                  </Text>
                  <Text fontSize="10px" color="gray.600" textAlign="center" fontFamily="mono">
                    backend missing <Text as="code" color="brand.400">GEMINI_API_KEY</Text>
                  </Text>
                </Stack>
              ) : (
                <HStack spacing={2}>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask anything…"
                    size="sm"
                    borderRadius="full"
                    isDisabled={loading}
                    fontSize={{ base: "16px", md: "sm" }}
                    _focus={{
                      borderColor: "brand.400",
                      boxShadow: "0 0 0 1px rgba(99,102,241,0.4)",
                    }}
                    border="1px solid"
                    borderColor={borderCol}
                  />
                  <IconButton
                    aria-label="Send"
                    icon={<Icon as={FaPaperPlane as ElementType} />}
                    size="sm"
                    colorScheme="purple"
                    borderRadius="full"
                    onClick={sendMessage}
                    isLoading={loading}
                    isDisabled={!input.trim() || !available}
                    flexShrink={0}
                  />
                </HStack>
              )}
              {model && available && !loading && (
                <Text fontSize="9px" color="gray.600" textAlign="center" fontFamily="mono" mt={2}>
                  powered by {model}
                </Text>
              )}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChat;
