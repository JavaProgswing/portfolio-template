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
  projects: {
    name: string;
    description: string;
    links: { name: string; link: string }[];
    skills: string[];
  }[];
  contacts: Contact[];
  journey: {
    title: string;
    company: string;
    date: string;
    description: string;
  }[];
  cp: { codeforces: string; leetcode: string };
  currentWork: {
    title: string;
    org: string;
    description: string;
    tags: string[];
    startDate: string;
  };
}

function buildSystemPrompt(data: PortfolioData): string {
  const firstName = data.name.split(" ")[0];
  const allFrameworks = [
    ...data.frameworks.frontend,
    ...data.frameworks.backend,
    ...data.frameworks.databases,
    ...data.frameworks.misc,
  ]
    .map((f) => f.name)
    .join(", ");

  const projectsStr = data.projects
    .map(
      (p) =>
        `  • ${p.name}: ${p.description}${p.skills.length ? ` [${p.skills.join(", ")}]` : ""}`
    )
    .join("\n");

  const journeyStr = data.journey
    .map((j) => `  • ${j.title} at ${j.company} (${j.date}): ${j.description}`)
    .join("\n");

  const github = data.contacts.find((c) => c.id === "github");
  const githubLine = github ? `GitHub: ${github.link}` : "";

  const cpLines = [
    data.cp.codeforces && `  Codeforces: ${data.cp.codeforces}`,
    data.cp.leetcode && `  LeetCode: ${data.cp.leetcode}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are an AI assistant embedded in ${data.name}'s portfolio website. Here is everything you know:

Name: ${data.name}
Tags: ${data.tags.join(", ")}
Bio: ${data.desc}

Languages: ${data.languages.join(", ")}
Frameworks & Libraries: ${allFrameworks}

Journey:
${journeyStr}

Currently Building: ${data.currentWork.title} at ${data.currentWork.org} (since ${data.currentWork.startDate})
  ${data.currentWork.description}
  Tech: ${data.currentWork.tags.join(", ")}

Projects:
${projectsStr}

Competitive Programming:
${cpLines}
${githubLine}

Answer questions about ${firstName} conversationally. Be direct and specific. Keep responses concise (2-4 sentences usually). If you don't know something, say so.`;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panelBg = useColorModeValue("white", "#111827");
  const borderCol = useColorModeValue("gray.200", "rgba(255,255,255,0.1)");
  const aiBubbleBg = useColorModeValue("gray.100", "rgba(255,255,255,0.06)");

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

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
            // partial JSON chunk
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

  return (
    <>
      <MotionBox
        position="fixed"
        bottom={6}
        right={{ base: 4, md: 6 }}
        zIndex={1000}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
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
            bg="blue.600"
            color="white"
            boxShadow="0 0 24px rgba(0,127,255,0.45)"
            _hover={{ bg: "blue.500", boxShadow: "0 0 36px rgba(0,127,255,0.65)" }}
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
                borderColor="blue.600"
              />
            )}
          </Button>
        </Tooltip>
      </MotionBox>

      <AnimatePresence>
        {isOpen && (
          <MotionBox
            position="fixed"
            bottom="76px"
            right={{ base: 4, md: 6 }}
            w={{ base: "calc(100vw - 32px)", sm: "370px" }}
            h="460px"
            bg={panelBg}
            border="1px solid"
            borderColor={borderCol}
            borderRadius="2xl"
            boxShadow="0 24px 64px rgba(0,0,0,0.35)"
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
            <Box px={4} py={3} bgGradient="linear(to-r, blue.700, purple.700)" flexShrink={0}>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <Icon as={FaRobot as ElementType} color="white" boxSize={4} />
                  <Text fontWeight="600" color="white" fontSize="sm">
                    Ask about {firstName}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <HStack spacing={1}>
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
                    />
                    <Text fontSize="10px" color="whiteAlpha.800" fontFamily="mono">
                      {available === null
                        ? "connecting…"
                        : available
                        ? model
                        : "offline"}
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
                      bg={msg.role === "user" ? "blue.500" : aiBubbleBg}
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
                  Run <Text as="code" color="blue.400">ollama serve</Text> to enable
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
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px rgba(0,127,255,0.4)",
                    }}
                    border="1px solid"
                    borderColor={borderCol}
                  />
                  <IconButton
                    aria-label="Send"
                    icon={<Icon as={FaPaperPlane as ElementType} />}
                    size="sm"
                    colorScheme="blue"
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
