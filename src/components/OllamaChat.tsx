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
import { motion, AnimatePresence } from "framer-motion";

type Role = "user" | "assistant";
interface Message { role: Role; content: string }

interface Contact {
  id: string;
  name: string;
  site: string;
  link: string;
}

interface Framework {
  name: string;
  id: string;
  desc: string;
  link: string;
}

interface Project {
  name: string;
  description: string;
  links: { name: string; link: string }[];
  skills: string[];
}

interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
}

interface JourneyEntry {
  title: string;
  company: string;
  date: string;
  description: string;
  evidence?: { name: string; url: string }[];
}

interface FollowItem {
  name: string;
  type: string;
  url: string;
  desc: string;
}

interface PortfolioData {
  name: string;
  desc: string;
  tags: string[];
  languages: string[];
  frameworks: {
    frontend: Framework[];
    backend: Framework[];
    databases: Framework[];
    misc: Framework[];
  };
  projects: Project[];
  contacts: Contact[];
  journey: JourneyEntry[];
  blogs: BlogPost[];
  cp: { codeforces: string; leetcode: string };
  currentWork: {
    title: string;
    org: string;
    description: string;
    tags: string[];
    startDate: string;
    links: { name: string; link: string }[];
  };
  interests?: {
    areas: string[];
    following: FollowItem[];
  };
}

// ── System prompt — comprehensive, with personality + examples ────────────────

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
    .map((b) => `  • "${b.title}" (${b.date}, ${b.readTime}, tags: ${b.tags.join("/")})\n      ${b.excerpt}`)
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
- Don't mention you are "an AI" or apologize for limitations unless asked.

# About ${data.name}

${data.desc}

Tags: ${data.tags.join(" · ")}
GitHub: ${github}
LinkedIn: ${linkedin}

# Current Focus

${cwStr}

# Technical Stack

Languages: ${data.languages.join(", ")} — primary: ${data.languages[0]}
Frameworks & Tools: ${allFrameworks}

# Journey

${journeyStr}

# Projects (${data.projects.length} total — list ALL when asked, but lead with most relevant)

${projectsStr}

# Competitive Programming

  Codeforces handle: ${data.cp.codeforces}
  LeetCode handle: ${data.cp.leetcode}

# Interests & What ${firstName} Follows

Areas of interest: ${interestsAreas}

Sources ${firstName} reads/watches:
${followingStr}

# Writing

${blogsStr}

# Example Responses

User: "What's the most impressive thing ${firstName} has built?"
You: "Probably Valorant Narrator — a JavaFX app that hijacks team comms with TTS voices using AWS Polly and Windows TTS. Live demo at valnarrator.vercel.app. It took deep TTS pipeline knowledge to ship."

User: "How do I contact ${firstName}?"
You: "The icons in the top-right navbar — GitHub, LinkedIn, Twitter, Spotify. LinkedIn is best for professional outreach."

User: "What's ${firstName} working on now?"
You: "GSoC 2025 with LenovoLegionToolkit — adding OS-level automation (Bluetooth, DND, Volume, Night Light, Fan Full Speed, G-Sync) to the Windows app. C# and WPF stack."

User: "Tell me about ${firstName}'s competitive programming."
You: "${firstName} is on Codeforces as ${data.cp.codeforces} and LeetCode as ${data.cp.leetcode} — check the Activity → Competitive tab on this site for live stats. Java is the language of choice for contests."
`;
}

const OLLAMA_BASE = "http://localhost:11434";

const MotionBox = motion(Box);

interface Props {
  data: PortfolioData;
}

const OllamaChat = ({ data }: Props) => {
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
  const [model, setModel] = useState("llama3.2");
  const [scrollHidden, setScrollHidden] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panelBg = useColorModeValue("white", "#111118");
  const borderCol = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
  const aiBubbleBg = useColorModeValue("gray.100", "rgba(255,255,255,0.06)");

  // ── Detect Ollama availability ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((d) => {
        setAvailable(true);
        if (d.models?.length > 0) {
          const preferred = d.models.find(
            (m: { name: string }) =>
              m.name.includes("llama3") ||
              m.name.includes("mistral") ||
              m.name.includes("phi")
          );
          const chosen = preferred ?? d.models[0];
          setModel(chosen.name.replace(/:latest$/, ""));
        }
      })
      .catch(() => setAvailable(false));
  }, []);

  // ── Scroll-hide: slide FAB off when scrolling down past 250px, back on scroll-up
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
          if (delta > 0 && currentY > 250) {
            setScrollHidden(true);
          } else if (delta < 0) {
            setScrollHidden(false);
          }
          lastY = currentY;
        }

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // External triggers: `/` keyboard shortcut opens + focuses chat; "close-all" closes it
  useEffect(() => {
    const onFocus = () => {
      if (!isOpen) onToggle();
      setTimeout(() => inputRef.current?.focus(), 200);
    };
    const onCloseAll = () => {
      if (isOpen) onClose();
    };
    window.addEventListener("focus-ai-chat", onFocus);
    window.addEventListener("close-all", onCloseAll);
    return () => {
      window.removeEventListener("focus-ai-chat", onFocus);
      window.removeEventListener("close-all", onCloseAll);
    };
  }, [isOpen, onToggle, onClose]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !available) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user" as Role, content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: buildSystemPrompt(data) },
            ...messages.slice(-8),
            { role: "user", content: userMsg },
          ],
          stream: true,
        }),
      });

      if (!res.ok) throw new Error("ollama_error");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no_reader");

      let fullText = "";
      setMessages((prev) => [...prev, { role: "assistant" as Role, content: "" }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullText += parsed.message.content;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant" as Role, content: fullText },
              ]);
            }
          } catch {
            // partial chunk
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as Role,
          content: "Couldn't reach Ollama. Make sure it's running: `ollama serve`",
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

  // Only hide FAB when scrolled down AND chat is closed
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
                    ? `Ollama offline (${OLLAMA_BASE})`
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
            bottom="76px"
            right={{ base: 4, md: 6 }}
            w={{ base: "calc(100vw - 32px)", sm: "380px" }}
            h="480px"
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
            {/* Header — simplified, no model tag */}
            <Box
              px={4}
              py={3}
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
                      w="7px"
                      h="7px"
                      borderRadius="full"
                      bg={
                        available
                          ? "green.300"
                          : available === false
                          ? "red.300"
                          : "yellow.300"
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
                    size="xs"
                    variant="ghost"
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
                      px={3}
                      py={2}
                      borderRadius="xl"
                      borderBottomRightRadius={msg.role === "user" ? "sm" : "xl"}
                      borderBottomLeftRadius={msg.role === "assistant" ? "sm" : "xl"}
                      bg={msg.role === "user" ? "brand.500" : aiBubbleBg}
                      color={msg.role === "user" ? "white" : "inherit"}
                      fontSize="sm"
                      lineHeight="1.6"
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
                          <Text
                            as="span"
                            animation="blink 1s steps(2, start) infinite"
                          >
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
                <Text
                  fontSize="xs"
                  color="gray.500"
                  textAlign="center"
                  py={1}
                  fontFamily="mono"
                >
                  Run <Text as="code" color="brand.400">ollama serve</Text> to enable
                </Text>
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
                    fontSize="sm"
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
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </>
  );
};

export default OllamaChat;
